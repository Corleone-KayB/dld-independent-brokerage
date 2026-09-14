import Image from "next/image";
import Link from "next/link";
import { BedDouble, Bath, Ruler, MapPin } from "lucide-react";
import type { Property, PropertyImage } from "@prisma/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatAed } from "@/lib/utils/format";
import { PROPERTY_PURPOSE_LABELS } from "@/lib/constants";

type PropertyWithImages = Property & { images: PropertyImage[] };

export function PropertyCard({ property }: { property: PropertyWithImages }) {
  const image = property.images[0]?.url;

  return (
    <Link href={`/properties/${property.slug}`} className="focus-ring block rounded-2xl">
      <Card className="group overflow-hidden transition-shadow hover:shadow-glass">
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-charcoal/5">
          {image ? (
            <Image
              src={image}
              alt={property.title}
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-charcoal/40">
              Demo image placeholder
            </div>
          )}
          <Badge tone="champagne" className="absolute left-3 top-3">
            {PROPERTY_PURPOSE_LABELS[property.purpose] ?? property.purpose}
          </Badge>
        </div>

        <div className="p-5">
          <p className="font-display text-lg font-semibold text-charcoal">
            {formatAed(property.price)}
          </p>
          <h3 className="mt-1 truncate text-sm font-medium text-charcoal/90">{property.title}</h3>
          <p className="mt-1 flex items-center gap-1 text-xs text-charcoal/50">
            <MapPin className="h-3.5 w-3.5" />
            {property.community ?? property.city}
          </p>

          <div className="mt-4 flex items-center gap-4 border-t border-charcoal/10 pt-4 text-xs text-charcoal/60">
            {property.bedrooms !== null && (
              <span className="flex items-center gap-1">
                <BedDouble className="h-3.5 w-3.5" /> {property.bedrooms}
              </span>
            )}
            {property.bathrooms !== null && (
              <span className="flex items-center gap-1">
                <Bath className="h-3.5 w-3.5" /> {property.bathrooms}
              </span>
            )}
            {property.sizeSqft !== null && (
              <span className="flex items-center gap-1">
                <Ruler className="h-3.5 w-3.5" /> {property.sizeSqft.toLocaleString()} sqft
              </span>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}
