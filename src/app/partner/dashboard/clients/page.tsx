import type { Metadata } from "next";
import Link from "next/link";
import { getSessionUser } from "@/server/rbac/guard";
import { listClients } from "@/modules/crm/service";
import { Card } from "@/components/ui/card";
import { NewClientForm } from "@/components/crm/new-client-form";
import { formatAed } from "@/lib/utils/format";

export const metadata: Metadata = { title: "Clients" };

export default async function ClientsPage() {
  const user = await getSessionUser();
  if (!user?.partnerId) return <p className="text-charcoal/60">No partner account linked.</p>;

  const clients = await listClients(user.partnerId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-charcoal">Clients</h1>
          <p className="mt-1 text-charcoal/60">Your client book.</p>
        </div>
        <NewClientForm />
      </div>

      {clients.length === 0 ? (
        <Card className="p-10 text-center text-charcoal/50">No clients yet.</Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {clients.map((client) => (
            <Link key={client.id} href={`/partner/dashboard/clients/${client.id}`}>
              <Card className="p-5 transition-shadow hover:shadow-elevated-hover">
                <p className="font-display text-base font-semibold text-charcoal">{client.name}</p>
                <p className="mt-1 text-xs text-charcoal/50">{client.email || client.phone || "No contact info"}</p>
                <p className="mt-3 text-sm text-charcoal/70">
                  Budget: {client.budget ? formatAed(client.budget) : "—"}
                </p>
                <p className="mt-1 text-xs text-charcoal/40">
                  {client._count.leads} leads · {client._count.appointments} appointments
                </p>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
