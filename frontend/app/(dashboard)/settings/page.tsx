"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export default function SettingsPage() {
  const [email, setEmail] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) {
        setEmail(user.email);
      }
    });
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/auth/login";
  };

  const handleDeleteAccount = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }

    setDeleting(true);
    try {
      await api.delete("/api/account");
      const supabase = createClient();
      await supabase.auth.signOut();
      window.location.href = "/auth/login";
    } catch {
      toast.error("Failed to delete account");
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Settings</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Manage your account settings
        </p>
      </div>

      <div className="bg-white rounded-xl border border-neutral-200 shadow-card p-6 space-y-5">
        <h2 className="text-base font-semibold text-neutral-900">Account</h2>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-neutral-600">Email</Label>
          <Input
            type="email"
            value={email}
            readOnly
            className="h-9 text-sm bg-neutral-50 border-neutral-200 cursor-not-allowed"
          />
        </div>
        <Button
          variant="outline"
          className="h-9 text-sm bg-white border-neutral-300 text-neutral-900 hover:bg-neutral-50"
          onClick={handleSignOut}
        >
          Sign out
        </Button>
      </div>

      <Separator className="bg-neutral-200" />

      <div className="bg-white rounded-xl border border-red-200 shadow-card p-6 space-y-4">
        <h2 className="text-base font-semibold text-red-600">Danger Zone</h2>
        <p className="text-sm text-neutral-500">
          Permanently delete your account and all associated data. This action
          cannot be undone.
        </p>
        {confirmDelete && (
          <p className="text-sm text-red-600 font-medium">
            Are you sure? Click again to confirm permanent deletion.
          </p>
        )}
        <Button
          variant="destructive"
          className="h-9 text-sm"
          onClick={handleDeleteAccount}
          disabled={deleting}
        >
          {deleting
            ? "Deleting..."
            : confirmDelete
              ? "Confirm delete account"
              : "Delete account"}
        </Button>
      </div>
    </div>
  );
}
