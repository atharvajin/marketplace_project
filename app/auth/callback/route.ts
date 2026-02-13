import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const role = user.user_metadata?.role as string | undefined;
      if (role === "seller" || role === "buyer") {
        await supabase
          .from("profiles")
          .update({ role, updated_at: new Date().toISOString() })
          .eq("id", user.id);
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role, last_role_selection")
        .eq("id", user.id)
        .single();

      const isSeller =
        profile?.role === "seller" ||
        (profile as { last_role_selection?: string })?.last_role_selection === "seller";
      if (isSeller) {
        return NextResponse.redirect(new URL("/dashboard", requestUrl.origin));
      }
    }
  }

  return NextResponse.redirect(new URL("/browse", requestUrl.origin));
}
