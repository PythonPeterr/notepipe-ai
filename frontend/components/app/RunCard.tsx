"use client";

import { format } from "date-fns";
import { Upload, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TableRow, TableCell } from "@/components/ui/table";
import StatusBadge from "@/components/app/StatusBadge";
import type { Run } from "@/lib/types";

interface RunCardProps {
  run: Run;
  onView?: (run: Run) => void;
  onRerun?: (run: Run) => void;
}

export default function RunCard({ run, onView, onRerun }: RunCardProps) {
  const isUpload = run.source === "upload";

  return (
    <TableRow className="border-neutral-100 hover:bg-neutral-50">
      <TableCell className="text-sm font-medium py-3">
        <div className="flex items-center gap-2">
          {isUpload ? (
            <Upload className="h-3.5 w-3.5 text-neutral-400 flex-shrink-0" />
          ) : (
            <Radio className="h-3.5 w-3.5 text-neutral-400 flex-shrink-0" />
          )}
          {run.meeting_title}
        </div>
      </TableCell>
      <TableCell className="py-3">
        <span className="text-xs bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-md border border-neutral-200 capitalize">
          {run.crm_target}
        </span>
      </TableCell>
      <TableCell className="py-3">
        <StatusBadge status={run.status} />
      </TableCell>
      <TableCell className="text-xs text-neutral-400 py-3">
        {format(new Date(run.created_at), "MMM d, HH:mm")}
      </TableCell>
      <TableCell className="py-3 text-right">
        <div className="flex items-center justify-end gap-1">
          {onRerun && run.status === "failed" && !isUpload && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-neutral-500"
              onClick={() => onRerun(run)}
            >
              Re-run
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-neutral-500"
            onClick={() => onView?.(run)}
          >
            View
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
