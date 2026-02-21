"use client";

import { useEffect, useState } from "react";
import { Mic, Building2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import ConnectionCard from "@/components/app/ConnectionCard";
import type { Connection } from "@/lib/types";

export default function ConnectionsPage() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [apiKey, setApiKey] = useState("");
  const [savingKey, setSavingKey] = useState(false);
  const [loading, setLoading] = useState(true);
  const [keyTouched, setKeyTouched] = useState(false);

  const fireflies = connections.find((c) => c.service === "fireflies");
  const hubspot = connections.find((c) => c.service === "hubspot");
  const pipedrive = connections.find((c) => c.service === "pipedrive");

  const webhookUrl = fireflies
    ? `${process.env.NEXT_PUBLIC_API_URL}/api/webhooks/fireflies`
    : "";

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

  const handleConnectCRM = (service: "hubspot" | "pipedrive") => {
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
            <div className="h-9 w-9 rounded-lg border border-neutral-200 bg-neutral-50 flex items-center justify-center">
              <Mic className="h-5 w-5 text-neutral-600" />
            </div>
            <div>
              <p className="text-sm font-semibold">Fireflies.ai</p>
              <p className="text-xs text-neutral-500">
                {fireflies ? "Connected" : "Not connected"}
              </p>
            </div>
            {fireflies && (
              <span className="flex items-center gap-1 text-xs text-green-600 ml-auto">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                Connected
              </span>
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

          {fireflies && webhookUrl && (
            <ConnectionCard
              name="Fireflies.ai"
              icon={<Mic className="h-5 w-5 text-neutral-600" />}
              connected={true}
              workspaceName="Connected"
              webhookUrl={webhookUrl}
              showWebhookUrl={true}
              onConnect={() => {}}
              onDisconnect={() => handleDisconnect("fireflies")}
            />
          )}
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-base font-semibold text-neutral-900">CRM</h2>
        <div className="grid grid-cols-2 gap-4">
          <ConnectionCard
            name="HubSpot"
            icon={
              <Building2 className="h-5 w-5 text-neutral-600" />
            }
            connected={!!hubspot}
            workspaceName={hubspot?.metadata?.workspace_name}
            onConnect={() => handleConnectCRM("hubspot")}
            onDisconnect={() => handleDisconnect("hubspot")}
          />
          <ConnectionCard
            name="Pipedrive"
            icon={
              <Building2 className="h-5 w-5 text-neutral-600" />
            }
            connected={!!pipedrive}
            workspaceName={
              pipedrive?.metadata?.workspace_name ??
              pipedrive?.metadata?.company_domain
            }
            onConnect={() => handleConnectCRM("pipedrive")}
            onDisconnect={() => handleDisconnect("pipedrive")}
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
