
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

const AssistantFlowInputSchema = z.object({
  query: z.string().describe('The user question or command.'),
  // In a real app, you would pass the user's role and ID here.
  // userRole: z.string().describe('The role of the user (e.g., gestor, motorista).'),
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
    prompt: `You are an intelligent and friendly assistant for the RodoCheck application, a vehicle and fleet management system.
Your goal is to understand the user's request and provide a helpful response and a specific action to perform.

The user is asking: "{{query}}"

Analyze the user's intent and decide the best action. The available pages are:
- /dashboard: Main dashboard
- /checklist/viagem: Create a new trip checklist
- /checklist/manutencao: Create a new maintenance checklist
- /consultas: Search and view past checklists
- /relatorios: Generate reports
- /manutencoes: View and schedule maintenance
- /usuarios: Manage users
- /veiculos: Manage vehicles
- /pneus: Manage tires

Here are some examples of how to respond:

- If the user says "criar um checklist de viagem", you should respond with something like "Ok, vamos criar um checklist de viagem." and set the action to "navigate" and the payload to "/checklist/viagem".
- If the user says "checklist de manutenção" or "criar checklist de manutenção", you should respond with "Certo, vamos para a tela de checklist de manutenção." and set the action to "navigate" and the payload to "/checklist/manutencao".
- If the user says "gestão de pneus", "ver pneus" or "gerenciar pneus", you should respond with "Ok, aqui está a tela de gestão de pneus." and set the action to "navigate" and the payload to "/pneus".
- If the user says "ver pendências" or "problemas em aberto", you should respond with "Claro, aqui estão os checklists com pendências." and set the action to "navigate" and the payload to "/consultas". You can also filter by status if the system supports it.
- If the user says "gerar um relatório de custos", you should respond with "Certo, vamos para a tela de relatórios." and set the action to "navigate" and the payload to "/relatorios".
- If the user asks for "suporte" or "falar com alguém", you should respond with "Para falar com o suporte, clique no link." and set the action to "link" and the payload to a WhatsApp link like "https://wa.me/5511999999999".
- If you don't understand, respond politely and say you don't know how to help with that. Set the action to "none".
- If the request is ambiguous, ask for clarification. For example, if they say "criar checklist", ask "Qual tipo de checklist, de viagem ou de manutenção?". Set the action to "none".

Based on the user's query, provide the appropriate JSON output.`,
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
