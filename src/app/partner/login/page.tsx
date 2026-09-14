import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Card } from "@/components/ui/card";
import { LoginForm } from "@/components/partner/login-form";

export const metadata: Metadata = { title: "Partner Login" };

export default function PartnerLoginPage() {
  return (
    <div className="container-shell flex min-h-[70vh] items-center justify-center py-12">
      <Card className="w-full max-w-md p-8">
        <h1 className="text-center font-display text-2xl font-semibold text-charcoal">Partner Login</h1>
        <p className="mt-2 text-center text-sm text-charcoal/60">
          Sign in to access your partner dashboard.
        </p>
        <div className="mt-6">
          <Suspense fallback={null}>
            <LoginForm />
          </Suspense>
        </div>
        <p className="mt-6 text-center text-sm text-charcoal/50">
          Not a partner yet?{" "}
          <Link href="/partner/apply" className="font-medium text-charcoal hover:text-champagne-dark">
            Apply here
          </Link>
        </p>
      </Card>
    </div>
  );
}
