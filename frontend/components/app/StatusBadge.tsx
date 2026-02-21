import { cn } from "@/lib/utils";
import type { RunStatus } from "@/lib/types";

const statusStyles: Record<RunStatus, string> = {
  success: "bg-green-50 text-green-700 border-green-200",
  failed: "bg-red-50 text-red-700 border-red-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
};

interface StatusBadgeProps {
  status: RunStatus;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border capitalize",
        statusStyles[status]
      )}
    >
      {status}
    </span>
  );
}
