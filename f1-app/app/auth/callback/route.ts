import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Create/update profile row with display name from OAuth metadata
      const displayName =
        data.user.user_metadata?.full_name ??
        data.user.email?.split("@")[0] ??
        "Player";

      await supabase
        .from("profiles")
        .upsert({ id: data.user.id, display_name: displayName });

      // On Vercel, origin from request.url may be an internal URL.
      // x-forwarded-host contains the actual public hostname.
      const forwardedHost = request.headers.get("x-forwarded-host");
      const redirectBase =
        process.env.NODE_ENV === "development" || !forwardedHost
          ? origin
          : `https://${forwardedHost}`;

      return NextResponse.redirect(`${redirectBase}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=auth_failed`);
}
