-- PostMatic Supabase PostgreSQL Database Schema
-- Run this script in the Supabase Dashboard SQL Editor (https://supabase.com/dashboard)

-- 1. Users Table (Extends Supabase auth.users or stores profile metadata)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Video Jobs Table (Tracks automated video generation pipeline state)
CREATE TABLE IF NOT EXISTS public.video_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    topic TEXT NOT NULL,
    target_duration INTEGER DEFAULT 25,
    voice TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    progress_pct INTEGER NOT NULL DEFAULT 0,
    video_url TEXT,
    duration_seconds DOUBLE PRECISION,
    file_size_bytes BIGINT,
    script_data JSONB,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Social Accounts Table (Stores OAuth 2.0 access & refresh tokens for social publishing)
CREATE TABLE IF NOT EXISTS public.social_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    platform TEXT NOT NULL, -- 'youtube' or 'tiktok'
    account_name TEXT,
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_user_platform UNIQUE(user_id, platform)
);

-- 4. Create Indexes for performance
CREATE INDEX IF NOT EXISTS idx_video_jobs_user_id ON public.video_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_video_jobs_status ON public.video_jobs(status);
CREATE INDEX IF NOT EXISTS idx_social_accounts_user_id ON public.social_accounts(user_id);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_accounts ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies for users table
DROP POLICY IF EXISTS "Allow users to read own profile" ON public.users;
CREATE POLICY "Allow users to read own profile" ON public.users
    FOR SELECT USING (auth.uid() = id OR auth.uid() IS NULL);

DROP POLICY IF EXISTS "Allow users to update own profile" ON public.users;
CREATE POLICY "Allow users to update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- 7. RLS Policies for video_jobs table
DROP POLICY IF EXISTS "Allow public read access to video_jobs" ON public.video_jobs;
CREATE POLICY "Allow public read access to video_jobs" ON public.video_jobs
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert access to video_jobs" ON public.video_jobs;
CREATE POLICY "Allow public insert access to video_jobs" ON public.video_jobs
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update access to video_jobs" ON public.video_jobs;
CREATE POLICY "Allow public update access to video_jobs" ON public.video_jobs
    FOR UPDATE USING (true);

-- 8. RLS Policies for social_accounts table
DROP POLICY IF EXISTS "Allow users to manage own social accounts" ON public.social_accounts;
CREATE POLICY "Allow users to manage own social accounts" ON public.social_accounts
    FOR ALL USING (auth.uid() = user_id);

-- 9. Automatic Profile Creation Trigger on Auth Sign-Up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', '')
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        avatar_url = EXCLUDED.avatar_url,
        updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT OR UPDATE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 10. Enable Supabase Realtime Replication for video_jobs
ALTER PUBLICATION supabase_realtime ADD TABLE public.video_jobs;
