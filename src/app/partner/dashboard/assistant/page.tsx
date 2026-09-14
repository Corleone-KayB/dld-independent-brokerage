import type { Metadata } from "next";
import { BrokerAssistant } from "@/components/crm/broker-assistant";

export const metadata: Metadata = { title: "Broker Assistant" };

export default function BrokerAssistantPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-charcoal">Broker Assistant</h1>
        <p className="mt-1 text-charcoal/60">Search your clients and inventory in plain language.</p>
      </div>
      <BrokerAssistant />
    </div>
  );
}
