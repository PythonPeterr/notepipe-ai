"use client";

import { useState } from "react";
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
import type { Prompt } from "@/lib/types";

interface PromptEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prompt: Prompt | null;
  onSave: (data: {
    name: string;
    system_prompt: string;
  }) => void;
  saving?: boolean;
}

export default function PromptEditor({
  open,
  onOpenChange,
  prompt,
  onSave,
  saving = false,
}: PromptEditorProps) {
  const [name, setName] = useState(prompt?.name ?? "");
  const [systemPrompt, setSystemPrompt] = useState(prompt?.system_prompt ?? "");
  const [touched, setTouched] = useState(false);

  const handleSave = () => {
    onSave({
      name,
      system_prompt: systemPrompt,
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[480px] sm:max-w-[480px] bg-white p-0">
        <div className="p-6 border-b border-neutral-100">
          <SheetTitle className="text-base font-semibold">
            {prompt ? "Edit Prompt" : "New Prompt"}
          </SheetTitle>
          <SheetDescription className="text-sm text-neutral-500 mt-0.5">
            Configure AI extraction instructions.
          </SheetDescription>
        </div>
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-neutral-600">
              Prompt Name
            </Label>
            <Input
              className="h-9 text-sm bg-neutral-50 border-neutral-200"
              placeholder="e.g. B2B Sales Call"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => setTouched(true)}
            />
            {touched && !name.trim() && (
              <p className="text-xs text-red-500">Prompt name is required</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-neutral-600">
              System Prompt
            </Label>
            <Textarea
              className="text-sm bg-neutral-50 border-neutral-200 resize-none min-h-[160px]"
              placeholder="Tell the AI what to extract from meeting transcripts..."
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
            />
          </div>
        </div>
        <div className="p-6 border-t border-neutral-100">
          <Button
            className="w-full bg-black text-white hover:bg-neutral-800 h-9 text-sm"
            onClick={handleSave}
            disabled={saving || !name.trim() || !systemPrompt.trim()}
          >
            {saving ? "Saving..." : "Save Prompt"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
