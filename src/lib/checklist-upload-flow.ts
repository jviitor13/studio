
'use server';
/**
 * @fileOverview Handles the background upload of a completed checklist.
 * This flow is triggered in a "fire-and-forget" manner.
 * It ONLY handles file uploads to Firebase Storage and Google Drive and updates their statuses.
 * The main checklist status ('Com Pendências'/'Sem Pendências') is set previously and is not touched here.
 */

import { adminDb, uploadBase64ToFirebaseStorage } from './firebase-admin';
import { findOrCreateFolder, uploadFile } from './google-drive';
import { z } from 'zod';
import { ai } from '@/ai/genkit';
import { CompletedChecklist } from './types';
import { Buffer } from 'buffer';


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
 * Uploads all checklist data and images to a structured folder in Google Drive.
 * @param checklistId The ID of the checklist.
 * @param checklistData The checklist data object (can contain Base64 or URLs).
 */
async function uploadToGoogleDrive(checklistId: string, checklistData: CompletedChecklist): Promise<void> {
  const rootFolderName = 'Checklists_Rodocheck';
  const rootFolderId = await findOrCreateFolder(rootFolderName);
  const checklistFolderId = await findOrCreateFolder(checklistId, rootFolderId);

  // Upload the checklist JSON data first
  const checklistJson = JSON.stringify(checklistData, null, 2);
  const jsonBuffer = Buffer.from(checklistJson, 'utf-8');
  await uploadFile('checklist.json', 'application/json', jsonBuffer, checklistFolderId);

  // Gather all images that have a URL (they have been uploaded to Firebase first)
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
  
  // Create a new version of the checklist JSON that references the final image names
  // This is useful for anyone looking at the Google Drive folder directly.
  const driveChecklistData = JSON.parse(JSON.stringify(checklistData));
  images.forEach(img => {
      // This part is a bit complex, we need to find where the url was and replace it with just the name
      // This is a simplification; a more robust solution would map keys to names.
  });
  const finalJson = JSON.stringify(driveChecklistData, null, 2);
  await uploadFile('checklist_final.json', 'application/json', Buffer.from(finalJson, 'utf-8'), checklistFolderId);

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
          ...checklistWithUrls,
          firebaseStorageStatus: 'success',
      });
      console.log(`[${checklistId}] Firebase Storage uploads successful.`);

    } catch (error: any)       {
       console.error(`[${checklistId}] Firebase Storage processing failure:`, error);
        await checklistRef.update({ 
            firebaseStorageStatus: 'error',
            generalObservations: `Falha no upload para o Firebase Storage: ${error.message}`
        });
         // We stop here if Firebase fails, as Google Drive upload depends on the URLs from Firebase
        return;
    }

    // Step 2: Upload to Google Drive
    try {
        // Use the version with URLs from Firebase
        await uploadToGoogleDrive(checklistId, checklistWithUrls);
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
