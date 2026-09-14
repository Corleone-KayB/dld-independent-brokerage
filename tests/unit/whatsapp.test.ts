import { describe, it, expect } from "vitest";
import { buildWhatsAppLink } from "@/lib/utils/whatsapp";

describe("WhatsApp CTA link builder", () => {
  it("builds a working wa.me deep link with the message encoded", () => {
    const link = buildWhatsAppLink("Hi, I'm interested", "971501234567");
    expect(link).toMatch(/^https:\/\/wa\.me\/971501234567\?text=/);
    const [, query] = link.split("?");
    expect(new URLSearchParams(query).get("text")).toBe("Hi, I'm interested");
  });

  it("strips non-numeric characters from the phone number", () => {
    const link = buildWhatsAppLink("Hello", "+971 50 123 4567");
    expect(link.startsWith("https://wa.me/971501234567")).toBe(true);
  });
});
