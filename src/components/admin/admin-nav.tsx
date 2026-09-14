"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  ClipboardList,
  Users2,
  UserSquare2,
  Building2,
  Landmark,
  Target,
  Handshake,
  Wallet,
  ShieldCheck,
  FileClock,
  BarChart3,
  Megaphone,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/applications", label: "Applications", icon: ClipboardList },
  { href: "/admin/partners", label: "Partners", icon: Users2 },
  { href: "/admin/brokers", label: "Brokers", icon: UserSquare2 },
  { href: "/admin/properties", label: "Properties", icon: Building2 },
  { href: "/admin/developers", label: "Developers", icon: Landmark },
  { href: "/admin/leads", label: "Leads", icon: Target },
  { href: "/admin/deals", label: "Deals", icon: Handshake },
  { href: "/admin/commissions", label: "Commissions", icon: Wallet },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/marketing", label: "Marketing", icon: Megaphone },
  { href: "/admin/compliance", label: "Compliance", icon: ShieldCheck },
  { href: "/admin/audit-logs", label: "Audit Logs", icon: FileClock },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex h-full flex-col gap-1 p-4">
      {NAV_ITEMS.map((item) => {
        const active = item.href === "/admin" ? pathname === "/admin" : pathname?.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "focus-ring flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              active ? "bg-champagne/20 text-charcoal" : "text-charcoal/60 hover:bg-charcoal/5 hover:text-charcoal",
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
      <button
        onClick={() => signOut({ callbackUrl: "/partner/login" })}
        className="focus-ring mt-auto flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-charcoal/60 hover:bg-charcoal/5 hover:text-charcoal"
      >
        <LogOut className="h-4 w-4" /> Sign out
      </button>
    </nav>
  );
}
