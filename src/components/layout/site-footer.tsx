import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-charcoal text-ivory/70">
      <div className="container-shell grid gap-10 py-16 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="font-display text-lg font-semibold text-ivory">
            DLD Independent Brokerage Partners
          </p>
          <p className="mt-3 max-w-xs text-sm">
            A private digital network connecting verified independent brokers,
            brokerage partners and their clients across Dubai. Not an official
            Dubai Land Department platform.
          </p>
        </div>

        <div>
          <p className="text-sm font-semibold text-ivory">Explore</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link className="focus-ring rounded hover:text-ivory" href="/properties">Properties</Link></li>
            <li><Link className="focus-ring rounded hover:text-ivory" href="/brokers">Brokers</Link></li>
            <li><Link className="focus-ring rounded hover:text-ivory" href="/communities">Communities</Link></li>
            <li><Link className="focus-ring rounded hover:text-ivory" href="/developers">Developers</Link></li>
            <li><Link className="focus-ring rounded hover:text-ivory" href="/investors">Investor Hub</Link></li>
            <li><Link className="focus-ring rounded hover:text-ivory" href="/calculators">Calculators</Link></li>
            <li><Link className="focus-ring rounded hover:text-ivory" href="/blog">Blog</Link></li>
            <li><Link className="focus-ring rounded hover:text-ivory" href="/partners">Become a Partner</Link></li>
          </ul>
        </div>

        <div>
          <p className="text-sm font-semibold text-ivory">Company</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link className="focus-ring rounded hover:text-ivory" href="/about">About</Link></li>
            <li><Link className="focus-ring rounded hover:text-ivory" href="/contact">Contact</Link></li>
            <li><Link className="focus-ring rounded hover:text-ivory" href="/privacy">Privacy Policy</Link></li>
            <li><Link className="focus-ring rounded hover:text-ivory" href="/terms">Terms of Service</Link></li>
          </ul>
        </div>

        <div>
          <p className="text-sm font-semibold text-ivory">Official Verification</p>
          <p className="mt-3 text-sm">
            Always confirm broker and brokerage licensing directly with the
            Dubai Land Department for the final word on official status.
          </p>
        </div>
      </div>

      <div className="border-t border-white/10 py-6">
        <p className="container-shell text-xs text-ivory/50">
          © {new Date().getFullYear()} DLD Independent Brokerage Partners. This
          is an independent private platform and is not affiliated with, endorsed
          by, or operated by the Dubai Land Department or any government entity.
        </p>
      </div>
    </footer>
  );
}
