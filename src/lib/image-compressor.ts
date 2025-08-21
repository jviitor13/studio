
"use client";

import imageCompression from 'browser-image-compression';

/**
 * Compresses an image file using the browser-image-compression library.
 * @param file The image file to compress.
 * @returns A promise that resolves with the compressed image as a base64 string.
 */
export async function compressImage(file: File): Promise<string> {
  const options = {
    maxSizeMB: 0.5, // Aim for a file size under 500KB
    maxWidthOrHeight: 1280, // Resize the largest dimension to 1280px
    useWebWorker: true, // Use a web worker to avoid blocking the main thread
    fileType: 'image/jpeg', // Force output to JPEG for better compression
  };

  try {
    const compressedFile = await imageCompression(file, options);
    const dataUrl = await imageCompression.getDataUrlFromFile(compressedFile);
    return dataUrl;
  } catch (error) {
    console.error('Error during image compression:', error);
    // Fallback to original file if compression fails
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (err) => reject(err);
    });
  }
}
