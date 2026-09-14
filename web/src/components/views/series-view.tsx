"use client";

import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  SeriesItem,
  fetchUserSeries,
  createSeries,
  deleteSeries,
} from "@/lib/api";

interface SeriesViewProps {
  userId?: string;
  onSelectSeriesDetail: (seriesId: string) => void;
  onStartEpisodeGeneration: (series: { id: string; title: string; nextEpisode: number }) => void;
}

export function SeriesView({
  userId,
  onSelectSeriesDetail,
  onStartEpisodeGeneration,
}: SeriesViewProps) {
  const [seriesList, setSeriesList] = useState<SeriesItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New series form state
  const [newTitle, setNewTitle] = useState("");
  const [newGenre, setNewGenre] = useState("Historical");
  const [newTone, setNewTone] = useState("Cinematic & Dramatic");
  const [newPremise, setNewPremise] = useState("");
  const [newWorldRules, setNewWorldRules] = useState("");

  const loadSeries = async () => {
    setIsLoading(true);
    try {
      const data = await fetchUserSeries(userId);
      setSeriesList(data);
    } catch (err) {
      console.error("Failed to fetch series:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSeries();
  }, [userId]);

  const handleCreateSeries = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setIsCreating(true);
    try {
      const rules = newWorldRules
        .split("\n")
        .map((r) => r.trim())
        .filter(Boolean);

      const created = await createSeries({
        user_id: userId || "anonymous",
        title: newTitle.trim(),
        genre: newGenre,
        tone: newTone,
        premise: newPremise.trim() || undefined,
        world_rules: rules.length > 0 ? rules : undefined,
      });

      setSeriesList([created, ...seriesList]);
      setShowCreateModal(false);
      setNewTitle("");
      setNewPremise("");
      setNewWorldRules("");
    } catch (err) {
      console.error("Error creating series:", err);
    } finally {
      setIsCreating(false);
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
    } catch (err) {
      console.error("Error deleting series:", err);
    }
  };

  const applyPreset = (preset: {
    title: string;
    genre: string;
    tone: string;
    premise: string;
    rules: string;
  }) => {
    setNewTitle(preset.title);
    setNewGenre(preset.genre);
    setNewTone(preset.tone);
    setNewPremise(preset.premise);
    setNewWorldRules(preset.rules);
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-5">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2.5">
            <Film className="w-5 h-5 text-indigo-400" />
            <span>Series Ecosystem</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Produce multi-episode content universes with autonomous AI continuity, Show Bibles, and persistent lore.
          </p>
        </div>

        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold h-9 px-4 rounded-md flex items-center gap-2 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>New Series</span>
        </Button>
      </div>

      {/* Series Grid */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
          <p className="text-xs text-zinc-400">Loading your series universes...</p>
        </div>
      ) : seriesList.length === 0 ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-lg bg-[#111115] border border-white/[0.04] space-y-4">
          <div className="w-12 h-12 rounded-full bg-indigo-950/40 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Clapperboard className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-white">No Content Series Yet</h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              Create your first series to link videos into serialized narrative arcs. The AI will remember every episode's events and characters.
            </p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2"
          >
            Create Your First Series
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {seriesList.map((series) => {
            const nextEp = (series.episode_count || 0) + 1;
            const premise = series.bible_json?.premise || "No premise defined yet.";

            return (
              <div
                key={series.id}
                onClick={() => onSelectSeriesDetail(series.id)}
                className="group relative bg-[#111115] hover:bg-[#141419] border border-white/[0.05] hover:border-indigo-500/40 rounded-lg p-5 transition-all cursor-pointer flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1 min-w-0">
                      <h3 className="text-sm font-semibold text-white group-hover:text-indigo-300 transition-colors truncate">
                        {series.title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {series.genre && (
                          <Badge variant="outline" className="border-white/[0.08] text-zinc-400 text-[10px] py-0 px-1.5">
                            {series.genre}
                          </Badge>
                        )}
                        {series.tone && (
                          <Badge variant="outline" className="border-white/[0.08] text-zinc-500 text-[10px] py-0 px-1.5">
                            {series.tone}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={(e) => handleDeleteSeries(series.id, e)}
                      className="text-zinc-600 hover:text-red-400 p-1 rounded transition-colors"
                      title="Delete series"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                    {premise}
                  </p>
                </div>

                <div className="pt-2 border-t border-white/[0.04] flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                    <Layers className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{series.episode_count} {series.episode_count === 1 ? "Episode" : "Episodes"}</span>
                  </div>

                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onStartEpisodeGeneration({
                        id: series.id,
                        title: series.title,
                        nextEpisode: nextEp,
                      });
                    }}
                    className="h-7 text-[11px] bg-white/[0.06] hover:bg-indigo-600 text-zinc-200 hover:text-white border border-white/[0.06] hover:border-transparent transition-all flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Next Ep #{nextEp}</span>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Series Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-[#111115] border border-white/[0.08] rounded-xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <div>
                <h3 className="text-sm font-semibold text-white">Create New Series</h3>
                <p className="text-xs text-zinc-400">Initialize a serialized narrative universe with a Show Bible.</p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-zinc-500 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            {/* Presets */}
            <div className="space-y-1.5">
              <label className="text-[11px] text-zinc-500 uppercase tracking-wider font-semibold block">
                Quick Idea Presets
              </label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  {
                    title: "Ancient Mysteries & Lost Relics",
                    genre: "Historical",
                    tone: "Investigative & Atmospheric",
                    premise: "Chronicles forgotten civilizations, unsolved artifacts, and hidden excavations throughout history.",
                    rules: "No fantasy magic — ground all claims in real archaeological mysteries.\nEvery episode concludes with an open unanswered question.",
                  },
                  {
                    title: "Rogue AI Chrono-Files",
                    genre: "Sci-Fi",
                    tone: "Fast-Paced & Cyberpunk",
                    premise: "An autonomous agent uncovers secret corporate tech conspiracies in the year 2048.",
                    rules: "Hardware terminology must be grounded in actual quantum computing.\nProtagonist always narrates in first-person log style.",
                  },
                  {
                    title: "The Billionaire Playbook",
                    genre: "Business & Finance",
                    tone: "Sharp & Analytical",
                    premise: "Breakdowns of counter-intuitive moves made by titan founders during market crises.",
                    rules: "Focus on psychology, asymmetric bets, and tactical pivots.",
                  },
                ].map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => applyPreset(preset)}
                    className="text-[11px] py-1 px-2.5 rounded bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white border border-white/[0.04] transition-all"
                  >
                    {preset.title.split("&")[0].trim()}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleCreateSeries} className="space-y-3.5">
              <div>
                <label className="text-xs font-medium text-zinc-300 block mb-1">Series Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Chronicles of King Solomon"
                  className="w-full bg-[#0c0c0e] border border-white/[0.08] rounded-md px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-zinc-300 block mb-1">Genre</label>
                  <input
                    type="text"
                    value={newGenre}
                    onChange={(e) => setNewGenre(e.target.value)}
                    placeholder="e.g. Historical, Sci-Fi"
                    className="w-full bg-[#0c0c0e] border border-white/[0.08] rounded-md px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-zinc-300 block mb-1">Tone</label>
                  <input
                    type="text"
                    value={newTone}
                    onChange={(e) => setNewTone(e.target.value)}
                    placeholder="e.g. Dramatic, Humorous"
                    className="w-full bg-[#0c0c0e] border border-white/[0.08] rounded-md px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-300 block mb-1">Overarching Premise</label>
                <textarea
                  rows={3}
                  value={newPremise}
                  onChange={(e) => setNewPremise(e.target.value)}
                  placeholder="What is the master storyline connecting these episodes?"
                  className="w-full bg-[#0c0c0e] border border-white/[0.08] rounded-md p-3 text-xs text-white focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-300 block mb-1">
                  World Rules & Canon Constraints (one per line)
                </label>
                <textarea
                  rows={2}
                  value={newWorldRules}
                  onChange={(e) => setNewWorldRules(e.target.value)}
                  placeholder="e.g. Ancient Jerusalem setting only. Fast narrative pacing."
                  className="w-full bg-[#0c0c0e] border border-white/[0.08] rounded-md p-3 text-xs text-white focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateModal(false)}
                  className="text-xs h-8 px-3 border-white/[0.08] text-zinc-400 hover:text-white"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isCreating || !newTitle.trim()}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs h-8 px-4 font-semibold"
                >
                  {isCreating ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
                  <span>Create Universe</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
