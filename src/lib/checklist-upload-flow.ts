

'use server';
/**
 * @fileOverview Handles the background upload of a completed checklist.
 * This flow is triggered in a "fire-and-forget" manner.
 * It handles file uploads to Firebase Storage, generates a final PDF,
 * and uploads that PDF to Google Drive.
 */

import { adminDb, uploadBase64ToFirebaseStorage } from './firebase-admin';
import { findOrCreateFolder, uploadFile } from './google-drive';
import { z } from 'zod';
import { ai } from '@/ai/genkit';
import { CompletedChecklist } from './types';
import { Buffer } from 'buffer';
import { generateChecklistPdf } from './pdf-generator';
import { format } from 'date-fns';


const ChecklistUploadDataSchema = z.object({
  checklistId: z.string(),
});
export type ChecklistUploadData = z.infer<typeof ChecklistUploadDataSchema>;


/**
 * Iterates through all images in the checklist data, uploads them from Base64 to Firebase Storage,
 * and returns a new checklist object with the Base64 strings replaced by public URLs.
 * @param checklistData The original checklist data with Base64 images.
 * @param checklistId The ID of the checklist, used for creating storage paths.
 * @returns An updated checklist object with Firebase Storage URLs.
 */
async function processFirebaseUploads(checklistData: CompletedChecklist, checklistId: string): Promise<CompletedChecklist> {
  const updatedChecklist = JSON.parse(JSON.stringify(checklistData)); // Deep copy
  const basePath = `checklists/${checklistId}`;

  // Process item photos
  for (let i = 0; i < updatedChecklist.questions.length; i++) {
    const photo = updatedChecklist.questions[i].photo;
    if (photo && photo.startsWith('data:image')) {
      const url = await uploadBase64ToFirebaseStorage(photo, `${basePath}/item_${i}.jpg`);
      updatedChecklist.questions[i].photo = url;
    }
  }

  // Process vehicle images
  if (updatedChecklist.vehicleImages) {
    for (const key in updatedChecklist.vehicleImages) {
      const photo = (updatedChecklist.vehicleImages as any)[key];
      if (photo && photo.startsWith('data:image')) {
        const url = await uploadBase64ToFirebaseStorage(photo, `${basePath}/vehicle_${key}.jpg`);
        (updatedChecklist.vehicleImages as any)[key] = url;
      }
    }
  }
  
  // Process signatures
  if (updatedChecklist.signatures) {
    for (const key in updatedChecklist.signatures) {
        const photo = (updatedChecklist.signatures as any)[key];
         if (photo && photo.startsWith('data:image')) {
            const url = await uploadBase64ToFirebaseStorage(photo, `${basePath}/signature_${key}.png`);
            (updatedChecklist.signatures as any)[key] = url;
        }
    }
  }

  return updatedChecklist;
}

/**
 * Generates a PDF from the checklist data and uploads it to Google Drive.
 * @param checklistId The ID of the checklist.
 * @param checklistData The checklist data object with Firebase URLs for images.
 */
async function uploadToGoogleDrive(checklistData: CompletedChecklist): Promise<void> {
  const rootFolderName = 'Checklists_Rodocheck';
  const rootFolderId = await findOrCreateFolder(rootFolderName);
  
  // Create a subfolder named after the vehicle plate for better organization.
  const vehicleFolderName = checklistData.vehicle.replace(/[\/]/g, '_').trim();
  const vehicleFolderId = await findOrCreateFolder(vehicleFolderName, rootFolderId);
  
  // Generate the PDF in memory.
  const pdfBase64 = await generateChecklistPdf(checklistData, 'base64');
  if (!pdfBase64) {
    throw new Error('PDF generation returned an empty result.');
  }

  // Convert base64 to a Buffer for upload.
  const pdfBuffer = Buffer.from(pdfBase64, 'base64');
  
  // Create a descriptive filename.
  const formattedDate = checklistData.createdAt ? format(new Date(checklistData.createdAt.toString()), "dd-MM-yyyy_HH-mm") : 'data_indisponivel';
  const fileName = `checklist_${vehicleFolderName}_${formattedDate}.pdf`;
  
  // Upload the PDF.
  await uploadFile(fileName, 'application/pdf', pdfBuffer, vehicleFolderId);
}

export const uploadChecklistFlow = ai.defineFlow(
  {
    name: 'uploadChecklistFlow',
    inputSchema: ChecklistUploadDataSchema,
    outputSchema: z.void(),
  },
  async ({ checklistId }) => {
    const checklistRef = adminDb.collection('completed-checklists').doc(checklistId);
    let checklistData: CompletedChecklist;

    try {
        const docSnap = await checklistRef.get();
        if (!docSnap.exists) {
          throw new Error(`[${checklistId}] Checklist document not found for background processing.`);
        }
        checklistData = docSnap.data() as CompletedChecklist;
    } catch (error: any) {
        console.error(`[${checklistId}] Critical error fetching document:`, error);
        return; // Cannot proceed without the document
    }

    let checklistWithUrls: CompletedChecklist = checklistData;

    // Step 1: Process Firebase Storage uploads
    try {
      checklistWithUrls = await processFirebaseUploads(checklistData, checklistId);
      await checklistRef.update({
          ...checklistWithUrls, // Save URLs back to Firestore
          firebaseStorageStatus: 'success',
      });
      console.log(`[${checklistId}] Firebase Storage uploads successful.`);

    } catch (error: any) {
       console.error(`[${checklistId}] Firebase Storage processing failure:`, error);
        await checklistRef.update({ 
            firebaseStorageStatus: 'error',
            generalObservations: `Falha no upload para o Firebase Storage: ${error.message}`
        });
        // We stop here if Firebase fails, as Google Drive PDF generation depends on these URLs
        return;
    }

    // Step 2: Upload final PDF to Google Drive
    try {
        // Use the version with URLs from Firebase to generate the PDF
        await uploadToGoogleDrive(checklistWithUrls);
        await checklistRef.update({ googleDriveStatus: 'success' });
        console.log(`[${checklistId}] Google Drive upload successful.`);

    } catch (error: any) {
        console.error(`[${checklistId}] Google Drive processing failure:`, error);
        await checklistRef.update({ 
            googleDriveStatus: 'error',
            generalObservations: `Falha no upload para o Google Drive: ${error.message}`
        });
    }

    console.log(`[${checklistId}] Background processing finished.`);
  }
);
