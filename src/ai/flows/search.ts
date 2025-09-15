
'use server';

/**
 * @fileOverview A transaction search AI agent.
 *
 * - searchTransactions - A function that handles the transaction search process.
 * - SearchTransactionsInput - The input type for the searchTransactions function.
 * - SearchTransactionsOutput - The return type for the searchTransactions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TransactionSchema = z.object({
    id: z.string(),
    name: z.string(),
    category: z.string(),
    date: z.string(),
    amount: z.number(),
    type: z.enum(['income', 'expense']),
    accountId: z.string(),
});

const SearchTransactionsInputSchema = z.object({
  query: z.string().describe('The natural language search query for transactions.'),
  transactions: z.array(TransactionSchema).describe('The list of transactions to search through.'),
});
export type SearchTransactionsInput = z.infer<typeof SearchTransactionsInputSchema>;


const SearchTransactionsOutputSchema = z.object({
    results: z.array(TransactionSchema).describe('An array of transactions that match the search query.'),
});
export type SearchTransactionsOutput = z.infer<typeof SearchTransactionsOutputSchema>;


export async function searchTransactions(input: SearchTransactionsInput): Promise<SearchTransactionsOutput> {
  return searchTransactionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'searchTransactionsPrompt',
  input: {schema: SearchTransactionsInputSchema},
  output: {schema: SearchTransactionsOutputSchema},
  prompt: `You are an intelligent search assistant for a personal finance app. Your task is to find transactions that match a user's natural language query.

  Search through the provided transactions and return only the ones that match the query. The query can be about anything: name, category, date range, or amount.

  User Query: {{{query}}}
  
  Transactions:
  {{{json transactions}}}
  `,
});

const searchTransactionsFlow = ai.defineFlow(
  {
    name: 'searchTransactionsFlow',
    inputSchema: SearchTransactionsInputSchema,
    outputSchema: SearchTransactionsOutputSchema,
  },
  async input => {
    if (input.query.trim() === '') {
      return { results: [] };
    }
    const {output} = await prompt(input);
    return output!;
  }
);
