import { z } from "zod";

export const brokerAssistantQuerySchema = z.object({
  query: z.string().trim().min(3, "Enter a question, e.g. \"2 bedroom under 1.8M in JVC\"").max(500),
});

export type BrokerAssistantQueryInput = z.infer<typeof brokerAssistantQuerySchema>;
