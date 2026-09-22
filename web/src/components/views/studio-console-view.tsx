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
  VolumeX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { VideoJobResponse, CustomCharacterPayload } from "@/lib/api";
import { YouTubeIcon, TikTokIcon, InstagramIcon } from "@/components/social/social-icons";
import { SUBTITLE_STYLES, MUSIC_TRACKS } from "./create-series-wizard";

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
  musicTrack?: string;
  setMusicTrack?: (track: string) => void;
  subtitleStyle?: string;
  setSubtitleStyle?: (style: string) => void;
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
  musicTrack = "lofi_chill",
  setMusicTrack,
  subtitleStyle = "hormozi_yellow",
  setSubtitleStyle,
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
      if (auditionMusicRef.current) {
        auditionMusicRef.current.pause();
      }
    };
  }, []);

  // Music Audition playback state
  const [auditionMusicId, setAuditionMusicId] = useState<string | null>(null);
  const auditionMusicRef = useRef<HTMLAudioElement | null>(null);

  const togglePlayMusicSample = (trackId: string, previewUrl: string | null, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!previewUrl) return;

    if (auditionMusicId === trackId) {
      if (auditionMusicRef.current) {
        auditionMusicRef.current.pause();
        auditionMusicRef.current.currentTime = 0;
      }
      setAuditionMusicId(null);
    } else {
      if (auditionMusicRef.current) {
        auditionMusicRef.current.pause();
        auditionMusicRef.current.currentTime = 0;
      }
      const audio = new Audio(previewUrl);
      auditionMusicRef.current = audio;
      setAuditionMusicId(trackId);

      audio.play().catch((err) => {
        console.warn("Music audition error:", err);
        setAuditionMusicId(null);
      });
      audio.onended = () => setAuditionMusicId(null);
      audio.onerror = () => {
        console.warn(`Music audition sample failed to load for ${trackId}`);
        setAuditionMusicId(null);
      };
    }
  };

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
        <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 text-sm shadow-xs">
          <div className="flex items-center gap-2">
            <Film className="w-4 h-4 text-[#6c5ce7]" />
            <span className="font-semibold text-slate-900">{seriesTitle}</span>
            {seriesEpisode && (
              <Badge variant="primary" className="text-xs px-2 py-0.5">
                Episode {seriesEpisode}
              </Badge>
            )}
            <span className="text-xs text-purple-700/80 hidden sm:inline">
              • AI is loaded with this series' Show Bible context
            </span>
          </div>
          {onClearSeries && (
            <button
              onClick={onClearSeries}
              className="text-xs text-[#6c5ce7] hover:text-[#5b4bc4] transition-colors underline font-medium"
            >
              Exit Series Mode
            </button>
          )}
        </div>
      )}

      {/* Stepped Wizard Navigation Bar */}
      <div className="flex items-center justify-between border-b border-slate-200/80 pb-4">
        <div className="flex items-center gap-1 sm:gap-3">
          {/* Step 1 Tab */}
          <button
            onClick={() => setCurrentStep(1)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              currentStep === 1
                ? "bg-purple-50 text-[#6c5ce7] shadow-xs"
                : topic.trim()
                ? "text-slate-700 hover:text-slate-900 hover:bg-slate-50"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                currentStep === 1
                  ? "bg-[#6c5ce7] text-white"
                  : topic.trim()
                  ? "bg-slate-200 text-slate-800"
                  : "bg-slate-100 text-slate-600 border border-slate-200"
              }`}
            >
              1
            </span>
            <span>Idea & Format</span>
          </button>

          <ChevronRight className="w-4 h-4 text-slate-400 hidden sm:block" />

          {/* Step 2 Tab */}
          <button
            onClick={() => {
              if (topic.trim()) setCurrentStep(2);
            }}
            disabled={!topic.trim()}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              currentStep === 2
                ? "bg-purple-50 text-[#6c5ce7] shadow-xs"
                : !topic.trim()
                ? "cursor-not-allowed text-slate-500 font-medium"
                : "text-slate-700 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                currentStep === 2
                  ? "bg-[#6c5ce7] text-white"
                  : topic.trim()
                  ? "bg-slate-200 text-slate-800"
                  : "bg-slate-100 text-slate-600 border border-slate-200"
              }`}
            >
              2
            </span>
            <span>Voice & Settings</span>
          </button>

          <ChevronRight className="w-4 h-4 text-slate-400 hidden sm:block" />

          {/* Step 3 Tab */}
          <button
            onClick={() => {
              if (activeJob) setCurrentStep(3);
            }}
            disabled={!activeJob}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              currentStep === 3
                ? "bg-purple-50 text-[#6c5ce7] shadow-xs"
                : !activeJob
                ? "cursor-not-allowed text-slate-500 font-medium"
                : "text-slate-700 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                currentStep === 3
                  ? "bg-[#6c5ce7] text-white"
                  : activeJob?.status === "completed"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-slate-100 text-slate-600 border border-slate-200"
              }`}
            >
              3
            </span>
            <span>Render & Preview</span>
          </button>
        </div>

        {/* Quick Mode Indicator */}
        <div className="hidden md:flex items-center gap-2 text-xs text-slate-600 font-semibold">
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
            <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs space-y-2">
              <label className="text-xs font-semibold text-slate-900 block">Production Mode</label>
              <div className="grid grid-cols-2 gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200/60">
                <button
                  type="button"
                  onClick={() => setStudioMode("shorts")}
                  className={`py-2 px-3 rounded-md text-xs font-semibold transition-all ${
                    studioMode === "shorts"
                      ? "bg-white text-[#6c5ce7] shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Faceless Explainer
                </button>
                <button
                  type="button"
                  onClick={() => setStudioMode("story")}
                  className={`py-2 px-3 rounded-md text-xs font-semibold transition-all ${
                    studioMode === "story"
                      ? "bg-white text-[#6c5ce7] shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Animated Story
                </button>
              </div>
            </div>

            {/* Video Aspect Ratio Toggle */}
            <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs space-y-2">
              <label className="text-xs font-semibold text-slate-900 block">Format & Framing</label>
              <div className="grid grid-cols-2 gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200/60">
                <button
                  type="button"
                  onClick={() => {
                    setVideoFormat("short");
                    setTargetDuration(60);
                  }}
                  className={`py-2 px-3 rounded-md text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                    videoFormat === "short"
                      ? "bg-white text-[#6c5ce7] shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
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
                  className={`py-2 px-3 rounded-md text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                    videoFormat === "long"
                      ? "bg-white text-[#6c5ce7] shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span>16:9 Widescreen (Long)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Main Idea Prompt Input */}
          <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Video Topic & Narrative Prompt</h3>
                <p className="text-xs text-slate-600 font-medium">
                  Describe what your video is about. Be as specific or conceptual as you like.
                </p>
              </div>
              <button
                type="button"
                onClick={toggleDictation}
                className={`p-2 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-semibold ${
                  isDictating
                    ? "bg-rose-50 text-rose-600 border border-rose-200"
                    : "bg-slate-100 text-slate-700 hover:text-slate-900 hover:bg-slate-200"
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
              className="min-h-[160px] resize-y bg-slate-50/50 border-slate-200 focus:bg-white focus:border-[#6c5ce7] focus:ring-1 focus:ring-[#6c5ce7] text-slate-900 text-sm leading-relaxed p-4 rounded-xl placeholder:text-slate-400"
            />

            <div className="flex items-center justify-between text-xs text-slate-600 font-medium pt-1">
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
              className="h-10 px-6 text-xs font-semibold rounded-lg bg-[#6c5ce7] hover:bg-[#5b4bc4] text-white shadow-xs"
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
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-3 overflow-hidden">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Concept:</span>
              <p className="text-xs text-slate-900 font-medium truncate max-w-md sm:max-w-xl">{topic}</p>
            </div>
            <button
              onClick={() => setCurrentStep(1)}
              className="text-xs text-[#6c5ce7] hover:underline transition-colors ml-3 whitespace-nowrap font-semibold"
            >
              Edit Idea
            </button>
          </div>

          {/* Voice Audition Selector */}
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Narrator & Voice Profile</h3>
                <p className="text-xs text-slate-600 font-medium">
                  Select the neural voice actor that best matches your video's pacing and atmosphere.
                </p>
              </div>
              <span className="text-xs text-slate-600 font-medium">Tap play to audition sample</span>
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
                        ? "bg-purple-50/80 border-[#6c5ce7] shadow-2xs"
                        : "bg-slate-50/70 border-slate-200 hover:border-slate-300 hover:bg-white"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${
                          isSelected ? "bg-[#6c5ce7] text-white" : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        {v.initials}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-slate-900 truncate">{v.name}</span>
                          <span className="text-[10px] text-slate-600 px-1 py-0.5 rounded bg-slate-100 font-medium border border-slate-200/80">
                            {v.badge}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 truncate font-medium">{v.role}</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => togglePlayVoiceSample(v.id, e)}
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors shrink-0 ${
                        isAuditioning
                          ? "bg-[#6c5ce7] text-white animate-pulse"
                          : "bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200"
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
            <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span>Target Duration</span>
                </label>
                <span className="text-xs text-[#6c5ce7] font-semibold">{targetDuration} seconds</span>
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
                          ? "bg-[#6c5ce7] text-white font-semibold shadow-2xs"
                          : "bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-200 hover:bg-slate-100"
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
                          ? "bg-[#6c5ce7] text-white font-semibold shadow-2xs"
                          : "bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {sec / 60} min
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Platform & Social Target */}
            <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs space-y-3">
              <label className="text-xs font-medium text-slate-700 block">Primary Destination</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "youtube", label: "YouTube", icon: YouTubeIcon, activeColor: "bg-red-50 border-red-200 text-red-700", iconClass: "text-red-600" },
                  { id: "tiktok", label: "TikTok", icon: TikTokIcon, activeColor: "bg-cyan-50 border-cyan-200 text-cyan-800", iconClass: "text-cyan-600" },
                  { id: "instagram", label: "Instagram", icon: InstagramIcon, activeColor: "bg-pink-50 border-pink-200 text-pink-700", iconClass: "text-pink-600" },
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
                          : "bg-slate-50 text-slate-600 hover:text-slate-900 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      <Icon className={`h-3.5 w-3.5 ${isSelected ? p.iconClass : "text-slate-400"} fill-current`} />
                      <span>{p.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Animated Story Mode Settings (Conditional) */}
          {studioMode === "story" && (
            <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs space-y-5">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Story Style & Art Direction</h3>
                <p className="text-xs text-slate-500">
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
                        ? "bg-[#6c5ce7] text-white border-[#6c5ce7] font-semibold shadow-2xs"
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:text-slate-900 hover:bg-slate-100"
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
                    <Users className="w-4 h-4 text-slate-500" />
                    <span className="text-xs font-medium text-slate-700">Custom Characters</span>
                    <Badge variant="outline" className="border-slate-200 text-slate-600 text-[10px] py-0 bg-slate-100">
                      {customCharacters.length} / 3
                    </Badge>
                  </div>
                  {customCharacters.length < 3 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddCharacter}
                      className="text-xs h-7 border-slate-200 bg-white text-slate-700 hover:bg-slate-50 rounded-lg"
                    >
                      <UserPlus className="w-3 h-3 mr-1" />
                      Add Character
                    </Button>
                  )}
                </div>

                {customCharacters.length === 0 ? (
                  <p className="text-xs text-slate-500 italic font-medium">
                    No custom characters added. The AI will invent dynamic characters automatically for the story.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {customCharacters.map((char, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-50/80 p-3 rounded-lg border border-slate-200 space-y-2.5 relative group"
                      >
                        <button
                          type="button"
                          onClick={() => handleRemoveCharacter(idx)}
                          className="absolute top-2 right-2 text-slate-400 hover:text-red-500 transition-colors"
                          title="Remove character"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                        <div>
                          <label className="text-[10px] text-slate-600 font-semibold block mb-1">Character Name</label>
                          <input
                            type="text"
                            value={char.name}
                            onChange={(e) => handleUpdateCharacter(idx, "name", e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-[#6c5ce7] focus:ring-1 focus:ring-[#6c5ce7]"
                            placeholder="Hero Name"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] text-slate-600 font-semibold block mb-1">Assigned Voice</label>
                          <select
                            value={char.voice || VOICES[0].id}
                            onChange={(e) => handleUpdateCharacter(idx, "voice", e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-[#6c5ce7] focus:ring-1 focus:ring-[#6c5ce7]"
                          >
                            {VOICES.map((v) => (
                              <option key={v.id} value={v.id}>
                                {v.name} ({v.role})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-[10px] text-slate-600 font-semibold block mb-1">Visual Prompt Notes</label>
                          <input
                            type="text"
                            value={char.visual_notes || ""}
                            onChange={(e) => handleUpdateCharacter(idx, "visual_notes", e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-[#6c5ce7] focus:ring-1 focus:ring-[#6c5ce7]"
                            placeholder="Black trench coat, neon glasses"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] text-slate-600 font-semibold block mb-1">Reference Portrait</label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageFileChange(idx, e)}
                            className="text-[10px] text-slate-600 file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-[10px] file:bg-slate-200 file:text-slate-700 font-medium"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Trending Audio & Subtitle Engine (Step 6.3) */}
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <span>Audio & Caption Engine</span>
                  <Badge variant="outline" className="border-amber-300 text-amber-700 bg-amber-50 text-[10px] py-0">
                    Hormozi Kinetic Pop
                  </Badge>
                </h3>
                <p className="text-xs text-slate-600 font-medium">
                  Dynamic word-level highlight animation and ducked background audio.
                </p>
              </div>
            </div>

            {/* Subtitle Style Selector */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-800 block">Subtitle Animation Preset</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {SUBTITLE_STYLES.map((sub) => {
                  const isSelected = subtitleStyle === sub.id;
                  return (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => setSubtitleStyle?.(sub.id)}
                      className={`p-2.5 rounded-lg border text-left transition-all flex items-center justify-between ${
                        isSelected
                          ? "bg-amber-50/80 border-amber-400 text-slate-900 shadow-2xs"
                          : "bg-slate-50/70 border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-white font-medium"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: sub.highlightColor }}
                        />
                        <span className="text-xs font-medium line-clamp-1">{sub.name}</span>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Background Music Presets & Trending Audio Link */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-800">Background Music Track</label>
                <span className="text-[11px] text-slate-500 font-medium">Auto-ducked (-22dB) under narration</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {MUSIC_TRACKS.map((track) => {
                  const isSelected = musicTrack === track.id;
                  const isPlaying = auditionMusicId === track.id;
                  return (
                    <div
                      key={track.id}
                      onClick={() => setMusicTrack?.(track.id)}
                      className={`p-2 rounded-lg border text-left cursor-pointer transition-all flex items-center justify-between ${
                        isSelected
                          ? "bg-purple-50/80 border-[#6c5ce7] text-slate-900 font-semibold shadow-2xs ring-1 ring-[#6c5ce7]"
                          : "bg-slate-50/70 border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-white"
                      }`}
                    >
                      <div className="space-y-0.5 min-w-0 pr-1">
                        <div className="flex items-center gap-1">
                          <p className="text-xs font-medium truncate">{track.name}</p>
                          {isSelected && <Check className="w-3 h-3 text-[#6c5ce7] shrink-0" />}
                        </div>
                        <p className="text-[10px] text-slate-500 truncate font-medium">{track.mood}</p>
                      </div>
                      {track.previewUrl ? (
                        <button
                          type="button"
                          onClick={(e) => togglePlayMusicSample(track.id, track.previewUrl, e)}
                          className={`p-1.5 rounded-lg border transition-all shrink-0 ${
                            isPlaying
                              ? "bg-[#6c5ce7] text-white border-[#6c5ce7] animate-pulse"
                              : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-slate-900 shadow-2xs"
                          }`}
                          title={isPlaying ? "Pause music preview" : "Audition music preview"}
                        >
                          {isPlaying ? (
                            <Pause className="w-3 h-3" />
                          ) : (
                            <Play className="w-3 h-3 fill-current" />
                          )}
                        </button>
                      ) : (
                        <VolumeX className="w-3.5 h-3.5 text-slate-400 shrink-0" title="No background audio" />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Direct TikTok / YouTube sound link input */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] text-slate-700 font-medium">Or Paste TikTok / YouTube Trending Sound Link:</span>
                  {musicTrack && musicTrack.startsWith("http") && (
                    <span className="text-[10px] text-teal-600 font-medium flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
                      Custom Audio URL Active
                    </span>
                  )}
                </div>
                <input
                  type="url"
                  value={musicTrack?.startsWith("http") ? musicTrack : ""}
                  onChange={(e) => setMusicTrack?.(e.target.value.trim() || "lofi_chill")}
                  placeholder="https://www.tiktok.com/@... or https://youtube.com/..."
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#6c5ce7] focus:ring-1 focus:ring-[#6c5ce7] transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Auto-publish checkbox */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-2.5">
              <input
                id="auto-pub"
                type="checkbox"
                checked={autoPublishYouTube}
                onChange={(e) => setAutoPublishYouTube(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 bg-white text-red-600 focus:ring-red-500 cursor-pointer"
              />
              <label htmlFor="auto-pub" className="text-xs text-slate-800 font-semibold cursor-pointer flex items-center gap-1.5">
                <YouTubeIcon className="h-3.5 w-3.5 text-red-600 fill-current" />
                <span>Automatically publish to YouTube once rendered</span>
              </label>
            </div>
            <span className="text-[11px] text-slate-500 font-medium">Requires connected YouTube channel</span>
          </div>

          {/* Step 2 Actions */}
          <div className="flex items-center justify-between pt-2">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(1)}
              className="border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900 px-4 py-2 text-xs flex items-center gap-1.5 rounded-lg"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Idea</span>
            </Button>

            <Button
              variant="primary"
              onClick={handleStartGeneration}
              disabled={isSubmitting || !topic.trim()}
              className="h-10 px-6 text-xs font-semibold rounded-lg bg-[#6c5ce7] hover:bg-[#5b4bc4] text-white shadow-xs"
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
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-slate-900">
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
                          ? "border-emerald-300 text-emerald-700 bg-emerald-50"
                          : isFailed
                          ? "border-rose-300 text-rose-700 bg-rose-50"
                          : "border-purple-300 text-[#6c5ce7] bg-purple-50"
                      }`}
                    >
                      {activeJob.status}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-slate-600 font-medium mt-0.5">{getStageName(activeJob?.status)}</p>
              </div>

              {activeJob && (
                <div className="text-right">
                  <span className="text-lg font-bold text-slate-900">{activeJob.progress_pct}%</span>
                  <span className="text-xs text-slate-500 font-medium block">completed</span>
                </div>
              )}
            </div>

            {/* Progress Bar */}
            {activeJob && (
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    isCompleted
                      ? "bg-emerald-500"
                      : isFailed
                      ? "bg-rose-500"
                      : "bg-[#6c5ce7]"
                  }`}
                  style={{ width: `${activeJob.progress_pct || 0}%` }}
                />
              </div>
            )}

            {/* Pipeline Stage Indicators */}
            {isRendering && (
              <div className="grid grid-cols-4 gap-2 pt-1 text-[11px] text-slate-500 font-medium">
                <span className={activeJob?.status === "scripting" ? "text-[#6c5ce7] font-bold" : ""}>
                  1. Scripting
                </span>
                <span className={activeJob?.status === "synthesizing" ? "text-[#6c5ce7] font-bold" : ""}>
                  2. Voiceover
                </span>
                <span className={activeJob?.status === "sourcing_media" ? "text-[#6c5ce7] font-bold" : ""}>
                  3. Visuals
                </span>
                <span className={activeJob?.status === "rendering" ? "text-[#6c5ce7] font-bold" : ""}>
                  4. Assembly
                </span>
              </div>
            )}
          </div>

          {/* Video Preview Center */}
          <div className="flex flex-col items-center justify-center p-6 rounded-xl bg-white border border-slate-200/80 shadow-xs">
            {videoSrc && isCompleted ? (
              <div className="w-full flex flex-col items-center space-y-4">
                <div
                  className={`relative rounded-xl overflow-hidden bg-black border border-slate-200 shadow-md ${
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
                    <Button variant="secondary" size="sm" className="h-9 px-4 text-xs font-semibold rounded-lg flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800">
                      <Download className="w-3.5 h-3.5" />
                      <span>Download MP4</span>
                    </Button>
                  </a>

                  <Button
                    variant="primary"
                    size="sm"
                    onClick={onOpenSocialModal}
                    className="h-9 px-4 text-xs font-semibold rounded-lg flex items-center gap-2 bg-[#6c5ce7] hover:bg-[#5b4bc4] text-white shadow-xs"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Publish to Channels</span>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentStep(1)}
                    className="border-slate-200 text-slate-700 hover:bg-slate-50 text-xs h-9 px-4 rounded-lg"
                  >
                    <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                    <span>Create New Video</span>
                  </Button>
                </div>
              </div>
            ) : isRendering ? (
              <div
                className={`w-full flex flex-col items-center justify-center rounded-xl bg-slate-50 border border-slate-200 p-8 text-center space-y-4 ${
                  videoFormat === "short"
                    ? "max-w-[320px] aspect-[9/16]"
                    : "max-w-[640px] aspect-[16/9]"
                }`}
              >
                <Loader2 className="w-8 h-8 text-[#6c5ce7] animate-spin" />
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-slate-900">Engine Processing</p>
                  <p className="text-xs text-slate-600 font-medium max-w-xs">{getStageName(activeJob?.status)}</p>
                </div>
                <div className="text-[11px] text-slate-600 font-medium">
                  Zero-OpEx compute pipeline active
                </div>
              </div>
            ) : isFailed ? (
              <div className="text-center py-12 space-y-4">
                <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-slate-900">Video Generation Failed</p>
                  <p className="text-xs text-slate-600 font-medium max-w-sm mx-auto">
                    {activeJob?.error_message || "An error occurred during video rendering."}
                  </p>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setCurrentStep(2)}
                  className="rounded-lg text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold"
                >
                  Return to Settings
                </Button>
              </div>
            ) : (
              <div className="text-center py-12 space-y-3">
                <Film className="w-10 h-10 text-slate-400 mx-auto" />
                <p className="text-sm font-semibold text-slate-600">No active render job</p>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setCurrentStep(1)}
                  className="rounded-lg text-xs font-semibold bg-[#6c5ce7] hover:bg-[#5b4bc4] text-white shadow-xs"
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
