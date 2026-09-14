// Reads the NEXT_PUBLIC_ var directly (not via src/lib/env.ts) so this stays
// safe to import from client components — env.ts also validates
// server-only secrets that must never reach the client bundle.
const DEFAULT_WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "971500000000";

/** Builds a wa.me deep link. Every CTA that uses this must be a real, working link. */
export function buildWhatsAppLink(message: string, phone: string = DEFAULT_WHATSAPP_NUMBER): string {
  const digitsOnly = phone.replace(/[^0-9]/g, "");
  const params = new URLSearchParams({ text: message });
  return `https://wa.me/${digitsOnly}?${params.toString()}`;
}
