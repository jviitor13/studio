
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
// Firebase imports removed - using Django backend


const getTireData = async () => {
    const snapshot = await adminDb.collection('pneus').get();
    const tires = snapshot.docs.map(doc => doc.data());
    // This is a summary. You can make it more complex as needed.
    return tires.reduce((acc, tire) => {
        const status = tire.status || 'unknown';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
};

const getMaintenanceData = async () => {
    const snapshot = await adminDb.collection('manutencoes').get();
    const maintenances = snapshot.docs.map(doc => doc.data());
    // This is a summary. You can make it more complex as needed.
     return maintenances.reduce((acc, maintenance) => {
        const status = maintenance.status || 'unknown';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
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
- /checklist/manutencao: Create a new maintenance checklist
- /consultas: Search and view past checklists
- /relatorios: Generate reports
- /manutencoes: View and schedule maintenance
- /usuarios: Manage users
- /veiculos: Manage vehicles
- /pneus: Manage tires

Example Interactions:

1.  **Navigational Commands (Direct Action):**
    *   If the user says "criar um checklist de manutenção" or "ir para checklist de manutenção", respond with "Entendido. Redirecionando para a tela de criação de checklist de manutenção..." and set action to "navigate" with payload "/checklist/manutencao".
    *   If the user says "abrir relatórios", respond with "Acessando a tela de relatórios..." and set action to "navigate" with payload "/relatorios".

2.  **Data-driven Queries (Inform, then Suggest):**
    *   If the user asks about system data (like "Como estão os pneus?" or "e as manutenções?"), use o JSON de dados para dar uma resposta informativa. For example: "Atualmente, temos X pneus em uso e Y em manutenção. Deseja visualizar os detalhes?". The action MUST be "none" in this case. You are only providing information and suggesting the next step for the user to decide.

3.  **Support & Ambiguity:**
    *   If the user asks for "suporte", provide a WhatsApp link. Respond with "Para falar com o suporte, clique no link." set action to "link" and payload to "https://wa.me/5511999999999".
    *   If you don't understand, respond politely and say you don't know how to help. Set action to "none".

Based on the user's query and the data provided, generate the most helpful and accurate JSON output. For data queries, always provide the information first and let the user decide if they want to navigate. The action must be 'none' for these cases.`;


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
