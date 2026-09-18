"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";

type GalleryImage = { id: string; url: string; alt: string | null };

export function PropertyGallery({ images, title }: { images: GalleryImage[]; title: string }) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  const close = useCallback(() => {
    setLightboxIndex(null);
    triggerRef.current?.focus();
  }, []);

  const open = (index: number, trigger: HTMLElement) => {
    triggerRef.current = trigger;
    setLightboxIndex(index);
  };

  const step = useCallback(
    (delta: number) => {
      setLightboxIndex((current) => {
        if (current === null) return current;
        return (current + delta + images.length) % images.length;
      });
    },
    [images.length],
  );

  useEffect(() => {
    if (lightboxIndex === null) return;
    closeButtonRef.current?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    }
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [lightboxIndex, close, step]);

  if (images.length === 0) {
    return (
      <div className="flex aspect-[4/3] items-center justify-center rounded-2xl bg-charcoal/5 text-charcoal/40">
        Demo image placeholder
      </div>
    );
  }

  const coverImage = images[0]!;
  const visibleThumbnails = images.slice(1, 3);
  const remainingCount = images.length - 3;
  const activeImage = lightboxIndex !== null ? images[lightboxIndex] : undefined;

  return (
    <>
      <div className="grid gap-2 sm:grid-cols-4">
        <button
          type="button"
          onClick={(e) => open(0, e.currentTarget)}
          className="focus-ring group relative aspect-[4/3] overflow-hidden rounded-2xl bg-charcoal/5 sm:col-span-3 sm:row-span-2"
        >
          <Image
            src={coverImage.url}
            alt={coverImage.alt ?? title}
            fill
            sizes="(max-width: 640px) 100vw, 75vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
            priority
          />
          <span className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-obsidian/70 px-3 py-1.5 text-xs font-medium text-ivory backdrop-blur-sm">
            <Expand className="h-3.5 w-3.5" /> View all {images.length} photos
          </span>
        </button>
        {visibleThumbnails.map((img, i) => {
          const index = i + 1;
          const isLastVisible = i === visibleThumbnails.length - 1 && remainingCount > 0;
          return (
            <button
              type="button"
              key={img.id}
              onClick={(e) => open(index, e.currentTarget)}
              className="focus-ring group relative aspect-square overflow-hidden rounded-2xl bg-charcoal/5"
            >
              <Image
                src={img.url}
                alt={img.alt ?? title}
                fill
                sizes="(max-width: 640px) 100vw, 25vw"
                className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
              />
              {isLastVisible && (
                <span className="absolute inset-0 flex items-center justify-center bg-obsidian/60 font-display text-lg font-semibold text-ivory">
                  +{remainingCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {lightboxIndex !== null && activeImage && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${title} photo gallery`}
          className="fixed inset-0 z-50 flex items-center justify-center bg-obsidian/95 motion-safe:animate-fade-in"
        >
          <button
            ref={closeButtonRef}
            type="button"
            onClick={close}
            aria-label="Close gallery"
            className="focus-ring absolute right-4 top-4 rounded-full p-2.5 text-ivory hover:bg-ivory/10"
          >
            <X className="h-6 w-6" />
          </button>

          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => step(-1)}
                aria-label="Previous photo"
                className="focus-ring absolute left-2 top-1/2 -translate-y-1/2 rounded-full p-2.5 text-ivory hover:bg-ivory/10 sm:left-4"
              >
                <ChevronLeft className="h-7 w-7" />
              </button>
              <button
                type="button"
                onClick={() => step(1)}
                aria-label="Next photo"
                className="focus-ring absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-2.5 text-ivory hover:bg-ivory/10 sm:right-4"
              >
                <ChevronRight className="h-7 w-7" />
              </button>
            </>
          )}

          <div className="relative h-[70vh] w-[90vw] max-w-5xl">
            <Image
              src={activeImage.url}
              alt={activeImage.alt ?? title}
              fill
              sizes="90vw"
              className="object-contain"
            />
          </div>

          <p className="absolute bottom-4 text-sm text-ivory/60">
            {lightboxIndex + 1} / {images.length}
          </p>
        </div>
      )}
    </>
  );
}
