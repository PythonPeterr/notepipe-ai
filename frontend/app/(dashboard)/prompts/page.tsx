"use client";

import { useEffect, useState } from "react";
import { Plus, FileText } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import PromptEditor from "@/components/app/PromptEditor";
import type { Prompt } from "@/lib/types";

export default function PromptsPage() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPrompts();
  }, []);

  const fetchPrompts = async () => {
    try {
      const data = await api.get<Prompt[]>("/api/prompts");
      setPrompts(data);
    } catch {
      // API not available yet
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (prompt: Prompt) => {
    try {
      await api.patch(`/api/prompts/${prompt.id}`, {
        is_active: !prompt.is_active,
      });
      setPrompts((prev) =>
        prev.map((p) =>
          p.id === prompt.id ? { ...p, is_active: !p.is_active } : p
        )
      );
      toast.success(
        `Prompt ${!prompt.is_active ? "activated" : "deactivated"}`
      );
    } catch {
      toast.error("Failed to update prompt");
    }
  };

  const handleEdit = (prompt: Prompt) => {
    setEditingPrompt(prompt);
    setEditorOpen(true);
  };

  const handleNew = () => {
    setEditingPrompt(null);
    setEditorOpen(true);
  };

  const handleSave = async (data: {
    name: string;
    system_prompt: string;
  }) => {
    setSaving(true);
    try {
      if (editingPrompt) {
        await api.patch(`/api/prompts/${editingPrompt.id}`, data);
        toast.success("Prompt saved");
      } else {
        await api.post("/api/prompts", data);
        toast.success("Prompt created");
      }
      await fetchPrompts();
      setEditorOpen(false);
      setEditingPrompt(null);
    } catch {
      toast.error("Failed to save prompt");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Prompt Bank</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Manage your AI extraction prompts
          </p>
        </div>
        <Button
          className="h-9 text-sm bg-black text-white hover:bg-neutral-800"
          onClick={handleNew}
        >
          <Plus className="h-4 w-4" />
          New prompt
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-neutral-200 shadow-card p-5"
            >
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-64" />
                </div>
                <Skeleton className="h-5 w-9 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      ) : prompts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="h-11 w-11 rounded-xl bg-neutral-100 border border-neutral-200 flex items-center justify-center mb-4">
            <FileText className="h-5 w-5 text-neutral-400" />
          </div>
          <p className="text-sm font-semibold text-neutral-800">
            No prompts yet
          </p>
          <p className="text-sm text-neutral-400 mt-1 max-w-xs">
            Create a prompt to define how AI extracts meeting data for your CRM.
          </p>
          <Button
            className="mt-5 h-8 text-xs bg-black text-white hover:bg-neutral-800"
            onClick={handleNew}
          >
            Create prompt
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {prompts.map((prompt) => (
            <div
              key={prompt.id}
              className="bg-white rounded-xl border border-neutral-200 shadow-card p-5"
            >
              <div className="flex items-center justify-between">
                <div
                  className="flex-1 cursor-pointer"
                  onClick={() => handleEdit(prompt)}
                >
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-neutral-900">
                      {prompt.name}
                    </p>
                    {prompt.is_default && (
                      <span className="text-xs bg-neutral-100 text-neutral-500 px-1.5 py-0.5 rounded border border-neutral-200">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    {prompt.description}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-neutral-400">
                    {prompt.is_active ? "Active" : "Inactive"}
                  </span>
                  <Switch
                    checked={prompt.is_active}
                    onCheckedChange={() => handleToggleActive(prompt)}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <PromptEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        prompt={editingPrompt}
        onSave={handleSave}
        saving={saving}
      />
    </div>
  );
}
