"use client";

import { useEffect, useState } from "react";
import { Copy, Check } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import ConnectionCard from "@/components/app/ConnectionCard";
import type { Connection } from "@/lib/types";

interface WebhookConfig {
  webhook_url: string;
  webhook_secret: string;
  user_id: string;
}

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <p className="text-xs font-medium text-neutral-500 mb-1">{label}</p>
      <div className="flex items-center gap-2 bg-neutral-50 rounded-md px-3 py-2 border border-neutral-200">
        <code className="text-xs text-neutral-600 flex-1 truncate">
          {value}
        </code>
        <button
          onClick={handleCopy}
          className="flex-shrink-0 text-neutral-400 hover:text-neutral-600"
        >
          {copied ? (
            <Check className="h-3 w-3 text-green-600" />
          ) : (
            <Copy className="h-3 w-3" />
          )}
        </button>
      </div>
    </div>
  );
}

export default function ConnectionsPage() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [apiKey, setApiKey] = useState("");
  const [savingKey, setSavingKey] = useState(false);
  const [loading, setLoading] = useState(true);
  const [keyTouched, setKeyTouched] = useState(false);
  const [webhookConfig, setWebhookConfig] = useState<WebhookConfig | null>(null);

  const fireflies = connections.find((c) => c.service === "fireflies");
  const hubspot = connections.find((c) => c.service === "hubspot");
  const pipedrive = connections.find((c) => c.service === "pipedrive");
  const attio = connections.find((c) => c.service === "attio");
  const zoho = connections.find((c) => c.service === "zoho");

  useEffect(() => {
    const fetchConnections = async () => {
      try {
        const data = await api.get<Connection[]>("/api/connections");
        setConnections(data);
      } catch {
        // API not available yet
      } finally {
        setLoading(false);
      }
    };
    fetchConnections();
  }, []);

  // Fetch webhook config once Fireflies is connected
  useEffect(() => {
    if (!fireflies) {
      setWebhookConfig(null);
      return;
    }
    const fetchConfig = async () => {
      try {
        const data = await api.get<WebhookConfig>(
          "/api/connections/fireflies/webhook-url"
        );
        setWebhookConfig(data);
      } catch {
        // Not critical
      }
    };
    fetchConfig();
  }, [fireflies]);

  const handleSaveFirefliesKey = async () => {
    if (!apiKey.trim()) return;
    setSavingKey(true);
    try {
      await api.post("/api/connections/fireflies", { api_key: apiKey });
      const data = await api.get<Connection[]>("/api/connections");
      setConnections(data);
      setApiKey("");
      toast.success("Fireflies API key saved");
    } catch {
      toast.error("Failed to save API key");
    } finally {
      setSavingKey(false);
    }
  };

  const handleConnectCRM = (service: "hubspot" | "pipedrive" | "attio" | "zoho") => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/api/auth/${service}`;
  };

  const handleDisconnect = async (service: string) => {
    try {
      await api.delete(`/api/connections/${service}`);
      setConnections((prev) => prev.filter((c) => c.service !== service));
      toast.success("Disconnected successfully");
    } catch {
      toast.error("Failed to disconnect");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Connections</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Connect your meeting recorder and CRM
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="text-base font-semibold text-neutral-900">
          Meeting Recorder
        </h2>
        <div className="bg-white rounded-xl border border-neutral-200 shadow-card p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg border border-neutral-200 bg-neutral-50 flex items-center justify-center overflow-hidden">
              <Image src="/logos/fireflies.svg" alt="Fireflies.ai" width={24} height={24} />
            </div>
            <div>
              <p className="text-sm font-semibold">Fireflies.ai</p>
              <p className="text-xs text-neutral-500">
                {fireflies
                  ? `Connected ${(fireflies.metadata as Record<string, string>)?.key_hint ? `· Key: ${(fireflies.metadata as Record<string, string>).key_hint}` : ""}`
                  : "Not connected"}
              </p>
            </div>
            {fireflies && (
              <div className="flex items-center gap-2 ml-auto">
                <span className="flex items-center gap-1 text-xs text-green-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                  Connected
                </span>
                <Button
                  size="sm"
                  className="h-7 text-xs border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50"
                  onClick={() => handleDisconnect("fireflies")}
                >
                  Disconnect
                </Button>
              </div>
            )}
          </div>

          {!fireflies && (
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-neutral-600">
                API Key
              </Label>
              <div className="flex gap-2">
                <Input
                  type="password"
                  placeholder="Enter your Fireflies API key"
                  className="h-9 text-sm bg-neutral-50 border-neutral-200 flex-1"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  onBlur={() => setKeyTouched(true)}
                />
                <Button
                  className="h-9 text-sm bg-black text-white hover:bg-neutral-800"
                  onClick={handleSaveFirefliesKey}
                  disabled={savingKey || !apiKey.trim()}
                >
                  {savingKey ? "Saving..." : "Save"}
                </Button>
              </div>
              {keyTouched && apiKey.length > 0 && apiKey.length < 10 && (
                <p className="text-xs text-amber-500 mt-1">API key seems too short</p>
              )}
            </div>
          )}

          {fireflies && webhookConfig && (
            <div className="border-t border-neutral-100 pt-4 space-y-4">
              <div>
                <p className="text-sm font-medium text-neutral-900 mb-1">
                  Webhook setup
                </p>
                <p className="text-xs text-neutral-500">
                  Go to{" "}
                  <a
                    href="https://app.fireflies.ai/integrations/custom/webhooks"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-neutral-700 underline"
                  >
                    Fireflies &rarr; Settings &rarr; Webhooks
                  </a>
                  {" "}and paste these values:
                </p>
              </div>
              <div className="space-y-3">
                <CopyField label="1. Webhook URL" value={webhookConfig.webhook_url} />
                <CopyField label="2. Secret" value={webhookConfig.webhook_secret} />
                <CopyField label="3. Client Reference ID" value={webhookConfig.user_id} />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-base font-semibold text-neutral-900">CRM</h2>
        <div className="grid grid-cols-2 gap-4">
          <ConnectionCard
            name="HubSpot"
            icon={
              <Image src="/logos/hubspot.svg" alt="HubSpot" width={24} height={24} />
            }
            connected={!!hubspot}
            workspaceName={hubspot?.metadata?.workspace_name}
            onConnect={() => handleConnectCRM("hubspot")}
            onDisconnect={() => handleDisconnect("hubspot")}
          />
          <ConnectionCard
            name="Pipedrive"
            icon={
              <Image src="/logos/pipedrive.svg" alt="Pipedrive" width={24} height={24} />
            }
            connected={!!pipedrive}
            workspaceName={
              pipedrive?.metadata?.workspace_name ??
              pipedrive?.metadata?.company_domain
            }
            onConnect={() => handleConnectCRM("pipedrive")}
            onDisconnect={() => handleDisconnect("pipedrive")}
          />
          <ConnectionCard
            name="Attio"
            icon={
              <Image src="/logos/attio.svg" alt="Attio" width={24} height={24} />
            }
            connected={!!attio}
            workspaceName={attio?.metadata?.workspace_name}
            onConnect={() => handleConnectCRM("attio")}
            onDisconnect={() => handleDisconnect("attio")}
          />
          <ConnectionCard
            name="Zoho CRM"
            icon={
              <Image src="/logos/zoho.svg" alt="Zoho CRM" width={24} height={24} />
            }
            connected={!!zoho}
            workspaceName={(zoho?.metadata as Record<string, string>)?.location}
            onConnect={() => handleConnectCRM("zoho")}
            onDisconnect={() => handleDisconnect("zoho")}
          />
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-8">
          <p className="text-sm text-neutral-400">Loading connections...</p>
        </div>
      )}
    </div>
  );
}
