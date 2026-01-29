"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function BecomeSellerButton() {
  const supabase = createClient();
  const router = useRouter();

  const becomeSeller = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/auth/login");
      return;
    }

    // Create seller onboarding record (does not make them seller instantly)
    await supabase.from("seller_profiles").upsert({
      user_id: user.id,
      kyc_status: "not_started",
    });

    router.push("/seller/onboarding");
  };

  return (
    <Button onClick={becomeSeller} size="sm" className="hidden sm:inline-flex">
      Become a Seller
    </Button>
  );
}
