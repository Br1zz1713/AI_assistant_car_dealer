-- Database Update Script (Phase 2 & 4)
-- This script adds the Listings Aggregation and Spotting (Scout) tables.

-- 1. Create Listings table
CREATE TABLE IF NOT EXISTS public.listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_id TEXT NOT NULL,
    source_platform TEXT NOT NULL,
    url TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    price_eur NUMERIC NOT NULL,
    images TEXT[] DEFAULT '{}',
    specs JSONB DEFAULT '{}',
    country TEXT NOT NULL,
    is_new_match BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for listings
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

-- Safety check: Only create policy if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'listings' AND policyname = 'Allow public read access on listings'
    ) THEN
        CREATE POLICY "Allow public read access on listings" ON public.listings FOR SELECT TO public USING (true);
    END IF;
END
$$;

-- 2. Create Upsert Function for Listings
CREATE OR REPLACE FUNCTION public.upsert_listing(
    p_external_id TEXT,
    p_source_platform TEXT,
    p_url TEXT,
    p_title TEXT,
    p_price_eur NUMERIC,
    p_images TEXT[],
    p_specs JSONB,
    p_country TEXT
)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.listings (
    external_id, source_platform, url, title, price_eur, images, specs, country, is_new_match, updated_at
  )
  VALUES (
    p_external_id, p_source_platform, p_url, p_title, p_price_eur, p_images, p_specs, p_country, true, now()
  )
  ON CONFLICT (url) DO UPDATE SET
    price_eur = EXCLUDED.price_eur,
    images = EXCLUDED.images,
    specs = EXCLUDED.specs,
    title = EXCLUDED.title,
    is_new_match = true,
    updated_at = now()
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql;

-- 3. Create spotting_subscriptions table for Car Scout
CREATE TABLE IF NOT EXISTS public.spotting_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    filters JSONB NOT NULL, -- { brand, model, price_max, countries: [] }
    last_check TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for spotting_subscriptions
ALTER TABLE public.spotting_subscriptions ENABLE ROW LEVEL SECURITY;

-- Safety check for subscriptions policy
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'spotting_subscriptions' AND policyname = 'Users can manage their own subscriptions'
    ) THEN
        CREATE POLICY "Users can manage their own subscriptions"
            ON public.spotting_subscriptions
            FOR ALL
            TO authenticated
            USING (auth.uid() = user_id)
            WITH CHECK (auth.uid() = user_id);
    END IF;
END
$$;

-- 4. Favorites Policy fix (Optional but recommended)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'favorites' AND policyname = 'Users can manage their own favorites'
    ) THEN
        CREATE POLICY "Users can manage their own favorites"
            ON public.favorites
            FOR ALL
            TO authenticated
            USING (auth.uid() = user_id)
            WITH CHECK (auth.uid() = user_id);
    END IF;
END
$$;
