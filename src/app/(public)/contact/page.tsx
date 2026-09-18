import type { Metadata } from "next";
import { WhatsAppButton } from "@/components/ui/whatsapp-button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";

export const metadata: Metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <div className="container-shell max-w-2xl py-16">
      <PageHeader
        title="Contact Us"
        description="Have a question about properties, becoming a partner, or an existing application? Reach out to our support team."
      />

      <Card className="mt-8 p-6">
        <p className="font-medium text-charcoal">WhatsApp Support</p>
        <p className="mt-1 text-sm text-charcoal/60">Fastest way to reach our team.</p>
        <div className="mt-4">
          <WhatsAppButton message="Hi, I have a question about DLD Independent Brokerage Partners." trackType="WHATSAPP_SUPPORT">
            WhatsApp Support
          </WhatsAppButton>
        </div>
      </Card>
    </div>
  );
}
