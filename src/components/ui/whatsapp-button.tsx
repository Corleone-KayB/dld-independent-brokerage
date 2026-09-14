"use client";

import { MessageCircle } from "lucide-react";
import { buildWhatsAppLink } from "@/lib/utils/whatsapp";
import { buttonVariants, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

export type WhatsAppTrackType = "WHATSAPP_BROKER" | "WHATSAPP_PROPERTY" | "WHATSAPP_PARTNER_TEAM" | "WHATSAPP_SUPPORT";

function trackEnquiry(type: WhatsAppTrackType, ids: { propertyId?: string; brokerId?: string; partnerId?: string }) {
  try {
    const body = JSON.stringify({ type, ...ids });
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/analytics/track", new Blob([body], { type: "application/json" }));
    } else {
      fetch("/api/analytics/track", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true });
    }
  } catch {
    // Best-effort analytics only — never block the WhatsApp CTA on tracking failures.
  }
}

export function WhatsAppButton({
  message,
  phone,
  children = "WhatsApp",
  size = "md",
  className,
  trackType,
  propertyId,
  brokerId,
  partnerId,
}: {
  message: string;
  phone?: string;
  children?: React.ReactNode;
  size?: ButtonProps["size"];
  className?: string;
  trackType?: WhatsAppTrackType;
  propertyId?: string;
  brokerId?: string;
  partnerId?: string;
}) {
  return (
    <a
      href={buildWhatsAppLink(message, phone)}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackType && trackEnquiry(trackType, { propertyId, brokerId, partnerId })}
      className={cn(buttonVariants({ variant: "whatsapp", size }), className)}
    >
      <MessageCircle className="h-4 w-4" />
      {children}
    </a>
  );
}
