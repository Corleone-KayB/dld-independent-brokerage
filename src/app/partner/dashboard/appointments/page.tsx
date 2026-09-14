import type { Metadata } from "next";
import { getSessionUser } from "@/server/rbac/guard";
import { listAppointments, listClients } from "@/modules/crm/service";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NewAppointmentForm } from "@/components/crm/new-appointment-form";
import { formatDate } from "@/lib/utils/format";

export const metadata: Metadata = { title: "Appointments" };

export default async function AppointmentsPage() {
  const user = await getSessionUser();
  if (!user?.partnerId) return <p className="text-charcoal/60">No partner account linked.</p>;

  const [appointments, clients] = await Promise.all([
    listAppointments({ partnerId: user.partnerId }),
    listClients(user.partnerId),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-charcoal">Appointments</h1>
          <p className="mt-1 text-charcoal/60">Upcoming and past viewings.</p>
        </div>
        <NewAppointmentForm clients={clients.map((c) => ({ id: c.id, name: c.name }))} />
      </div>

      {appointments.length === 0 ? (
        <Card className="p-10 text-center text-charcoal/50">No appointments scheduled.</Card>
      ) : (
        <div className="space-y-3">
          {appointments.map((appt) => (
            <Card key={appt.id} className="flex items-center justify-between p-4">
              <div>
                <p className="font-medium text-charcoal">{appt.client?.name ?? "Unassigned"}</p>
                <p className="text-sm text-charcoal/50">{formatDate(appt.startsAt)}</p>
              </div>
              <Badge tone={appt.status === "COMPLETED" ? "success" : appt.status === "CANCELLED" || appt.status === "NO_SHOW" ? "danger" : "neutral"}>
                {appt.status}
              </Badge>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
