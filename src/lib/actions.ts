
'use server';
import { assessVehicleDamage as assessVehicleDamageFlow } from '@/ai/flows/assess-vehicle-damage';
import type { AssessVehicleDamageInput } from '@/ai/flows/assess-vehicle-damage';
import { assistantFlow } from '@/ai/flows/assistant-flow';
import type { AssistantFlowInput } from '@/ai/flows/assistant-flow';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
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

export async function createUser(data: UserData) {
  try {
    const userRecord = await adminAuth.createUser({
      email: data.email,
      password: data.password,
      displayName: data.name,
      emailVerified: true, 
      disabled: false,
    });

    await adminAuth.setCustomUserClaims(userRecord.uid, { role: data.role });

    const userDocRef = adminDb.collection('users').doc(userRecord.uid);
    await userDocRef.set({
      name: data.name,
      email: data.email,
      role: data.role,
      status: 'Ativo', 
      createdAt: new Date().toISOString(),
    });

    return { success: true, uid: userRecord.uid };
  } catch (error: any) {
    console.error('Error creating user:', error);
    let errorMessage = 'Ocorreu um erro desconhecido.';
    if (error.code === 'auth/email-already-exists') {
      errorMessage = 'Este e-mail já está em uso por outro usuário.';
    } else if (error.code === 'auth/invalid-password') {
      errorMessage =
        'A senha fornecida não é válida. Deve ter pelo menos 6 caracteres.';
    }
    return { success: false, error: errorMessage };
  }
}

export async function saveChecklistAndTriggerUpload(
  checklistData: CompletedChecklist,
) {
  const checklistId = checklistData.id;
  const checklistRef = adminDb.collection('completed-checklists').doc(checklistId);

  try {
    // The checklistData object already has the correct final status
    // calculated on the client-side. We just save it.
    await checklistRef.set(checklistData);
    
    // Then, we trigger the upload flow as a background task.
    // This flow will ONLY handle file uploads and update their respective statuses.
    uploadChecklistFlow({ checklistId });

    return { success: true, checklistId };
  } catch (error: any) {
    console.error(
      `[${checklistId}] Error saving initial checklist or triggering upload:`,
      error
    );
    
    await checklistRef.set({
        ...checklistData,
        generalObservations: `Falha crítica ao salvar o checklist: ${error.message}`,
        firebaseStorageStatus: 'error',
        googleDriveStatus: 'error',
    }, { merge: true });

    return { success: false, error: error.message, checklistId };
  }
}

export async function retryChecklistUpload(checklistId: string) {
  try {
    const checklistRef = adminDb.collection('completed-checklists').doc(checklistId);
    
    // Reset only upload statuses to re-trigger the process
    await checklistRef.update({
      googleDriveStatus: 'pending',
      firebaseStorageStatus: 'pending',
      generalObservations: adminDb.FieldValue.delete(), // Clear previous errors
    });

    // Re-trigger the background flow
    uploadChecklistFlow({ checklistId });

    return { success: true };
  } catch (error: any) {
    console.error(`[${checklistId}] Error re-triggering upload:`, error);
    return { success: false, error: error.message };
  }
}
