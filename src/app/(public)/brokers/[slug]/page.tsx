import type { Metadata } from "next";
import type { ReactNode } from "react";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getBrokerBySlug, getBrokerById } from "@/modules/brokers/service";
import { getConnectionBetween } from "@/modules/network/service";
import { getSessionUser } from "@/server/rbac/guard";
import { getNetworkActivity } from "@/server/analytics/broker-performance";
import { PropertyCard } from "@/components/property/property-card";
import { VerificationBadge } from "@/components/compliance/verification-badge";
import { WhatsAppButton } from "@/components/ui/whatsapp-button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConnectButton } from "@/components/network/connect-button";
import { dldConfig } from "@/server/dld/config";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const broker = await getBrokerBySlug(slug);
  return { title: broker?.name ?? "Broker Profile" };
}

export default async function BrokerProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const broker = await getBrokerBySlug(slug);
  if (!broker) notFound();

  const whatsappMessage = `Hi ${broker.name}, I found your profile on DLD Independent Brokerage Partners and would like to connect.`;
  // Public network stats: counts and rating only — never AED figures (commission, deal value, etc.).
  const network = await getNetworkActivity(broker.id);

  // Peer-to-peer network CTA: only shown to another broker, when both sides have opted in.
  let networkCta: ReactNode = null;
  if (broker.networkOptIn) {
    const viewer = await getSessionUser();
    if (viewer?.brokerId && viewer.brokerId !== broker.id) {
      const viewerBroker = await getBrokerById(viewer.brokerId);
      if (viewerBroker?.networkOptIn) {
        const connection = await getConnectionBetween(viewer.brokerId, broker.id);
        if (!connection) {
          networkCta = <ConnectButton targetBrokerId={broker.id} label="Connect on the Network" />;
        } else if (connection.status === "ACCEPTED") {
          networkCta = <Badge tone="success">Connected on the Network</Badge>;
        } else if (connection.status === "REQUESTED") {
          networkCta =
            connection.requesterId === viewer.brokerId ? (
              <Badge tone="warning">Request Sent</Badge>
            ) : (
              <Badge tone="warning">Awaiting Your Response</Badge>
            );
        } else {
          networkCta = <ConnectButton targetBrokerId={broker.id} label="Reconnect on the Network" />;
        }
      }
    }
  }

  return (
    <div className="container-shell py-12">
      <div className="grid gap-10 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-1">
          <div className="relative mx-auto h-28 w-28 overflow-hidden rounded-full bg-charcoal/10">
            {broker.photoUrl ? (
              <Image src={broker.photoUrl} alt={broker.name} fill className="object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center font-display text-3xl text-charcoal/50">
                {broker.name.charAt(0)}
              </div>
            )}
          </div>
          <h1 className="mt-4 text-center font-display text-2xl font-semibold text-charcoal">{broker.name}</h1>
          <p className="text-center text-sm text-charcoal/60">
            {broker.partner?.companyName ?? "Independent Broker"}
          </p>

          <div className="mt-4 flex justify-center">
            <VerificationBadge status={broker.verificationStatus} lastVerifiedAt={broker.lastVerifiedAt} />
          </div>

          {network.reviewCount > 0 && network.rating !== null && (
            <p className="mt-3 text-center text-sm text-charcoal/60">
              <span className="text-champagne-dark">★</span> {network.rating.toFixed(1)} · {network.reviewCount} peer
              review{network.reviewCount === 1 ? "" : "s"}
            </p>
          )}

          {(network.dealCollaborations > 0 || network.referralsCompleted > 0) && (
            <dl className="mt-3 grid grid-cols-2 gap-2 text-center text-xs text-charcoal/50">
              {network.dealCollaborations > 0 && (
                <div>
                  <dd className="font-display text-base font-semibold text-charcoal">{network.dealCollaborations}</dd>
                  <dt>Deal Collaborations</dt>
                </div>
              )}
              {network.referralsCompleted > 0 && (
                <div>
                  <dd className="font-display text-base font-semibold text-charcoal">{network.referralsCompleted}</dd>
                  <dt>Referrals Completed</dt>
                </div>
              )}
            </dl>
          )}

          <dl className="mt-6 space-y-3 text-sm">
            <div className="flex justify-between border-b border-charcoal/10 pb-2">
              <dt className="text-charcoal/50">Experience</dt>
              <dd className="font-medium text-charcoal">{broker.experienceYears ?? "—"} years</dd>
            </div>
            <div className="flex justify-between border-b border-charcoal/10 pb-2">
              <dt className="text-charcoal/50">Broker Number</dt>
              <dd className="font-medium text-charcoal">{broker.brokerNumber ?? "—"}</dd>
            </div>
            <div className="flex justify-between border-b border-charcoal/10 pb-2">
              <dt className="text-charcoal/50">ORN</dt>
              <dd className="font-medium text-charcoal">{broker.orn ?? "—"}</dd>
            </div>
            <div className="flex justify-between pb-2">
              <dt className="text-charcoal/50">Languages</dt>
              <dd className="font-medium text-charcoal">{broker.languages.join(", ") || "—"}</dd>
            </div>
          </dl>

          {broker.specializations.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {broker.specializations.map((s) => (
                <Badge key={s} tone="neutral">{s}</Badge>
              ))}
            </div>
          )}

          <div className="mt-6 flex flex-col items-stretch gap-2">
            <WhatsAppButton message={whatsappMessage} trackType="WHATSAPP_BROKER" brokerId={broker.id}>WhatsApp Broker</WhatsAppButton>
            {networkCta && <div className="flex justify-center">{networkCta}</div>}
            {dldConfig.officialVerificationUrl && (
              <a
                href={dldConfig.officialVerificationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="focus-ring text-center text-xs text-charcoal/50 underline hover:text-charcoal"
              >
                Verify official credentials via Dubai Land Department
              </a>
            )}
          </div>
        </Card>

        <div className="lg:col-span-2">
          {broker.bio && (
            <Card className="p-6">
              <h2 className="font-display text-lg font-semibold text-charcoal">About</h2>
              <p className="mt-2 whitespace-pre-line text-charcoal/70">{broker.bio}</p>
            </Card>
          )}

          <h2 className="mb-6 mt-8 font-display text-xl font-semibold text-charcoal">Active Listings</h2>
          {broker.properties.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-charcoal/20 p-8 text-center text-charcoal/50">
              No active listings from this broker yet.
            </p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2">
              {broker.properties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
