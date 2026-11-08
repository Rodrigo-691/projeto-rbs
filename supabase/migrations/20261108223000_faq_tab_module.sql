-- Add faq tab module to quota_modules
INSERT INTO public.quota_modules (quota, tab_key) VALUES
  ('master', 'faq'),
  ('subcota_g', 'faq'),
  ('subcota', 'faq')
ON CONFLICT DO NOTHING;
