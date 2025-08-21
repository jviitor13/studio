
"use client";

/**
 * Compresses an image file to a base64 JPEG string.
 * @param file The image file to compress.
 * @param quality The quality of the output JPEG (0.0 to 1.0).
 * @param maxWidth The maximum width of the output image.
 * @returns A promise that resolves with the compressed image as a base64 string.
 */
export function compressImage(
  file: File,
  quality: number = 0.7,
  maxWidth: number = 800
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      if (!event.target?.result) {
        return reject(new Error("FileReader did not return a result."));
      }
      const img = new Image();
      img.src = event.target.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          const scaleFactor = maxWidth / width;
          width = maxWidth;
          height = img.height * scaleFactor;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          return reject(new Error("Could not get canvas context"));
        }

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve(dataUrl);
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
}
