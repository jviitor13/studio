
'use client';

import { getStorage, ref, uploadString, getDownloadURL } from 'firebase/storage';
import { app } from './firebase';

const storage = getStorage(app);

/**
 * Uploads a base64 encoded image string to Firebase Storage and returns the download URL.
 * This function is intended for client-side use.
 * @param base64 The base64 encoded image string (e.g., from a canvas or file reader).
 * @param path The path within the storage bucket to save the image.
 * @param filename The name of the file.
 * @returns A promise that resolves with the public download URL of the uploaded image.
 */
export async function uploadImageAndGetURLClient(base64: string, path: string, filename: string): Promise<string> {
  if (!base64 || !base64.startsWith('data:image')) {
    // If the string is already a URL, return it directly.
    if (base64 && (base64.startsWith('http') || base64.startsWith('gs:'))) {
        return base64;
    }
    // If the string is empty or invalid, return an empty string or throw an error.
    if (!base64) {
      return '';
    }
    throw new Error('Invalid base64 string provided for upload.');
  }

  const storageRef = ref(storage, `${path}/${filename}.jpg`);
  
  const snapshot = await uploadString(storageRef, base64, 'data_url');
  
  const downloadURL = await getDownloadURL(snapshot.ref);
  
  return downloadURL;
}
