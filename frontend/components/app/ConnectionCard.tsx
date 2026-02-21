"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ConnectionCardProps {
  name: string;
  icon: React.ReactNode;
  connected: boolean;
  workspaceName?: string;
  webhookUrl?: string;
  showWebhookUrl?: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}

export default function ConnectionCard({
  name,
  icon,
  connected,
  workspaceName,
  webhookUrl,
  showWebhookUrl = false,
  onConnect,
  onDisconnect,
}: ConnectionCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!webhookUrl) return;
    await navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-xl border border-neutral-200 shadow-card p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg border border-neutral-200 bg-neutral-50 flex items-center justify-center">
            {icon}
          </div>
          <div>
            <p className="text-sm font-semibold">{name}</p>
            <p className="text-xs text-neutral-500">
              {connected ? workspaceName : "Not connected"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          {connected && (
            <span className="flex items-center gap-1 text-xs text-green-600">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
              Connected
            </span>
          )}
          <Button
            size="sm"
            className={cn(
              "h-7 text-xs",
              connected
                ? "border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50"
                : "bg-black text-white hover:bg-neutral-800"
            )}
            onClick={connected ? onDisconnect : onConnect}
          >
            {connected ? "Disconnect" : "Connect"}
          </Button>
        </div>
      </div>

      {showWebhookUrl && webhookUrl && (
        <div className="mt-4 pt-4 border-t border-neutral-100">
          <p className="text-xs font-medium text-neutral-500 mb-1.5">
            Webhook URL
          </p>
          <div className="flex items-center gap-2 bg-neutral-50 rounded-md px-3 py-2 border border-neutral-200">
            <code className="text-xs text-neutral-600 flex-1 truncate">
              {webhookUrl}
            </code>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleCopy}
            >
              {copied ? (
                <Check className="h-3 w-3 text-green-600" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
