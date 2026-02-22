"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  ArrowLeft,
  User,
  Building2,
  FileText,
  CheckCircle,
  Clock,
  AlertTriangle,
  RotateCcw,
  Upload,
} from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import StatusBadge from "@/components/app/StatusBadge";
import type { Run } from "@/lib/types";

export default function RunDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [run, setRun] = useState<Run | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [rerunning, setRerunning] = useState(false);

  useEffect(() => {
    const fetchRun = async () => {
      setLoading(true);
      try {
        const data = await api.get<Run>(`/api/runs/${id}`);
        setRun(data);
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    fetchRun();
  }, [id]);

  const handleRerun = async () => {
    if (!run) return;
    setRerunning(true);
    try {
      await api.post(`/api/runs/${run.id}/rerun`);
      toast.success("Re-run started");
      router.push("/runs");
    } catch {
      toast.error("Failed to re-run");
    } finally {
      setRerunning(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-5 w-20" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-80" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
        </div>
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  if (notFound || !run) {
    return (
      <div className="space-y-6">
        <Link
          href="/runs"
          className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to runs
        </Link>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="h-11 w-11 rounded-xl bg-neutral-100 border border-neutral-200 flex items-center justify-center mb-4">
            <AlertTriangle className="h-5 w-5 text-neutral-400" />
          </div>
          <p className="text-sm font-semibold text-neutral-800">
            Run not found
          </p>
          <p className="text-sm text-neutral-400 mt-1 max-w-xs">
            This run may have been deleted or you don&apos;t have access to it.
          </p>
          <Link href="/runs">
            <Button className="mt-5 h-8 text-xs bg-black text-white hover:bg-neutral-800">
              Back to runs
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const { extracted_data, crm_results } = run;
  const isUpload = run.source === "upload";

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Link
        href="/runs"
        className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-900 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to runs
      </Link>

      {/* Header */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-card p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-xl font-bold text-neutral-900">
              {run.meeting_title}
            </h1>
            <div className="flex items-center gap-3 text-sm text-neutral-500">
              {isUpload && run.original_filename && (
                <span className="inline-flex items-center gap-1">
                  <Upload className="h-3.5 w-3.5" />
                  Uploaded from: {run.original_filename}
                </span>
              )}
              {run.meeting_date && (
                <span>
                  {format(new Date(run.meeting_date), "MMMM d, yyyy")}
                </span>
              )}
              {run.duration_ms !== null && (
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {run.duration_ms < 1000
                    ? `${run.duration_ms}ms`
                    : `${(run.duration_ms / 1000).toFixed(1)}s`}
                </span>
              )}
              <span className="text-xs text-neutral-400">
                {format(new Date(run.created_at), "MMM d, yyyy 'at' HH:mm")}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-md border border-neutral-200">
              {{ hubspot: "HubSpot", pipedrive: "Pipedrive", attio: "Attio", zoho: "Zoho" }[run.crm_target]}
            </span>
            <StatusBadge status={run.status} />
          </div>
        </div>
      </div>

      {/* Error banner */}
      {run.status === "failed" && run.error_message && (
        <div className="bg-red-50 rounded-xl border border-red-200 p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-800">Run failed</p>
            <p className="text-sm text-red-600 mt-1">{run.error_message}</p>
          </div>
        </div>
      )}

      {/* Extracted Data section */}
      {extracted_data && (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-neutral-900 uppercase tracking-wide">
            Extracted Data
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Contact card */}
            <div className="bg-white rounded-xl border border-neutral-200 shadow-card p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-neutral-100 border border-neutral-200 flex items-center justify-center">
                  <User className="h-4 w-4 text-neutral-500" />
                </div>
                <h3 className="text-sm font-semibold text-neutral-900">
                  Contact
                </h3>
              </div>
              <div className="space-y-2.5">
                <DetailRow label="Name" value={extracted_data.contact.name} />
                <DetailRow label="Email" value={extracted_data.contact.email} />
                <DetailRow
                  label="Phone"
                  value={extracted_data.contact.phone}
                />
                <DetailRow
                  label="Title"
                  value={extracted_data.contact.title}
                />
              </div>
            </div>

            {/* Company card */}
            <div className="bg-white rounded-xl border border-neutral-200 shadow-card p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-neutral-100 border border-neutral-200 flex items-center justify-center">
                  <Building2 className="h-4 w-4 text-neutral-500" />
                </div>
                <h3 className="text-sm font-semibold text-neutral-900">
                  Company
                </h3>
              </div>
              <div className="space-y-2.5">
                <DetailRow label="Name" value={extracted_data.company.name} />
                <DetailRow
                  label="Domain"
                  value={extracted_data.company.domain}
                />
                <DetailRow
                  label="Industry"
                  value={extracted_data.company.industry}
                />
              </div>
            </div>
          </div>

          {/* Meeting Summary */}
          <div className="bg-white rounded-xl border border-neutral-200 shadow-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-8 w-8 rounded-lg bg-neutral-100 border border-neutral-200 flex items-center justify-center">
                <FileText className="h-4 w-4 text-neutral-500" />
              </div>
              <h3 className="text-sm font-semibold text-neutral-900">
                Meeting Summary
              </h3>
            </div>
            <p className="text-sm text-neutral-700 leading-relaxed whitespace-pre-wrap">
              {extracted_data.meeting_summary}
            </p>
          </div>

          {/* Deal Stage */}
          {extracted_data.deal_stage && (
            <div className="bg-white rounded-xl border border-neutral-200 shadow-card p-5">
              <h3 className="text-sm font-semibold text-neutral-900 mb-3">
                Deal Stage
              </h3>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                {extracted_data.deal_stage}
              </span>
            </div>
          )}

          {/* Follow-ups */}
          {extracted_data.follow_ups.length > 0 && (
            <div className="bg-white rounded-xl border border-neutral-200 shadow-card p-5">
              <h3 className="text-sm font-semibold text-neutral-900 mb-4">
                Follow-ups
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-neutral-100">
                      <th className="text-left text-xs font-medium text-neutral-400 uppercase tracking-wide pb-2 pr-4">
                        Owner
                      </th>
                      <th className="text-left text-xs font-medium text-neutral-400 uppercase tracking-wide pb-2 pr-4">
                        Action
                      </th>
                      <th className="text-left text-xs font-medium text-neutral-400 uppercase tracking-wide pb-2">
                        Due Date
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {extracted_data.follow_ups.map((followUp, index) => (
                      <tr
                        key={index}
                        className="border-b border-neutral-50 last:border-0"
                      >
                        <td className="py-2.5 pr-4 text-neutral-900 font-medium">
                          {followUp.owner}
                        </td>
                        <td className="py-2.5 pr-4 text-neutral-700">
                          {followUp.action}
                        </td>
                        <td className="py-2.5 text-neutral-500">
                          {followUp.due_date
                            ? format(new Date(followUp.due_date), "MMM d, yyyy")
                            : "\u2014"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Custom Fields */}
          {Object.keys(extracted_data.custom_fields).length > 0 && (
            <div className="bg-white rounded-xl border border-neutral-200 shadow-card p-5">
              <h3 className="text-sm font-semibold text-neutral-900 mb-4">
                Custom Fields
              </h3>
              <div className="space-y-2.5">
                {Object.entries(extracted_data.custom_fields).map(
                  ([key, value]) => (
                    <DetailRow
                      key={key}
                      label={key}
                      value={String(value)}
                    />
                  )
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* CRM Results section */}
      {crm_results && (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-neutral-900 uppercase tracking-wide">
            CRM Results
          </h2>

          <div className="bg-white rounded-xl border border-neutral-200 shadow-card p-5">
            <div className="space-y-3">
              {crm_results.contact_id && (
                <CRMResultRow
                  label="Contact created"
                  value={crm_results.contact_id}
                />
              )}
              {crm_results.company_id && (
                <CRMResultRow
                  label="Company created"
                  value={crm_results.company_id}
                />
              )}
              {crm_results.note_id && (
                <CRMResultRow
                  label="Note attached"
                  value={crm_results.note_id}
                />
              )}
              {crm_results.deal_id && (
                <CRMResultRow
                  label="Deal updated"
                  value={crm_results.deal_id}
                />
              )}

              {!crm_results.contact_id &&
                !crm_results.company_id &&
                !crm_results.note_id &&
                !crm_results.deal_id &&
                (!crm_results.errors || crm_results.errors.length === 0) && (
                  <p className="text-sm text-neutral-400">
                    No CRM records were created.
                  </p>
                )}

              {crm_results.errors && crm_results.errors.length > 0 && (
                <div className="mt-3 pt-3 border-t border-neutral-100">
                  <p className="text-xs font-medium text-red-600 mb-2">
                    CRM Errors
                  </p>
                  <ul className="space-y-1">
                    {crm_results.errors.map((error, index) => (
                      <li
                        key={index}
                        className="text-sm text-red-600 flex items-start gap-2"
                      >
                        <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                        {error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Action button */}
      <div className="flex justify-end">
        {isUpload ? (
          <Link href="/uploads">
            <Button className="bg-black text-white hover:bg-neutral-800 rounded-md">
              <Upload className="h-4 w-4 mr-2" />
              Upload another
            </Button>
          </Link>
        ) : (
          <Button
            className="bg-black text-white hover:bg-neutral-800 rounded-md"
            onClick={handleRerun}
            disabled={rerunning}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            {rerunning ? "Re-running..." : "Re-run"}
          </Button>
        )}
      </div>
    </div>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="text-xs text-neutral-400 flex-shrink-0">{label}</span>
      <span className="text-sm text-neutral-900 text-right">
        {value || "\u2014"}
      </span>
    </div>
  );
}

function CRMResultRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
      <span className="text-sm text-neutral-700">{label}</span>
      <code className="ml-auto text-xs bg-neutral-50 text-neutral-600 px-2 py-0.5 rounded border border-neutral-200 font-mono">
        {value}
      </code>
    </div>
  );
}
