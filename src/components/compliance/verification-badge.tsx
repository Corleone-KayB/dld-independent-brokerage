import { BadgeCheck, Clock, AlertTriangle, ShieldX } from "lucide-react";
import type { VerificationStatus } from "@prisma/client";
import { describeVerification } from "@/server/dld/verification";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";

const TONE_ICON = {
  success: BadgeCheck,
  warning: Clock,
  neutral: BadgeCheck,
  danger: ShieldX,
} as const;

export function VerificationBadge({
  status,
  lastVerifiedAt,
  className,
}: {
  status: VerificationStatus;
  lastVerifiedAt: Date | null;
  className?: string;
}) {
  const display = describeVerification(status, lastVerifiedAt);
  const Icon = TONE_ICON[display.tone] ?? AlertTriangle;

  return (
    <Badge
      tone={display.tone === "danger" ? "danger" : display.tone === "warning" ? "warning" : display.tone === "success" ? "success" : "neutral"}
      className={cn(className)}
      title={display.description}
    >
      <Icon className="h-3.5 w-3.5" />
      {display.label}
    </Badge>
  );
}
