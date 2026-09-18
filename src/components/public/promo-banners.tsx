import Image from "next/image";
import { listActiveBanners } from "@/modules/marketing/service";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export async function PromoBanners({ placement = "HOMEPAGE" }: { placement?: string }) {
  const banners = await listActiveBanners(placement);
  if (banners.length === 0) return null;

  return (
    <section className="container-shell py-10">
      <div className="grid gap-4 sm:grid-cols-2">
        {banners.map((banner) => (
          <Card key={banner.id} className="relative overflow-hidden p-6">
            {banner.imageUrl && (
              <div className="absolute inset-0 -z-10">
                <Image src={banner.imageUrl} alt={banner.title} fill sizes="(max-width: 640px) 100vw, 50vw" className="object-cover opacity-20" />
              </div>
            )}
            <p className="font-display text-lg font-semibold text-charcoal">{banner.title}</p>
            {banner.subtitle && <p className="mt-1 text-sm text-charcoal/60">{banner.subtitle}</p>}
            {banner.ctaHref && banner.ctaLabel && (
              <Button href={banner.ctaHref} size="sm" variant="outline" className="mt-4">
                {banner.ctaLabel}
              </Button>
            )}
          </Card>
        ))}
      </div>
    </section>
  );
}
