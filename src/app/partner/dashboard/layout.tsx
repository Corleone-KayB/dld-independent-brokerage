import { redirect } from "next/navigation";
import { getSessionUser } from "@/server/rbac/guard";
import { anyRoleHasPermission, PERMISSIONS } from "@/server/rbac/permissions";
import { DashboardNav } from "@/components/partner/dashboard-nav";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/partner/login?callbackUrl=/partner/dashboard");
  const canAccessDashboard =
    anyRoleHasPermission(user.roles, PERMISSIONS.LEADS_MANAGE_OWN) ||
    anyRoleHasPermission(user.roles, PERMISSIONS.DEVELOPER_MANAGE_OWN);
  if (!canAccessDashboard) {
    redirect("/partner/login");
  }

  return (
    <div className="container-shell grid gap-6 py-8 lg:grid-cols-[240px_1fr]">
      <aside className="h-fit rounded-2xl border border-stone/20 bg-soft-white">
        <DashboardNav roles={user.roles} />
      </aside>
      <div>{children}</div>
    </div>
  );
}
