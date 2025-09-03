
"use server";
import { assessVehicleDamage as assessVehicleDamageFlow } from "@/ai/flows/assess-vehicle-damage";
import type { AssessVehicleDamageInput } from "@/ai/flows/assess-vehicle-damage";
import { assistantFlow } from "@/ai/flows/assistant-flow";
import type { AssistantFlowInput } from "@/ai/flows/assistant-flow";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { uploadChecklistFlow } from "./checklist-upload-flow";
import type { ChecklistUploadData } from "./checklist-upload-flow";

export async function handleDamageAssessment(data: AssessVehicleDamageInput) {
    try {
        const result = await assessVehicleDamageFlow(data);
        return { success: true, data: result };
    } catch (error) {
        console.error("Error assessing vehicle damage:", error);
        return { success: false, error: "Failed to assess vehicle damage." };
    }
}

export async function invokeAssistant(data: AssistantFlowInput) {
    try {
        const result = await assistantFlow(data);
        return { success: true, data: result };
    } catch (error) {
        console.error("Error invoking assistant:", error);
        return { success: false, error: "Falha ao se comunicar com o assistente de IA." };
    }
}


interface UserData {
  name: string;
  email: string;
  password?: string;
  role: "Gestor" | "Motorista" | "Mecânico";
}

export async function createUser(data: UserData) {
  try {
    // Create user in Firebase Auth
    const userRecord = await adminAuth.createUser({
      email: data.email,
      password: data.password,
      displayName: data.name,
      emailVerified: true, // Or false, depending on your flow
      disabled: false,
    });

    // Set custom claims for role-based access control
    await adminAuth.setCustomUserClaims(userRecord.uid, { role: data.role });

    // Create user document in Firestore
    const userDocRef = adminDb.collection("users").doc(userRecord.uid);
    await userDocRef.set({
      name: data.name,
      email: data.email,
      role: data.role,
      status: "Ativo", // Default status
      createdAt: new Date().toISOString(),
    });

    return { success: true, uid: userRecord.uid };
  } catch (error: any) {
    console.error("Error creating user:", error);
    let errorMessage = "Ocorreu um erro desconhecido.";
    if (error.code === 'auth/email-already-exists') {
        errorMessage = "Este e-mail já está em uso por outro usuário.";
    } else if (error.code === 'auth/invalid-password') {
        errorMessage = "A senha fornecida não é válida. Deve ter pelo menos 6 caracteres.";
    }
    return { success: false, error: errorMessage };
  }
}

export async function triggerChecklistUpload(data: ChecklistUploadData) {
    try {
        // This is a "fire-and-forget" call. We don't await the result.
        // The flow will run in the background.
        uploadChecklistFlow(data);
        return { success: true };
    } catch (error) {
        console.error("Error triggering checklist upload flow:", error);
        return { success: false, error: "Failed to trigger checklist upload." };
    }
}
