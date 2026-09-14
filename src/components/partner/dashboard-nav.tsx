"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { LayoutDashboard, Users, Building2, Calendar, ShieldCheck, LogOut } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const NAV_ITEMS = [
  { href: "/partner/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/partner/dashboard/leads", label: "Leads", icon: Users },
  { href: "/partner/dashboard/clients", label: "Clients", icon: Users },
  { href: "/partner/dashboard/properties", label: "Properties", icon: Building2 },
  { href: "/partner/dashboard/appointments", label: "Appointments", icon: Calendar },
  { href: "/partner/dashboard/compliance", label: "Compliance", icon: ShieldCheck },
];

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav className="flex h-full flex-col gap-1 p-4">
      {NAV_ITEMS.map((item) => {
        const active = pathname === item.href;
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
