
'use server';
import { assessVehicleDamage as assessVehicleDamageFlow } from '@/ai/flows/assess-vehicle-damage';
import type { AssessVehicleDamageInput } from '@/ai/flows/assess-vehicle-damage';
import { assistantFlow } from '@/ai/flows/assistant-flow';
import type { AssistantFlowInput } from '@/ai/flows/assistant-flow';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { uploadChecklistFlow } from './checklist-upload-flow';
import { CompletedChecklist } from './types';
import { ai } from '@/ai/genkit';


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

  try {
    const checklistRef = adminDb.collection('completed-checklists').doc(checklistId);
    
    await checklistRef.set(checklistData);

    // Trigger the background upload flow and DON'T wait for it to complete.
    // This is "fire-and-forget"
    ai.run('uploadChecklistFlow', { checklistId });

    // Return immediately to the client
    return { success: true, checklistId };
  } catch (error: any) {
    console.error(
      `[${checklistId}] Error saving initial checklist or triggering upload:`,
      error
    );
    // Optionally update Firestore document to reflect the error
    const checklistRef = adminDb.collection('completed-checklists').doc(checklistId);
    await checklistRef.set({ 
        ...checklistData, 
        status: 'Pendente', 
        googleDriveStatus: 'error',
        firebaseStorageStatus: 'error',
        generalObservations: `Falha ao iniciar o processo de upload: ${error.message}`
    }, { merge: true });

    return { success: false, error: error.message, checklistId };
  }
}
