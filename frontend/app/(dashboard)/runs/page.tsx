"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Zap } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import RunCard from "@/components/app/RunCard";
import type { Run, RunStatus, CRMTarget, PaginatedResponse } from "@/lib/types";
import Link from "next/link";

type StatusFilter = RunStatus | "all";
type CRMFilter = CRMTarget | "all";

export default function RunsPage() {
  const router = useRouter();
  const [runs, setRuns] = useState<Run[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [crmFilter, setCRMFilter] = useState<CRMFilter>("all");

  const fetchRuns = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (crmFilter !== "all") params.set("crm_target", crmFilter);
      params.set("per_page", "50");

      const data = await api.get<PaginatedResponse<Run>>(
        `/api/runs?${params.toString()}`
      );
      setRuns(data.items);
      setTotal(data.total);
    } catch {
      // API not available yet
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, crmFilter]);

  useEffect(() => {
    fetchRuns();
  }, [fetchRuns]);

  const handleRerun = async (run: Run) => {
    try {
      await api.post(`/api/runs/${run.id}/rerun`);
      toast.success("Re-run started");
      fetchRuns();
    } catch {
      toast.error("Failed to re-run");
    }
  };

  const statusOptions: { value: StatusFilter; label: string }[] = [
    { value: "all", label: "All status" },
    { value: "success", label: "Success" },
    { value: "failed", label: "Failed" },
    { value: "pending", label: "Pending" },
  ];

  const crmOptions: { value: CRMFilter; label: string }[] = [
    { value: "all", label: "All CRMs" },
    { value: "hubspot", label: "HubSpot" },
    { value: "pipedrive", label: "Pipedrive" },
  ];

  if (!loading && runs.length === 0 && !search && statusFilter === "all" && crmFilter === "all") {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Run History</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Track your automation runs
          </p>
        </div>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="h-11 w-11 rounded-xl bg-neutral-100 border border-neutral-200 flex items-center justify-center mb-4">
            <Zap className="h-5 w-5 text-neutral-400" />
          </div>
          <p className="text-sm font-semibold text-neutral-800">No runs yet</p>
          <p className="text-sm text-neutral-400 mt-1 max-w-xs">
            Connect Fireflies and a CRM to start automating your post-meeting
            workflow.
          </p>
          <Link href="/connections">
            <Button className="mt-5 h-8 text-xs bg-black text-white hover:bg-neutral-800">
              Connect tools
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Run History</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Track your automation runs
        </p>
      </div>

      <div className="bg-white rounded-xl border border-neutral-200 shadow-card overflow-hidden">
        <div className="flex items-center gap-2 p-4 border-b border-neutral-100">
          <Input
            placeholder="Search runs..."
            className="h-8 text-sm max-w-xs bg-neutral-50 border-neutral-200"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="flex gap-1">
            {statusOptions.map((opt) => (
              <Button
                key={opt.value}
                variant="outline"
                size="sm"
                className={`h-8 text-xs border-neutral-200 ${
                  statusFilter === opt.value
                    ? "bg-neutral-100 text-neutral-900"
                    : ""
                }`}
                onClick={() => setStatusFilter(opt.value)}
              >
                {opt.label}
              </Button>
            ))}
          </div>
          <div className="flex gap-1">
            {crmOptions.map((opt) => (
              <Button
                key={opt.value}
                variant="outline"
                size="sm"
                className={`h-8 text-xs border-neutral-200 ${
                  crmFilter === opt.value
                    ? "bg-neutral-100 text-neutral-900"
                    : ""
                }`}
                onClick={() => setCRMFilter(opt.value)}
              >
                {opt.label}
              </Button>
            ))}
          </div>
          <div className="ml-auto text-xs text-neutral-400">
            {total} run{total !== 1 ? "s" : ""}
          </div>
        </div>

        {loading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-4 py-2"
              >
                <Skeleton className="h-3.5 w-48" />
                <Skeleton className="h-5 w-16 rounded-md" />
                <Skeleton className="h-5 w-14 rounded-full" />
                <Skeleton className="h-3.5 w-20" />
              </div>
            ))}
          </div>
        ) : runs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-neutral-500">
              No runs match your filters
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-neutral-100 hover:bg-transparent">
                <TableHead className="text-xs font-medium text-neutral-400 uppercase tracking-wide h-9">
                  Meeting
                </TableHead>
                <TableHead className="text-xs font-medium text-neutral-400 uppercase tracking-wide h-9">
                  CRM
                </TableHead>
                <TableHead className="text-xs font-medium text-neutral-400 uppercase tracking-wide h-9">
                  Status
                </TableHead>
                <TableHead className="text-xs font-medium text-neutral-400 uppercase tracking-wide h-9">
                  Date
                </TableHead>
                <TableHead className="h-9" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {runs.map((run) => (
                <RunCard
                  key={run.id}
                  run={run}
                  onView={(r) => router.push(`/runs/${r.id}`)}
                  onRerun={handleRerun}
                />
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
