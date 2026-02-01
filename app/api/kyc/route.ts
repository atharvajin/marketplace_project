import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * POST /api/kyc - Submit KYC and mark seller as verified
 */
export async function POST(request: Request) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, last_role_selection, kyc_completed")
    .eq("id", user.id)
    .single();

  const isSeller =
    profile?.role === "seller" ||
    (profile as { last_role_selection?: string })?.last_role_selection === "seller";
  if (!profile || !isSeller) {
    return NextResponse.json(
      { error: "Only sellers need to complete KYC" },
      { status: 403 }
    );
  }

  if (profile.kyc_completed) {
    return NextResponse.json(
      { error: "KYC already completed", redirect: "/dashboard" },
      { status: 400 }
    );
  }

  const body = await request.json();
  const { full_name, address, id_type, id_number } = body;

  if (!full_name || !address || !id_type || !id_number) {
    return NextResponse.json(
      { error: "Missing required fields: full_name, address, id_type, id_number" },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: full_name,
      kyc_completed: true,
      kyc_submitted_at: new Date().toISOString(),
      kyc_data: { address, id_type, id_number },
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    redirect: "/dashboard",
  });
}
