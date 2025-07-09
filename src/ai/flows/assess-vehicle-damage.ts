'use server';

/**
 * @fileOverview Assesses vehicle damage based on uploaded images and reports any potential unrecorded damage.
 *
 * - assessVehicleDamage - A function that takes a vehicle image and checklist ID, checks for damage, and returns a damage assessment.
 * - AssessVehicleDamageInput - The input type for the assessVehicleDamage function.
 * - AssessVehicleDamageOutput - The return type for the assessVehicleDamage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AssessVehicleDamageInputSchema = z.object({
  vehicleImageUri: z
    .string()
    .describe(
      "A photo of the vehicle, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  checklistId: z.string().describe('The ID of the checklist being submitted.'),
  vehicleId: z.string().describe('The ID of the vehicle.'),
});
export type AssessVehicleDamageInput = z.infer<typeof AssessVehicleDamageInputSchema>;

const AssessVehicleDamageOutputSchema = z.object({
  damageDetected: z
    .boolean()
    .describe(
      'Whether the image analysis detects potential damage not previously recorded.'
    ),
  damageDescription: z
    .string()
    .optional()
    .describe('A description of the potential damage detected, if any.'),
});
export type AssessVehicleDamageOutput = z.infer<typeof AssessVehicleDamageOutputSchema>;

export async function assessVehicleDamage(input: AssessVehicleDamageInput): Promise<AssessVehicleDamageOutput> {
  return assessVehicleDamageFlow(input);
}

const assessVehicleDamagePrompt = ai.definePrompt({
  name: 'assessVehicleDamagePrompt',
  input: {schema: AssessVehicleDamageInputSchema},
  output: {schema: AssessVehicleDamageOutputSchema},
  prompt: `You are an AI assistant specialized in vehicle damage assessment.
  You are provided with an image of a vehicle and the ID of the checklist being submitted.
  Your task is to analyze the image for any potential damage that has not been previously recorded in the system.

  Analyze the following vehicle image for damage:
  {{media url=vehicleImageUri}}

  Consider the context of the checklist ID: {{{checklistId}}} and vehicle ID: {{{vehicleId}}}.

  Respond with whether damage is detected (damageDetected: true/false) and a description of the damage (damageDescription) if any damage is detected.
  If no damage is detected, damageDescription should be empty.
  Always respond in the requested JSON format.
  `,
});

const assessVehicleDamageFlow = ai.defineFlow(
  {
    name: 'assessVehicleDamageFlow',
    inputSchema: AssessVehicleDamageInputSchema,
    outputSchema: AssessVehicleDamageOutputSchema,
  },
  async input => {
    const {output} = await assessVehicleDamagePrompt(input);
    return output!;
  }
);
