-- Lucky Egg Launch Control — Post-Launch skeleton schema
-- Run this once in Supabase: Project > SQL Editor > New Query > paste > Run

create table if not exists post_launch_skus (
  id bigint generated always as identity primary key,
  sku text not null,
  product text not null,
  market text not null,
  launch_date date,
  days_since_launch int,
  amazon_stage int,
  tiktok_stage int,
  tiktok_strategy text,
  rating numeric(2,1),
  review_count int,
  vine_enrolled int,
  vine_reviews int,
  lifetime_sales int,
  launch_strategy text,
  is_placeholder boolean default true,
  updated_at timestamptz default now()
);

-- Clear any previous seed before re-running
delete from post_launch_skus;

insert into post_launch_skus
  (sku, product, market, launch_date, days_since_launch, is_placeholder)
values
  ('LE73', 'Morally Unhinged', 'UK', '2026-04-03', 145, true),
  ('LE59', 'Ding or Doom', 'UK', '2026-03-02', 177, true),
  ('LE61', 'MMC Dublin Castle', 'UK', '2026-03-02', 177, true),
  ('LE44', 'Party Hoppers', 'UK', '2026-03-23', 156, true),
  ('LE47', 'MMC Buckingham Palace', 'UK', '2026-03-24', 155, true),
  ('LE77', 'Code Quackers', 'UK', '2026-04-16', 132, true),
  ('LE75', 'GTM Poolside', 'UK', '2026-04-21', 127, true),
  ('LE76', 'GTM Karaoke Duel', 'UK', '2026-04-21', 127, true),
  ('LE37', 'Roast or Boast', 'UK', '2026-05-20', 98, true),
  ('LE26', 'Poppin Panic', 'UK', '2026-06-05', 82, true),
  ('LE86', 'Cockeyed', 'UK', '2026-06-11', 76, true),
  ('LE78', 'That''s a Bit Sus', 'UK', '2026-03-01', 178, true),
  ('LE112', 'Confusing Confessions', 'UK', '2026-06-29', 58, true),
  ('LE62', 'Senseless', 'UK', '2026-07-01', 56, true),
  ('LE44', 'Party Hoppers', 'US', '2026-02-12', 195, true),
  ('LE59', 'Ding or Doom', 'US', '2026-03-02', 177, true),
  ('LE75', 'GTM Poolside', 'US', '2026-07-15', 42, true),
  ('LE76', 'GTM Battle', 'US', '2026-05-20', 98, true),
  ('LE26W', 'Poppin Panic (Walmart Exclusive)', 'US', '2026-03-23', 156, true),
  ('LE61', 'MMC Dublin Castle', 'US', '2026-04-17', 131, true),
  ('LE47', 'MMC Buckingham Palace', 'US', '2026-04-24', 124, true),
  ('LE78', 'Thats a Bit Sus (Walmart Exclusive)', 'US', '2026-05-01', 117, true),
  ('LE38', 'Lyrical Rewind', 'US', '2026-05-15', 103, true);

-- amazon_stage, tiktok_stage, rating, review_count, lifetime_sales etc are
-- left NULL — these get filled in once Nova/Neon data is wired up. is_placeholder
-- stays true until real numbers overwrite a row, so the UI can flag it clearly.
