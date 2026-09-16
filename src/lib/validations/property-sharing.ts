import { z } from "zod";

export const propertyShareCreateSchema = z.object({
  targetBrokerId: z.string().min(1),
});
