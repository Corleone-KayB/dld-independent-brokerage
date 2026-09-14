import type { Metadata } from "next";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PARTNER_TYPE_LABELS } from "@/lib/constants";

export const metadata: Metadata = { title: "Become a Partner" };

const BENEFITS = [
  "Professional broker profile with verification badges",
  "Embedded CRM for clients, leads and appointments",
  "Deterministic property matching for your clients",
  "Compliance tracking with expiry alerts",
  "A partner dashboard with your pipeline and KPIs",
];

export default function PartnersPage() {
  return (
    <div>
      <section className="bg-charcoal py-20 text-ivory">
        <div className="container-shell">
          <h1 className="max-w-2xl font-display text-4xl font-semibold sm:text-5xl">
            Trusted Brokers. Verified Partners. Better Property Decisions.
          </h1>
          <p className="mt-6 max-w-xl text-ivory/70">
            Join a private network of independent brokers and brokerage
            partners across Dubai. Apply in minutes and get access to our
            partner dashboard, CRM and compliance tools.
          </p>
          <Button href="/partner/apply" size="lg" variant="primary" className="mt-8">
            Start Application
          </Button>
        </div>
      </section>

      <section className="container-shell py-16">
        <h2 className="font-display text-2xl font-semibold text-charcoal">Who can join</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Object.entries(PARTNER_TYPE_LABELS).map(([key, label]) => (
            <Card key={key} className="p-5">
              <p className="font-display text-base font-semibold text-charcoal">{label}</p>
            </Card>
          ))}
        </div>

        <Card className="mt-6 flex flex-wrap items-center justify-between gap-4 border-champagne/30 bg-champagne/10 p-6">
          <div>
            <p className="font-display text-lg font-semibold text-charcoal">Property Owner? Skip the application.</p>
            <p className="mt-1 text-sm text-charcoal/60">
              List your property directly and we&apos;ll match you with a verified broker.
            </p>
          </div>
          <Button href="/list-property" variant="primary">List My Property</Button>
        </Card>
      </section>

      <section className="bg-ivory py-16">
        <div className="container-shell grid gap-10 lg:grid-cols-2">
          <div>
            <h2 className="font-display text-2xl font-semibold text-charcoal">What you get</h2>
            <ul className="mt-6 space-y-3">
              {BENEFITS.map((benefit) => (
                <li key={benefit} className="flex items-start gap-3 text-charcoal/70">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-champagne-dark" />
                  {benefit}
                </li>
              ))}
            </ul>
          </div>
          <Card className="p-8">
            <h3 className="font-display text-xl font-semibold text-charcoal">Application process</h3>
            <ol className="mt-4 space-y-4 text-sm text-charcoal/70">
              <li><strong className="text-charcoal">1. Basic information</strong> — your contact and company details</li>
              <li><strong className="text-charcoal">2. Professional information</strong> — broker number, ORN, specialization</li>
              <li><strong className="text-charcoal">3. Verification</strong> — license and practice card information</li>
              <li><strong className="text-charcoal">4. Business profile</strong> — your focus areas</li>
              <li><strong className="text-charcoal">5. Agreement</strong> — accept partner terms</li>
              <li><strong className="text-charcoal">6. Submitted</strong> — track your application status</li>
            </ol>
            <Button href="/partner/apply" variant="primary" className="mt-6 w-full">
              Start Application
            </Button>
          </Card>
        </div>
      </section>
    </div>
  );
}
