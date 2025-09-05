
'use server';
/**
 * @fileOverview Handles the background upload of a completed checklist.
 * This flow is triggered in a "fire-and-forget" manner.
 * It prioritizes Google Drive upload first, then Firebase Storage.
 */

import { adminDb, admin } from './firebase-admin';
import { findOrCreateFolder, uploadFile, uploadFileFromUrl } from './google-drive';
import { z } from 'zod';
import { ai } from '@/ai/genkit';
import { CompletedChecklist } from './types';
import { Buffer } from 'buffer';
import { Readable } from 'stream';

const ChecklistUploadDataSchema = z.object({
  checklistId: z.string(),
});
export type ChecklistUploadData = z.infer<typeof ChecklistUploadDataSchema>;

/**
 * Uploads a base64 encoded image to Firebase Storage and returns the public URL.
 * @param base64String The base64 data URL.
 * @param path The path to store the file in.
 * @returns The public URL of the uploaded file.
 */
async function uploadBase64ToFirebaseStorage(base64String: string, path: string): Promise<string> {
  const bucket = admin.storage().bucket();
  
  // Extract content type and base64 data
  const match = base64String.match(/^data:(image\/\w+);base64,(.*)$/);
  if (!match) {
    throw new Error('Invalid base64 string format');
  }
  const contentType = match[1];
  const base64Data = match[2];
  
  const buffer = Buffer.from(base64Data, 'base64');
  const file = bucket.file(path);

  await file.save(buffer, {
    metadata: {
      contentType: contentType,
    },
  });
  
  // Make the file public and get the URL
  await file.makePublic();
  return file.publicUrl();
}

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
 * Uploads all checklist data and images to a structured folder in Google Drive.
 * @param checklistId The ID of the checklist.
 * @param checklistData The checklist data object (can contain Base64 or URLs).
 */
async function uploadToGoogleDrive(checklistId: string, checklistData: CompletedChecklist): Promise<void> {
  const rootFolderName = 'Checklists_Rodocheck';
  const rootFolderId = await findOrCreateFolder(rootFolderName);
  const checklistFolderId = await findOrCreateFolder(checklistId, rootFolderId);
  const imagesFolderId = await findOrCreateFolder('images', checklistFolderId);

  // Upload the checklist JSON data first
  const checklistJson = JSON.stringify(checklistData, null, 2);
  const jsonBuffer = Buffer.from(checklistJson, 'utf-8');
  await uploadFile('checklist.json', 'application/json', jsonBuffer, checklistFolderId);

  // Gather all images (now they are URLs)
  const images: { name: string; url: string }[] = [];
  checklistData.questions.forEach((q, index) => {
    if (q.photo && q.photo.startsWith('http')) images.push({ name: `item_${index}.jpg`, url: q.photo });
  });
  if (checklistData.vehicleImages) {
    for (const [key, value] of Object.entries(checklistData.vehicleImages)) {
      if (value.startsWith('http')) images.push({ name: `vehicle_${key}.jpg`, url: value });
    }
  }
   if (checklistData.signatures) {
    for (const [key, value] of Object.entries(checklistData.signatures)) {
      if (value.startsWith('http')) images.push({ name: `signature_${key}.png`, url: value });
    }
  }
  
  // Upload all images from their URLs
  for (const image of images) {
    const mimeType = image.name.endsWith('.png') ? 'image/png' : 'image/jpeg';
    await uploadFileFromUrl(image.name, mimeType, image.url, imagesFolderId);
  }
}

export const uploadChecklistFlow = ai.defineFlow(
  {
    name: 'uploadChecklistFlow',
    inputSchema: ChecklistUploadDataSchema,
    outputSchema: z.void(),
  },
  async ({ checklistId }) => {
    const checklistRef = adminDb.collection('completed-checklists').doc(checklistId);
    let checklistWithUrls: CompletedChecklist | null = null;
    
    try {
      const docSnap = await checklistRef.get();
      if (!docSnap.exists) {
        console.error(`[${checklistId}] Checklist document not found for background processing.`);
        return;
      }
      const originalChecklistData = docSnap.data() as CompletedChecklist;

      // First, process all Firebase uploads to get the final URLs.
      checklistWithUrls = await processFirebaseUploads(originalChecklistData, checklistId);
      await checklistRef.update({
          ...checklistWithUrls,
          firebaseStorageStatus: 'success',
      });
      console.log(`[${checklistId}] Firebase Storage uploads successful.`);

    } catch (error: any) {
       console.error(`[${checklistId}] Firebase Storage processing failure:`, error);
        await checklistRef.update({ 
            firebaseStorageStatus: 'error',
            status: 'Pendente',
            generalObservations: `Falha no upload para o Firebase Storage: ${error.message}`
        });
        // Stop the flow if Firebase fails, as Drive needs the URLs
        return; 
    }

    try {
        if (!checklistWithUrls) {
            throw new Error("Checklist data with URLs is not available.");
        }
        // Upload to Google Drive (Priority 1)
        await uploadToGoogleDrive(checklistId, checklistWithUrls);
        await checklistRef.update({ googleDriveStatus: 'success' });
        console.log(`[${checklistId}] Google Drive upload successful.`);

    } catch (error: any) {
        console.error(`[${checklistId}] Google Drive processing failure:`, error);
        await checklistRef.update({ 
            googleDriveStatus: 'error',
            status: 'Pendente',
            generalObservations: `Falha no upload para o Google Drive: ${error.message}`
        });
        // Stop the flow
        return;
    }

    try {
        // If both uploads are successful, determine final status
        const docSnap = await checklistRef.get();
        const finalChecklistData = docSnap.data() as CompletedChecklist;

        const hasIssues = finalChecklistData.questions.some((q: any) => q.status === 'Não OK');
        const finalStatus = hasIssues ? 'Pendente' : 'OK';
        
        await checklistRef.update({
            status: finalStatus
        });
         console.log(`[${checklistId}] Process finished with status: ${finalStatus}`);

    } catch (error: any) {
         console.error(`[${checklistId}] Error setting final status:`, error);
         await checklistRef.update({ 
            status: 'Pendente',
            generalObservations: `Falha ao finalizar o status: ${error.message}`
        });
    }
  }
);
