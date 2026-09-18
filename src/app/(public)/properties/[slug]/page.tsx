import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BedDouble, Bath, Ruler, MapPin, Car } from "lucide-react";
import { getPropertyBySlug, getSimilarProperties, recordPropertyView } from "@/modules/properties/service";
import { PropertyCard } from "@/components/property/property-card";
import { PropertyGallery } from "@/components/property/property-gallery";
import { VerificationBadge } from "@/components/compliance/verification-badge";
import { WhatsAppButton } from "@/components/ui/whatsapp-button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatAed } from "@/lib/utils/format";
import { PROPERTY_PURPOSE_LABELS, PROPERTY_TYPE_LABELS } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const property = await getPropertyBySlug(slug);
  if (!property) return { title: "Property" };
  return {
    title: property.seoTitle || property.title,
    description: property.seoDescription || property.description || undefined,
  };
}

export default async function PropertyDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const property = await getPropertyBySlug(slug);
  if (!property) notFound();

  recordPropertyView(property.id, property.brokerId);

  const similar = await getSimilarProperties(property.id, property.community, property.purpose);
  const whatsappMessage = `Hi, I'm interested in "${property.title}" (${formatAed(property.price)}) listed on DLD Independent Brokerage Partners.`;

  return (
    <div className="container-shell py-12">
      <nav className="mb-6 text-sm text-charcoal/50">
        <Link href="/properties" className="hover:text-charcoal">Properties</Link> / {property.title}
      </nav>

      <div className="grid gap-10 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <PropertyGallery images={property.images} title={property.title} />

          <div className="mt-8 flex flex-wrap items-start justify-between gap-4">
            <div>
              <Badge tone="champagne">{PROPERTY_PURPOSE_LABELS[property.purpose] ?? property.purpose}</Badge>
              <h1 className="mt-3 font-display text-3xl font-semibold text-charcoal">{property.title}</h1>
              <p className="mt-1 flex items-center gap-1 text-charcoal/60">
                <MapPin className="h-4 w-4" /> {[property.community, property.city].filter(Boolean).join(", ")}
              </p>
            </div>
            <p className="font-display text-3xl font-semibold text-champagne-dark">{formatAed(property.price)}</p>
          </div>

          <div className="mt-6 flex flex-wrap gap-6 rounded-2xl border border-stone/20 bg-soft-white p-6 text-sm">
            {property.bedrooms !== null && (
              <span className="flex items-center gap-2"><BedDouble className="h-5 w-5 text-champagne-dark" /> {property.bedrooms} Bedrooms</span>
            )}
            {property.bathrooms !== null && (
              <span className="flex items-center gap-2"><Bath className="h-5 w-5 text-champagne-dark" /> {property.bathrooms} Bathrooms</span>
            )}
            {property.sizeSqft !== null && (
              <span className="flex items-center gap-2"><Ruler className="h-5 w-5 text-champagne-dark" /> {property.sizeSqft.toLocaleString()} sqft</span>
            )}
            {property.parkingSpaces !== null && (
              <span className="flex items-center gap-2"><Car className="h-5 w-5 text-champagne-dark" /> {property.parkingSpaces} Parking</span>
            )}
            <span className="text-charcoal/50">{PROPERTY_TYPE_LABELS[property.propertyType] ?? property.propertyType}</span>
          </div>

          {property.description && (
            <div className="mt-8">
              <h2 className="font-display text-xl font-semibold text-charcoal">Description</h2>
              <p className="mt-3 whitespace-pre-line text-charcoal/70">{property.description}</p>
            </div>
          )}

          {property.amenities.length > 0 && (
            <div className="mt-8">
              <h2 className="font-display text-xl font-semibold text-charcoal">Amenities</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {property.amenities.map((amenity) => (
                  <Badge key={amenity} tone="neutral">{amenity}</Badge>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8 grid gap-4 rounded-2xl border border-stone/20 bg-soft-white p-6 sm:grid-cols-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-charcoal/50">Rental Yield</p>
              <p className="mt-1 font-display text-lg font-semibold text-charcoal">
                {property.rentalYield ? `${property.rentalYield}%` : "—"}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-charcoal/50">Est. ROI</p>
              <p className="mt-1 font-display text-lg font-semibold text-charcoal">
                {property.roi ? `${property.roi}%` : "—"}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-charcoal/50">Completion</p>
              <p className="mt-1 font-display text-lg font-semibold text-charcoal">
                {property.completionStatus ?? "—"}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <p className="text-xs uppercase tracking-wide text-charcoal/50">Trust &amp; Verification</p>
            <VerificationBadge status={property.verificationStatus} lastVerifiedAt={null} className="mt-3" />
            <p className="mt-3 text-xs text-charcoal/50">
              Always confirm details directly with the assigned broker and the
              Dubai Land Department before making a decision.
            </p>
          </Card>

          {property.broker && (
            <Card className="p-6">
              <p className="text-xs uppercase tracking-wide text-charcoal/50">Assigned Broker</p>
              <Link href={`/brokers/${property.broker.slug}`} className="focus-ring mt-2 block font-display text-lg font-semibold text-charcoal hover:text-champagne-dark">
                {property.broker.name}
              </Link>
              <VerificationBadge
                status={property.broker.verificationStatus}
                lastVerifiedAt={property.broker.lastVerifiedAt}
                className="mt-2"
              />
              <div className="mt-4 flex flex-col gap-2">
                <WhatsAppButton
                  message={whatsappMessage}
                  size="md"
                  trackType="WHATSAPP_BROKER"
                  brokerId={property.broker.id}
                  propertyId={property.id}
                >
                  WhatsApp Broker
                </WhatsAppButton>
              </div>
            </Card>
          )}

          <Card className="p-6">
            <p className="text-xs uppercase tracking-wide text-charcoal/50">Enquire</p>
            <p className="mt-2 text-sm text-charcoal/60">
              Interested in this property? Reach out and our team will
              schedule a viewing.
            </p>
            <div className="mt-4">
              <WhatsAppButton
                message={whatsappMessage}
                size="md"
                className="w-full"
                trackType="WHATSAPP_PROPERTY"
                propertyId={property.id}
              >
                WhatsApp About Property
              </WhatsAppButton>
            </div>
          </Card>
        </div>
      </div>

      {similar.length > 0 && (
        <div className="mt-16">
          <h2 className="mb-6 font-display text-2xl font-semibold text-charcoal">Similar Properties</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {similar.map((item) => (
              <PropertyCard key={item.id} property={item} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
