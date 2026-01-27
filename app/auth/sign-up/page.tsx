"use client";

import React from "react"

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Store, Loader2, ShoppingBag, Package, Check } from "lucide-react";
import type { UserRole } from "@/lib/types";

export default function SignUpPage() {
  const [step, setStep] = useState<"role" | "details">("role");
  const [role, setRole] = useState<UserRole | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleRoleSelect = (selectedRole: UserRole) => {
    setRole(selectedRole);
    setStep("details");
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role) return;

    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo:
          process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ||
          `${window.location.origin}/auth/callback`,
        data: {
          display_name: fullName,
          role: role,
        },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/auth/sign-up-success");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Link href="/" className="inline-flex items-center justify-center gap-2 mb-4">
            <Store className="h-8 w-8 text-primary" />
            <span className="font-serif text-2xl font-semibold text-foreground">P2P Market</span>
          </Link>
          <CardTitle className="text-2xl">Create your account</CardTitle>
          <CardDescription>
            {step === "role"
              ? "How do you want to use P2P Market?"
              : `Signing up as a ${role}`}
          </CardDescription>
        </CardHeader>

        {step === "role" ? (
          <CardContent className="space-y-4">
            <button
              type="button"
              onClick={() => handleRoleSelect("buyer")}
              className="w-full p-4 border border-border rounded-lg hover:border-primary hover:bg-primary/5 transition-colors text-left group"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-full bg-secondary group-hover:bg-primary/10 transition-colors">
                  <ShoppingBag className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-foreground">I want to buy</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Browse listings, participate in auctions, and purchase digital or physical goods.
                  </p>
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleRoleSelect("seller")}
              className="w-full p-4 border border-border rounded-lg hover:border-primary hover:bg-primary/5 transition-colors text-left group"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-full bg-secondary group-hover:bg-primary/10 transition-colors">
                  <Package className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-foreground">I want to sell</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Create listings, run auctions, and sell your products to our community.
                  </p>
                </div>
              </div>
            </button>

            <p className="text-sm text-muted-foreground text-center pt-4">
              Already have an account?{" "}
              <Link href="/auth/login" className="text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </CardContent>
        ) : (
          <form onSubmit={handleSignUp}>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="p-3 bg-primary/10 rounded-lg flex items-center gap-3">
                {role === "buyer" ? (
                  <ShoppingBag className="h-5 w-5 text-primary" />
                ) : (
                  <Package className="h-5 w-5 text-primary" />
                )}
                <span className="text-sm font-medium text-foreground capitalize">
                  {role} Account
                </span>
                <Check className="h-4 w-4 text-primary ml-auto" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
                <p className="text-xs text-muted-foreground">
                  Must be at least 6 characters
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create account
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setStep("role");
                  setRole(null);
                }}
              >
                Back to role selection
              </Button>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  );
}
