"use client";

import React from "react";
import {
  Video,
  Layers,
  Share2,
  Terminal,
  Settings,
  PlusCircle,
  Cpu,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type ActiveWorkspaceView =
  | "studio"
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
  const navItems: NavItem[] = [
    { id: "studio", label: "Studio Console", icon: PlusCircle },
    {
      id: "library",
      label: "Render Library",
      icon: Video,
      badge: completedJobsCount > 0 ? String(completedJobsCount) : undefined,
      badgeType: "count",
    },
    {
      id: "queue",
      label: "Job Queue",
      icon: Layers,
      badge: activeJobsCount > 0 ? `${activeJobsCount} Active` : undefined,
      badgeType: activeJobsCount > 0 ? "live" : undefined,
    },
    { id: "social", label: "Social Accounts", icon: Share2 },
    { id: "logs", label: "Engine Logs", icon: Terminal },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <aside className="w-64 shrink-0 border-r border-white/[0.08] bg-[#090b0e] flex flex-col justify-between hidden md:flex min-h-[calc(100vh-4rem)] p-4">
      <div className="space-y-6">
        {/* Navigation Section */}
        <div className="space-y-1">
          <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-2">
            Workspaces
          </p>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onViewChange(item.id)}
                  className={cn(
                    "w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all group",
                    isActive
                      ? "bg-amber-500/10 text-white font-semibold border border-amber-500/30 shadow-md shadow-amber-500/5"
                      : "text-zinc-400 hover:bg-white/[0.04] hover:text-white"
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon
                      className={cn(
                        "h-4 w-4 transition-colors",
                        isActive
                          ? "text-amber-400"
                          : "text-zinc-500 group-hover:text-zinc-300"
                      )}
                    />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={cn(
                        "text-[10px] font-mono px-2 py-0.5 rounded-full font-medium",
                        item.badgeType === "live"
                          ? "bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse font-semibold"
                          : "bg-white/[0.06] text-zinc-300 border border-white/[0.08]"
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Creator Channel & Cloud Quota Card */}
      <div className="creator-surface rounded-2xl p-4 space-y-3 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-400" />
            <span className="text-xs font-semibold text-white">Creator Studio</span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20">
            Free Tier
          </span>
        </div>
        <div className="space-y-1.5 text-[11px] text-zinc-400">
          <div className="flex justify-between">
            <span>Resolution</span>
            <span className="font-semibold text-zinc-300">1080x1920 HD</span>
          </div>
          <div className="flex justify-between">
            <span>Cloud Compute</span>
            <span className="font-semibold text-emerald-400">Unlimited Free</span>
          </div>
          <div className="flex justify-between">
            <span>Direct Publishing</span>
            <span className="font-semibold text-zinc-300">YouTube Shorts</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
