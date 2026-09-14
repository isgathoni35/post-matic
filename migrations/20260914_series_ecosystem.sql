-- Series Ecosystem Migration
-- Adds series table, show bible JSONB storage, and links video_jobs to series episodes

-- 1. Create series table
CREATE TABLE IF NOT EXISTS public.series (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    genre TEXT,
    tone TEXT,
    bible_json JSONB DEFAULT '{}'::jsonb,
    episode_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Alter video_jobs to associate with a series and episode number
ALTER TABLE public.video_jobs
    ADD COLUMN IF NOT EXISTS series_id UUID REFERENCES public.series(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS episode_number INTEGER;

-- 3. Create indexes for quick series lookups
CREATE INDEX IF NOT EXISTS idx_series_user_id ON public.series(user_id);
CREATE INDEX IF NOT EXISTS idx_video_jobs_series_id ON public.video_jobs(series_id);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.series ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for series
DROP POLICY IF EXISTS "Allow users to read series" ON public.series;
CREATE POLICY "Allow users to read series" ON public.series
    FOR SELECT USING (auth.uid() = user_id OR auth.uid() IS NULL);

DROP POLICY IF EXISTS "Allow users to insert series" ON public.series;
CREATE POLICY "Allow users to insert series" ON public.series
    FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL);

DROP POLICY IF EXISTS "Allow users to update series" ON public.series;
CREATE POLICY "Allow users to update series" ON public.series
    FOR UPDATE USING (auth.uid() = user_id OR auth.uid() IS NULL);

DROP POLICY IF EXISTS "Allow users to delete series" ON public.series;
CREATE POLICY "Allow users to delete series" ON public.series
    FOR DELETE USING (auth.uid() = user_id OR auth.uid() IS NULL);
