
'use server';

import { google } from 'googleapis';
import { Readable } from 'stream';
import fetch from 'node-fetch';
// Service account import removed - using environment variables


// This is the scope for Google Drive API.
const SCOPES = ['https://www.googleapis.com/auth/drive'];

function getDriveClient() {
    // Authenticate with the service account using environment variables.
    const auth = new google.auth.GoogleAuth({
        keyFile: process.env.GOOGLE_DRIVE_CREDENTIALS_FILE,
        scopes: SCOPES,
    });

    return google.drive({ version: 'v3', auth });
}


/**
 * Finds a folder by name. If a parent folder ID is provided, it searches within that folder.
 * If not found, it creates the folder inside the specified parent.
 * This function now assumes the root folder "Checklists_Rodocheck" is manually created and shared.
 * @param folderName The name of the folder to find or create.
 * @param parentFolderId The ID of the parent folder. If null, it searches for a shared top-level folder.
 * @returns The ID of the found or created folder.
 */
export async function findOrCreateFolder(folderName: string, parentFolderId?: string): Promise<string> {
    const drive = getDriveClient();
    try {
        // Query to find a folder by name. If a parent is specified, it's included in the query.
        let query = `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and trashed=false`;
        if (parentFolderId) {
            query += ` and '${parentFolderId}' in parents`;
        }

        const response = await drive.files.list({
            q: query,
            fields: 'files(id, name)',
            // For service accounts, corpora must be 'allDrives' to find items in Shared Drives or shared folders.
            corpora: 'allDrives',
            includeItemsFromAllDrives: true,
            supportsAllDrives: true,
        });

        if (response.data.files && response.data.files.length > 0) {
            // Folder found, return its ID.
            return response.data.files[0].id!;
        } else {
            // If it's a subfolder, create it. If it's the root, throw an error.
            if (parentFolderId) {
                const fileMetadata = {
                    name: folderName,
                    mimeType: 'application/vnd.google-apps.folder',
                    parents: [parentFolderId],
                };
                const newFolder = await drive.files.create({
                    requestBody: fileMetadata,
                    fields: 'id',
                    supportsAllDrives: true,
                });
                return newFolder.data.id!;
            } else {
                 // The root folder was not found. It must be created and shared manually.
                 throw new Error(`The root folder "${folderName}" was not found. Please create it on Google Drive and share it with the service account email: ${serviceAccount.client_email}`);
            }
        }
    } catch (error: any) {
        console.error('Error finding or creating folder:', error);
        // Provide a more specific error message.
        if (error.message.includes("not found")) {
            throw new Error(`Failed to process folder "${folderName}". It might not be shared correctly. Please verify sharing permissions with ${serviceAccount.client_email}.`);
        }
        throw new Error(`Failed to process folder "${folderName}". Details: ${error.message}`);
    }
}

/**
 * Uploads a file to a specific folder in Google Drive.
 * @param fileName The name of the file to be saved.
 * @param mimeType The MIME type of the file.
 * @param content The content of the file as a Readable stream or Buffer.
 * @param folderId The ID of the folder where the file will be uploaded.
 */
export async function uploadFile(fileName: string, mimeType: string, content: Readable | Buffer, folderId: string): Promise<void> {
    const drive = getDriveClient();
    try {
        const fileMetadata = {
            name: fileName,
            parents: [folderId],
        };

        const media = {
            mimeType: mimeType,
            body: content instanceof Buffer ? Readable.from(content) : content,
        };

        await drive.files.create({
            requestBody: fileMetadata,
            media: media,
            fields: 'id',
            supportsAllDrives: true, // Required for Shared Drives
        });
    } catch (error) {
        console.error(`Error uploading file "${fileName}":`, error);
        throw new Error(`Failed to upload file "${fileName}"`);
    }
}

// Remember to add the service account email to the shared Google Drive folder with 'Editor' permissions.
