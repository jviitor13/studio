
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


// In a real app, this data would come from Firestore. For now, we use mock data.
const getTireData = async () => {
    // const snapshot = await adminDb.collection('tires').get();
    // return snapshot.docs.map(doc => doc.data());
    return {
        inUse: 8,
        inStock: 12,
        inMaintenance: 3,
        scrapped: 2,
    };
};

const getMaintenanceData = async () => {
    // const snapshot = await adminDb.collection('maintenances').get();
    // return snapshot.docs.map(doc => doc.data());
     return {
        inProgress: 5,
        pendingApproval: 2,
        pending: 1,
    };
}


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

const promptTemplate = `Você é um assistente inteligente para RodoCheck, um sistema de gestão de frotas. Sua função é ajudar usuários a navegar, responder perguntas e dar insights com base nos dados do sistema. Responda de forma clara, profissional e objetiva.

O usuário está perguntando: "{{query}}"

Para te ajudar a responder, aqui estão alguns dados atuais do sistema:
- **Resumo de Pneus:** {{{tireData}}}
- **Resumo de Manutenções:** {{{maintenanceData}}}

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

1.  **Navigational Commands (Direct Action):**
    *   If the user says "criar um checklist de viagem" or "ir para checklist", respond with "Entendido. Redirecionando para a tela de criação de checklist de viagem..." and set action to "navigate" with payload "/checklist/viagem".
    *   If the user says "abrir relatórios", respond with "Acessando a tela de relatórios..." and set action to "navigate" with payload "/relatorios".

2.  **Data-driven Queries (Inform, then Suggest):**
    *   If the user asks "Como estão os pneus da frota?", use o JSON de pneus. Responda algo como: "Atualmente, temos {{tireData.inUse}} pneus em uso e {{tireData.inMaintenance}} em manutenção. Deseja visualizar os detalhes?". A ação DEVE ser "none", pois você está apenas informando e sugerindo o próximo passo.
    *   If the user asks "e as manutenções?", use o JSON de manutenções. Responda algo como: "Temos {{maintenanceData.inProgress}} veículos em manutenção e {{maintenanceData.pendingApproval}} aguardando aprovação. Gostaria de ver a lista completa?". A ação DEVE ser "none".

3.  **Support & Ambiguity:**
    *   If the user asks for "suporte", provide a WhatsApp link. Respond with "Para falar com o suporte, clique no link." set action to "link" and payload to "https://wa.me/5511999999999".
    *   If the request is ambiguous (e.g., "criar checklist"), ask for clarification: "Qual tipo de checklist, de viagem ou de manutenção?". Set action to "none".
    *   If you don't understand, respond politely and say you don't know how to help. Set action to "none".

Based on the user's query and the data provided, generate the most helpful and accurate JSON output. For data queries, always provide the information first and let the user decide if they want to navigate.`;


const assistantPrompt = ai.definePrompt({
    name: 'assistantPrompt',
    prompt: promptTemplate,
    input: {
        schema: z.object({
            query: z.string(),
            tireData: z.string(),
            maintenanceData: z.string(),
        })
    },
    output: { schema: AssistantFlowOutputSchema },
});


export const assistantFlow = ai.defineFlow(
  {
    name: 'assistantFlow',
    inputSchema: AssistantFlowInputSchema,
    outputSchema: AssistantFlowOutputSchema,
  },
  async (input) => {
    // Fetch real-time data before calling the prompt
    const tireData = await getTireData();
    const maintenanceData = await getMaintenanceData();

    const { output } = await assistantPrompt({
      query: input.query,
      tireData: JSON.stringify(tireData, null, 2),
      maintenanceData: JSON.stringify(maintenanceData, null, 2),
    });
    
    return output!;
  }
);
