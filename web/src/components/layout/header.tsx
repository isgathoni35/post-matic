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
    <header className="sticky top-0 z-40 w-full h-14 sm:h-16 bg-white/95 backdrop-blur-xl border-b border-slate-200/80 px-3.5 sm:px-8 flex items-center justify-between shadow-xs">
      <div className="flex items-center gap-3 sm:gap-6">
        <BrandLogo size="sm" badgeText="Studio" />
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-xs text-slate-700 hover:text-slate-900 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition-colors font-medium"
        >
          <Home className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Home</span>
        </Link>

        <div className="h-4 w-[1px] bg-slate-200" />

        {/* User Auth State / Dropdown */}
        {isLoading ? (
          <div className="h-8 w-24 rounded-lg bg-slate-100 animate-pulse" />
        ) : user ? (
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200"
            >
              <div className="h-8 w-8 rounded-full bg-[#6c5ce7] flex items-center justify-center text-xs font-bold text-white shadow-xs">
                {userInitial}
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-semibold text-slate-900 max-w-[130px] truncate leading-none">
                  {user.email?.split("@")[0]}
                </span>
                <span className="text-[10px] text-slate-600 font-medium mt-0.5">
                  Creator Account
                </span>
              </div>
            </button>

            {/* Dropdown Menu */}
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white p-2 shadow-xl z-50 space-y-1 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-2 border-b border-slate-100">
                  <p className="text-xs font-semibold text-slate-900 truncate">{user.email}</p>
                  <span className="text-[10px] text-emerald-600 flex items-center gap-1 mt-0.5 font-medium">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Authenticated
                  </span>
                </div>
                <Link
                  href="/"
                  onClick={() => setShowDropdown(false)}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors"
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
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-rose-600 hover:bg-rose-50 transition-colors font-medium"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link href="/login">
            <Button variant="primary" size="sm" className="h-9 px-4 text-xs font-semibold rounded-lg bg-[#6c5ce7] hover:bg-[#5b4bc4] text-white">
              <LogIn className="h-3.5 w-3.5 mr-1" />
              Sign In
            </Button>
          </Link>
        )}
      </div>
    </header>
  );
}
