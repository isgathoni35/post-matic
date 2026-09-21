-- Series Autopilot Scheduler Migration
-- Adds autonomous daily scheduling, posting frequency, target platforms, and niche styling columns to public.series

-- 1. Alter series table to add scheduling and styling configuration
ALTER TABLE public.series
    ADD COLUMN IF NOT EXISTS autopilot_enabled BOOLEAN DEFAULT false NOT NULL,
    ADD COLUMN IF NOT EXISTS post_frequency_per_day INTEGER DEFAULT 1 NOT NULL CHECK (post_frequency_per_day BETWEEN 1 AND 3),
    ADD COLUMN IF NOT EXISTS preferred_time_utc TEXT DEFAULT '18:00' NOT NULL,
    ADD COLUMN IF NOT EXISTS target_platforms TEXT[] DEFAULT ARRAY['youtube']::TEXT[],
    ADD COLUMN IF NOT EXISTS require_approval BOOLEAN DEFAULT false NOT NULL,
    ADD COLUMN IF NOT EXISTS next_post_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS last_posted_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS niche TEXT DEFAULT 'scary_stories',
    ADD COLUMN IF NOT EXISTS art_style TEXT DEFAULT 'cinematic_dark',
    ADD COLUMN IF NOT EXISTS voice TEXT DEFAULT 'en-US-BrianMultilingualNeural',
    ADD COLUMN IF NOT EXISTS music_track TEXT DEFAULT 'cinematic_mystery',
    ADD COLUMN IF NOT EXISTS subtitle_style TEXT DEFAULT 'hormozi_yellow';

-- 2. Index for high-performance hourly cron querying of due autopilot series
CREATE INDEX IF NOT EXISTS idx_series_autopilot_due ON public.series(autopilot_enabled, next_post_at);
