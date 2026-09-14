"use client";

import React from "react";
import {
  Video,
  Layers,
  Share2,
  Terminal,
  Settings,
  Sparkles,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type ActiveWorkspaceView =
  | "studio"
  | "series"
  | "library"
  | "queue"
  | "social"
  | "logs"
  | "settings";

interface NavItem {
  id: ActiveWorkspaceView;
  label: string;
  icon: React.ElementType;
  badge?: string;
  badgeType?: "live" | "count";
}

interface SidebarProps {
  activeView: ActiveWorkspaceView;
  onViewChange: (view: ActiveWorkspaceView) => void;
  activeJobsCount?: number;
  completedJobsCount?: number;
}

export function Sidebar({
  activeView,
  onViewChange,
  activeJobsCount = 0,
  completedJobsCount = 0,
}: SidebarProps) {
  const primaryNav: NavItem[] = [
    { id: "studio", label: "Studio", icon: Sparkles },
    { id: "series", label: "Series", icon: BookOpen },
  ];

  const secondaryNav: NavItem[] = [
    {
      id: "library",
      label: "Library",
      icon: Video,
      badge: completedJobsCount > 0 ? String(completedJobsCount) : undefined,
      badgeType: "count",
    },
    {
      id: "queue",
      label: "Queue",
      icon: Layers,
      badge: activeJobsCount > 0 ? String(activeJobsCount) : undefined,
      badgeType: activeJobsCount > 0 ? "live" : undefined,
    },
    { id: "social", label: "Channels", icon: Share2 },
    { id: "logs", label: "Logs", icon: Terminal },
  ];

  const renderNavItem = (item: NavItem) => {
    const Icon = item.icon;
    const isActive = activeView === item.id;

    return (
      <button
        key={item.id}
        type="button"
        onClick={() => onViewChange(item.id)}
        className={cn(
          "w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors duration-150",
          isActive
            ? "bg-white/[0.06] text-white font-medium"
            : "text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.03]"
        )}
      >
        <div className="flex items-center gap-2.5">
          {/* Active indicator bar */}
          <span
            className={cn(
              "w-0.5 h-4 rounded-full transition-all duration-200",
              isActive ? "bg-indigo-500" : "bg-transparent"
            )}
          />
          <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-white" : "text-zinc-500")} />
          <span>{item.label}</span>
        </div>
        {item.badge && (
          <span
            className={cn(
              "text-[11px] font-mono tabular-nums px-1.5 py-0.5 rounded",
              item.badgeType === "live"
                ? "bg-amber-500/15 text-amber-400"
                : "bg-white/[0.06] text-zinc-400"
            )}
          >
            {item.badge}
          </span>
        )}
      </button>
    );
  };

  return (
    <aside className="w-52 shrink-0 border-r border-white/[0.05] bg-[#0c0c0e] flex flex-col hidden md:flex min-h-[calc(100vh-3.5rem)]">
      <div className="flex-1 py-4 px-3 space-y-6 overflow-y-auto">
        {/* Primary: Create */}
        <div>
          <p className="px-3 mb-1 text-[11px] font-medium text-zinc-600 uppercase tracking-wider">
            Create
          </p>
          <nav className="space-y-0.5">
            {primaryNav.map(renderNavItem)}
          </nav>
        </div>

        {/* Divider */}
        <div className="border-t border-white/[0.05]" />

        {/* Secondary: Manage */}
        <div>
          <p className="px-3 mb-1 text-[11px] font-medium text-zinc-600 uppercase tracking-wider">
            Manage
          </p>
          <nav className="space-y-0.5">
            {secondaryNav.map(renderNavItem)}
          </nav>
        </div>
      </div>

      {/* Bottom: Settings */}
      <div className="p-3 border-t border-white/[0.05]">
        <button
          type="button"
          onClick={() => onViewChange("settings")}
          className={cn(
            "w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors duration-150",
            activeView === "settings"
              ? "bg-white/[0.06] text-white font-medium"
              : "text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.03]"
          )}
        >
          <span
            className={cn(
              "w-0.5 h-4 rounded-full transition-all duration-200",
              activeView === "settings" ? "bg-indigo-500" : "bg-transparent"
            )}
          />
          <Settings className="h-4 w-4 shrink-0" />
          <span>Settings</span>
        </button>
      </div>
    </aside>
  );
}

