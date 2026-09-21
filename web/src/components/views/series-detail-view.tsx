"use client";

import React, { useState, useEffect } from "react";
import {
  Film,
  ArrowLeft,
  Sparkles,
  BookOpen,
  Calendar,
  Layers,
  Play,
  Download,
  CheckCircle2,
  Clock,
  Edit3,
  Save,
  Loader2,
  Plus,
  Zap,
  Power,
  Radio,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  SeriesItem,
  fetchSeriesDetail,
  updateSeriesBible,
  ShowBible,
  triggerSeriesAutopilotNow,
  toggleSeriesAutopilot,
} from "@/lib/api";
import { YouTubeIcon, TikTokIcon, InstagramIcon } from "@/components/social/social-icons";
import { toast } from "sonner";

interface SeriesDetailViewProps {
  seriesId: string;
  onBack: () => void;
  onStartEpisodeGeneration: (series: { id: string; title: string; nextEpisode: number }) => void;
  onSelectVideoJob?: (jobId: string) => void;
  onOpenSocialModal?: () => void;
}

export function SeriesDetailView({
  seriesId,
  onBack,
  onStartEpisodeGeneration,
  onSelectVideoJob,
}: SeriesDetailViewProps) {
  const [series, setSeries] = useState<SeriesItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditingBible, setIsEditingBible] = useState(false);
  const [isSavingBible, setIsSavingBible] = useState(false);

  // Editable Bible state
  const [editablePremise, setEditablePremise] = useState("");
  const [editableRules, setEditableRules] = useState("");
  const [editableTone, setEditableTone] = useState("");
  const [isTriggeringNow, setIsTriggeringNow] = useState(false);
  const [isTogglingAutopilot, setIsTogglingAutopilot] = useState(false);

  const loadDetail = async () => {
    setIsLoading(true);
    try {
      const data = await fetchSeriesDetail(seriesId);
      setSeries(data);
      if (data.bible_json) {
        setEditablePremise(data.bible_json.premise || "");
        setEditableRules((data.bible_json.world_rules || []).join("\n"));
        setEditableTone(data.bible_json.tone || data.tone || "");
      }
    } catch (err) {
      console.error("Failed to fetch series detail:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDetail();
  }, [seriesId]);

  const handleSaveBible = async () => {
    if (!series) return;
    setIsSavingBible(true);
    try {
      const rules = editableRules
        .split("\n")
        .map((r) => r.trim())
        .filter(Boolean);

      const updated = await updateSeriesBible(series.id, {
        premise: editablePremise.trim(),
        world_rules: rules,
        tone: editableTone.trim(),
      });

      setSeries((prev) => (prev ? { ...prev, bible_json: updated.bible_json, tone: updated.tone } : prev));
      setIsEditingBible(false);
    } catch (err) {
      console.error("Failed to save bible:", err);
    } finally {
      setIsSavingBible(false);
    }
  };

  const handleTriggerNow = async () => {
    if (!series) return;
    setIsTriggeringNow(true);
    try {
      const res = await triggerSeriesAutopilotNow(series.id);
      toast.success(`⚡ Dispatched Episode #${res.job.episode_number}!`, {
        description: `Generating '${res.job.topic?.slice(0, 50)}...' now in background pipeline.`,
      });
      loadDetail();
    } catch (err: any) {
      console.error("Failed to trigger series now:", err);
      toast.error("Episode Trigger Failed", {
        description: err.message || "Failed to trigger episode.",
      });
    } finally {
      setIsTriggeringNow(false);
    }
  };

  const isAutopilot = Boolean(
    series?.autopilot_enabled ?? (series?.bible_json as any)?.autopilot_enabled ?? false
  );

  const handleToggleAutopilot = async () => {
    if (!series) return;
    setIsTogglingAutopilot(true);
    const newStatus = !isAutopilot;
    try {
      await toggleSeriesAutopilot(series.id, newStatus);
      setSeries((prev) => (prev ? { ...prev, autopilot_enabled: newStatus } : prev));
      toast.success(newStatus ? "Autopilot Activated" : "Autopilot Paused");
      loadDetail();
    } catch (err: any) {
      console.error("Failed to toggle autopilot:", err);
      toast.error("Failed to update autopilot status");
    } finally {
      setIsTogglingAutopilot(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-3">
        <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
        <p className="text-xs text-zinc-400">Loading series universe & Show Bible...</p>
      </div>
    );
  }

  if (!series) {
    return (
      <div className="text-center py-16 space-y-4">
        <p className="text-sm text-zinc-400">Series not found.</p>
        <Button onClick={onBack} variant="outline" className="text-xs">
          Return to Series Hub
        </Button>
      </div>
    );
  }

  const nextEpNum = (series.episode_count || 0) + 1;
  const bible = (series.bible_json as any) || {};
  const episodes = series.episodes || [];
  const platforms = series.target_platforms || bible.target_platforms || ["youtube"];
  const frequency = Number(series.post_frequency_per_day ?? bible.post_frequency_per_day ?? 1);
  const preferredTime = String(series.preferred_time_utc ?? bible.preferred_time_utc ?? "18:00");

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Navigation & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-4">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={onBack}
            className="border-white/[0.08] text-zinc-400 hover:text-white h-9 w-9 p-0 rounded-lg"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white">{series.title}</h1>
              {series.genre && (
                <Badge variant="outline" className="border-indigo-500/30 text-indigo-300 text-[10px] py-0 px-2">
                  {series.genre}
                </Badge>
              )}
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              {series.episode_count} canon {series.episode_count === 1 ? "episode" : "episodes"} produced
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* 1-Click Manual Trigger Override Button */}
          <Button
            variant="primary"
            size="sm"
            disabled={isTriggeringNow}
            onClick={handleTriggerNow}
            className="h-9 text-xs font-bold px-3 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-black border-none shadow-[0_0_15px_rgba(245,158,11,0.25)] flex items-center gap-1.5"
            title="1-Click Override: Generate and dispatch the next episode immediately"
          >
            {isTriggeringNow ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-black" />
            ) : (
              <Zap className="w-3.5 h-3.5 text-black fill-black" />
            )}
            <span>{isTriggeringNow ? "Dispatching..." : `Trigger Ep #${nextEpNum} Now`}</span>
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() =>
              onStartEpisodeGeneration({
                id: series.id,
                title: series.title,
                nextEpisode: nextEpNum,
              })
            }
            className="h-9 text-xs font-semibold bg-white/[0.05] border-white/10"
          >
            <Sparkles className="w-3.5 h-3.5 mr-1.5 text-cyan-400" />
            <span>Open Studio</span>
          </Button>
        </div>
      </div>

      {/* Autopilot Scheduling & Multi-Channel Health Banner */}
      <div
        className={`p-4 rounded-2xl border transition-all ${
          isAutopilot
            ? "border-emerald-500/30 bg-gradient-to-r from-emerald-950/30 via-zinc-950 to-zinc-950"
            : "border-white/[0.08] pm-surface"
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              {isAutopilot ? (
                <Badge
                  variant="outline"
                  className="border-emerald-500/40 bg-emerald-950/50 text-emerald-300 text-xs py-0.5 px-2.5 flex items-center gap-1.5 shadow-[0_0_12px_rgba(16,185,129,0.25)] font-semibold"
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span>AUTOPILOT: ACTIVE</span>
                </Badge>
              ) : (
                <Badge variant="outline" className="border-white/10 text-zinc-500 text-xs py-0.5 px-2.5">
                  Manual Creation Mode
                </Badge>
              )}

              <span className="text-xs text-zinc-400 font-mono">
                {frequency}x daily at {preferredTime} UTC
              </span>
            </div>

            <p className="text-xs text-zinc-400 flex items-center gap-1.5 pt-0.5">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>Next Scheduled Post:</span>
              <strong className="text-zinc-200 font-mono">
                {series.next_post_at ? new Date(series.next_post_at).toLocaleString() : "Due Now (Next Hourly Cron)"}
              </strong>
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Publishing Channels */}
            <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-lg border border-white/[0.06]">
              <span className="text-[11px] text-zinc-400">Targets:</span>
              {platforms.includes("youtube") && (
                <YouTubeIcon className="w-4 h-4 text-red-500" title="YouTube Shorts" />
              )}
              {platforms.includes("tiktok") && (
                <TikTokIcon className="w-4 h-4 text-cyan-400" title="TikTok" />
              )}
              {platforms.includes("instagram") && (
                <InstagramIcon className="w-4 h-4 text-pink-400" title="Instagram Reels" />
              )}
            </div>

            {/* Quick Autopilot Toggle */}
            <Button
              variant="outline"
              size="sm"
              disabled={isTogglingAutopilot}
              onClick={handleToggleAutopilot}
              className={`h-8 text-xs font-medium border ${
                isAutopilot
                  ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20"
                  : "border-white/10 text-zinc-300 bg-white/[0.03] hover:border-white/20"
              }`}
            >
              <Power className="w-3.5 h-3.5 mr-1.5" />
              <span>{isAutopilot ? "Pause Autopilot" : "Activate Autopilot"}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Show Bible Section */}
      <div className="p-5 rounded-xl pm-surface border border-white/[0.06] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-semibold text-white">Show Bible & Continuity Memory</h3>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (isEditingBible) handleSaveBible();
              else setIsEditingBible(true);
            }}
            className="text-xs text-indigo-400 hover:text-indigo-300 h-8 px-2.5 rounded-lg"
          >
            {isEditingBible ? (
              <>
                {isSavingBible ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Save className="w-3.5 h-3.5 mr-1" />}
                <span>Save Bible</span>
              </>
            ) : (
              <>
                <Edit3 className="w-3.5 h-3.5 mr-1" />
                <span>Edit Bible</span>
              </>
            )}
          </Button>
        </div>

        {isEditingBible ? (
          <div className="space-y-3 pt-2">
            <div>
              <label className="text-[11px] text-zinc-400 block mb-1">Overarching Premise</label>
              <textarea
                rows={3}
                value={editablePremise}
                onChange={(e) => setEditablePremise(e.target.value)}
                className="w-full bg-[#0c0c0e] border border-white/[0.08] rounded-lg p-3 text-xs text-white focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 resize-none"
              />
            </div>

            <div>
              <label className="text-[11px] text-zinc-400 block mb-1">World Rules & Canon (one per line)</label>
              <textarea
                rows={3}
                value={editableRules}
                onChange={(e) => setEditableRules(e.target.value)}
                className="w-full bg-[#0c0c0e] border border-white/[0.08] rounded-lg p-3 text-xs text-white focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 resize-none"
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5 bg-[#0c0c0e] p-4 rounded-lg border border-white/[0.04]">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-zinc-500">Overarching Premise</span>
              <p className="text-zinc-300 leading-relaxed">
                {bible.premise || "No master premise specified."}
              </p>
            </div>

            <div className="space-y-1.5 bg-[#0c0c0e] p-4 rounded-lg border border-white/[0.04]">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-zinc-500">Canon Rules & Lore</span>
              {bible.world_rules && bible.world_rules.length > 0 ? (
                <ul className="space-y-1 text-zinc-300">
                  {bible.world_rules.map((rule: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-indigo-500">•</span>
                      <span>{rule}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-zinc-500 italic">No specific world rules defined.</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Episode Timeline */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-zinc-400" />
            <h3 className="text-sm font-semibold text-white">Episode Canon Timeline</h3>
          </div>
          <span className="text-xs text-zinc-500">
            {episodes.length} of {series.episode_count} rendered
          </span>
        </div>

        {episodes.length === 0 ? (
          <div className="text-center py-12 rounded-xl pm-surface border border-white/[0.06] space-y-3">
            <Film className="w-8 h-8 text-zinc-600 mx-auto" />
            <p className="text-xs text-zinc-400">No episodes rendered yet for this series.</p>
            <Button
              variant="primary"
              size="sm"
              onClick={() =>
                onStartEpisodeGeneration({
                  id: series.id,
                  title: series.title,
                  nextEpisode: 1,
                })
              }
              className="h-9 text-xs font-semibold px-4"
            >
              Produce Episode #1
            </Button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {episodes.map((ep, idx) => {
              const epNum = ep.episode_number || idx + 1;
              const isDone = ep.status === "completed";
              const videoSrc = ep.video_url
                ? ep.video_url.startsWith("http")
                  ? ep.video_url
                  : `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}${ep.video_url}`
                : null;

              return (
                <div
                  key={ep.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl pm-surface border border-white/[0.06] hover:border-white/[0.12] transition-all gap-3"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold text-xs shrink-0">
                      {epNum}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-semibold text-white truncate">{ep.topic}</h4>
                        <Badge
                          variant="outline"
                          className={`text-[9px] py-0 px-1.5 ${
                            isDone
                              ? "border-emerald-500/30 text-emerald-400"
                              : "border-zinc-700 text-zinc-400"
                          }`}
                        >
                          {ep.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-zinc-500 mt-1">
                        {ep.duration_seconds && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {Math.round(ep.duration_seconds)}s
                          </span>
                        )}
                        <span>
                          {new Date(ep.created_at).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    {videoSrc && isDone && (
                      <a
                        href={videoSrc}
                        download={`ep${epNum}_${ep.topic.slice(0, 20)}.mp4`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs h-8 px-3"
                        >
                          <Download className="w-3 h-3 mr-1.5" />
                          <span>Download</span>
                        </Button>
                      </a>
                    )}

                    {onSelectVideoJob && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => onSelectVideoJob(ep.id)}
                        className="text-xs h-8 px-3"
                      >
                        <Play className="w-3 h-3 mr-1.5" />
                        <span>View</span>
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
