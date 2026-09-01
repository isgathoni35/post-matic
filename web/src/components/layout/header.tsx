"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Film, Activity, HelpCircle, LogIn, LogOut, User as UserIcon, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

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
        {/* Brand */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20 border border-amber-300/30 group-hover:scale-105 transition-transform">
            <Film className="h-5 w-5 text-black" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-tight text-white text-base">POST-MATIC</span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 font-semibold border border-amber-500/20">
                Studio
              </span>
            </div>
            <span className="text-[11px] text-muted-foreground hidden sm:inline">
              Automated Faceless Video Pipeline
            </span>
          </div>
        </Link>
      </div>

      {/* Center / Status */}
      <div className="hidden md:flex items-center gap-3">
        <Badge variant="success" pulse className="px-3 py-1 text-xs">
          <Activity className="h-3 w-3 mr-1" />
          FFmpeg & FastAPI Online
        </Badge>
        <span className="text-zinc-600 text-xs">•</span>
        <span className="text-xs text-muted-foreground font-mono">
          Free-Tier Distributed Compute
        </span>
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-3">
        <button
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-white px-2.5 py-1.5 rounded-md hover:bg-white/[0.04] transition-colors"
          title="Architecture Documentation"
        >
          <HelpCircle className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Docs</span>
        </button>

        <div className="h-4 w-[1px] bg-white/[0.08]" />

        {/* User Auth State / Dropdown */}
        {isLoading ? (
          <div className="h-8 w-24 rounded-lg bg-white/[0.04] animate-pulse" />
        ) : user ? (
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2.5 p-1 rounded-lg hover:bg-white/[0.05] transition-colors"
            >
              <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-amber-500 to-amber-700 flex items-center justify-center text-xs font-bold text-black border border-amber-400/40">
                {userInitial}
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-medium text-white max-w-[130px] truncate leading-none">
                  {user.email?.split("@")[0]}
                </span>
                <span className="text-[10px] text-muted-foreground font-mono mt-0.5">
                  Authenticated
                </span>
              </div>
            </button>

            {/* Dropdown Menu */}
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl studio-card p-2 shadow-2xl z-50 space-y-1 bg-[#12161f] border border-white/[0.1]">
                <div className="px-3 py-2 border-b border-white/[0.06]">
                  <p className="text-xs font-medium text-white truncate">{user.email}</p>
                  <span className="text-[10px] font-mono text-emerald-400">Supabase Session Active</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowDropdown(false);
                    signOut();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-rose-400 hover:bg-rose-500/10 transition-colors"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sign Out of Studio
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link href="/login">
            <Button variant="secondary" size="sm" className="h-8 text-xs font-semibold">
              <LogIn className="h-3.5 w-3.5 mr-1" />
              Sign In
            </Button>
          </Link>
        )}
      </div>
    </header>
  );
}
