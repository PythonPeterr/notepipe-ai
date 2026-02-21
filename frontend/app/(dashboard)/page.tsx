"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import {
  Zap,
  CheckCircle,
  Users,
  Calendar,
} from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import StatusBadge from "@/components/app/StatusBadge";
import type { Run, PaginatedResponse } from "@/lib/types";
import Link from "next/link";

interface DashboardStats {
  total_runs: number;
  success_rate: number;
  contacts_created: number;
  meetings_processed: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [runs, setRuns] = useState<Run[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsData, runsData] = await Promise.all([
          api.get<DashboardStats>("/api/dashboard/stats"),
          api.get<PaginatedResponse<Run>>("/api/runs?per_page=10"),
        ]);
        setStats(statsData);
        setRuns(runsData.items);
      } catch {
        // API not available yet — show empty state
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const statCards = [
    {
      label: "Total Runs",
      value: stats?.total_runs ?? 0,
      sub: "All time",
      icon: Zap,
    },
    {
      label: "Success Rate",
      value: stats ? `${Math.round(stats.success_rate)}%` : "0%",
      sub: "Last 30 days",
      icon: CheckCircle,
    },
    {
      label: "Contacts Created",
      value: stats?.contacts_created ?? 0,
      sub: "All time",
      icon: Users,
    },
    {
      label: "Meetings Processed",
      value: stats?.meetings_processed ?? 0,
      sub: "All time",
      icon: Calendar,
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Overview</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Your automation dashboard
          </p>
        </div>
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-neutral-200 shadow-card p-5"
            >
              <Skeleton className="h-3 w-24 mb-3" />
              <Skeleton className="h-8 w-16 mb-1" />
              <Skeleton className="h-3 w-20" />
            </div>
          ))}
        </div>
        <div className="bg-white rounded-xl border border-neutral-200 shadow-card overflow-hidden">
          <div className="p-4 border-b border-neutral-100">
            <Skeleton className="h-4 w-32" />
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3 border-b border-neutral-100">
              <Skeleton className="h-3.5 w-48" />
              <Skeleton className="h-5 w-16 rounded-md" />
              <Skeleton className="h-5 w-14 rounded-full" />
              <Skeleton className="h-3.5 w-20" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!stats || (stats.total_runs === 0 && runs.length === 0)) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Overview</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Your automation dashboard
          </p>
        </div>
        <div className="grid grid-cols-4 gap-4">
          {statCards.map((card) => (
            <div
              key={card.label}
              className="bg-white rounded-xl border border-neutral-200 shadow-card p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
                  {card.label}
                </span>
                <card.icon className="h-4 w-4 text-neutral-400" />
              </div>
              <p className="text-3xl font-bold text-neutral-900">0</p>
              <p className="text-xs text-neutral-400 mt-1">{card.sub}</p>
            </div>
          ))}
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
        <h1 className="text-2xl font-bold text-neutral-900">Overview</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Your automation dashboard
        </p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="bg-white rounded-xl border border-neutral-200 shadow-card p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
                {card.label}
              </span>
              <card.icon className="h-4 w-4 text-neutral-400" />
            </div>
            <p className="text-3xl font-bold text-neutral-900">{card.value}</p>
            <p className="text-xs text-neutral-400 mt-1">{card.sub}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-neutral-200 shadow-card overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-neutral-100">
          <h2 className="text-base font-semibold text-neutral-900">
            Recent Runs
          </h2>
          <Link href="/runs">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-neutral-500"
            >
              View all
            </Button>
          </Link>
        </div>
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
              <TableRow
                key={run.id}
                className="border-neutral-100 hover:bg-neutral-50"
              >
                <TableCell className="text-sm font-medium py-3">
                  {run.meeting_title}
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
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-neutral-500"
                  >
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
