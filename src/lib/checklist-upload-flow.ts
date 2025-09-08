
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
import fetch from 'node-fetch';


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
  if (updatedChecklist.questions) {
    for (let i = 0; i < updatedChecklist.questions.length; i++) {
        const photo = updatedChecklist.questions[i].photo;
        if (photo && photo.startsWith('data:image')) {
        const url = await uploadBase64ToFirebaseStorage(photo, `${basePath}/item_${i}.jpg`);
        updatedChecklist.questions[i].photo = url;
        }
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

async function fetchImageAsBase64(imageUrl: string): Promise<string> {
    try {
        const response = await fetch(imageUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch image ${imageUrl}: ${response.statusText}`);
        }
        const buffer = await response.arrayBuffer();
        const base64 = Buffer.from(buffer).toString('base64');
        const mimeType = response.headers.get('content-type') || 'image/jpeg';
        return `data:${mimeType};base64,${base64}`;
    } catch (error) {
        console.error(`Error fetching image as base64: ${imageUrl}`, error);
        return ''; // Return empty string or a placeholder if fetching fails
    }
}

async function convertChecklistImagesToBase64(checklistWithUrls: CompletedChecklist): Promise<CompletedChecklist> {
    const checklistForPdf = JSON.parse(JSON.stringify(checklistWithUrls)); // Deep copy

    const conversionPromises: Promise<any>[] = [];

    // Item photos
    checklistForPdf.questions?.forEach((q: any, i: number) => {
        if (q.photo?.startsWith('http')) {
            conversionPromises.push(
                fetchImageAsBase64(q.photo).then(b64 => {
                    checklistForPdf.questions[i].photo = b64;
                })
            );
        }
    });

    // Vehicle images
    if (checklistForPdf.vehicleImages) {
        Object.keys(checklistForPdf.vehicleImages).forEach(key => {
            const url = (checklistForPdf.vehicleImages as any)[key];
            if (url?.startsWith('http')) {
                conversionPromises.push(
                    fetchImageAsBase64(url).then(b64 => {
                        (checklistForPdf.vehicleImages as any)[key] = b64;
                    })
                );
            }
        });
    }

    // Signatures
    if (checklistForPdf.signatures) {
        Object.keys(checklistForPdf.signatures).forEach(key => {
            const url = (checklistForPdf.signatures as any)[key];
            if (url?.startsWith('http')) {
                conversionPromises.push(
                    fetchImageAsBase64(url).then(b64 => {
                        (checklistForPdf.signatures as any)[key] = b64;
                    })
                );
            }
        });
    }

    await Promise.all(conversionPromises);
    return checklistForPdf;
}

/**
 * Generates a PDF from the checklist data, uploads it and all individual images to Google Drive.
 * @param checklistData The checklist data object with Firebase URLs for images.
 */
async function uploadToGoogleDrive(checklistData: CompletedChecklist): Promise<void> {
  const rootFolderName = 'Checklists_Rodocheck';
  const rootFolderId = await findOrCreateFolder(rootFolderName);

  const formattedDate = checklistData.createdAt ? format(new Date(checklistData.createdAt.toString()), "dd-MM-yyyy_HH-mm") : 'data_indisponivel';
  const vehicleFolderName = checklistData.vehicle.replace(/[\/]/g, '_').trim();
  const checklistFolderName = `${vehicleFolderName}_${formattedDate}`;
  const checklistFolderId = await findOrCreateFolder(checklistFolderName, rootFolderId);
  
  // 1. Convert all image URLs back to Base64 for PDF generation
  const checklistForPdf = await convertChecklistImagesToBase64(checklistData);

  // 2. Generate and upload the PDF
  const pdfBase64 = await generateChecklistPdf(checklistForPdf, 'base64');
  if (!pdfBase64) {
    throw new Error('PDF generation returned an empty result.');
  }

  const pdfBuffer = Buffer.from(pdfBase64, 'base64');
  const pdfFileName = `checklist_${vehicleFolderName}.pdf`;
  await uploadFile(pdfFileName, 'application/pdf', pdfBuffer, checklistFolderId);

  // 3. Upload all individual images to the SAME checklist folder
  const imagesToUpload: { name: string; url: string; mimeType: string }[] = [];

  if(checklistData.questions) {
      checklistData.questions.forEach((q, i) => {
          if (q.photo?.startsWith('http')) {
              imagesToUpload.push({ name: `item_${i}_${q.text.substring(0,10)}.jpg`, url: q.photo, mimeType: 'image/jpeg' });
          }
      });
  }


  if (checklistData.vehicleImages) {
      Object.entries(checklistData.vehicleImages).forEach(([key, url]) => {
          if (url?.startsWith('http')) {
              imagesToUpload.push({ name: `vehicle_${key}.jpg`, url, mimeType: 'image/jpeg' });
          }
      });
  }

  if (checklistData.signatures) {
      Object.entries(checklistData.signatures).forEach(([key, url]) => {
          if (url?.startsWith('http')) {
              imagesToUpload.push({ name: `signature_${key}.png`, url, mimeType: 'image/png' });
          }
      });
  }

  // Execute all image uploads in parallel
  await Promise.all(
      imagesToUpload.map(async image => {
        try {
            const response = await fetch(image.url);
            if (!response.ok) {
                throw new Error(`Failed to fetch image from URL: ${response.statusText}`);
            }
            const buffer = Buffer.from(await response.arrayBuffer());
            await uploadFile(image.name, image.mimeType, buffer, checklistFolderId);
        } catch (error) {
            console.error(`Error uploading image from URL "${image.name}":`, error);
            // Optionally decide if one failed image upload should fail the whole process
        }
      })
  );
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

    // Step 2: Upload final PDF and images to Google Drive
    try {
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
