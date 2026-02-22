"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
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

  const handleGoogleLogin = async () => {
    setOauthLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (authError) {
      setError(authError.message);
      setOauthLoading(false);
    }
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
            disabled={loading || oauthLoading}
          />
          {error && (
            <p className="text-xs text-red-600">{error}</p>
          )}
          <Button
            type="submit"
            className="w-full h-9 text-sm bg-black text-white hover:bg-neutral-800"
            disabled={loading || oauthLoading}
          >
            {loading ? "Sending..." : "Send magic link"}
          </Button>
        </form>

        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-neutral-200" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-white px-2 text-neutral-400">or continue with</span>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full h-9 text-sm border-neutral-200 hover:bg-neutral-50"
          disabled={loading || oauthLoading}
          onClick={handleGoogleLogin}
        >
          {oauthLoading ? (
            "Redirecting..."
          ) : (
            <>
              <GoogleIcon />
              <span className="ml-2">Google</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
