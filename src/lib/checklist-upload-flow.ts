
'use server';
/**
 * @fileOverview Handles the background upload of a completed checklist to Google Drive and Firebase Storage.
 */

import { adminDb } from './firebase-admin';
import { findOrCreateFolder, uploadFile } from './google-drive';
import { uploadImageAndGetURL } from './storage';
import { z } from 'zod';
import { ai } from '@/ai/genkit';
import { CompletedChecklist } from './types';


const ChecklistUploadDataSchema = z.object({
    checklistId: z.string(),
    imageDataUrls: z.record(z.string(), z.string()),
});
export type ChecklistUploadData = z.infer<typeof ChecklistUploadDataSchema>;

async function uploadToGoogleDrive(checklistId: string, checklistData: CompletedChecklist, imageDataUrls: Record<string, string>): Promise<void> {
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

    // 5. Upload all images
    for (const [key, dataUrl] of Object.entries(imageDataUrls)) {
        if (dataUrl) {
            await uploadFile(`${key}.jpg`, 'image/jpeg', dataUrl, imagesFolderId, true);
        }
    }
}

async function uploadToFirebaseStorage(checklistId: string, imageDataUrls: Record<string, string>): Promise<Record<string, string>> {
    const uploadedUrls: Record<string, string> = {};
    for (const [key, dataUrl] of Object.entries(imageDataUrls)) {
        if (dataUrl) {
            const path = `checklists/${checklistId}/images`;
            const filename = key;
            const url = await uploadImageAndGetURL(dataUrl, path, filename);
            uploadedUrls[key] = url;
        }
    }
    return uploadedUrls;
}

export const uploadChecklistFlow = ai.defineFlow(
    {
        name: 'uploadChecklistFlow',
        inputSchema: ChecklistUploadDataSchema,
        outputSchema: z.void(),
    },
    async ({ checklistId, imageDataUrls }) => {
        const checklistRef = adminDb.collection('completed-checklists').doc(checklistId);
        
        const docSnap = await checklistRef.get();
        if (!docSnap.exists) {
            console.error(`[${checklistId}] Checklist document not found.`);
            return;
        }
        const checklistData = docSnap.data() as CompletedChecklist;

        // --- Google Drive Upload ---
        try {
            await uploadToGoogleDrive(checklistId, checklistData, imageDataUrls);
            await checklistRef.update({ googleDriveStatus: 'success' });
        } catch (error) {
            console.error(`[${checklistId}] Google Drive upload failed:`, error);
            await checklistRef.update({ googleDriveStatus: 'error' });
        }

        // --- Firebase Storage Upload ---
        try {
            const uploadedUrls = await uploadToFirebaseStorage(checklistId, imageDataUrls);

            // Create a flat object of updates
            const firestoreUpdates: Record<string, any> = { firebaseStorageStatus: 'success' };
            for(const [key, url] of Object.entries(uploadedUrls)) {
                // key is like 'questions.0.photo' or 'signatures.selfieResponsavel'
                firestoreUpdates[key] = url;
            }
            
            await checklistRef.update(firestoreUpdates);

        } catch (error) {
            console.error(`[${checklistId}] Firebase Storage upload failed:`, error);
            await checklistRef.update({ firebaseStorageStatus: 'error' });
        }
        
        // Final status update
        const hasIssues = checklistData.questions.some((q: any) => q.status === "Não OK");
        await checklistRef.update({ status: hasIssues ? "Pendente" : "OK" });
    }
);

    