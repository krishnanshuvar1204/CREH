import { BadgeCheck, Clock, MailCheck, MailWarning } from "lucide-react";
import type { VerificationStatus } from "../types";

const config: Record<VerificationStatus, { label: string; cls: string; Icon: typeof BadgeCheck }> = {
  unverified: { label: "Email not verified", cls: "bg-amber-100 text-amber-900 ring-amber-300", Icon: MailWarning },
  email_verified: { label: "Email verified", cls: "bg-slate-100 text-slate-700 ring-slate-300", Icon: MailCheck },
  community_pending: { label: "Verification pending", cls: "bg-sky-100 text-sky-800 ring-sky-300", Icon: Clock },
  community_verified: { label: "Verified neighbor", cls: "bg-emerald-100 text-emerald-800 ring-emerald-300", Icon: BadgeCheck },
};

export default function VerifiedBadge({ status, className = "" }: { status: VerificationStatus; className?: string }) {
  const { label, cls, Icon } = config[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ring-1 ${cls} ${className}`}>
      <Icon className="size-3.5" /> {label}
    </span>
  );
}
