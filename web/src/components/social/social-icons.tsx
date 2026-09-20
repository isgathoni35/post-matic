import React from "react";
import { cn } from "@/lib/utils";

export interface SocialIconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
  variant?: "color" | "mono";
}

/**
 * Precision YouTube Icon Vector
 */
export function YouTubeIcon({ className, variant = "color", ...props }: SocialIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={cn(
        "shrink-0",
        variant === "color" && "text-red-500",
        className
      )}
      {...props}
    >
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

/**
 * Authentic TikTok Musical Note Glyph Vector
 */
export function TikTokIcon({ className, variant = "color", ...props }: SocialIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={cn(
        "shrink-0",
        variant === "color" && "text-cyan-400",
        className
      )}
      {...props}
    >
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 3 15.69 6.34 6.34 0 0 0 9.34 22a6.34 6.34 0 0 0 6.33-6.31V9.07a8.16 8.16 0 0 0 4.92 1.63V7.27a4.85 4.85 0 0 1-1-.58z" />
    </svg>
  );
}

/**
 * Official Instagram Glyph Vector
 */
export function InstagramIcon({ className, variant = "color", ...props }: SocialIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={cn(
        "shrink-0",
        variant === "color" && "text-pink-500",
        className
      )}
      {...props}
    >
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  );
}

export type SupportedSocialPlatform = "youtube" | "tiktok" | "instagram";

export interface SocialPlatformBadgeProps {
  platform: SupportedSocialPlatform;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  withBadge?: boolean;
}

const BADGE_STYLES: Record<SupportedSocialPlatform, {
  container: string;
  iconColor: string;
}> = {
  youtube: {
    container: "bg-red-500/10 border-red-500/25 text-red-500 shadow-[0_0_12px_rgba(239,68,68,0.15)]",
    iconColor: "text-red-500",
  },
  tiktok: {
    container: "bg-cyan-500/10 border-cyan-500/25 text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.15)]",
    iconColor: "text-cyan-400",
  },
  instagram: {
    container: "bg-pink-500/10 border-pink-500/25 text-pink-400 shadow-[0_0_12px_rgba(236,72,153,0.15)]",
    iconColor: "text-pink-400",
  },
};

const SIZE_MAP = {
  sm: {
    box: "h-7 w-7 rounded-lg",
    icon: "h-3.5 w-3.5",
  },
  md: {
    box: "h-9 w-9 rounded-xl",
    icon: "h-4 w-4",
  },
  lg: {
    box: "h-10 w-10 rounded-xl",
    icon: "h-5 w-5",
  },
  xl: {
    box: "h-12 w-12 rounded-2xl",
    icon: "h-6 w-6",
  },
};

/**
 * Universal Platform Icon with optional brand badge container
 */
export function SocialPlatformIcon({
  platform,
  size = "md",
  className,
  withBadge = false,
}: SocialPlatformBadgeProps) {
  const sizeConfig = SIZE_MAP[size] || SIZE_MAP.md;
  const badgeConfig = BADGE_STYLES[platform] || BADGE_STYLES.youtube;

  const renderRawIcon = (iconClass: string) => {
    switch (platform) {
      case "youtube":
        return <YouTubeIcon className={iconClass} variant="color" />;
      case "tiktok":
        return <TikTokIcon className={iconClass} variant="color" />;
      case "instagram":
        return <InstagramIcon className={iconClass} variant="color" />;
      default:
        return null;
    }
  };

  if (!withBadge) {
    return renderRawIcon(cn(sizeConfig.icon, className));
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center border transition-all duration-200",
        sizeConfig.box,
        badgeConfig.container,
        className
      )}
    >
      {renderRawIcon(sizeConfig.icon)}
    </div>
  );
}
