"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Film, LogIn, LogOut, ExternalLink, Sparkles, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

import { BrandLogo } from "@/components/ui/brand-logo";

interface HeaderProps {
  onOpenSocialModal?: () => void;
}

export function Header({ onOpenSocialModal }: HeaderProps = {}) {
  const { user, signOut, isLoading } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);

  const userInitial = user?.email ? user.email.charAt(0).toUpperCase() : "U";

  return (
    <header className="sticky top-0 z-40 w-full h-16 studio-glass border-b border-white/[0.08] px-4 sm:px-8 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <BrandLogo size="sm" badgeText="Studio" />
      </div>

      {/* Center / Status */}
      <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs text-zinc-300">
        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="font-medium text-white">Engine Active</span>
        <span className="text-zinc-600">•</span>
        <span className="text-zinc-400">9:16 HD 60FPS</span>
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white px-2.5 py-1.5 rounded-lg hover:bg-white/[0.04] transition-colors"
        >
          <Home className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Home</span>
        </Link>

        <div className="h-4 w-[1px] bg-white/[0.08]" />

        {/* User Auth State / Dropdown */}
        {isLoading ? (
          <div className="h-8 w-24 rounded-lg bg-white/[0.04] animate-pulse" />
        ) : user ? (
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-white/[0.05] transition-colors border border-transparent hover:border-white/[0.08]"
            >
              <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-amber-500 to-amber-700 flex items-center justify-center text-xs font-bold text-black border border-amber-400/40 shadow-sm">
                {userInitial}
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-semibold text-white max-w-[130px] truncate leading-none">
                  {user.email?.split("@")[0]}
                </span>
                <span className="text-[10px] text-zinc-400 font-medium mt-0.5">
                  Creator Account
                </span>
              </div>
            </button>

            {/* Dropdown Menu */}
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl studio-card p-2 shadow-2xl z-50 space-y-1 bg-[#121622] border border-white/[0.1] animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-2 border-b border-white/[0.06]">
                  <p className="text-xs font-medium text-white truncate">{user.email}</p>
                  <span className="text-[10px] text-emerald-400 flex items-center gap-1 mt-0.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    Authenticated
                  </span>
                </div>
                <Link
                  href="/"
                  onClick={() => setShowDropdown(false)}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-zinc-300 hover:text-white hover:bg-white/[0.06] transition-colors"
                >
                  <Home className="h-3.5 w-3.5" />
                  PostMatic Home
                </Link>
                <button
                  type="button"
                  onClick={async () => {
                    setShowDropdown(false);
                    await signOut();
                    window.location.href = "/";
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-rose-400 hover:bg-rose-500/10 transition-colors"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link href="/login">
            <Button variant="primary" size="sm" className="h-9 px-4 text-xs font-semibold rounded-xl shadow-lg shadow-amber-500/20">
              <LogIn className="h-3.5 w-3.5 mr-1" />
              Sign In
            </Button>
          </Link>
        )}
      </div>
    </header>
  );
}
