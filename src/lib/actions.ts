
'use server';
import { assessVehicleDamage as assessVehicleDamageFlow } from '@/ai/flows/assess-vehicle-damage';
import type { AssessVehicleDamageInput } from '@/ai/flows/assess-vehicle-damage';
import { assistantFlow } from '@/ai/flows/assistant-flow';
import type { AssistantFlowInput } from '@/ai/flows/assistant-flow';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { uploadChecklistFlow } from './checklist-upload-flow';
import type { ChecklistUploadData } from './checklist-upload-flow';
import { CompletedChecklist } from './types';
import { getStorage, ref, uploadString, getDownloadURL } from 'firebase-admin/storage';


// Helper function to upload images within a server action
async function uploadImageAndGetURL(base64: string, path: string, filename: string): Promise<string> {
    if (!base64 || !base64.startsWith('data:image')) {
        if (base64 && (base64.startsWith('http') || base64.startsWith('gs:'))) {
            return base64;
        }
        if (!base64) {
            return '';
        }
        throw new Error(`Invalid base64 string provided for upload: ${filename}`);
    }

    const storage = getStorage(adminDb.app);
    const bucket = storage.bucket('rodocheck-244cd.appspot.com');
    const file = bucket.file(`${path}/${filename}.jpg`);

    const buffer = Buffer.from(base64.split(',')[1], 'base64');

    await file.save(buffer, {
        metadata: {
            contentType: 'image/jpeg',
        },
    });

    const [url] = await file.getSignedUrl({
        action: 'read',
        expires: '03-09-2491', // Far future expiration date
    });

    return url;
}


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

export async function triggerChecklistUpload(data: ChecklistUploadData) {
  try {
    uploadChecklistFlow(data);
    return { success: true };
  } catch (error) {
    console.error('Error triggering checklist upload flow:', error);
    throw new Error('Failed to trigger checklist upload.');
  }
}

export async function saveChecklistAndTriggerUpload(
  checklistData: CompletedChecklist,
  imageDataUrls: Record<string, string>
) {
  const checklistId = checklistData.id;

  try {
    const uploadedUrls: Record<string, string> = {};
    for (const [key, dataUrl] of Object.entries(imageDataUrls)) {
      if (dataUrl) {
        const path = `checklists/${checklistId}/images`;
        const filename = key;
        const url = await uploadImageAndGetURL(dataUrl, path, filename);
        uploadedUrls[key] = url;
      }
    }
    
    const finalChecklistData = { ...checklistData };
    
    finalChecklistData.vehicleImages = {
      cavaloFrontal: uploadedUrls['vehicleImages.cavaloFrontal'] || '',
      cavaloLateralDireita: uploadedUrls['vehicleImages.cavaloLateralDireita'] || '',
      cavaloLateralEsquerda: uploadedUrls['vehicleImages.cavaloLateralEsquerda'] || '',
      carretaFrontal: uploadedUrls['vehicleImages.carretaFrontal'] || '',
      carretaLateralDireita: uploadedUrls['vehicleImages.carretaLateralDireita'] || '',
      carretaLateralEsquerda: uploadedUrls['vehicleImages.carretaLateralEsquerda'] || '',
    };
    finalChecklistData.signatures = {
      selfieResponsavel: uploadedUrls['signatures.selfieResponsavel'] || '',
      assinaturaResponsavel: uploadedUrls['signatures.assinaturaResponsavel'] || '',
      selfieMotorista: uploadedUrls['signatures.selfieMotorista'] || '',
      assinaturaMotorista: uploadedUrls['signatures.assinaturaMotorista'] || '',
    };
    finalChecklistData.questions = finalChecklistData.questions.map((q, index) => {
        const photoUrl = uploadedUrls[`questions.${index}.photo`];
        if (photoUrl) {
            return { ...q, photo: photoUrl };
        }
        return q;
    });

    const hasIssues = finalChecklistData.questions.some(
      (q: any) => q.status === 'Não OK'
    );
    finalChecklistData.status = hasIssues ? 'Pendente' : 'OK';
    finalChecklistData.firebaseStorageStatus = 'success';


    const checklistRef = adminDb.collection('completed-checklists').doc(checklistId);
    await checklistRef.set(finalChecklistData);

    uploadChecklistFlow({
      checklistId,
      imageDataUrls, 
    });

    return { success: true, checklistId };
  } catch (error: any) {
    console.error(
      `[${checklistId}] Error saving checklist or triggering upload:`,
      error
    );
    return { success: false, error: error.message };
  }
}
