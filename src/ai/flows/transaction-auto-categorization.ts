'use server';
/**
 * @fileOverview This file defines a Genkit flow for automatically categorizing transactions based on their description and user history.
 *
 * - categorizeTransaction - A function that takes a transaction description and user ID, and returns the predicted category.
 * - CategorizeTransactionInput - The input type for the categorizeTransaction function.
 * - CategorizeTransactionOutput - The return type for the categorizeTransaction function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CategorizeTransactionInputSchema = z.object({
  transactionDescription: z
    .string()
    .describe('The description of the transaction.'),
  userId: z.string().describe('The ID of the user making the transaction.'),
});

export type CategorizeTransactionInput = z.infer<
  typeof CategorizeTransactionInputSchema
>;

const CategorizeTransactionOutputSchema = z.object({
  categoryId: z
    .string()
    .describe(
      'The ID of the predicted category for the transaction.  If a suitable category cannot be found, returns null.'
    )
    .nullable(),
  confidence: z
    .number()
    .describe(
      'A confidence score between 0 and 1 indicating the certainty of the category prediction.'
    ),
});

export type CategorizeTransactionOutput = z.infer<
  typeof CategorizeTransactionOutputSchema
>;

export async function categorizeTransaction(
  input: CategorizeTransactionInput
): Promise<CategorizeTransactionOutput> {
  return categorizeTransactionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'categorizeTransactionPrompt',
  input: {
    schema: CategorizeTransactionInputSchema,
  },
  output: {
    schema: CategorizeTransactionOutputSchema,
  },
  prompt: `You are a personal finance assistant that categorizes transactions for users.

  Given the following transaction description and the user's transaction history, predict the most appropriate category for the transaction.

  Transaction Description: {{{transactionDescription}}}
  User ID: {{{userId}}}

  If you are unsure, return null for the categoryId.

  Return a confidence score between 0 and 1 indicating how certain you are of the prediction.
`,
});

const categorizeTransactionFlow = ai.defineFlow(
  {
    name: 'categorizeTransactionFlow',
    inputSchema: CategorizeTransactionInputSchema,
    outputSchema: CategorizeTransactionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
