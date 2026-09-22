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
          "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors duration-150",
          isActive
            ? "bg-purple-50 text-[#6c5ce7] font-semibold"
            : "text-slate-700 hover:text-slate-900 hover:bg-slate-50 font-medium"
        )}
      >
        <div className="flex items-center gap-2.5">
          {/* Active indicator bar */}
          <span
            className={cn(
              "w-1 h-4 rounded-full transition-all duration-200",
              isActive ? "bg-[#6c5ce7]" : "bg-transparent"
            )}
          />
          <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-[#6c5ce7]" : "text-slate-500")} />
          <span>{item.label}</span>
        </div>
        {item.badge && (
          <span
            className={cn(
              "text-[11px] font-mono tabular-nums px-2 py-0.5 rounded-full font-semibold",
              item.badgeType === "live"
                ? "bg-amber-50 text-amber-700 border border-amber-200"
                : "bg-slate-100 text-slate-700 font-bold border border-slate-200"
            )}
          >
            {item.badge}
          </span>
        )}
      </button>
    );
  };

  return (
    <aside className="w-56 shrink-0 border-r border-slate-200/80 bg-white flex flex-col hidden md:flex min-h-[calc(100vh-3.5rem)]">
      <div className="flex-1 py-4 px-3 space-y-6 overflow-y-auto">
        {/* Primary: Create */}
        <div>
          <p className="px-3 mb-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Create
          </p>
          <nav className="space-y-0.5">
            {primaryNav.map(renderNavItem)}
          </nav>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-200/60" />

        {/* Secondary: Manage */}
        <div>
          <p className="px-3 mb-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Manage
          </p>
          <nav className="space-y-0.5">
            {secondaryNav.map(renderNavItem)}
          </nav>
        </div>
      </div>

      {/* Bottom: Settings */}
      <div className="p-3 border-t border-slate-200/60">
        <button
          type="button"
          onClick={() => onViewChange("settings")}
          className={cn(
            "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors duration-150",
            activeView === "settings"
              ? "bg-purple-50 text-[#6c5ce7] font-semibold"
              : "text-slate-700 hover:text-slate-900 hover:bg-slate-50 font-medium"
          )}
        >
          <span
            className={cn(
              "w-1 h-4 rounded-full transition-all duration-200",
              activeView === "settings" ? "bg-[#6c5ce7]" : "bg-transparent"
            )}
          />
          <Settings className={cn("h-4 w-4 shrink-0", activeView === "settings" ? "text-[#6c5ce7]" : "text-slate-500")} />
          <span>Settings</span>
        </button>
      </div>
    </aside>
  );
}

