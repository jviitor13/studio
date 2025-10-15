'use server';
/**
 * @fileOverview Handles the background upload of a completed checklist.
 * This flow is triggered in a "fire-and-forget" manner.
 * It generates a final PDF and uploads it to Google Drive.
 */

// Firebase dependencies removed - using Django backend
import { findOrCreateFolder, uploadFile } from './google-drive';
import { z } from 'zod';
import { ai } from '@/ai/genkit';
import { CompletedChecklist } from './types';
import { Buffer } from 'buffer';
import { generateChecklistPdf } from './pdf-generator';
import { format } from 'date-fns';
import fetch from 'node-fetch';
// Image compression removed - not compatible with server-side execution


const ChecklistUploadDataSchema = z.object({
  checklistId: z.string(),
  fullChecklistData: z.any().optional(), // Complete checklist data with images
});
export type ChecklistUploadData = z.infer<typeof ChecklistUploadDataSchema>;


// Firebase Storage completely removed - no processing needed

async function fetchImageAsBase64(imageUrl: string): Promise<string> {
    try {
        const response = await fetch(imageUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch image ${imageUrl}: ${response.statusText}`);
        }
        const buffer = await response.arrayBuffer();
        const base64 = Buffer.from(buffer).toString('base64');
        const mimeType = response.headers.get('content-type') || 'image/jpeg';
        return `data:${mimeType};base64,${base64}`;
    } catch (error) {
        console.error(`Error fetching image as base64: ${imageUrl}`, error);
        return ''; // Return empty string or a placeholder if fetching fails
    }
}

// Função removida - não é mais necessária pois trabalhamos diretamente com Base64

/**
 * Generates a PDF from the checklist data and uploads it to Google Drive.
 * @param checklistData The checklist data object with Base64 images.
 */
async function uploadToGoogleDrive(checklistData: CompletedChecklist): Promise<void> {
  const rootFolderName = 'Checklists_Rodocheck';
  const rootFolderId = await findOrCreateFolder(rootFolderName);

  const formattedDate = checklistData.createdAt ? format(new Date(checklistData.createdAt.toString()), "dd-MM-yyyy_HH-mm") : 'data_indisponivel';
  const vehicleFolderName = checklistData.vehicle.replace(/[\/]/g, '_').trim();
  const checklistFolderName = `${vehicleFolderName}_${formattedDate}`;
  const checklistFolderId = await findOrCreateFolder(checklistFolderName, rootFolderId);
  
  console.log(`[${checklistData.id}] Criando pasta: ${checklistFolderName} (ID: ${checklistFolderId})`);
  
  // 1. Generate and upload the PDF with high-quality images
  console.log(`[${checklistData.id}] Gerando PDF com imagens de alta qualidade...`);
  
  // For PDF generation, we want high-quality images, so we'll use the original data
  // The checklistData from Firestore might have compressed images, so we need to handle this
  let pdfChecklistData = checklistData;
  
  // If images are compressed (smaller), we'll use them as-is for the PDF
  // The PDF generator will work with whatever quality is available
  const pdfBase64 = await generateChecklistPdf(pdfChecklistData, 'base64');
  if (!pdfBase64) {
    throw new Error('PDF generation returned an empty result.');
  }

  const pdfBuffer = Buffer.from(pdfBase64, 'base64');
  const pdfFileName = `checklist_${vehicleFolderName}.pdf`;
  
  console.log(`[${checklistData.id}] Enviando PDF para Google Drive: ${pdfFileName}`);
  await uploadFile(pdfFileName, 'application/pdf', pdfBuffer, checklistFolderId);
  console.log(`[${checklistData.id}] PDF enviado com sucesso!`);

  // 2. Upload all individual images to the SAME checklist folder
  const imagesToUpload: { name: string; data: string; mimeType: string }[] = [];

  if(checklistData.questions) {
      checklistData.questions.forEach((q, i) => {
          if (q.photo && typeof q.photo === 'string' && q.photo.startsWith('data:image')) {
              imagesToUpload.push({ 
                name: `item_${i}_${q.text.substring(0,10)}.jpg`, 
                data: q.photo, 
                mimeType: 'image/jpeg' 
              });
          }
      });
  }

  if (checklistData.vehicleImages) {
      Object.entries(checklistData.vehicleImages).forEach(([key, data]) => {
          if (data && typeof data === 'string' && data.startsWith('data:image')) {
              imagesToUpload.push({ 
                name: `vehicle_${key}.jpg`, 
                data, 
                mimeType: 'image/jpeg' 
              });
          }
      });
  }

  if (checklistData.signatures) {
      Object.entries(checklistData.signatures).forEach(([key, data]) => {
          if (data && typeof data === 'string' && data.startsWith('data:image')) {
              imagesToUpload.push({ 
                name: `signature_${key}.png`, 
                data, 
                mimeType: 'image/png' 
              });
          }
      });
  }

  console.log(`[${checklistData.id}] Enviando ${imagesToUpload.length} imagens individuais...`);

  // Execute all image uploads in parallel
  await Promise.all(
      imagesToUpload.map(async image => {
        try {
          const imageBuffer = Buffer.from(image.data.split(',')[1], 'base64');
          await uploadFile(image.name, image.mimeType, imageBuffer, checklistFolderId);
          console.log(`[${checklistData.id}] Imagem enviada: ${image.name}`);
        } catch (error) {
          console.error(`[${checklistData.id}] Erro ao enviar imagem ${image.name}:`, error);
        }
      })
  );
  
  console.log(`[${checklistData.id}] Todas as imagens enviadas com sucesso!`);
}

// All Firestore and Firebase Storage functionality removed

// Simplified upload function - no Firestore, direct to Google Drive
export async function uploadChecklistFlow({ checklistId, fullChecklistData }: ChecklistUploadData) {
  try {
    if (!fullChecklistData) {
      throw new Error(`[${checklistId}] No checklist data provided`);
    }

    const checklistData = fullChecklistData as CompletedChecklist;
    console.log(`[${checklistId}] Starting direct Google Drive upload...`);

    // Upload directly to Google Drive
    await uploadToGoogleDrive(checklistData);
    
    console.log(`[${checklistId}] Google Drive upload completed successfully!`);
    
  } catch (error: any) {
    console.error(`[${checklistId}] Google Drive upload failed:`, error);
    throw error;
  }
}