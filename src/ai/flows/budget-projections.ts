'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating AI-powered budget projections.
 *
 * - budgetProjections - A function that returns budget projections based on user history and goals.
 * - BudgetProjectionsInput - The input type for the budgetProjections function.
 * - BudgetProjectionsOutput - The return type for the budgetProjections function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const BudgetProjectionsInputSchema = z.object({
  transactionHistory: z.string().describe('The user transaction history in JSON format.'),
  financialGoals: z.string().describe('The user financial goals in JSON format.'),
});
export type BudgetProjectionsInput = z.infer<typeof BudgetProjectionsInputSchema>;

const BudgetProjectionsOutputSchema = z.object({
  suggestedSpendingLimits: z.string().describe('Suggested spending limits based on transaction history and financial goals in JSON format.'),
  explanation: z.string().describe('Explanation of how the suggested spending limits were determined.'),
});
export type BudgetProjectionsOutput = z.infer<typeof BudgetProjectionsOutputSchema>;

export async function budgetProjections(input: BudgetProjectionsInput): Promise<BudgetProjectionsOutput> {
  return budgetProjectionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'budgetProjectionsPrompt',
  input: {schema: BudgetProjectionsInputSchema},
  output: {schema: BudgetProjectionsOutputSchema},
  prompt: `You are a personal finance advisor providing budget projections.

  Based on the user's transaction history and financial goals, suggest optimal spending limits.
  Explain how you determined these spending limits.  Return the results in JSON format.

  Transaction History: {{{transactionHistory}}}
  Financial Goals: {{{financialGoals}}}
  `,
});

const budgetProjectionsFlow = ai.defineFlow(
  {
    name: 'budgetProjectionsFlow',
    inputSchema: BudgetProjectionsInputSchema,
    outputSchema: BudgetProjectionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
