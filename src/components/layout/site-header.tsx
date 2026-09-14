"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { MAIN_NAV } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-charcoal/10 bg-ivory/90 backdrop-blur-md">
      <div className="container-shell flex h-20 items-center justify-between">
        <Link href="/" className="font-display text-lg font-semibold tracking-tight text-charcoal">
          DLD Independent
          <span className="text-champagne-dark"> Brokerage Partners</span>
        </Link>

        <nav className="hidden items-center gap-8 lg:flex">
          {MAIN_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "focus-ring rounded text-sm font-medium text-charcoal/70 transition-colors hover:text-charcoal",
                pathname?.startsWith(item.href) && "text-charcoal",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Button href="/partner/login" variant="ghost" size="sm">
            Login
          </Button>
          <Button href="/partners" variant="primary" size="sm">
            Become a Partner
          </Button>
        </div>

        <button
          className="focus-ring rounded p-2 lg:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-charcoal/10 bg-ivory lg:hidden">
          <nav className="container-shell flex flex-col gap-1 py-4">
            {MAIN_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="focus-ring rounded px-2 py-2.5 text-sm font-medium text-charcoal/80 hover:bg-charcoal/5"
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-2 flex gap-3 px-2">
              <Button href="/partner/login" variant="outline" size="sm" className="flex-1">
                Login
              </Button>
              <Button href="/partners" variant="primary" size="sm" className="flex-1">
                Become a Partner
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
