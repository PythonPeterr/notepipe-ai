"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Suspense } from "react";

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get("code");

    if (!code) {
      router.replace("/auth/login");
      return;
    }

    const supabase = createClient();
    supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
      if (error) {
        router.replace("/auth/login");
      } else {
        router.replace("/overview");
      }
    });
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-[#EFEFEF] flex items-center justify-center">
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-card p-8 text-center">
        <div className="h-6 w-6 bg-black rounded-sm mx-auto mb-4 animate-pulse" />
        <p className="text-sm text-neutral-500">Signing you in...</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#EFEFEF] flex items-center justify-center">
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-card p-8 text-center">
            <div className="h-6 w-6 bg-black rounded-sm mx-auto mb-4 animate-pulse" />
            <p className="text-sm text-neutral-500">Loading...</p>
          </div>
        </div>
      }
    >
      <CallbackHandler />
    </Suspense>
  );
}
