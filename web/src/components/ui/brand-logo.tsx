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

export function BrandLogo({
  size = "md",
  showWordmark = true,
  showBadge = true,
  badgeText = "Studio",
  className,
  href = "/",
}: BrandLogoProps) {
  const iconDimensions = {
    sm: "h-8 w-8",
    md: "h-9 w-9",
    lg: "h-11 w-11",
  }[size];

  const textSize = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-xl",
  }[size];

  const content = (
    <div className={cn("inline-flex items-center gap-2.5 group select-none", className)}>
      {/* Bespoke Geometric Aperture / Play-Pulse Mark */}
      <div
        className={cn(
          "relative flex items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-105",
          iconDimensions,
          "bg-gradient-to-br from-[#1c2230] via-[#121622] to-[#0a0c12]",
          "border border-white/[0.12] group-hover:border-amber-500/40",
          "shadow-[0_4px_16px_-2px_rgba(245,158,11,0.2),inset_0_1px_0_0_rgba(255,255,255,0.15)]"
        )}
      >
        {/* Ambient Underglow */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-tr from-amber-500/20 via-orange-500/10 to-transparent blur-sm pointer-events-none" />

        {/* Custom Interlocking Aperture Vector */}
        <svg
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="relative z-10 w-[62%] h-[62%]"
        >
          <defs>
            <linearGradient id="aperture-grad-1" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#fbbf24" />
              <stop offset="60%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#ea580c" />
            </linearGradient>
            <linearGradient id="aperture-grad-2" x1="28" y1="4" x2="4" y2="28" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="100%" stopColor="#f59e0b" />
            </linearGradient>
          </defs>

          {/* Continuous Loop Segments forming Aperture & Play Core */}
          <path
            d="M9 7C7.89543 7 7 7.89543 7 9V17.5C7 18.3284 7.67157 19 8.5 19H12.5C13.3284 19 14 18.3284 14 17.5V11C14 9.89543 14.8954 9 16 9H23C24.1046 9 25 8.10457 25 7C25 5.89543 24.1046 5 23 5H11C9.89543 5 9 5.89543 9 7Z"
            fill="url(#aperture-grad-1)"
          />
          <path
            d="M23 25C24.1046 25 25 24.1046 25 23V14.5C25 13.6716 24.3284 13 23.5 13H19.5C18.6716 13 18 13.6716 18 14.5V21C18 22.1046 17.1046 23 16 23H9C7.89543 23 7 23.8954 7 25C7 26.1046 7.89543 27 9 27H21C22.1046 27 23 26.1046 23 25Z"
            fill="url(#aperture-grad-1)"
            opacity="0.85"
          />
          {/* Dynamic Play Iris Center */}
          <polygon
            points="14,12 21,16 14,20"
            fill="url(#aperture-grad-2)"
          />
        </svg>
      </div>

      {/* Wordmark and Badge */}
      {showWordmark && (
        <div className="flex flex-col text-left leading-none">
          <div className="flex items-center gap-1.5">
            <span className={cn("font-extrabold tracking-tight text-white font-sans", textSize)}>
              Post<span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-orange-400">Matic</span>
            </span>
            {showBadge && (
              <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase tracking-wide">
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
