import { z } from "zod";

export const dealCollaboratorRoleEnum = z.enum([
  "LISTING_BROKER",
  "BUYER_BROKER",
  "REFERRING_BROKER",
  "CO_BROKER",
]);

export const collaboratorInviteSchema = z.object({
  brokerId: z.string().min(1),
  role: dealCollaboratorRoleEnum,
  splitPercent: z.coerce.number().min(0).max(100).optional(),
});
