import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const DEV_BYPASS = process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === "true";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isAuthRoute = pathname.startsWith("/auth");
  const isLandingPage = pathname === "/";

  let supabaseResponse = NextResponse.next({
    request,
  });

  // Dev mode: skip all auth checks
  if (DEV_BYPASS) {
    return supabaseResponse;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    // Auth check failed — treat as unauthenticated
  }

  // Landing page
  if (isLandingPage) {
    if (user) {
      const url = request.nextUrl.clone();
      url.pathname = "/overview";
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  // Auth callback: always let through (client-side PKCE exchange)
  if (pathname === "/auth/callback") {
    return supabaseResponse;
  }

  // Auth routes: authenticated users go to dashboard
  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/overview";
    return NextResponse.redirect(url);
  }

  // Protected routes: unauthenticated users go to login
  if (!user && !isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icons|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
