-- Add courtesy_quota_rules to sponsors table to track quota breakdown by sector and ticket type
ALTER TABLE public.sponsors
ADD COLUMN IF NOT EXISTS courtesy_quota_rules jsonb DEFAULT '[]'::jsonb;
