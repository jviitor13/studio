
'use server';
/**
 * @fileOverview Handles the background upload of a completed checklist to Google Drive.
 * The images are already in Firebase Storage, so this flow only handles the Google Drive backup.
 */

import { adminDb } from './firebase-admin';
import { findOrCreateFolder, uploadFileFromUrl, uploadFile } from './google-drive';
import { z } from 'zod';
import { ai } from '@/ai/genkit';
import { CompletedChecklist } from './types';


const ChecklistUploadDataSchema = z.object({
    checklistId: z.string(),
});
export type ChecklistUploadData = z.infer<typeof ChecklistUploadDataSchema>;


async function uploadToGoogleDrive(checklistId: string, checklistData: CompletedChecklist): Promise<void> {
    const rootFolderName = 'Checklists_Rodocheck';
    
    // 1. Find or create the root folder
    const rootFolderId = await findOrCreateFolder(rootFolderName);

    // 2. Create a subfolder for the checklist
    const checklistFolderId = await findOrCreateFolder(checklistId, rootFolderId);

    // 3. Upload the checklist JSON data
    const checklistJson = JSON.stringify(checklistData, null, 2);
    await uploadFile('checklist.json', 'application/json', checklistJson, checklistFolderId);

    // 4. Create an 'images' subfolder
    const imagesFolderId = await findOrCreateFolder('images', checklistFolderId);

    // 5. Gather all image URLs from the checklist data
    const imageUrls: { key: string, url: string }[] = [];
    checklistData.questions.forEach((q, index) => {
        if (q.photo) imageUrls.push({ key: `questions.${index}.photo`, url: q.photo });
    });
    if (checklistData.vehicleImages) {
        Object.entries(checklistData.vehicleImages).forEach(([key, url]) => {
            if (url) imageUrls.push({ key: `vehicleImages.${key}`, url: url as string });
        });
    }
     if (checklistData.signatures) {
        Object.entries(checklistData.signatures).forEach(([key, url]) => {
            if (url) imageUrls.push({ key: `signatures.${key}`, url: url as string });
        });
    }

    // 6. Upload all images from their Firebase Storage URL
    for (const { key, url } of imageUrls) {
        if (url) {
            await uploadFileFromUrl(`${key}.jpg`, 'image/jpeg', url, imagesFolderId);
        }
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
        
        const docSnap = await checklistRef.get();
        if (!docSnap.exists) {
            console.error(`[${checklistId}] Checklist document not found for Google Drive upload.`);
            return;
        }
        const checklistData = docSnap.data() as CompletedChecklist;

        // --- Google Drive Upload ---
        try {
            await uploadToGoogleDrive(checklistId, checklistData);
            await checklistRef.update({ googleDriveStatus: 'success' });
            console.log(`[${checklistId}] Google Drive upload successful.`);
        } catch (error) {
            console.error(`[${checklistId}] Google Drive upload failed:`, error);
            await checklistRef.update({ googleDriveStatus: 'error' });
        }
    }
);
