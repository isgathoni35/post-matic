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
  glow = false,
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
        "relative flex items-center justify-center transition-transform duration-200 group-hover:scale-105 shrink-0",
        iconDimensions,
        "bg-gradient-to-br from-[#6c5ce7] to-[#5844e3] text-white shadow-xs shadow-[#6c5ce7]/30",
        className
      )}
    >
      {/* Crisp Infinity Play Symbol */}
      <svg
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative z-10 w-[68%] h-[68%]"
      >
        {/* Left Infinity Loop */}
        <path
          d="M16 16 C 10 26, 3 22, 3 16 C 3 10, 10 6, 16 16 Z"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.9"
        />
        {/* Right Infinity Loop */}
        <path
          d="M16 16 C 22 6, 29 10, 29 16 C 29 22, 22 26, 16 16 Z"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.9"
        />
        {/* Play Triangle */}
        <polygon
          points="13.5,11.5 20,16 13.5,20.5"
          fill="white"
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
      <BrandIcon size={size} glow={false} />

      {/* Wordmark and Badge */}
      {showWordmark && (
        <div className="flex items-center gap-2 leading-none">
          <span className={cn("font-extrabold tracking-tight text-slate-900 font-sans", textSize)}>
            Post<span className="text-[#6c5ce7]">Matic</span>
          </span>
          {showBadge && (
            <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded-full bg-[#6c5ce7]/10 text-[#6c5ce7] border border-[#6c5ce7]/20 uppercase tracking-wide">
              {badgeText}
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex items-center">
        {content}
      </Link>
    );
  }

  return content;
}
