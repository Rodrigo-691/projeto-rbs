CREATE TABLE public.media_imports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name text NOT NULL,
  imported_by uuid DEFAULT auth.uid(),
  imported_by_email text DEFAULT public.current_email(),
  rows_ok integer NOT NULL DEFAULT 0,
  rows_error integer NOT NULL DEFAULT 0,
  errors jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.media_imports TO authenticated;
GRANT ALL ON public.media_imports TO service_role;
ALTER TABLE public.media_imports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin view imports" ON public.media_imports FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin_rbs'));
CREATE POLICY "admin insert imports" ON public.media_imports FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin_rbs'));