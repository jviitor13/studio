"use server";
import { assessVehicleDamage as assessVehicleDamageFlow } from "@/ai/flows/assess-vehicle-damage";
import type { AssessVehicleDamageInput } from "@/ai/flows/assess-vehicle-damage";

export async function handleDamageAssessment(data: AssessVehicleDamageInput) {
    try {
        const result = await assessVehicleDamageFlow(data);
        return { success: true, data: result };
    } catch (error) {
        console.error("Error assessing vehicle damage:", error);
        return { success: false, error: "Failed to assess vehicle damage." };
    }
}
