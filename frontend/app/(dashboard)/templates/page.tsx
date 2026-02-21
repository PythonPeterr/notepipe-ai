"use client";

import { useEffect, useState } from "react";
import { Plus, FileText } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import TemplateEditor from "@/components/app/TemplateEditor";
import type { Template, CRMActions } from "@/lib/types";

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const data = await api.get<Template[]>("/api/templates");
      setTemplates(data);
    } catch {
      // API not available yet
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (template: Template) => {
    try {
      await api.patch(`/api/templates/${template.id}`, {
        is_active: !template.is_active,
      });
      setTemplates((prev) =>
        prev.map((t) =>
          t.id === template.id ? { ...t, is_active: !t.is_active } : t
        )
      );
      toast.success(
        `Template ${!template.is_active ? "activated" : "deactivated"}`
      );
    } catch {
      toast.error("Failed to update template");
    }
  };

  const handleEdit = (template: Template) => {
    setEditingTemplate(template);
    setEditorOpen(true);
  };

  const handleNew = () => {
    setEditingTemplate(null);
    setEditorOpen(true);
  };

  const handleSave = async (data: {
    name: string;
    system_prompt: string;
    crm_actions: CRMActions;
  }) => {
    setSaving(true);
    try {
      if (editingTemplate) {
        await api.patch(`/api/templates/${editingTemplate.id}`, data);
        toast.success("Template saved");
      } else {
        await api.post("/api/templates", data);
        toast.success("Template created");
      }
      await fetchTemplates();
      setEditorOpen(false);
      setEditingTemplate(null);
    } catch {
      toast.error("Failed to save template");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Templates</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Manage your AI extraction templates
          </p>
        </div>
        <Button
          className="h-9 text-sm bg-black text-white hover:bg-neutral-800"
          onClick={handleNew}
        >
          <Plus className="h-4 w-4" />
          New template
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
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
      ) : templates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="h-11 w-11 rounded-xl bg-neutral-100 border border-neutral-200 flex items-center justify-center mb-4">
            <FileText className="h-5 w-5 text-neutral-400" />
          </div>
          <p className="text-sm font-semibold text-neutral-800">
            No templates yet
          </p>
          <p className="text-sm text-neutral-400 mt-1 max-w-xs">
            Create a template to define how AI extracts and routes meeting data
            to your CRM.
          </p>
          <Button
            className="mt-5 h-8 text-xs bg-black text-white hover:bg-neutral-800"
            onClick={handleNew}
          >
            Create template
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {templates.map((template) => (
            <div
              key={template.id}
              className="bg-white rounded-xl border border-neutral-200 shadow-card p-5"
            >
              <div className="flex items-center justify-between">
                <div
                  className="flex-1 cursor-pointer"
                  onClick={() => handleEdit(template)}
                >
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-neutral-900">
                      {template.name}
                    </p>
                    {template.is_default && (
                      <span className="text-xs bg-neutral-100 text-neutral-500 px-1.5 py-0.5 rounded border border-neutral-200">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    {template.description}
                  </p>
                  <div className="flex items-center gap-3 mt-2">
                    {Object.entries(template.crm_actions)
                      .filter(([, enabled]) => enabled)
                      .map(([key]) => (
                        <span
                          key={key}
                          className="text-xs text-neutral-400 capitalize"
                        >
                          {key.replace(/_/g, " ")}
                        </span>
                      ))}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-neutral-400">
                    {template.is_active ? "Active" : "Inactive"}
                  </span>
                  <Switch
                    checked={template.is_active}
                    onCheckedChange={() => handleToggleActive(template)}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <TemplateEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        template={editingTemplate}
        onSave={handleSave}
        saving={saving}
      />
    </div>
  );
}
