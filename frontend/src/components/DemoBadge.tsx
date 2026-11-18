import { FlaskConical } from "lucide-react";

// Shown whenever a page is rendering mock fallback data instead of live API data.
export default function DemoBadge({ className = "" }: { className?: string }) {
  return (
    <span
      role="status"
      title="The server could not be reached, so sample data is shown."
      className={`inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900 ring-1 ring-amber-300 ${className}`}
    >
      <FlaskConical className="size-3.5" /> Demo data
    </span>
  );
}
