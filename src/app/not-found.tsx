import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-ivory px-4 text-center">
      <p className="font-display text-6xl font-semibold text-champagne-dark">404</p>
      <h1 className="font-display text-2xl font-semibold text-charcoal">Page not found</h1>
      <p className="max-w-md text-charcoal/60">
        The page you are looking for doesn&apos;t exist or may have moved.
      </p>
      <Button href="/" variant="primary">
        Back to homepage
      </Button>
    </div>
  );
}
