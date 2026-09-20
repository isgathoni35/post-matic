"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  Play,
  Pause,
  Clock,
  Mic,
  MicOff,
  Video,
  Download,
  Share2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
  ChevronRight,
  ArrowLeft,
  ArrowRight,
  Users,
  UserPlus,
  Trash2,
  ImagePlus,
  Smartphone,
  Monitor,
  RotateCcw,
  Film,
  Compass,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { VideoJobResponse, CustomCharacterPayload } from "@/lib/api";
import { YouTubeIcon, TikTokIcon, InstagramIcon } from "@/components/social/social-icons";

export const VOICES = [
  {
    id: "en-US-BrianMultilingualNeural",
    name: "Brian",
    role: "Deep & Conversational",
    genre: "Viral TikTok & Storytelling",
    badge: "Most Natural",
    initials: "B",
  },
  {
    id: "en-US-AvaMultilingualNeural",
    name: "Ava",
    role: "Warm & Engaging",
    genre: "Lifestyle & Storyteller",
    badge: "Ultra Human",
    initials: "A",
  },
  {
    id: "en-US-AndrewMultilingualNeural",
    name: "Andrew",
    role: "Punchy & Dynamic",
    genre: "Podcast & Explainer",
    badge: "Podcast",
    initials: "An",
  },
  {
    id: "en-US-EmmaMultilingualNeural",
    name: "Emma",
    role: "Friendly & Expressive",
    genre: "Education & Advice",
    badge: "Storyteller",
    initials: "Em",
  },
  {
    id: "en-US-ChristopherNeural",
    name: "Christopher",
    role: "Deep & Cinematic",
    genre: "Classic Documentary",
    badge: "Cinematic",
    initials: "C",
  },
  {
    id: "en-US-GuyNeural",
    name: "Guy",
    role: "Energetic & Casual",
    genre: "Fast Paced & Modern",
    badge: "Energetic",
    initials: "G",
  },
  {
    id: "en-US-EricNeural",
    name: "Eric",
    role: "Authoritative & Deep",
    genre: "Finance & Explainers",
    badge: "Explainer",
    initials: "E",
  },
  {
    id: "en-US-JennyNeural",
    name: "Jenny",
    role: "Warm & Conversational",
    genre: "Lifestyle & Advice",
    badge: "Warm",
    initials: "J",
  },
  {
    id: "en-GB-SoniaNeural",
    name: "Sonia",
    role: "British Storyteller",
    genre: "History & Lore",
    badge: "Narrative",
    initials: "S",
  },
];

export interface StudioConsoleViewProps {
  topic: string;
  setTopic: (topic: string) => void;
  videoFormat: "short" | "long";
  setVideoFormat: (format: "short" | "long") => void;
  targetPlatform: "youtube" | "tiktok" | "instagram";
  setTargetPlatform: (platform: "youtube" | "tiktok" | "instagram") => void;
  targetDuration: number;
  setTargetDuration: (duration: number) => void;
  selectedVoice: string;
  setSelectedVoice: (voice: string) => void;
  autoPublishYouTube: boolean;
  setAutoPublishYouTube: (val: boolean) => void;
  isSubmitting: boolean;
  activeJob: VideoJobResponse | null;
  onGenerate: () => void;
  onOpenSocialModal: () => void;
  studioMode: "shorts" | "story";
  setStudioMode: (mode: "shorts" | "story") => void;
  storyStyle: "anime" | "donghua" | "stickman" | "3d_cartoon";
  setStoryStyle: (style: "anime" | "donghua" | "stickman" | "3d_cartoon") => void;
  customCharacters?: CustomCharacterPayload[];
  setCustomCharacters?: React.Dispatch<React.SetStateAction<CustomCharacterPayload[]>>;
  seriesTitle?: string;
  seriesEpisode?: number;
  onClearSeries?: () => void;
}

export function StudioConsoleView({
  topic,
  setTopic,
  videoFormat,
  setVideoFormat,
  targetPlatform,
  setTargetPlatform,
  targetDuration,
  setTargetDuration,
  selectedVoice,
  setSelectedVoice,
  autoPublishYouTube,
  setAutoPublishYouTube,
  isSubmitting,
  activeJob,
  onGenerate,
  onOpenSocialModal,
  studioMode,
  setStudioMode,
  storyStyle,
  setStoryStyle,
  customCharacters = [],
  setCustomCharacters,
  seriesTitle,
  seriesEpisode,
  onClearSeries,
}: StudioConsoleViewProps) {
  // Wizard Step: 1 = Prompt & Concept, 2 = Voice & Settings, 3 = Generation & Preview
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(() => {
    if (activeJob && !["completed", "failed"].includes(activeJob.status)) return 3;
    if (activeJob && activeJob.status === "completed") return 3;
    return 1;
  });

  // Automatically advance to Step 3 when a job starts generating or finishes
  useEffect(() => {
    if (activeJob) {
      setCurrentStep(3);
    }
  }, [activeJob?.job_id, activeJob?.id, activeJob?.status]);

  // Voice Audition playback state
  const [auditionVoiceId, setAuditionVoiceId] = useState<string | null>(null);
  const auditionAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (auditionAudioRef.current) {
        auditionAudioRef.current.pause();
      }
    };
  }, []);

  const togglePlayVoiceSample = (voiceId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (auditionVoiceId === voiceId) {
      if (auditionAudioRef.current) {
        auditionAudioRef.current.pause();
        auditionAudioRef.current.currentTime = 0;
      }
      setAuditionVoiceId(null);
    } else {
      if (auditionAudioRef.current) {
        auditionAudioRef.current.pause();
        auditionAudioRef.current.currentTime = 0;
      }
      const audio = new Audio(`/audio/samples/${voiceId}.mp3`);
      auditionAudioRef.current = audio;
      setAuditionVoiceId(voiceId);

      audio.play().catch((err) => {
        console.warn("Audio audition error:", err);
        setAuditionVoiceId(null);
      });
      audio.onended = () => setAuditionVoiceId(null);
      audio.onerror = () => {
        console.warn(`Audio sample failed to load for ${voiceId}`);
        setAuditionVoiceId(null);
      };
    }
  };

  // Speech-to-Text Dictation
  const [isDictating, setIsDictating] = useState(false);
  const recognitionRef = useRef<any>(null);

  const toggleDictation = () => {
    if (isDictating) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsDictating(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onstart = () => setIsDictating(true);
      recognition.onerror = (e: any) => {
        console.error("Speech recognition error:", e);
        setIsDictating(false);
      };
      recognition.onend = () => setIsDictating(false);

      recognition.onresult = (event: any) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript.trim()) {
          setTopic(topic ? `${topic.trim()} ${transcript.trim()}` : transcript.trim());
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error("Failed to start speech recognition:", err);
      setIsDictating(false);
    }
  };

  // Character helpers
  const DEFAULT_COLORS = ["#38BDF8", "#F59E0B", "#22C55E", "#EC4899", "#A855F7"];

  const handleAddCharacter = () => {
    if (customCharacters.length >= 3) return;
    const newIdx = customCharacters.length;
    const defaultNames = ["Protagonist", "Sidekick", "Rival"];
    const newChar: CustomCharacterPayload = {
      name: defaultNames[newIdx] || `Hero ${newIdx + 1}`,
      voice: VOICES[newIdx % VOICES.length].id,
      subtitle_color: DEFAULT_COLORS[newIdx % DEFAULT_COLORS.length],
      visual_notes: "",
    };
    setCustomCharacters && setCustomCharacters([...customCharacters, newChar]);
  };

  const handleRemoveCharacter = (idx: number) => {
    const updated = customCharacters.filter((_, i) => i !== idx);
    setCustomCharacters && setCustomCharacters(updated);
  };

  const handleUpdateCharacter = (
    idx: number,
    field: keyof CustomCharacterPayload,
    value: string
  ) => {
    const updated = [...customCharacters];
    updated[idx] = { ...updated[idx], [field]: value };
    setCustomCharacters && setCustomCharacters(updated);
  };

  const handleImageFileChange = (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      handleUpdateCharacter(idx, "image_data", base64);
    };
    reader.readAsDataURL(file);
  };

  // Job progress details
  const isRendering = activeJob && !["completed", "failed"].includes(activeJob.status);
  const isCompleted = activeJob?.status === "completed";
  const isFailed = activeJob?.status === "failed";

  const videoSrc = activeJob?.video_url
    ? activeJob.video_url.startsWith("http")
      ? activeJob.video_url
      : `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}${activeJob.video_url}`
    : null;

  const getStageName = (status?: string) => {
    switch (status) {
      case "scripting":
        return "Drafting script & narrative structure...";
      case "synthesizing":
        return "Synthesizing neural voiceover...";
      case "sourcing_media":
        return "Generating visual scenes & assets...";
      case "rendering":
        return "Compositing video, audio & subtitles...";
      case "completed":
        return "Video render finished!";
      case "failed":
        return "Generation halted with an error.";
      default:
        return "Initializing engine pipeline...";
    }
  };

  const handleStartGeneration = () => {
    setCurrentStep(3);
    onGenerate();
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Series Context Banner (if in Series Mode) */}
      {seriesTitle && (
        <div className="flex items-center justify-between px-4 py-2.5 rounded-lg bg-indigo-950/40 border border-indigo-500/20 text-indigo-200 text-sm">
          <div className="flex items-center gap-2">
            <Film className="w-4 h-4 text-indigo-400" />
            <span className="font-medium text-white">{seriesTitle}</span>
            {seriesEpisode && (
              <Badge variant="outline" className="border-indigo-500/30 text-indigo-300 text-xs px-2 py-0.5">
                Episode {seriesEpisode}
              </Badge>
            )}
            <span className="text-xs text-indigo-400/70 hidden sm:inline">
              • AI is loaded with this series' Show Bible context
            </span>
          </div>
          {onClearSeries && (
            <button
              onClick={onClearSeries}
              className="text-xs text-indigo-400 hover:text-indigo-200 transition-colors underline"
            >
              Exit Series Mode
            </button>
          )}
        </div>
      )}

      {/* Stepped Wizard Navigation Bar */}
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
        <div className="flex items-center gap-1 sm:gap-3">
          {/* Step 1 Tab */}
          <button
            onClick={() => setCurrentStep(1)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
              currentStep === 1
                ? "bg-white/[0.08] text-white"
                : topic.trim()
                ? "text-zinc-400 hover:text-zinc-200"
                : "text-zinc-500 hover:text-zinc-400"
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-semibold ${
                currentStep === 1
                  ? "bg-indigo-600 text-white"
                  : topic.trim()
                  ? "bg-zinc-700 text-zinc-300"
                  : "bg-zinc-800 text-zinc-500"
              }`}
            >
              1
            </span>
            <span>Idea & Format</span>
          </button>

          <ChevronRight className="w-4 h-4 text-zinc-600 hidden sm:block" />

          {/* Step 2 Tab */}
          <button
            onClick={() => {
              if (topic.trim()) setCurrentStep(2);
            }}
            disabled={!topic.trim()}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
              currentStep === 2
                ? "bg-white/[0.08] text-white"
                : !topic.trim()
                ? "opacity-40 cursor-not-allowed text-zinc-600"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-semibold ${
                currentStep === 2
                  ? "bg-indigo-600 text-white"
                  : topic.trim()
                  ? "bg-zinc-700 text-zinc-300"
                  : "bg-zinc-800 text-zinc-500"
              }`}
            >
              2
            </span>
            <span>Voice & Settings</span>
          </button>

          <ChevronRight className="w-4 h-4 text-zinc-600 hidden sm:block" />

          {/* Step 3 Tab */}
          <button
            onClick={() => {
              if (activeJob) setCurrentStep(3);
            }}
            disabled={!activeJob}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
              currentStep === 3
                ? "bg-white/[0.08] text-white"
                : !activeJob
                ? "opacity-40 cursor-not-allowed text-zinc-600"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-semibold ${
                currentStep === 3
                  ? "bg-indigo-600 text-white"
                  : activeJob?.status === "completed"
                  ? "bg-emerald-500/20 text-emerald-400"
                  : "bg-zinc-800 text-zinc-500"
              }`}
            >
              3
            </span>
            <span>Render & Preview</span>
          </button>
        </div>

        {/* Quick Mode Indicator */}
        <div className="hidden md:flex items-center gap-2 text-xs text-zinc-500">
          <span>{studioMode === "shorts" ? "Faceless" : "Story"} Mode</span>
          <span>•</span>
          <span>{videoFormat === "short" ? "9:16 Vertical" : "16:9 Landscape"}</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* STEP 1: IDEA & FORMAT */}
      {/* ========================================================================= */}
      {currentStep === 1 && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Top Controls: Production Mode & Aspect Ratio */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Production Mode Toggle */}
            <div className="pm-surface p-4 rounded-xl border border-white/[0.06]">
              <label className="text-xs font-medium text-zinc-400 block mb-2">Production Mode</label>
              <div className="grid grid-cols-2 gap-1.5 bg-[#0c0c0e] p-1 rounded-lg border border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => setStudioMode("shorts")}
                  className={`py-2 px-3 rounded-md text-xs font-medium transition-all ${
                    studioMode === "shorts"
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Faceless Explainer
                </button>
                <button
                  type="button"
                  onClick={() => setStudioMode("story")}
                  className={`py-2 px-3 rounded-md text-xs font-medium transition-all ${
                    studioMode === "story"
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Animated Story
                </button>
              </div>
            </div>

            {/* Video Aspect Ratio Toggle */}
            <div className="pm-surface p-4 rounded-xl border border-white/[0.06]">
              <label className="text-xs font-medium text-zinc-400 block mb-2">Format & Framing</label>
              <div className="grid grid-cols-2 gap-1.5 bg-[#0c0c0e] p-1 rounded-lg border border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => {
                    setVideoFormat("short");
                    setTargetDuration(60);
                  }}
                  className={`py-2 px-3 rounded-md text-xs font-medium flex items-center justify-center gap-2 transition-all ${
                    videoFormat === "short"
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>9:16 Vertical (Shorts)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setVideoFormat("long");
                    setTargetDuration(180);
                  }}
                  className={`py-2 px-3 rounded-md text-xs font-medium flex items-center justify-center gap-2 transition-all ${
                    videoFormat === "long"
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span>16:9 Widescreen (Long)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Main Idea Prompt Input */}
          <div className="pm-surface p-5 rounded-xl border border-white/[0.06] space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">Video Topic & Narrative Prompt</h3>
                <p className="text-xs text-zinc-400">
                  Describe what your video is about. Be as specific or conceptual as you like.
                </p>
              </div>
              <button
                type="button"
                onClick={toggleDictation}
                className={`p-2 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-medium ${
                  isDictating
                    ? "bg-red-500/20 text-red-400 border border-red-500/30"
                    : "bg-white/[0.04] text-zinc-400 hover:text-white hover:bg-white/[0.08]"
                }`}
                title={isDictating ? "Stop voice dictation" : "Speak your prompt"}
              >
                {isDictating ? (
                  <>
                    <MicOff className="w-3.5 h-3.5 animate-pulse" />
                    <span>Listening...</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-3.5 h-3.5" />
                    <span>Voice Input</span>
                  </>
                )}
              </button>
            </div>

            <Textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder={
                studioMode === "story"
                  ? "e.g. A rogue AI hacker in Neo-Tokyo gets trapped inside a corporate mainframe and must bargain with an eccentric digital ghost to break free..."
                  : "e.g. The forgotten history of the Library of Alexandria and the real truth behind how the ancient world lost its most valuable knowledge..."
              }
              className="min-h-[160px] resize-y bg-[#0c0c0e] border-white/[0.06] focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-zinc-100 text-sm leading-relaxed p-4 rounded-lg"
            />

            <div className="flex items-center justify-between text-xs text-zinc-500 pt-1">
              <span>{topic.trim().split(/\s+/).filter(Boolean).length} words</span>
              <span>{topic.length} characters</span>
            </div>
          </div>

          {/* Step 1 Actions */}
          <div className="flex items-center justify-end pt-2">
            <Button
              variant="primary"
              onClick={() => setCurrentStep(2)}
              disabled={!topic.trim()}
              className="h-10 px-6 text-xs font-semibold rounded-lg"
            >
              <span>Continue to Settings</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 2: VOICE & SETTINGS */}
      {/* ========================================================================= */}
      {currentStep === 2 && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Quick Summary Bar */}
          <div className="flex items-center justify-between p-3.5 rounded-xl pm-surface border border-white/[0.06]">
            <div className="flex items-center gap-3 overflow-hidden">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Concept:</span>
              <p className="text-xs text-zinc-200 truncate max-w-md sm:max-w-xl">{topic}</p>
            </div>
            <button
              onClick={() => setCurrentStep(1)}
              className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors ml-3 whitespace-nowrap"
            >
              Edit Idea
            </button>
          </div>

          {/* Voice Audition Selector */}
          <div className="pm-surface p-5 rounded-xl border border-white/[0.06] space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">Narrator & Voice Profile</h3>
                <p className="text-xs text-zinc-400">
                  Select the neural voice actor that best matches your video's pacing and atmosphere.
                </p>
              </div>
              <span className="text-xs text-zinc-500">Tap play to audition sample</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {VOICES.map((v) => {
                const isSelected = selectedVoice === v.id;
                const isAuditioning = auditionVoiceId === v.id;

                return (
                  <div
                    key={v.id}
                    onClick={() => setSelectedVoice(v.id)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between group ${
                      isSelected
                        ? "bg-indigo-950/30 border-indigo-500/50"
                        : "bg-[#0c0c0e] border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.02]"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${
                          isSelected ? "bg-indigo-600 text-white" : "bg-zinc-800 text-zinc-400"
                        }`}
                      >
                        {v.initials}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-white truncate">{v.name}</span>
                          <span className="text-[10px] text-zinc-500 px-1 py-0.2 rounded bg-zinc-800/80">
                            {v.badge}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-400 truncate">{v.role}</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => togglePlayVoiceSample(v.id, e)}
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors shrink-0 ${
                        isAuditioning
                          ? "bg-indigo-600 text-white animate-pulse"
                          : "bg-white/[0.05] text-zinc-400 hover:text-white hover:bg-white/[0.1]"
                      }`}
                      title={isAuditioning ? "Stop audio sample" : "Audition voice"}
                    >
                      {isAuditioning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Configuration Grid: Duration, Platform & Distribution */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Duration Selector */}
            <div className="pm-surface p-5 rounded-xl border border-white/[0.06] space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Target Duration</span>
                </label>
                <span className="text-xs text-indigo-400 font-semibold">{targetDuration} seconds</span>
              </div>

              {videoFormat === "short" ? (
                <div className="grid grid-cols-3 gap-2">
                  {[30, 60, 90].map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => setTargetDuration(sec)}
                      className={`py-2 text-xs font-medium rounded-lg transition-all ${
                        targetDuration === sec
                          ? "bg-indigo-600 text-white"
                          : "bg-[#0c0c0e] text-zinc-400 hover:text-white border border-white/[0.06]"
                      }`}
                    >
                      {sec}s (Short)
                    </button>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {[180, 300, 600].map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => setTargetDuration(sec)}
                      className={`py-2 text-xs font-medium rounded-lg transition-all ${
                        targetDuration === sec
                          ? "bg-indigo-600 text-white"
                          : "bg-[#0c0c0e] text-zinc-400 hover:text-white border border-white/[0.06]"
                      }`}
                    >
                      {sec / 60} min
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Platform & Social Target */}
            <div className="pm-surface p-5 rounded-xl border border-white/[0.06] space-y-3">
              <label className="text-xs font-medium text-zinc-300 block">Primary Destination</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "youtube", label: "YouTube", icon: YouTubeIcon, activeColor: "bg-red-600/20 border-red-500/40 text-white", iconClass: "text-red-500" },
                  { id: "tiktok", label: "TikTok", icon: TikTokIcon, activeColor: "bg-cyan-600/20 border-cyan-500/40 text-white", iconClass: "text-cyan-400" },
                  { id: "instagram", label: "Instagram", icon: InstagramIcon, activeColor: "bg-pink-600/20 border-pink-500/40 text-white", iconClass: "text-pink-400" },
                ].map((p) => {
                  const Icon = p.icon;
                  const isSelected = targetPlatform === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setTargetPlatform(p.id as "youtube" | "tiktok" | "instagram")}
                      className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all flex items-center justify-center gap-1.5 ${
                        isSelected
                          ? p.activeColor
                          : "bg-[#0c0c0e] text-zinc-400 hover:text-white border-white/[0.06] hover:bg-white/[0.03]"
                      }`}
                    >
                      <Icon className={`h-3.5 w-3.5 ${isSelected ? p.iconClass : "text-zinc-500"} fill-current`} />
                      <span>{p.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Animated Story Mode Settings (Conditional) */}
          {studioMode === "story" && (
            <div className="pm-surface p-5 rounded-xl border border-white/[0.06] space-y-5">
              <div>
                <h3 className="text-sm font-semibold text-white">Story Style & Art Direction</h3>
                <p className="text-xs text-zinc-400">
                  Choose visual aesthetics and define cast members for consistent scenes.
                </p>
              </div>

              {/* Visual Style Segmented Control */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: "anime", label: "Anime" },
                  { id: "donghua", label: "Donghua" },
                  { id: "stickman", label: "Stickman" },
                  { id: "3d_cartoon", label: "3D Cartoon" },
                ].map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setStoryStyle(st.id as any)}
                    className={`py-2.5 px-3 rounded-lg text-xs font-medium border text-center transition-all ${
                      storyStyle === st.id
                        ? "bg-indigo-600 text-white border-indigo-500"
                        : "bg-[#0c0c0e] text-zinc-400 border-white/[0.06] hover:text-white"
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>

              {/* Character Deck */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-zinc-400" />
                    <span className="text-xs font-medium text-zinc-300">Custom Characters</span>
                    <Badge variant="outline" className="border-white/[0.08] text-zinc-400 text-[10px] py-0">
                      {customCharacters.length} / 3
                    </Badge>
                  </div>
                  {customCharacters.length < 3 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddCharacter}
                      className="text-xs h-7 border-white/[0.08] bg-transparent text-zinc-300 hover:text-white rounded-lg"
                    >
                      <UserPlus className="w-3 h-3 mr-1" />
                      Add Character
                    </Button>
                  )}
                </div>

                {customCharacters.length === 0 ? (
                  <p className="text-xs text-zinc-500 italic">
                    No custom characters added. The AI will invent dynamic characters automatically for the story.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {customCharacters.map((char, idx) => (
                      <div
                        key={idx}
                        className="bg-[#0c0c0e] p-3 rounded-lg border border-white/[0.06] space-y-2.5 relative group"
                      >
                        <button
                          type="button"
                          onClick={() => handleRemoveCharacter(idx)}
                          className="absolute top-2 right-2 text-zinc-500 hover:text-red-400 transition-colors"
                          title="Remove character"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                        <div>
                          <label className="text-[10px] text-zinc-500 block mb-1">Character Name</label>
                          <input
                            type="text"
                            value={char.name}
                            onChange={(e) => handleUpdateCharacter(idx, "name", e.target.value)}
                            className="w-full bg-[#16161a] border border-white/[0.06] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                            placeholder="Hero Name"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] text-zinc-500 block mb-1">Assigned Voice</label>
                          <select
                            value={char.voice || VOICES[0].id}
                            onChange={(e) => handleUpdateCharacter(idx, "voice", e.target.value)}
                            className="w-full bg-[#16161a] border border-white/[0.06] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                          >
                            {VOICES.map((v) => (
                              <option key={v.id} value={v.id}>
                                {v.name} ({v.role})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-[10px] text-zinc-500 block mb-1">Visual Prompt Notes</label>
                          <input
                            type="text"
                            value={char.visual_notes || ""}
                            onChange={(e) => handleUpdateCharacter(idx, "visual_notes", e.target.value)}
                            className="w-full bg-[#16161a] border border-white/[0.06] rounded-lg px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-indigo-500"
                            placeholder="Black trench coat, neon glasses"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] text-zinc-500 block mb-1">Reference Portrait</label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageFileChange(idx, e)}
                            className="text-[10px] text-zinc-400 file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-[10px] file:bg-zinc-800 file:text-zinc-300"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Auto-publish checkbox */}
          <div className="flex items-center justify-between p-3.5 rounded-xl pm-surface border border-white/[0.06]">
            <div className="flex items-center gap-2.5">
              <input
                id="auto-pub"
                type="checkbox"
                checked={autoPublishYouTube}
                onChange={(e) => setAutoPublishYouTube(e.target.checked)}
                className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-red-600 focus:ring-red-500 cursor-pointer"
              />
              <label htmlFor="auto-pub" className="text-xs text-zinc-300 font-medium cursor-pointer flex items-center gap-1.5">
                <YouTubeIcon className="h-3.5 w-3.5 text-red-500 fill-current" />
                <span>Automatically publish to YouTube once rendered</span>
              </label>
            </div>
            <span className="text-[11px] text-zinc-500">Requires connected YouTube channel</span>
          </div>

          {/* Step 2 Actions */}
          <div className="flex items-center justify-between pt-2">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(1)}
              className="border-white/[0.08] text-zinc-400 hover:text-white px-4 py-2 text-xs flex items-center gap-1.5 rounded-lg"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Idea</span>
            </Button>

            <Button
              variant="primary"
              onClick={handleStartGeneration}
              disabled={isSubmitting || !topic.trim()}
              className="h-10 px-6 text-xs font-semibold rounded-lg"
            >
              <Sparkles className="w-4 h-4 mr-1.5" />
              <span>Start Video Generation</span>
            </Button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 3: RENDER & PREVIEW */}
      {/* ========================================================================= */}
      {currentStep === 3 && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Status Banner */}
          <div className="pm-surface p-5 rounded-xl border border-white/[0.06] space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-white">
                    {isCompleted
                      ? "Generation Complete"
                      : isFailed
                      ? "Render Failed"
                      : isRendering
                      ? "Rendering in Progress"
                      : "Ready to Generate"}
                  </h3>
                  {activeJob && (
                    <Badge
                      variant="outline"
                      className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 ${
                        isCompleted
                          ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10"
                          : isFailed
                          ? "border-red-500/30 text-red-400 bg-red-500/10"
                          : "border-indigo-500/30 text-indigo-400 bg-indigo-500/10"
                      }`}
                    >
                      {activeJob.status}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">{getStageName(activeJob?.status)}</p>
              </div>

              {activeJob && (
                <div className="text-right">
                  <span className="text-lg font-bold text-white">{activeJob.progress_pct}%</span>
                  <span className="text-xs text-zinc-500 block">completed</span>
                </div>
              )}
            </div>

            {/* Progress Bar */}
            {activeJob && (
              <div className="w-full bg-[#16161a] h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    isCompleted
                      ? "bg-emerald-500"
                      : isFailed
                      ? "bg-red-500"
                      : "bg-indigo-600"
                  }`}
                  style={{ width: `${activeJob.progress_pct || 0}%` }}
                />
              </div>
            )}

            {/* Pipeline Stage Indicators */}
            {isRendering && (
              <div className="grid grid-cols-4 gap-2 pt-1 text-[11px] text-zinc-500">
                <span className={activeJob?.status === "scripting" ? "text-indigo-400 font-semibold" : ""}>
                  1. Scripting
                </span>
                <span className={activeJob?.status === "synthesizing" ? "text-indigo-400 font-semibold" : ""}>
                  2. Voiceover
                </span>
                <span className={activeJob?.status === "sourcing_media" ? "text-indigo-400 font-semibold" : ""}>
                  3. Visuals
                </span>
                <span className={activeJob?.status === "rendering" ? "text-indigo-400 font-semibold" : ""}>
                  4. Assembly
                </span>
              </div>
            )}
          </div>

          {/* Video Preview Center */}
          <div className="flex flex-col items-center justify-center p-6 rounded-xl pm-surface border border-white/[0.06]">
            {videoSrc && isCompleted ? (
              <div className="w-full flex flex-col items-center space-y-4">
                <div
                  className={`relative rounded-xl overflow-hidden bg-black border border-white/[0.08] ${
                    videoFormat === "short"
                      ? "w-full max-w-[320px] aspect-[9/16]"
                      : "w-full max-w-[640px] aspect-[16/9]"
                  }`}
                >
                  <video
                    src={videoSrc}
                    controls
                    autoPlay
                    loop
                    className="w-full h-full object-contain"
                  />
                </div>

                {/* Video Action Toolbar */}
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <a
                    href={videoSrc}
                    download={`postmatic_${(activeJob?.job_id || "video").slice(0, 8)}.mp4`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="secondary" size="sm" className="h-9 px-4 text-xs font-semibold rounded-lg flex items-center gap-2">
                      <Download className="w-3.5 h-3.5" />
                      <span>Download MP4</span>
                    </Button>
                  </a>

                  <Button
                    variant="primary"
                    size="sm"
                    onClick={onOpenSocialModal}
                    className="h-9 px-4 text-xs font-semibold rounded-lg flex items-center gap-2"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Publish to Channels</span>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentStep(1)}
                    className="border-white/[0.08] text-zinc-400 hover:text-white text-xs h-9 px-4 rounded-lg"
                  >
                    <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                    <span>Create New Video</span>
                  </Button>
                </div>
              </div>
            ) : isRendering ? (
              <div
                className={`w-full flex flex-col items-center justify-center rounded-xl bg-black/50 border border-white/[0.06] p-8 text-center space-y-4 ${
                  videoFormat === "short"
                    ? "max-w-[320px] aspect-[9/16]"
                    : "max-w-[640px] aspect-[16/9]"
                }`}
              >
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-white">Engine Processing</p>
                  <p className="text-xs text-zinc-400 max-w-xs">{getStageName(activeJob?.status)}</p>
                </div>
                <div className="text-[11px] text-zinc-600">
                  Zero-OpEx compute pipeline active
                </div>
              </div>
            ) : isFailed ? (
              <div className="text-center py-12 space-y-4">
                <AlertCircle className="w-10 h-10 text-red-400 mx-auto" />
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-white">Video Generation Failed</p>
                  <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                    {activeJob?.error_message || "An error occurred during video rendering."}
                  </p>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setCurrentStep(2)}
                  className="rounded-lg text-xs"
                >
                  Return to Settings
                </Button>
              </div>
            ) : (
              <div className="text-center py-12 space-y-3">
                <Film className="w-10 h-10 text-zinc-700 mx-auto" />
                <p className="text-sm font-medium text-zinc-400">No active render job</p>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setCurrentStep(1)}
                  className="rounded-lg text-xs font-semibold"
                >
                  Start New Video
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
