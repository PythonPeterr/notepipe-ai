"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import type { ActionConfig } from "@/lib/types";

type ActionKey = keyof Pick<
  ActionConfig,
  | "create_contact"
  | "create_company"
  | "link_contact_to_company"
  | "attach_note"
  | "create_deal"
  | "update_deal_stage"
  | "extract_followups"
  | "log_meeting"
>;

interface ActionOption {
  key: ActionKey;
  label: string;
  description: string;
}

interface ActionSection {
  title: string;
  actions: ActionOption[];
}

const actionSections: ActionSection[] = [
  {
    title: "Core",
    actions: [
      {
        key: "create_contact",
        label: "Create/update contact",
        description: "Sync contact info to CRM",
      },
      {
        key: "create_company",
        label: "Create/update company",
        description: "Sync company details to CRM",
      },
      {
        key: "link_contact_to_company",
        label: "Link contact to company",
        description: "Associate person with their organization",
      },
    ],
  },
  {
    title: "Pipeline",
    actions: [
      {
        key: "attach_note",
        label: "Attach meeting note",
        description: "Add meeting summary as a note",
      },
      {
        key: "create_deal",
        label: "Create deal",
        description: "Create a new deal from meeting",
      },
      {
        key: "update_deal_stage",
        label: "Update deal stage",
        description: "Move existing deal through pipeline",
      },
      {
        key: "extract_followups",
        label: "Extract follow-ups",
        description: "Create tasks from action items",
      },
    ],
  },
  {
    title: "Logging",
    actions: [
      {
        key: "log_meeting",
        label: "Log meeting",
        description: "Record meeting activity in CRM",
      },
    ],
  },
];

export default function ActionsPage() {
  const [config, setConfig] = useState<ActionConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const data = await api.get<ActionConfig>("/api/actions");
      setConfig(data);
    } catch {
      // API not available yet
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (key: ActionKey, value: boolean) => {
    if (!config) return;

    // Optimistic update
    setConfig({ ...config, [key]: value });

    try {
      const updated = await api.patch<ActionConfig>("/api/actions", {
        [key]: value,
      });
      setConfig(updated);
    } catch {
      // Revert optimistic update
      setConfig({ ...config, [key]: !value });
      toast.error("Failed to update action setting");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Actions</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Configure which CRM actions run after extraction
        </p>
      </div>

      {actionSections.map((section) => (
        <div key={section.title}>
          <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2 px-1">
            {section.title}
          </h2>
          <div className="bg-white rounded-xl border border-neutral-200 shadow-card divide-y divide-neutral-100">
            {loading ? (
              section.actions.map((_, i) => (
                <div key={i} className="flex items-center justify-between px-5 py-4">
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-36" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                  <Skeleton className="h-5 w-9 rounded-full" />
                </div>
              ))
            ) : (
              section.actions.map((action) => (
                <div
                  key={action.key}
                  className="flex items-center justify-between px-5 py-4"
                >
                  <div>
                    <p className="text-sm font-medium text-neutral-800">
                      {action.label}
                    </p>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      {action.description}
                    </p>
                  </div>
                  <Switch
                    checked={config?.[action.key] ?? false}
                    onCheckedChange={(v) => handleToggle(action.key, v)}
                  />
                </div>
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
