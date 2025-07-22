
'use server';

/**
 * @fileOverview A flow for the RodoCheck AI assistant.
 *
 * - assistantFlow - A function that processes user queries and returns a structured response.
 * - AssistantFlowInput - The input type for the assistantFlow function.
 * - AssistantFlowOutput - The return type for the assistantFlow function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { adminDb } from '@/lib/firebase-admin';


// Tool to get tire status summary from Firestore
const getTireStatusSummary = ai.defineTool(
    {
        name: 'getTireStatusSummary',
        description: 'Get a summary of the status of all tires in the fleet.',
        outputSchema: z.object({
            inUse: z.number().describe('Number of tires currently in use on a vehicle.'),
            inStock: z.number().describe('Number of tires available in stock.'),
            inMaintenance: z.number().describe('Number of tires currently in maintenance.'),
            scrapped: z.number().describe('Number of tires that have been scrapped.'),
        }),
    },
    async () => {
        // In a real app, this data would come from Firestore.
        // const snapshot = await adminDb.collection('tires').get();
        // const tires = snapshot.docs.map(doc => doc.data());
        // For now, returning mock data.
        return {
            inUse: 8,
            inStock: 12,
            inMaintenance: 3,
            scrapped: 2,
        };
    }
);

// Tool to get maintenance status summary from Firestore
const getMaintenanceSummary = ai.defineTool(
    {
        name: 'getMaintenanceSummary',
        description: 'Get a summary of the status of all vehicle maintenances.',
        outputSchema: z.object({
            inProgress: z.number().describe('Number of vehicles currently in maintenance.'),
            pendingApproval: z.number().describe('Number of maintenances waiting for approval.'),
            pending: z.number().describe('Number of maintenances that are pending action.'),
        }),
    },
    async () => {
        // In a real app, this data would come from Firestore.
        // For now, returning mock data.
        return {
            inProgress: 5,
            pendingApproval: 2,
            pending: 1,
        };
    }
);


const AssistantFlowInputSchema = z.object({
  query: z.string().describe('The user question or command.'),
});
export type AssistantFlowInput = z.infer<typeof AssistantFlowInputSchema>;

const AssistantFlowOutputSchema = z.object({
  response: z.string().describe('The text response to show to the user.'),
  action: z
    .enum(['none', 'navigate', 'link', 'error'])
    .describe(
      'The action the application should perform. "navigate" for internal routing, "link" for external URLs.'
    ),
  payload: z
    .string()
    .optional()
    .describe(
      'The data for the action, e.g., a URL path for "navigate" or a full URL for "link".'
    ),
});
export type AssistantFlowOutput = z.infer<typeof AssistantFlowOutputSchema>;

const prompt = ai.definePrompt({
    name: 'assistantPrompt',
    input: {schema: AssistantFlowInputSchema},
    output: {schema: AssistantFlowOutputSchema},
    tools: [getTireStatusSummary, getMaintenanceSummary],
    prompt: `You are an intelligent assistant for RodoCheck, a fleet management system developed on Firebase. 
Your role is to help users navigate the app, answer questions about its features, and provide insights based on real-time data from Firebase. 
Respond clearly, professionally, and objectively. Whenever possible, suggest actions or navigate the user to the corresponding screen.

The user is asking: "{{query}}"

Available Pages:
- /dashboard: Main dashboard
- /checklist/viagem: Create a new trip checklist
- /checklist/manutencao: Create a new maintenance checklist
- /consultas: Search and view past checklists
- /relatorios: Generate reports
- /manutencoes: View and schedule maintenance
- /usuarios: Manage users
- /veiculos: Manage vehicles
- /pneus: Manage tires

Example Interactions:

1.  **Navigational Commands:**
    *   If the user says "criar um checklist", respond with "Ótimo! Redirecionando você para a tela de criação de checklist..." and set action to "navigate" with payload "/checklist/viagem".
    *   If the user says "abrir tela de relatórios", respond with "Acessando a tela de relatórios..." and set action to "navigate" with payload "/relatorios".

2.  **Data-driven Queries (use your tools):**
    *   If the user asks "Como estão os pneus da frota?", use the 'getTireStatusSummary' tool. Based on the result, respond like: "Atualmente, [X] pneus estão em uso, [Y] em manutenção... Deseja visualizar os detalhes?" and set action to "navigate" with payload "/pneus".
    *   If the user asks "Como estão as manutenções?", use the 'getMaintenanceSummary' tool. Based on the result, respond like: "Temos [A] veículos em manutenção, [B] aguardando aprovação... Deseja ver a lista?" and set action to "navigate" with payload "/manutencoes".

3.  **Support & Ambiguity:**
    *   If the user asks for "suporte", provide a WhatsApp link. Respond with "Para falar com o suporte, clique no link." set action to "link" and payload to "https://wa.me/5511999999999".
    *   If the request is ambiguous (e.g., "criar checklist"), ask for clarification: "Qual tipo de checklist, de viagem ou de manutenção?". Set action to "none".
    *   If you don't understand, respond politely and say you don't know how to help. Set action to "none".

Based on the user's query and the data from your tools, provide the most helpful and accurate JSON output.`,
  });

export const assistantFlow = ai.defineFlow(
  {
    name: 'assistantFlow',
    inputSchema: AssistantFlowInputSchema,
    outputSchema: AssistantFlowOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
