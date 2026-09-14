import Link from "next/link";

export default function PartnerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-ivory">
      <header className="border-b border-charcoal/10 bg-white">
        <div className="container-shell flex h-16 items-center justify-between">
          <Link href="/" className="font-display text-base font-semibold text-charcoal">
            DLD Independent Brokerage Partners
          </Link>
          <Link href="/" className="focus-ring rounded text-sm text-charcoal/60 hover:text-charcoal">
            Back to site
          </Link>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
