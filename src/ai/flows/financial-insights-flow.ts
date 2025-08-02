'use server';
/**
 * @fileOverview An AI-powered financial assistant flow.
 *
 * - askFinancialQuestion - A function that analyzes transactions to answer a user's question.
 * - FinancialQuestionInput - The input type for the askFinancialQuestion function.
 * - FinancialQuestionOutput - The return type for the askFinancialQuestion function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const TransactionSchema = z.object({
  id: z.string(),
  type: z.enum(['expense', 'cash-in', 'cash-out']),
  amount: z.number(),
  name: z.string(),
  date: z.string().describe("The date of the transaction in ISO format."),
  note: z.string().optional(),
});

const FinancialQuestionInputSchema = z.object({
  question: z.string().describe('The financial question being asked by the user.'),
  transactions: z.array(TransactionSchema).describe('The list of financial transactions to analyze.'),
  currency: z.string().describe('The currency code for the amounts (e.g., USD, EUR).'),
});
export type FinancialQuestionInput = z.infer<typeof FinancialQuestionInputSchema>;

export type FinancialQuestionOutput = string;

export async function askFinancialQuestion(input: FinancialQuestionInput): Promise<FinancialQuestionOutput> {
  return financialInsightsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'financialInsightsPrompt',
  input: { schema: FinancialQuestionInputSchema },
  output: { format: 'text' },
  prompt: `You are "BizTrack AI", an expert financial assistant. Your role is to analyze a user's financial transactions and answer their questions clearly and concisely. The user's currency is {{{currency}}}.

When answering, adhere to the following rules:
1.  **Be Direct:** Directly answer the user's question.
2.  **Use Data:** Base your answers strictly on the provided transaction data. Do not invent or assume any information. If the data is insufficient, state that you cannot answer.
3.  **Be Concise:** Provide brief, to-the-point answers. Use bullet points for lists (e.g., top expenses).
4.  **Friendly but Professional:** Maintain a helpful and professional tone.
5.  **No Financial Advice:** Do NOT provide any financial advice, predictions, or opinions. Your role is to analyze past data only.

User's Question:
"{{{question}}}"

Transaction Data to Analyze:
{{{json transactions}}}
`,
});

const financialInsightsFlow = ai.defineFlow(
  {
    name: 'financialInsightsFlow',
    inputSchema: FinancialQuestionInputSchema,
    outputSchema: z.string(),
  },
  async (input) => {
    const { text } = await prompt(input);
    return text;
  }
);
