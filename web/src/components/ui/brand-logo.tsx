"use client";

import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  size?: "sm" | "md" | "lg";
  showWordmark?: boolean;
  showBadge?: boolean;
  badgeText?: string;
  className?: string;
  href?: string;
}

export interface BrandIconProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  glow?: boolean;
}

export function BrandIcon({
  size = "md",
  className,
  glow = true,
}: BrandIconProps) {
  const iconDimensions = {
    xs: "h-6 w-6 rounded-lg",
    sm: "h-8 w-8 rounded-xl",
    md: "h-9 w-9 rounded-xl",
    lg: "h-12 w-12 rounded-2xl",
    xl: "h-16 w-16 rounded-2xl",
  }[size];

  return (
    <div
      className={cn(
        "relative flex items-center justify-center transition-all duration-300",
        iconDimensions,
        "bg-gradient-to-br from-[#1a1a24] via-[#121218] to-[#0c0c10]",
        "border border-white/[0.1] group-hover:border-indigo-500/40",
        "shadow-[0_2px_8px_rgba(0,0,0,0.4),inset_0_1px_0_0_rgba(255,255,255,0.1)]",
        className
      )}
    >
      {/* Ambient Underglow */}
      {glow && (
        <div className="absolute inset-0 rounded-[inherit] bg-gradient-to-tr from-indigo-500/15 via-violet-500/10 to-transparent blur-sm pointer-events-none" />
      )}

      {/* New Neon Infinity Play Logo */}
      <svg
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative z-10 w-[70%] h-[70%]"
      >
        <defs>
          <linearGradient id="neon-purple" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
          <linearGradient id="neon-cyan" x1="32" y1="32" x2="0" y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
        </defs>
        
        {/* Infinity Left Loop (Purple) */}
        <path 
          d="M16 16 C 10 26, 3 22, 3 16 C 3 10, 10 6, 16 16 Z" 
          stroke="url(#neon-purple)" 
          strokeWidth="2.5" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          className="drop-shadow-[0_0_4px_rgba(168,85,247,0.6)]" 
        />
        
        {/* Infinity Right Loop (Cyan) */}
        <path 
          d="M16 16 C 22 6, 29 10, 29 16 C 29 22, 22 26, 16 16 Z" 
          stroke="url(#neon-cyan)" 
          strokeWidth="2.5" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          className="drop-shadow-[0_0_4px_rgba(6,182,212,0.6)]" 
        />
        
        {/* Play Button Center */}
        <polygon 
          points="13.5,11 20.5,16 13.5,21" 
          fill="white" 
          className="drop-shadow-[0_0_5px_rgba(255,255,255,0.7)]" 
        />
      </svg>
    </div>
  );
}

export function BrandLogo({
  size = "md",
  showWordmark = true,
  showBadge = true,
  badgeText = "Studio",
  className,
  href = "/",
}: BrandLogoProps) {
  const textSize = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-xl",
  }[size];

  const content = (
    <div className={cn("inline-flex items-center gap-2.5 group select-none", className)}>
      <BrandIcon size={size} />

      {/* Wordmark and Badge */}
      {showWordmark && (
        <div className="flex flex-col text-left leading-none">
          <div className="flex items-center gap-1.5">
            <span className={cn("font-extrabold tracking-tight text-white font-sans", textSize)}>
              Post<span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-violet-400">Matic</span>
            </span>
            {showBadge && (
              <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase tracking-wide">
                {badgeText}
              </span>
            )}
          </div>
          <span className="text-[10px] text-zinc-400 font-medium tracking-normal mt-0.5">
            Faceless Video Suite
          </span>
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex">
        {content}
      </Link>
    );
  }

  return content;
}
