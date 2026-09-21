"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Film,
  Plus,
  Play,
  Sparkles,
  BookOpen,
  Trash2,
  Calendar,
  Layers,
  ChevronRight,
  Loader2,
  AlertCircle,
  Clapperboard,
  Zap,
  Clock,
  Radio,
  RefreshCw,
  Power,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  ShieldCheck,
  Flame,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  SeriesItem,
  fetchUserSeries,
  deleteSeries,
  getConnectedSocialAccounts,
  SocialAccount,
  triggerAutopilotDispatch,
  triggerSeriesAutopilotNow,
  toggleSeriesAutopilot,
} from "@/lib/api";
import { CreateSeriesWizard, VIRAL_NICHES } from "@/components/views/create-series-wizard";
import { YouTubeIcon, TikTokIcon, InstagramIcon } from "@/components/social/social-icons";
import { toast } from "sonner";

interface SeriesViewProps {
  userId?: string;
  onSelectSeriesDetail: (seriesId: string) => void;
  onStartEpisodeGeneration: (series: { id: string; title: string; nextEpisode: number }) => void;
  onOpenSocialModal?: () => void;
}

function formatNextPost(nextPostAt?: string | null, isAutopilot?: boolean): string {
  if (!isAutopilot) return "Manual Only";
  if (!nextPostAt) return "Due Now (Next Hourly Cron)";
  try {
    const postDate = new Date(nextPostAt);
    const now = new Date();
    const diffMs = postDate.getTime() - now.getTime();
    if (diffMs <= 0) return "Due Now (Next Hourly Cron)";

    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffHours === 0) {
      return `In ${diffMinutes}m (${postDate.toISOString().slice(11, 16)} UTC)`;
    }
    return `In ${diffHours}h ${diffMinutes}m (${postDate.toISOString().slice(11, 16)} UTC)`;
  } catch {
    return nextPostAt;
  }
}

export function SeriesView({
  userId,
  onSelectSeriesDetail,
  onStartEpisodeGeneration,
  onOpenSocialModal,
}: SeriesViewProps) {
  const [seriesList, setSeriesList] = useState<SeriesItem[]>([]);
  const [socialAccounts, setSocialAccounts] = useState<SocialAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDispatchingGlobal, setIsDispatchingGlobal] = useState(false);
  const [triggeringSeriesId, setTriggeringSeriesId] = useState<string | null>(null);
  const [togglingSeriesId, setTogglingSeriesId] = useState<string | null>(null);
  const [showCreateWizard, setShowCreateWizard] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [seriesData, accountsData] = await Promise.all([
        fetchUserSeries(userId),
        getConnectedSocialAccounts(userId).catch(() => []),
      ]);
      setSeriesList(seriesData);
      setSocialAccounts(accountsData);
    } catch (err) {
      console.error("Failed to fetch series data:", err);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Global Autopilot Dispatch Trigger
  const handleGlobalDispatch = async () => {
    setIsDispatchingGlobal(true);
    try {
      const res = await triggerAutopilotDispatch();
      toast.success("Autopilot Evaluator Complete", {
        description: `Checked ${res.checked_count} series, dispatched ${res.dispatched_count} video generation jobs.`,
      });
      loadData();
    } catch (err: any) {
      console.error("Autopilot dispatch failed:", err);
      toast.error("Dispatch Failed", {
        description: err.message || "Could not trigger hourly autopilot scheduler.",
      });
    } finally {
      setIsDispatchingGlobal(false);
    }
  };

  // 1-Click Manual Trigger Override for a specific series
  const handleTriggerSeriesNow = async (seriesId: string, seriesTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setTriggeringSeriesId(seriesId);
    try {
      const res = await triggerSeriesAutopilotNow(seriesId);
      toast.success(`⚡ Dispatched Episode #${res.job.episode_number}!`, {
        description: `Generating '${res.job.topic?.slice(0, 50)}...' now in background pipeline.`,
      });
      loadData();
    } catch (err: any) {
      console.error("Failed to trigger series now:", err);
      toast.error("Episode Trigger Failed", {
        description: err.message || "Failed to trigger episode for this series.",
      });
    } finally {
      setTriggeringSeriesId(null);
    }
  };

  // 1-Click Quick Autopilot Toggle
  const handleToggleAutopilot = async (seriesId: string, currentEnabled: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    setTogglingSeriesId(seriesId);
    const newStatus = !currentEnabled;
    try {
      await toggleSeriesAutopilot(seriesId, newStatus);
      setSeriesList((prev) =>
        prev.map((s) => (s.id === seriesId ? { ...s, autopilot_enabled: newStatus } : s))
      );
      toast.success(newStatus ? "Autopilot Activated" : "Autopilot Paused", {
        description: newStatus
          ? "Daily automated generation and publishing is now active."
          : "Series switched to manual creation mode.",
      });
      loadData();
    } catch (err: any) {
      console.error("Failed to toggle autopilot:", err);
      toast.error("Failed to update autopilot status");
    } finally {
      setTogglingSeriesId(null);
    }
  };

  const handleDeleteSeries = async (seriesId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this series? Existing rendered episodes will remain in your library.")) {
      return;
    }

    try {
      await deleteSeries(seriesId);
      setSeriesList(seriesList.filter((s) => s.id !== seriesId));
      toast.success("Series deleted");
    } catch (err) {
      console.error("Error deleting series:", err);
      toast.error("Failed to delete series");
    }
  };

  const handleSeriesCreated = (newSeries: SeriesItem) => {
    setSeriesList([newSeries, ...seriesList]);
    setShowCreateWizard(false);
  };

  // Social account connection checkers
  const ytAccount = socialAccounts.find((a) => a.platform.toLowerCase() === "youtube");
  const tiktokAccount = socialAccounts.find((a) => a.platform.toLowerCase() === "tiktok");
  const instagramAccount = socialAccounts.find((a) => a.platform.toLowerCase() === "instagram");

  const activeAutopilotCount = seriesList.filter(
    (s) => (s.autopilot_enabled ?? (s.bible_json as any)?.autopilot_enabled ?? false)
  ).length;

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Top Header & Mission Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-cyan-400" />
              <span>Series Ecosystem & Autopilot Hub</span>
            </h1>
            <Badge
              variant="outline"
              className="text-[10px] font-mono font-semibold bg-cyan-500/10 text-cyan-300 border-cyan-500/30"
            >
              {seriesList.length} {seriesList.length === 1 ? "Universe" : "Universes"}
            </Badge>

            {activeAutopilotCount > 0 && (
              <Badge
                variant="outline"
                className="text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border-emerald-500/30 flex items-center gap-1.5"
              >
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                </span>
                <span>{activeAutopilotCount} Autopilot Active</span>
              </Badge>
            )}
          </div>
          <p className="text-xs text-zinc-400">
            Autonomous multi-episode content universes with Show Bibles, viral niche pacing, and automated daily publishing while you sleep.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleGlobalDispatch}
            disabled={isDispatchingGlobal || seriesList.length === 0}
            className="h-9 text-xs font-semibold border-white/10 bg-white/[0.03] hover:bg-cyan-500/10 hover:border-cyan-500/40 text-zinc-200 transition-all flex items-center gap-1.5"
            title="Runs the hourly autopilot scheduler immediately to evaluate due series"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isDispatchingGlobal ? "animate-spin" : ""}`} />
            <span>{isDispatchingGlobal ? "Evaluating..." : "Run Scheduler"}</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowCreateWizard(true)}
            className="h-9 text-xs font-semibold bg-gradient-to-r from-cyan-400 via-indigo-500 to-purple-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.25)] hover:opacity-95 flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Series Wizard</span>
          </Button>
        </div>
      </div>

      {/* Multi-Channel Social Health Monitor Strip */}
      <div className="rounded-2xl pm-surface border border-white/[0.08] p-4 bg-gradient-to-r from-zinc-950 via-zinc-900/60 to-zinc-950">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>Multi-Channel Social Health Monitor</span>
                <span className="text-[10px] font-normal text-zinc-500">• Auto-Publishing Channels</span>
              </h2>
              <p className="text-[11px] text-zinc-400">
                Connected accounts automatically receive freshly rendered episodes on your autopilot schedule.
              </p>
            </div>
          </div>

          {/* Social Channel Health Badges */}
          <div className="flex flex-wrap items-center gap-2">
            {/* YouTube */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/40 border border-white/[0.06] text-xs">
              <YouTubeIcon className="w-4 h-4 text-red-500" />
              <div className="flex flex-col">
                <span className="text-[10px] font-semibold text-zinc-300">YouTube Shorts</span>
                <div className="flex items-center gap-1">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      ytAccount ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
                    }`}
                  />
                  <span className="text-[9px] text-zinc-400 font-mono">
                    {ytAccount ? ytAccount.account_name || "Connected" : "Disconnected"}
                  </span>
                </div>
              </div>
            </div>

            {/* TikTok */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/40 border border-white/[0.06] text-xs">
              <TikTokIcon className="w-4 h-4 text-cyan-400" />
              <div className="flex flex-col">
                <span className="text-[10px] font-semibold text-zinc-300">TikTok</span>
                <div className="flex items-center gap-1">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      tiktokAccount ? "bg-emerald-400 animate-pulse" : "bg-zinc-600"
                    }`}
                  />
                  <span className="text-[9px] text-zinc-400 font-mono">
                    {tiktokAccount ? tiktokAccount.account_name || "Connected" : "Not Linked"}
                  </span>
                </div>
              </div>
            </div>

            {/* Instagram */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/40 border border-white/[0.06] text-xs">
              <InstagramIcon className="w-4 h-4 text-pink-400" />
              <div className="flex flex-col">
                <span className="text-[10px] font-semibold text-zinc-300">Instagram Reels</span>
                <div className="flex items-center gap-1">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      instagramAccount ? "bg-emerald-400 animate-pulse" : "bg-zinc-600"
                    }`}
                  />
                  <span className="text-[9px] text-zinc-400 font-mono">
                    {instagramAccount ? instagramAccount.account_name || "Connected" : "Not Linked"}
                  </span>
                </div>
              </div>
            </div>

            {onOpenSocialModal && (
              <Button
                variant="outline"
                size="sm"
                onClick={onOpenSocialModal}
                className="h-8 text-[11px] font-medium border-white/10 hover:border-cyan-500/30 text-zinc-300 hover:text-white bg-white/[0.02]"
              >
                <span>Manage Accounts</span>
                <ChevronRight className="w-3 h-3 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Series Grid */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
          <p className="text-xs text-zinc-400">Loading your series universes & schedules...</p>
        </div>
      ) : seriesList.length === 0 ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-2xl pm-surface border border-white/[0.08] space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Clapperboard className="w-7 h-7" />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h3 className="text-base font-bold text-white">No Content Series Universes Yet</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Launch your first automated universe using our 8 pre-engineered viral niche engines. Set it to autopilot, and PostMatic will write, render, and publish episodes while you sleep.
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowCreateWizard(true)}
            className="h-9 text-xs font-semibold px-5 bg-gradient-to-r from-cyan-400 to-indigo-500 text-black shadow-lg"
          >
            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
            <span>Launch Your First Series</span>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {seriesList.map((series) => {
            const nextEp = (series.episode_count || 0) + 1;
            const bible = (series.bible_json as any) || {};
            const premise = bible.premise || "No premise defined yet.";
            const nicheId = series.niche || bible.niche || "scary_stories";
            const nicheObj = VIRAL_NICHES.find((n) => n.id === nicheId);
            const isAutopilot = Boolean(series.autopilot_enabled ?? bible.autopilot_enabled ?? false);
            const frequency = Number(series.post_frequency_per_day ?? bible.post_frequency_per_day ?? 1);
            const preferredTime = String(series.preferred_time_utc ?? bible.preferred_time_utc ?? "18:00");
            const platforms = series.target_platforms || bible.target_platforms || ["youtube"];
            const nextPostFormatted = formatNextPost(series.next_post_at ?? bible.next_post_at, isAutopilot);

            const isTriggeringThis = triggeringSeriesId === series.id;
            const isTogglingThis = togglingSeriesId === series.id;

            return (
              <div
                key={series.id}
                onClick={() => onSelectSeriesDetail(series.id)}
                className={`group relative pm-surface border rounded-2xl p-5 transition-all cursor-pointer flex flex-col justify-between space-y-4 hover:shadow-[0_0_30px_rgba(6,182,212,0.12)] ${
                  isAutopilot
                    ? "border-emerald-500/30 hover:border-emerald-400/50 bg-gradient-to-b from-emerald-950/[0.08] to-transparent"
                    : "border-white/[0.08] hover:border-cyan-500/40"
                }`}
              >
                <div className="space-y-3">
                  {/* Top Bar: Niche Tag & Autopilot Status Badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {nicheObj ? (
                        <Badge
                          variant="outline"
                          className="border-cyan-500/30 bg-cyan-950/20 text-cyan-300 text-[10px] py-0.5 px-2 font-medium"
                        >
                          {nicheObj.emoji} {nicheObj.name}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-white/10 text-zinc-400 text-[10px] py-0.5 px-2">
                          {series.genre || "Series"}
                        </Badge>
                      )}

                      {/* Autopilot Status Indicator with Live Pulse */}
                      {isAutopilot ? (
                        <Badge
                          variant="outline"
                          className="border-emerald-500/40 bg-emerald-950/40 text-emerald-300 text-[10px] py-0.5 px-2 flex items-center gap-1.5 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                        >
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                          </span>
                          <span className="font-semibold tracking-wide">AUTOPILOT: ACTIVE</span>
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-white/[0.06] bg-zinc-900/60 text-zinc-500 text-[10px] py-0.5 px-2">
                          Manual Mode
                        </Badge>
                      )}
                    </div>

                    {/* Actions: Quick Autopilot Toggle & Delete */}
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => handleToggleAutopilot(series.id, isAutopilot, e)}
                        disabled={isTogglingThis}
                        className={`p-1.5 rounded-lg border transition-all text-xs flex items-center ${
                          isAutopilot
                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
                            : "bg-white/[0.03] border-white/10 text-zinc-400 hover:text-white hover:border-white/20"
                        }`}
                        title={isAutopilot ? "Pause Autopilot" : "Activate Autopilot"}
                      >
                        {isTogglingThis ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Power className="w-3 h-3" />
                        )}
                      </button>

                      <button
                        onClick={(e) => handleDeleteSeries(series.id, e)}
                        className="text-zinc-600 hover:text-red-400 p-1.5 rounded-lg hover:bg-white/[0.04] transition-colors"
                        title="Delete series"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Title & Premise */}
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors truncate">
                      {series.title}
                    </h3>
                    <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                      {premise}
                    </p>
                  </div>

                  {/* Autopilot Scheduling & Next Post Card */}
                  <div className="rounded-xl bg-black/40 border border-white/[0.06] p-2.5 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-zinc-500 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-cyan-400" />
                        <span>Next Scheduled Post:</span>
                      </span>
                      <span className={`font-mono font-medium ${isAutopilot ? "text-cyan-300" : "text-zinc-500"}`}>
                        {nextPostFormatted}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-1 border-t border-white/[0.04]">
                      <span>
                        Cadence: <strong className="text-zinc-300 font-semibold">{frequency}x daily</strong> ({preferredTime} UTC)
                      </span>
                      <span className="capitalize text-zinc-400 font-mono">
                        {series.art_style || bible.art_style || "Cinematic"}
                      </span>
                    </div>
                  </div>

                  {/* Target Social Channels with Health status */}
                  <div className="flex items-center justify-between pt-0.5">
                    <span className="text-[11px] text-zinc-500">Publishing Targets:</span>

                    <div className="flex items-center gap-1.5 bg-black/50 px-2 py-1 rounded-md border border-white/[0.06]">
                      {platforms.includes("youtube") && (
                        <div className="flex items-center gap-0.5" title={ytAccount ? "YouTube Shorts (Connected)" : "YouTube Shorts (Needs Authorization)"}>
                          <YouTubeIcon className="w-3.5 h-3.5 text-red-500" />
                          <span className={`w-1 h-1 rounded-full ${ytAccount ? "bg-emerald-400" : "bg-amber-400"}`} />
                        </div>
                      )}
                      {platforms.includes("tiktok") && (
                        <div className="flex items-center gap-0.5" title={tiktokAccount ? "TikTok (Connected)" : "TikTok (Needs Authorization)"}>
                          <TikTokIcon className="w-3.5 h-3.5 text-cyan-400" />
                          <span className={`w-1 h-1 rounded-full ${tiktokAccount ? "bg-emerald-400" : "bg-amber-400"}`} />
                        </div>
                      )}
                      {platforms.includes("instagram") && (
                        <div className="flex items-center gap-0.5" title={instagramAccount ? "Instagram Reels (Connected)" : "Instagram Reels (Needs Authorization)"}>
                          <InstagramIcon className="w-3.5 h-3.5 text-pink-400" />
                          <span className={`w-1 h-1 rounded-full ${instagramAccount ? "bg-emerald-400" : "bg-amber-400"}`} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer: Episode Count & 1-Click Manual Trigger Override */}
                <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between gap-2" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-mono">
                    <Layers className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{series.episode_count} {series.episode_count === 1 ? "Episode" : "Episodes"}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* 1-Click Manual Trigger Override */}
                    <Button
                      size="sm"
                      variant="primary"
                      disabled={isTriggeringThis}
                      onClick={(e) => handleTriggerSeriesNow(series.id, series.title, e)}
                      className="h-7 text-[11px] font-bold px-2.5 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-black border-none shadow-[0_0_12px_rgba(245,158,11,0.25)] flex items-center gap-1 transition-all"
                      title="1-Click Override: Generate and dispatch the next episode immediately"
                    >
                      {isTriggeringThis ? (
                        <Loader2 className="w-3 h-3 animate-spin text-black" />
                      ) : (
                        <Zap className="w-3 h-3 text-black fill-black" />
                      )}
                      <span>{isTriggeringThis ? "Generating..." : `Trigger Ep #${nextEp}`}</span>
                    </Button>

                    {/* Open in Studio Console */}
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() =>
                        onStartEpisodeGeneration({
                          id: series.id,
                          title: series.title,
                          nextEpisode: nextEp,
                        })
                      }
                      className="h-7 text-[11px] font-semibold bg-white/[0.05] hover:bg-white/[0.1] text-zinc-300 border border-white/10 px-2"
                      title="Open in Studio to manually craft episode prompt"
                    >
                      <Sparkles className="w-3 h-3 text-cyan-400" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 3-Step Create Series Wizard Modal */}
      <CreateSeriesWizard
        userId={userId}
        isOpen={showCreateWizard}
        onClose={() => setShowCreateWizard(false)}
        onSeriesCreated={handleSeriesCreated}
      />
    </div>
  );
}
