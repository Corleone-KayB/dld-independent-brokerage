import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <div className="container-shell max-w-3xl py-16">
      <PageHeader title="Privacy Policy" />
      <div className="mt-6 space-y-4 text-sm text-charcoal/70">
        <p>
          This is placeholder legal content for the MVP demonstration
          environment. It should be replaced with counsel-reviewed privacy
          terms before any production launch.
        </p>
        <p>
          We collect information you submit through partner applications,
          property enquiries and CRM records solely to operate the platform.
          Compliance documents are stored securely and are never exposed
          through public URLs.
        </p>
      </div>
    </div>
  );
}
