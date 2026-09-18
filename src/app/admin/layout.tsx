import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/server/rbac/guard";
import { anyRoleHasPermission, PERMISSIONS } from "@/server/rbac/permissions";
import { AdminNav } from "@/components/admin/admin-nav";

const ADMIN_CONSOLE_PERMISSIONS = [
  PERMISSIONS.PARTNERS_VIEW_APPLICATIONS,
  PERMISSIONS.PROPERTIES_MANAGE_ALL,
  PERMISSIONS.DEALS_MANAGE_ALL,
  PERMISSIONS.COMMISSIONS_MANAGE,
  PERMISSIONS.ANALYTICS_VIEW,
  PERMISSIONS.MARKETING_MANAGE,
  PERMISSIONS.AUDIT_VIEW,
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/partner/login?callbackUrl=/admin");
  const canAccessAdmin = ADMIN_CONSOLE_PERMISSIONS.some((permission) => anyRoleHasPermission(user.roles, permission));
  if (!canAccessAdmin) {
    redirect("/partner/login");
  }

  return (
    <div className="min-h-screen bg-ivory">
      <header className="border-b border-stone/20 bg-soft-white">
        <div className="container-shell flex h-16 items-center justify-between">
          <Link href="/admin" className="font-display text-base font-semibold text-charcoal">
            DLD Admin Console
          </Link>
          <Link href="/" className="focus-ring rounded text-sm text-charcoal/60 hover:text-charcoal">
            View public site
          </Link>
        </div>
      </header>
      <div className="container-shell grid gap-6 py-8 lg:grid-cols-[240px_1fr]">
        <aside className="h-fit rounded-2xl border border-stone/20 bg-soft-white">
          <AdminNav />
        </aside>
        <div>{children}</div>
      </div>
    </div>
  );
}
