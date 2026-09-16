import type { Metadata } from "next";
import { getSessionUser } from "@/server/rbac/guard";
import { getBrokerById } from "@/modules/brokers/service";
import { listDiscoverableBrokers, listMyConnections } from "@/modules/network/service";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { OptInToggle } from "@/components/network/opt-in-toggle";
import { ConnectButton } from "@/components/network/connect-button";
import { NetworkActionButton } from "@/components/network/network-action-button";
import { StartConversationButton } from "@/components/network/start-conversation-button";

export const metadata: Metadata = { title: "Independent Brokerage Network" };

export default async function NetworkPage() {
  const user = await getSessionUser();
  if (!user?.brokerId) {
    return (
      <Card className="p-10 text-center text-charcoal/50">
        The Independent Brokerage Network is available to broker accounts only.
      </Card>
    );
  }

  const broker = await getBrokerById(user.brokerId);
  const optIn = broker?.networkOptIn ?? false;

  const [discoverable, connections] = await Promise.all([
    optIn ? listDiscoverableBrokers(user.brokerId) : Promise.resolve([]),
    listMyConnections(user.brokerId),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-charcoal">Independent Brokerage Network</h1>
          <p className="mt-1 max-w-xl text-charcoal/60">
            Connect with verified brokers on other teams to exchange leads, collaborate on deals, and share
            listings. A connection is required for direct messaging only — referrals, collaboration invites, and
            listing shares can be sent without one.
          </p>
        </div>
        <OptInToggle optIn={optIn} />
      </div>

      {!optIn ? (
        <Card className="p-10 text-center text-charcoal/50">
          Join the network to discover other brokers and start connecting.
        </Card>
      ) : (
        <>
          {connections.incoming.length > 0 && (
            <section>
              <h2 className="mb-3 font-display text-lg font-semibold text-charcoal">Incoming Requests</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {connections.incoming.map((c) => (
                  <Card key={c.id} className="flex items-center justify-between gap-3 p-4">
                    <div>
                      <p className="font-medium text-charcoal">{c.otherBroker.name}</p>
                      <p className="text-xs text-charcoal/50">wants to connect</p>
                    </div>
                    <div className="flex gap-2">
                      <NetworkActionButton endpoint={`/api/network/connections/${c.id}/accept`} label="Accept" />
                      <NetworkActionButton
                        endpoint={`/api/network/connections/${c.id}/decline`}
                        label="Decline"
                        variant="outline"
                      />
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {connections.outgoing.length > 0 && (
            <section>
              <h2 className="mb-3 font-display text-lg font-semibold text-charcoal">Pending Requests You Sent</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {connections.outgoing.map((c) => (
                  <Card key={c.id} className="flex items-center justify-between gap-3 p-4">
                    <p className="font-medium text-charcoal">{c.otherBroker.name}</p>
                    <NetworkActionButton
                      endpoint={`/api/network/connections/${c.id}/revoke`}
                      label="Cancel"
                      variant="outline"
                    />
                  </Card>
                ))}
              </div>
            </section>
          )}

          <section>
            <h2 className="mb-3 font-display text-lg font-semibold text-charcoal">
              Your Connections{connections.accepted.length > 0 && ` (${connections.accepted.length})`}
            </h2>
            {connections.accepted.length === 0 ? (
              <p className="text-sm text-charcoal/50">No connections yet — discover brokers below.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {connections.accepted.map((c) => (
                  <Card key={c.id} className="flex items-center justify-between gap-3 p-4">
                    <p className="font-medium text-charcoal">{c.otherBroker.name}</p>
                    <div className="flex gap-2">
                      <StartConversationButton brokerId={c.otherBroker.id} />
                      <NetworkActionButton
                        endpoint={`/api/network/connections/${c.id}/revoke`}
                        label="Disconnect"
                        variant="outline"
                      />
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="mb-3 font-display text-lg font-semibold text-charcoal">Discover Brokers</h2>
            {discoverable.length === 0 ? (
              <p className="text-sm text-charcoal/50">No other brokers have joined the network yet.</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {discoverable.map((b) => (
                  <Card key={b.id} className="p-5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-display text-base font-semibold text-charcoal">{b.name}</p>
                        <p className="mt-1 text-xs text-charcoal/50">
                          {b.areasServed.slice(0, 3).join(", ") || "Area not specified"}
                        </p>
                      </div>
                      {b.verificationStatus !== "PENDING" && <Badge tone="success">Verified</Badge>}
                    </div>
                    {b.specializations.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {b.specializations.slice(0, 3).map((s) => (
                          <Badge key={s} tone="neutral">{s}</Badge>
                        ))}
                      </div>
                    )}
                    <div className="mt-4 flex justify-end">
                      {b.connectionStatus === "NONE" && <ConnectButton targetBrokerId={b.id} />}
                      {b.connectionStatus === "REQUESTED_BY_ME" && <Badge tone="warning">Request Sent</Badge>}
                      {b.connectionStatus === "REQUESTED_BY_THEM" && (
                        <Badge tone="warning">Awaiting Your Response</Badge>
                      )}
                      {b.connectionStatus === "CONNECTED" && <Badge tone="success">Connected</Badge>}
                      {(b.connectionStatus === "DECLINED" || b.connectionStatus === "REVOKED") && (
                        <ConnectButton targetBrokerId={b.id} label="Reconnect" />
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
