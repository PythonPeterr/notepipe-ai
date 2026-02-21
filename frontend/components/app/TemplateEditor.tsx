"use client";

import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import type { Template, CRMActions } from "@/lib/types";

interface CRMActionConfig {
  key: keyof CRMActions;
  label: string;
  description: string;
}

const crmActionConfigs: CRMActionConfig[] = [
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
    key: "attach_note",
    label: "Attach meeting note",
    description: "Add meeting summary as a note",
  },
  {
    key: "update_deal_stage",
    label: "Update deal stage",
    description: "Move deal through pipeline",
  },
  {
    key: "extract_followups",
    label: "Extract follow-ups",
    description: "Create tasks from action items",
  },
];

const defaultActions: CRMActions = {
  create_contact: true,
  create_company: true,
  attach_note: true,
  update_deal_stage: false,
  extract_followups: true,
};

interface TemplateEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: Template | null;
  onSave: (data: {
    name: string;
    system_prompt: string;
    crm_actions: CRMActions;
  }) => void;
  saving?: boolean;
}

export default function TemplateEditor({
  open,
  onOpenChange,
  template,
  onSave,
  saving = false,
}: TemplateEditorProps) {
  const [name, setName] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [actions, setActions] = useState<CRMActions>(defaultActions);

  useEffect(() => {
    if (template) {
      setName(template.name);
      setSystemPrompt(template.system_prompt);
      setActions(template.crm_actions);
    } else {
      setName("");
      setSystemPrompt("");
      setActions(defaultActions);
    }
  }, [template]);

  const updateAction = (key: keyof CRMActions, value: boolean) => {
    setActions((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    onSave({
      name,
      system_prompt: systemPrompt,
      crm_actions: actions,
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[480px] sm:max-w-[480px] bg-white p-0">
        <div className="p-6 border-b border-neutral-100">
          <SheetTitle className="text-base font-semibold">
            {template ? "Edit Template" : "New Template"}
          </SheetTitle>
          <SheetDescription className="text-sm text-neutral-500 mt-0.5">
            Configure AI extraction and CRM actions.
          </SheetDescription>
        </div>
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-neutral-600">
              Template Name
            </Label>
            <Input
              className="h-9 text-sm bg-neutral-50 border-neutral-200"
              placeholder="e.g. B2B Sales Call"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-neutral-600">
              Custom Instructions
            </Label>
            <Textarea
              className="text-sm bg-neutral-50 border-neutral-200 resize-none min-h-[100px]"
              placeholder="Additional AI instructions..."
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-medium text-neutral-600">
              CRM Actions
            </Label>
            <div className="bg-neutral-50 rounded-lg border border-neutral-200 divide-y divide-neutral-100">
              {crmActionConfigs.map((action) => (
                <div
                  key={action.key}
                  className="flex items-center justify-between px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-neutral-800">
                      {action.label}
                    </p>
                    <p className="text-xs text-neutral-400">
                      {action.description}
                    </p>
                  </div>
                  <Switch
                    checked={actions[action.key]}
                    onCheckedChange={(v) => updateAction(action.key, v)}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="p-6 border-t border-neutral-100">
          <Button
            className="w-full bg-black text-white hover:bg-neutral-800 h-9 text-sm"
            onClick={handleSave}
            disabled={saving || !name.trim()}
          >
            {saving ? "Saving..." : "Save Template"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
