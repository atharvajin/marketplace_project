"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { BecomeSellerButton } from "@/components/BecomeSellerButton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Store,
  Search,
  ShoppingBag,
  Gavel,
  BookOpen,
  User,
  LogOut,
  LayoutDashboard,
  Menu,
  X,
  ShieldCheck,
  MessageSquare,
} from "lucide-react";

type ProfileWithExtras = Profile & {
  last_role_selection?: string;
  kyc_completed?: boolean;
};

export function Header() {
  const pathname = usePathname();
  const [profile, setProfile] = useState<ProfileWithExtras | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function getProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (data) setProfile(data as ProfileWithExtras);
      } else {
        setProfile(null);
      }
    }

    getProfile();
  }, [supabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const navLinks = [
    { href: "/browse", label: "Browse", icon: Search },
    { href: "/browse?type=digital", label: "Digital", icon: ShoppingBag },
    { href: "/auctions", label: "Auctions", icon: Gavel },
    { href: "/blog", label: "Blog", icon: BookOpen },
    { href: "/inbox", label: "Inbox", icon: MessageSquare },

  ];

  const role =
    profile?.role ?? (profile?.last_role_selection as string | undefined);
  const isSeller = role === "seller";
  const showKyc = isSeller && !profile?.kyc_completed;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <Store className="h-6 w-6 text-primary" />
            <span className="font-serif text-xl font-semibold text-foreground">
              P2P Market
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive =
                pathname === link.href ||
                pathname.startsWith(link.href.split("?")[0] + "/");

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-1.5 text-sm font-medium transition-colors hover:text-primary ${
                    isActive ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* RIGHT SIDE */}
        <div className="flex items-center gap-4">
          {/* Optional KYC CTA in navbar (seller only, if not completed) */}
          {profile && showKyc ? (
            <Link
              href="/kyc"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-md border border-primary/50 bg-transparent px-3 py-2 text-sm font-medium text-primary hover:bg-primary/10"
            >
              <ShieldCheck className="h-4 w-4" />
              Complete KYC
            </Link>
          ) : null}

          {profile ? (
            <div className="flex items-center gap-3">
              {/* Show Become Seller only if not seller */}
              {!isSeller && <BecomeSellerButton />}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-9 w-9 rounded-full"
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarImage
                        src={profile.avatar_url || undefined}
                        alt={profile.display_name || "User"}
                      />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {profile.display_name?.[0] ||
                          profile.email[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      {profile.display_name && (
                        <p className="font-medium text-foreground">
                          {profile.display_name}
                        </p>
                      )}
                      <p className="w-[200px] truncate text-sm text-muted-foreground">
                        {profile.email}
                      </p>
                      <p className="text-xs text-primary capitalize">
                        {role || "buyer"}
                      </p>
                    </div>
                  </div>

                  <DropdownMenuSeparator />

                  {/* KYC item inside dropdown (seller only) */}
                  {showKyc ? (
                    <>
                      <DropdownMenuItem asChild>
                        <Link href="/kyc" className="cursor-pointer">
                          <ShieldCheck className="mr-2 h-4 w-4" />
                          Complete seller verification (KYC)
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  ) : null}

                  {/* Seller Dashboard */}
                  {isSeller ? (
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard" className="cursor-pointer">
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                  ) : null}

                  {/* Profile */}
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  {/* Sign out */}
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="cursor-pointer text-destructive"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <Button variant="ghost" asChild>
                <Link href="/auth/login">Sign in</Link>
              </Button>
              <Button asChild>
                <Link href="/auth/sign-up">Get started</Link>
              </Button>
            </div>
          )}

          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-card p-4">
          <nav className="flex flex-col gap-3">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary py-2"
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </Link>
              );
            })}

            {/* Mobile KYC link */}
            {profile && showKyc ? (
              <>
                <hr className="border-border" />
                <Link
                  href="/kyc"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 text-sm font-medium text-primary py-2"
                >
                  <ShieldCheck className="h-4 w-4" />
                  Complete seller verification (KYC)
                </Link>
              </>
            ) : null}

            {!profile && (
              <>
                <hr className="border-border" />
                <Link
                  href="/auth/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-sm font-medium text-muted-foreground hover:text-primary py-2"
                >
                  Sign in
                </Link>
                <Link
                  href="/auth/sign-up"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-sm font-medium text-primary py-2"
                >
                  Get started
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
