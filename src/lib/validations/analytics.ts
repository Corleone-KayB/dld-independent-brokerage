import { z } from "zod";

export const enquiryTrackSchema = z.object({
  type: z.enum(["PROPERTY_VIEW", "WHATSAPP_BROKER", "WHATSAPP_PROPERTY", "WHATSAPP_PARTNER_TEAM", "WHATSAPP_SUPPORT"]),
  propertyId: z.string().trim().optional(),
  brokerId: z.string().trim().optional(),
  partnerId: z.string().trim().optional(),
});

export type EnquiryTrackInput = z.infer<typeof enquiryTrackSchema>;
