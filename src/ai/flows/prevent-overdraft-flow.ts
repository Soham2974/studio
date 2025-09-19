// src/ai/flows/prevent-overdraft-flow.ts
'use server';

/**
 * @fileOverview Prevents inventory overdraft when approving component requests.
 *
 * - preventOverdraft - Checks if approving a request would cause a negative inventory.
 * - PreventOverdraftInput - The input type for the preventOverdraft function.
 * - PreventOverdraftOutput - The return type for the preventOverdraft function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const PreventOverdraftInputSchema = z.object({
  componentName: z.string().describe('The name of the component.'),
  requestedQuantity: z.number().describe('The quantity of the component requested.'),
  currentQuantity: z.number().describe('The current quantity of the component in inventory.'),
});
export type PreventOverdraftInput = z.infer<typeof PreventOverdraftInputSchema>;

const PreventOverdraftOutputSchema = z.object({
  isOverdraft: z.boolean().describe('Whether approving the request would cause an overdraft.'),
  suggestedQuantity: z.number().optional().describe('The suggested quantity to approve to prevent overdraft.'),
  reason: z.string().describe('The reason for the overdraft warning.'),
});
export type PreventOverdraftOutput = z.infer<typeof PreventOverdraftOutputSchema>;

export async function preventOverdraft(input: PreventOverdraftInput): Promise<PreventOverdraftOutput> {
  return preventOverdraftFlow(input);
}

const prompt = ai.definePrompt({
  name: 'preventOverdraftPrompt',
  input: {schema: PreventOverdraftInputSchema},
  output: {schema: PreventOverdraftOutputSchema},
  prompt: `You are an inventory management assistant. Your task is to determine if approving a component request would cause an inventory overdraft.

  Component Name: {{{componentName}}}
  Requested Quantity: {{{requestedQuantity}}}
  Current Quantity: {{{currentQuantity}}}

  Determine if approving the request would result in a negative inventory. If so, set isOverdraft to true, provide a reason, and suggest a quantity to approve that prevents the overdraft.
  If approving the request will not cause an overdraft, set isOverdraft to false and provide a reason.
`,
});

const preventOverdraftFlow = ai.defineFlow(
  {
    name: 'preventOverdraftFlow',
    inputSchema: PreventOverdraftInputSchema,
    outputSchema: PreventOverdraftOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
