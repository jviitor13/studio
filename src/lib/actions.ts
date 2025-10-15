

'use server';
import { assessVehicleDamage as assessVehicleDamageFlow } from '@/ai/flows/assess-vehicle-damage';
import type { AssessVehicleDamageInput } from '@/ai/flows/assess-vehicle-damage';
import { assistantFlow } from '@/ai/flows/assistant-flow';
import type { AssistantFlowInput } from '@/ai/flows/assistant-flow';
// Firebase dependencies removed - using Django backend
import { uploadChecklistFlow } from './checklist-upload-flow';
import { CompletedChecklist } from './types';


export async function handleDamageAssessment(data: AssessVehicleDamageInput) {
  try {
    const result = await assessVehicleDamageFlow(data);
    return { success: true, data: result };
  } catch (error) {
    console.error('Error assessing vehicle damage:', error);
    return { success: false, error: 'Failed to assess vehicle damage.' };
  }
}

export async function invokeAssistant(data: AssistantFlowInput) {
  try {
    const result = await assistantFlow(data);
    return { success: true, data: result };
  } catch (error) {
    console.error('Error invoking assistant:', error);
    return {
      success: false,
      error: 'Falha ao se comunicar com o assistente de IA.',
    };
  }
}

interface UserData {
  name: string;
  email: string;
  password?: string;
  role: 'Gestor' | 'Motorista' | 'Mecânico';
}

// User creation now handled by Django backend
export async function createUser(data: UserData) {
  // This function is now handled by Django backend
  // Users are created through Google OAuth or Django admin
  return { success: false, error: 'User creation now handled by Django backend' };
}

export async function saveChecklistAndTriggerUpload(
  checklistData: CompletedChecklist,
) {
  const checklistId = checklistData.id;

  try {
    console.log(`[${checklistId}] Iniciando upload direto para Google Drive...`);
    
    // Skip Firestore completely - go directly to Google Drive
    try {
      // Pass the complete checklist data directly to Google Drive upload
      await uploadChecklistFlow({ checklistId, fullChecklistData: checklistData });
      console.log(`[${checklistId}] Upload para Google Drive iniciado com sucesso!`);
    } catch (uploadError: any) {
      console.error(`[${checklistId}] Error uploading to Google Drive:`, uploadError);
      throw new Error(`Falha ao enviar para Google Drive: ${uploadError.message}`);
    }

    return { success: true, checklistId };
  } catch (error: any) {
    console.error(
      `[${checklistId}] Error uploading checklist:`,
      error
    );

    return { success: false, error: error.message, checklistId };
  }
}

// Retry function removed - no Firestore to retry
export async function retryChecklistUpload(checklistId: string) {
  // This function is now handled by Django backend
  // Use the Django API to retry upload
  return { success: false, error: 'Retry now handled by Django backend' };
}
