
'use server';

import { google } from 'googleapis';
import { Readable } from 'stream';
import fetch from 'node-fetch';
import serviceAccount from '../../rodocheck-244cd-firebase-adminsdk-q5v8b-c6b2b51268.json';


// This is the scope for Google Drive API.
const SCOPES = ['https://www.googleapis.com/auth/drive'];

function getDriveClient() {
    // Authenticate with the service account.
    const auth = new google.auth.GoogleAuth({
        // The JSON string of the service account key is imported directly.
        credentials: {
            client_email: serviceAccount.client_email,
            private_key: serviceAccount.private_key,
        },
        scopes: SCOPES,
    });

    return google.drive({ version: 'v3', auth });
}

const drive = getDriveClient();

/**
 * Finds a folder by name. If a parent folder ID is provided, it searches within that folder.
 * If not found, it creates the folder inside the specified parent.
 * This function now assumes the root folder "Checklists_Rodocheck" is manually created and shared.
 * @param folderName The name of the folder to find or create.
 * @param parentFolderId The ID of the parent folder. If null, it searches for a shared top-level folder.
 * @returns The ID of the found or created folder.
 */
export async function findOrCreateFolder(folderName: string, parentFolderId?: string): Promise<string> {
    try {
        let query: string;
        if (parentFolderId) {
            // Search inside a specific parent folder
            query = `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and '${parentFolderId}' in parents and trashed=false`;
        } else {
            // Search for the top-level shared folder, it's not in 'parents' of 'root' for service accounts.
             query = `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and trashed=false`;
        }

        const response = await drive.files.list({
            q: query,
            fields: 'files(id, name)',
            // For service accounts, corpora must be 'allDrives' or 'drive' to see shared folders/drives
            corpora: 'allDrives',
            includeItemsFromAllDrives: true,
            supportsAllDrives: true,
        });

        if (response.data.files && response.data.files.length > 0) {
            // Folder found, return its ID.
            return response.data.files[0].id!;
        } else {
            // If it's a subfolder, create it. If it's the root, throw error.
            if (parentFolderId) {
                const fileMetadata = {
                    name: folderName,
                    mimeType: 'application/vnd.google-apps.folder',
                    parents: [parentFolderId],
                };
                const newFolder = await drive.files.create({
                    requestBody: fileMetadata,
                    fields: 'id',
                });
                return newFolder.data.id!;
            } else {
                 throw new Error(`The root folder "${folderName}" was not found. Please create it on Google Drive and share it with the service account email: ${serviceAccount.client_email}`);
            }
        }
    } catch (error) {
        console.error('Error finding or creating folder:', error);
        throw new Error(`Failed to process folder "${folderName}". Please check sharing permissions.`);
    }
}

/**
 * Uploads a file to a specific folder in Google Drive.
 * @param fileName The name of the file to be saved.
 * @param mimeType The MIME type of the file.
 * @param content The content of the file (string or data URL).
 * @param folderId The ID of the folder where the file will be uploaded.
 * @param isDataUrl Whether the content is a base64 data URL.
 */
export async function uploadFile(fileName: string, mimeType: string, content: string, folderId: string, isDataUrl: boolean = false): Promise<void> {
    try {
        const media = isDataUrl
            ? {
                mimeType: mimeType,
                // Convert base64 data URL to a readable stream
                body: Readable.from(Buffer.from(content.split(',')[1], 'base64')),
            }
            : {
                mimeType: mimeType,
                body: content,
            };
        
        const fileMetadata = {
            name: fileName,
            parents: [folderId],
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


/**
 * Uploads a file from a URL to a specific folder in Google Drive.
 * @param fileName The name of the file to be saved.
 * @param mimeType The MIME type of the file.
 * @param url The URL of the file to download and upload.
 * @param folderId The ID of the folder where the file will be uploaded.
 */
export async function uploadFileFromUrl(fileName: string, mimeType: string, url: string, folderId: string): Promise<void> {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch file from URL: ${response.statusText}`);
        }
        
        // Ensure response.body is not null and is a Readable stream
        const body = response.body as unknown as Readable;

        const fileMetadata = {
            name: fileName,
            parents: [folderId],
        };
        
        const media = {
            mimeType: mimeType,
            body: body,
        };

        await drive.files.create({
            requestBody: fileMetadata,
            media: media,
            fields: 'id',
            supportsAllDrives: true,
        });
    } catch (error) {
        console.error(`Error uploading file from URL "${fileName}":`, error);
        throw new Error(`Failed to upload file from URL "${fileName}"`);
    }
}



// Remember to add the service account email to the shared Google Drive folder with 'Editor' permissions.
