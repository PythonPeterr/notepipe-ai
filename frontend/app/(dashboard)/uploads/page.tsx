"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { toast } from "sonner";
import { Upload, Loader2, Type } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import StatusBadge from "@/components/app/StatusBadge";
import type { Run, RunSummary, PaginatedResponse } from "@/lib/types";

const ALLOWED_TYPES = [
  "text/plain",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const ALLOWED_EXTENSIONS = [".txt", ".pdf", ".docx"];
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

function isValidFile(file: File): string | null {
  const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext) && !ALLOWED_TYPES.includes(file.type)) {
    return "Unsupported file type. Allowed: .txt, .pdf, .docx";
  }
  if (file.size === 0) return "File is empty";
  if (file.size > MAX_SIZE) return "File exceeds 10MB limit";
  return null;
}

export default function UploadsPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [showPaste, setShowPaste] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [recentUploads, setRecentUploads] = useState<RunSummary[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(true);

  const fetchRecentUploads = useCallback(async () => {
    setLoadingRecent(true);
    try {
      const data = await api.get<PaginatedResponse<RunSummary>>(
        "/api/runs?source=upload&per_page=20"
      );
      setRecentUploads(data.items);
    } catch {
      // API not available yet
    } finally {
      setLoadingRecent(false);
    }
  }, []);

  useEffect(() => {
    fetchRecentUploads();
  }, [fetchRecentUploads]);

  const handleUpload = async (file: File) => {
    const error = isValidFile(file);
    if (error) {
      toast.error(error);
      return;
    }

    setUploading(true);
    try {
      const run = await api.upload<Run>("/api/uploads", file);
      toast.success("File processed successfully");
      router.push(`/runs/${run.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
      fetchRecentUploads();
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
    // Reset so the same file can be re-selected
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handlePasteSubmit = async () => {
    const trimmed = pasteText.trim();
    if (!trimmed) return;
    const file = new File([trimmed], "pasted-notes.txt", { type: "text/plain" });
    await handleUpload(file);
    setPasteText("");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Uploads</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Upload meeting notes to extract CRM data
        </p>
      </div>

      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`bg-white rounded-xl border-2 border-dashed transition-colors flex flex-col items-center justify-center text-center ${
          dragOver
            ? "border-neutral-900 bg-neutral-50"
            : "border-neutral-200"
        } ${uploading ? "pointer-events-none opacity-60" : ""} ${showPaste ? "p-6" : "p-12"}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,.pdf,.docx"
          className="hidden"
          onChange={handleFileSelect}
        />

        {!showPaste && (
          <>
            <div className="h-11 w-11 rounded-xl bg-neutral-100 border border-neutral-200 flex items-center justify-center mb-4">
              {uploading ? (
                <Loader2 className="h-5 w-5 text-neutral-400 animate-spin" />
              ) : (
                <Upload className="h-5 w-5 text-neutral-400" />
              )}
            </div>

            <p className="text-sm font-semibold text-neutral-800">
              {uploading
                ? "Processing..."
                : "Upload a file to extract CRM data"}
            </p>
            <p className="text-sm text-neutral-400 mt-1 max-w-xs">
              {uploading
                ? "Extracting data and writing to your CRM"
                : "Browse or drag and drop TXT, PDF or DOCX files. (Max 10MB)"}
            </p>

            {!uploading && (
              <div className="flex items-center gap-3 mt-5">
                <button
                  className="flex items-center gap-2 px-4 py-2 rounded-md bg-neutral-100 border border-neutral-200 text-xs font-medium text-neutral-700 hover:bg-neutral-200 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-3.5 w-3.5" />
                  Browse Files
                </button>
                <button
                  className="flex items-center gap-2 px-4 py-2 rounded-md bg-neutral-100 border border-neutral-200 text-xs font-medium text-neutral-700 hover:bg-neutral-200 transition-colors"
                  onClick={() => setShowPaste(true)}
                >
                  <Type className="h-3.5 w-3.5" />
                  Paste Text Manually
                </button>
              </div>
            )}
          </>
        )}

        {showPaste && (
          <div className="w-full space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-neutral-800">
                Paste meeting notes
              </p>
              <button
                className="text-xs text-neutral-500 hover:text-neutral-900 underline underline-offset-2"
                onClick={() => { setShowPaste(false); setPasteText(""); }}
              >
                Back to file upload
              </button>
            </div>
            <Textarea
              placeholder="Paste or type your meeting transcript here..."
              className="min-h-[200px] text-sm bg-neutral-50 border-neutral-200 resize-y"
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              autoFocus
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-neutral-400">
                {pasteText.length > 0 ? `${pasteText.length.toLocaleString()} characters` : ""}
              </span>
              <Button
                className="h-8 text-xs bg-black text-white hover:bg-neutral-800"
                disabled={!pasteText.trim() || uploading}
                onClick={handlePasteSubmit}
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Process Text"
                )}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Recent uploads table */}
      {(loadingRecent || recentUploads.length > 0) && (
        <div className="bg-white rounded-xl border border-neutral-200 shadow-card overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-neutral-100">
            <h2 className="text-sm font-semibold text-neutral-900">
              Recent Uploads
            </h2>
            <span className="text-xs text-neutral-400">
              {recentUploads.length} upload{recentUploads.length !== 1 ? "s" : ""}
            </span>
          </div>

          {loadingRecent ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 py-2">
                  <Skeleton className="h-3.5 w-48" />
                  <Skeleton className="h-5 w-16 rounded-md" />
                  <Skeleton className="h-5 w-14 rounded-full" />
                  <Skeleton className="h-3.5 w-20" />
                </div>
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-neutral-100 hover:bg-transparent">
                  <TableHead className="text-xs font-medium text-neutral-400 uppercase tracking-wide h-9">
                    File
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
                {recentUploads.map((run) => (
                  <TableRow
                    key={run.id}
                    className="border-neutral-100 hover:bg-neutral-50"
                  >
                    <TableCell className="text-sm font-medium py-3">
                      <div className="flex items-center gap-2">
                        <Upload className="h-3.5 w-3.5 text-neutral-400 flex-shrink-0" />
                        {run.original_filename || run.meeting_title}
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
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-neutral-500"
                        onClick={() => router.push(`/runs/${run.id}`)}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      )}
    </div>
  );
}
