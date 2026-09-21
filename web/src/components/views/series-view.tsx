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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#6c5ce7]" />
              <span>Series Ecosystem & Autopilot Hub</span>
            </h1>
            <Badge
              variant="outline"
              className="text-[10px] font-mono font-semibold bg-purple-50 text-[#6c5ce7] border-purple-200"
            >
              {seriesList.length} {seriesList.length === 1 ? "Universe" : "Universes"}
            </Badge>

            {activeAutopilotCount > 0 && (
              <Badge
                variant="outline"
                className="text-[10px] font-mono font-semibold bg-emerald-50 text-emerald-700 border-emerald-300 flex items-center gap-1.5"
              >
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                </span>
                <span>{activeAutopilotCount} Autopilot Active</span>
              </Badge>
            )}
          </div>
          <p className="text-xs text-slate-500">
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
            className="h-9 text-xs font-semibold border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 transition-all flex items-center gap-1.5 shadow-2xs"
            title="Runs the hourly autopilot scheduler immediately to evaluate due series"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#6c5ce7] ${isDispatchingGlobal ? "animate-spin" : ""}`} />
            <span>{isDispatchingGlobal ? "Evaluating..." : "Run Scheduler"}</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowCreateWizard(true)}
            className="h-9 text-xs font-semibold bg-[#6c5ce7] hover:bg-[#5b4bc4] text-white shadow-xs flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Series Wizard</span>
          </Button>
        </div>
      </div>

      {/* Multi-Channel Social Health Monitor Strip */}
      <div className="rounded-2xl bg-white border border-slate-200/80 p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-purple-50 border border-purple-200 flex items-center justify-center text-[#6c5ce7]">
              <Radio className="w-4 h-4 text-[#6c5ce7] animate-pulse" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <span>Multi-Channel Social Health Monitor</span>
                <span className="text-[10px] font-normal text-slate-400">• Auto-Publishing Channels</span>
              </h2>
              <p className="text-[11px] text-slate-500">
                Connected accounts automatically receive freshly rendered episodes on your autopilot schedule.
              </p>
            </div>
          </div>

          {/* Social Channel Health Badges */}
          <div className="flex flex-wrap items-center gap-2">
            {/* YouTube */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs">
              <YouTubeIcon className="w-4 h-4 text-red-600" />
              <div className="flex flex-col">
                <span className="text-[10px] font-semibold text-slate-700">YouTube Shorts</span>
                <div className="flex items-center gap-1">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      ytAccount ? "bg-emerald-500 animate-pulse" : "bg-amber-400"
                    }`}
                  />
                  <span className="text-[9px] text-slate-500 font-mono">
                    {ytAccount ? ytAccount.account_name || "Connected" : "Disconnected"}
                  </span>
                </div>
              </div>
            </div>

            {/* TikTok */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs">
              <TikTokIcon className="w-4 h-4 text-cyan-600" />
              <div className="flex flex-col">
                <span className="text-[10px] font-semibold text-slate-700">TikTok</span>
                <div className="flex items-center gap-1">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      tiktokAccount ? "bg-emerald-500 animate-pulse" : "bg-slate-300"
                    }`}
                  />
                  <span className="text-[9px] text-slate-500 font-mono">
                    {tiktokAccount ? tiktokAccount.account_name || "Connected" : "Not Linked"}
                  </span>
                </div>
              </div>
            </div>

            {/* Instagram */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs">
              <InstagramIcon className="w-4 h-4 text-pink-600" />
              <div className="flex flex-col">
                <span className="text-[10px] font-semibold text-slate-700">Instagram Reels</span>
                <div className="flex items-center gap-1">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      instagramAccount ? "bg-emerald-500 animate-pulse" : "bg-slate-300"
                    }`}
                  />
                  <span className="text-[9px] text-slate-500 font-mono">
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
                className="h-8 text-[11px] font-medium border-slate-200 hover:bg-slate-100 text-slate-700 hover:text-slate-900 bg-white shadow-2xs"
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
          <Loader2 className="w-6 h-6 text-[#6c5ce7] animate-spin" />
          <p className="text-xs text-slate-500">Loading your series universes & schedules...</p>
        </div>
      ) : seriesList.length === 0 ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-purple-50 border border-purple-200 flex items-center justify-center text-[#6c5ce7]">
            <Clapperboard className="w-7 h-7" />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h3 className="text-base font-bold text-slate-900">No Content Series Universes Yet</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Launch your first automated universe using our 8 pre-engineered viral niche engines. Set it to autopilot, and PostMatic will write, render, and publish episodes while you sleep.
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowCreateWizard(true)}
            className="h-9 text-xs font-semibold px-5 bg-[#6c5ce7] hover:bg-[#5b4bc4] text-white shadow-xs"
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
                className={`group relative bg-white border rounded-2xl p-5 transition-all cursor-pointer flex flex-col justify-between space-y-4 hover:shadow-md ${
                  isAutopilot
                    ? "border-emerald-300 ring-1 ring-emerald-400/20 shadow-2xs"
                    : "border-slate-200/80 hover:border-slate-300 shadow-2xs"
                }`}
              >
                <div className="space-y-3">
                  {/* Top Bar: Niche Tag & Autopilot Status Badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {nicheObj ? (
                        <Badge
                          variant="outline"
                          className="border-purple-200 bg-purple-50 text-[#6c5ce7] text-[10px] py-0.5 px-2 font-medium"
                        >
                          {nicheObj.emoji} {nicheObj.name}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600 text-[10px] py-0.5 px-2 font-medium">
                          {series.genre || "Series"}
                        </Badge>
                      )}

                      {/* Autopilot Status Indicator with Live Pulse */}
                      {isAutopilot ? (
                        <Badge
                          variant="outline"
                          className="border-emerald-300 bg-emerald-50 text-emerald-700 text-[10px] py-0.5 px-2 flex items-center gap-1.5 font-semibold"
                        >
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                          </span>
                          <span className="font-semibold tracking-wide">AUTOPILOT: ACTIVE</span>
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-slate-200 bg-slate-100 text-slate-500 text-[10px] py-0.5 px-2 font-medium">
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
                            ? "bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100"
                            : "bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-100"
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
                        className="text-slate-400 hover:text-rose-500 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                        title="Delete series"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Title & Premise */}
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#6c5ce7] transition-colors truncate">
                      {series.title}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {premise}
                    </p>
                  </div>

                  {/* Autopilot Scheduling & Next Post Card */}
                  <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-2.5 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 flex items-center gap-1 font-medium">
                        <Clock className="w-3 h-3 text-[#6c5ce7]" />
                        <span>Next Scheduled Post:</span>
                      </span>
                      <span className={`font-mono font-medium ${isAutopilot ? "text-emerald-700" : "text-slate-500"}`}>
                        {nextPostFormatted}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-200/60">
                      <span>
                        Cadence: <strong className="text-slate-800 font-semibold">{frequency}x daily</strong> ({preferredTime} UTC)
                      </span>
                      <span className="capitalize text-slate-600 font-mono">
                        {series.art_style || bible.art_style || "Cinematic"}
                      </span>
                    </div>
                  </div>

                  {/* Target Social Channels with Health status */}
                  <div className="flex items-center justify-between pt-0.5">
                    <span className="text-[11px] text-slate-400 font-medium">Publishing Targets:</span>

                    <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-md border border-slate-200">
                      {platforms.includes("youtube") && (
                        <div className="flex items-center gap-0.5" title={ytAccount ? "YouTube Shorts (Connected)" : "YouTube Shorts (Needs Authorization)"}>
                          <YouTubeIcon className="w-3.5 h-3.5 text-red-600" />
                          <span className={`w-1 h-1 rounded-full ${ytAccount ? "bg-emerald-500" : "bg-amber-400"}`} />
                        </div>
                      )}
                      {platforms.includes("tiktok") && (
                        <div className="flex items-center gap-0.5" title={tiktokAccount ? "TikTok (Connected)" : "TikTok (Needs Authorization)"}>
                          <TikTokIcon className="w-3.5 h-3.5 text-cyan-600" />
                          <span className={`w-1 h-1 rounded-full ${tiktokAccount ? "bg-emerald-500" : "bg-amber-400"}`} />
                        </div>
                      )}
                      {platforms.includes("instagram") && (
                        <div className="flex items-center gap-0.5" title={instagramAccount ? "Instagram Reels (Connected)" : "Instagram Reels (Needs Authorization)"}>
                          <InstagramIcon className="w-3.5 h-3.5 text-pink-600" />
                          <span className={`w-1 h-1 rounded-full ${instagramAccount ? "bg-emerald-500" : "bg-amber-400"}`} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer: Episode Count & 1-Click Manual Trigger Override */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono">
                    <Layers className="w-3.5 h-3.5 text-[#6c5ce7]" />
                    <span>{series.episode_count} {series.episode_count === 1 ? "Episode" : "Episodes"}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* 1-Click Manual Trigger Override */}
                    <Button
                      size="sm"
                      variant="primary"
                      disabled={isTriggeringThis}
                      onClick={(e) => handleTriggerSeriesNow(series.id, series.title, e)}
                      className="h-7 text-[11px] font-semibold px-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg shadow-xs flex items-center gap-1 transition-all"
                      title="1-Click Override: Generate and dispatch the next episode immediately"
                    >
                      {isTriggeringThis ? (
                        <Loader2 className="w-3 h-3 animate-spin text-white" />
                      ) : (
                        <Zap className="w-3 h-3 text-white fill-white" />
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
                      className="h-7 text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 px-2 rounded-lg"
                      title="Open in Studio to manually craft episode prompt"
                    >
                      <Sparkles className="w-3 h-3 text-[#6c5ce7]" />
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
