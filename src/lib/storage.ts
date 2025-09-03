
'use client';

import { getStorage, ref, uploadString, getDownloadURL } from 'firebase/storage';
import { app } from './firebase';

const storage = getStorage(app);

/**
 * Uploads a base64 encoded image string to Firebase Storage and returns the download URL.
 * @param base64 The base64 encoded image string (e.g., from a canvas or file reader).
 * @param path The path within the storage bucket to save the image.
 * @param filename The name of the file.
 * @returns A promise that resolves with the public download URL of the uploaded image.
 */
export async function uploadImageAndGetURL(base64: string, path: string, filename: string): Promise<string> {
  // Ensure the base64 string is properly formatted
  if (!base64 || !base64.startsWith('data:image')) {
    // If it's already a URL, just return it.
    if (base64 && (base64.startsWith('http') || base64.startsWith('gs:'))) {
        return base64;
    }
    // Silently ignore if no image is provided, as some fields are optional.
    if (!base64) {
      return '';
    }
    throw new Error('Invalid base64 string provided for upload.');
  }

  const storageRef = ref(storage, `${path}/${filename}.jpg`);
  
  // 'data_url' is the correct format for uploadString with base64 data URLs
  const snapshot = await uploadString(storageRef, base64, 'data_url');
  
  const downloadURL = await getDownloadURL(snapshot.ref);
  
  return downloadURL;
}
