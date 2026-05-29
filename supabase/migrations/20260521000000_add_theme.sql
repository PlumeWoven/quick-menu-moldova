-- Add theme column to restaurants
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS theme text not null default 'light' check (theme in ('light', 'dark'));
