"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-ivory px-4 text-center">
      <h1 className="font-display text-2xl font-semibold text-charcoal">
        Something went wrong
      </h1>
      <p className="max-w-md text-charcoal/60">
        An unexpected error occurred. Our team has been notified. Please try
        again, or return to the homepage.
      </p>
      <div className="flex gap-3">
        <Button onClick={() => reset()} variant="primary">
          Try again
        </Button>
        <Button href="/" variant="outline">
          Go home
        </Button>
      </div>
    </div>
  );
}
