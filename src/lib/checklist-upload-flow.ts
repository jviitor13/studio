
'use server';
/**
 * @fileOverview Handles the background upload of a completed checklist.
 * This flow is triggered in a "fire-and-forget" manner.
 * It prioritizes Google Drive upload first, then Firebase Storage.
 */

import { adminDb } from './firebase-admin';
import { findOrCreateFolder, uploadFile } from './google-drive';
import { getStorage } from 'firebase-admin/storage';
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
  const storage = getStorage(adminDb.app);
  const bucket = storage.bucket('gs://rodocheck-244cd.appspot.com');
  
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
  const jsonStream = Readable.from(jsonBuffer);
  await uploadFile('checklist.json', 'application/json', jsonStream, checklistFolderId);

  // Gather all images (Base64)
  const images: { name: string; data: string }[] = [];
  checklistData.questions.forEach((q, index) => {
    if (q.photo && q.photo.startsWith('data:image')) images.push({ name: `item_${index}.jpg`, data: q.photo });
  });
  if (checklistData.vehicleImages) {
    for (const [key, value] of Object.entries(checklistData.vehicleImages)) {
      if (value.startsWith('data:image')) images.push({ name: `vehicle_${key}.jpg`, data: value });
    }
  }
   if (checklistData.signatures) {
    for (const [key, value] of Object.entries(checklistData.signatures)) {
      if (value.startsWith('data:image')) images.push({ name: `signature_${key}.png`, data: value });
    }
  }
  
  // Upload all images from Base64
  for (const image of images) {
    const mimeType = image.data.match(/^data:(image\/\w+);base64,/)?.[1] || 'image/jpeg';
    const imageBuffer = Buffer.from(image.data.split(',')[1], 'base64');
    const imageStream = Readable.from(imageBuffer);
    await uploadFile(image.name, mimeType, imageStream, imagesFolderId);
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
    
    try {
      const docSnap = await checklistRef.get();
      if (!docSnap.exists) {
        console.error(`[${checklistId}] Checklist document not found for background processing.`);
        return;
      }
      const originalChecklistData = docSnap.data() as CompletedChecklist;

      // 1. Upload to Google Drive (Priority 1)
      await uploadToGoogleDrive(checklistId, originalChecklistData);
      await checklistRef.update({ googleDriveStatus: 'success' });
      console.log(`[${checklistId}] Google Drive upload successful.`);

      // The checklist is now considered processed. Determine final status.
      const hasIssues = originalChecklistData.questions.some((q: any) => q.status === 'Não OK');
      const finalStatus = hasIssues ? 'Pendente' : 'OK';
      

      // 2. Asynchronously upload to Firebase Storage and update document with URLs.
      // This happens after the main processing is "done" from the user's perspective.
      const checklistWithUrls = await processFirebaseUploads(originalChecklistData, checklistId);
      
      await checklistRef.update({
          ...checklistWithUrls,
          firebaseStorageStatus: 'success',
          status: finalStatus // Update final status only after all uploads are confirmed
      });
      console.log(`[${checklistId}] Firebase Storage uploads successful.`);

    } catch (error: any) {
        console.error(`[${checklistId}] Critical background processing failure:`, error);
        await checklistRef.update({ 
            googleDriveStatus: 'error',
            firebaseStorageStatus: 'error', // If GDrive fails, we mark both as error
            status: 'Pendente', // Keep it as pending for manual review
            generalObservations: `Falha crítica no processamento (Google Drive): ${error.message}`
        });
    }
  }
);
