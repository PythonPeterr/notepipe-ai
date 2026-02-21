"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-[#EFEFEF] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-card w-full max-w-sm p-8">
          <div className="flex items-center gap-2 mb-8">
            <div className="h-6 w-6 bg-black rounded-sm" />
            <span className="font-bold text-sm">Notepipe</span>
          </div>
          <div className="flex flex-col items-center text-center py-4">
            <div className="h-11 w-11 rounded-xl bg-neutral-100 border border-neutral-200 flex items-center justify-center mb-4">
              <Mail className="h-5 w-5 text-neutral-400" />
            </div>
            <h1 className="text-xl font-bold text-neutral-900 mb-1">
              Check your email
            </h1>
            <p className="text-sm text-neutral-500">
              We sent a magic link to{" "}
              <span className="font-medium text-neutral-900">{email}</span>.
              Click the link to sign in.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#EFEFEF] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-card w-full max-w-sm p-8">
        <div className="flex items-center gap-2 mb-8">
          <div className="h-6 w-6 bg-black rounded-sm" />
          <span className="font-bold text-sm">Notepipe</span>
        </div>
        <h1 className="text-xl font-bold text-neutral-900 mb-1">Sign in</h1>
        <p className="text-sm text-neutral-500 mb-6">
          Enter your email to receive a magic link.
        </p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            type="email"
            placeholder="you@company.com"
            className="h-9 text-sm bg-neutral-50 border-neutral-200"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
          />
          {error && (
            <p className="text-xs text-red-600">{error}</p>
          )}
          <Button
            type="submit"
            className="w-full h-9 text-sm bg-black text-white hover:bg-neutral-800"
            disabled={loading}
          >
            {loading ? "Sending..." : "Send magic link"}
          </Button>
        </form>
      </div>
    </div>
  );
}
