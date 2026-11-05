CREATE TABLE public.sponsor_tab_overrides (
  sponsor_id uuid NOT NULL REFERENCES public.sponsors(id) ON DELETE CASCADE,
  tab_key text NOT NULL,
  allowed boolean NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (sponsor_id, tab_key)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sponsor_tab_overrides TO authenticated;
GRANT ALL ON public.sponsor_tab_overrides TO service_role;
ALTER TABLE public.sponsor_tab_overrides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "view overrides" ON public.sponsor_tab_overrides FOR SELECT TO authenticated USING (public.can_access_sponsor(sponsor_id));
CREATE POLICY "admin manage overrides" ON public.sponsor_tab_overrides FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin_rbs')) WITH CHECK (public.has_role(auth.uid(),'admin_rbs'));
CREATE TRIGGER audit_sponsor_tab_overrides AFTER INSERT OR UPDATE OR DELETE ON public.sponsor_tab_overrides FOR EACH ROW EXECUTE FUNCTION public.log_change();

CREATE OR REPLACE FUNCTION public.quota_allows(_sponsor_id uuid, _tab_key text) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  select public.has_role(auth.uid(),'admin_rbs')
    or (
      public.can_access_sponsor(_sponsor_id)
      and coalesce(
        (select o.allowed from public.sponsor_tab_overrides o where o.sponsor_id = _sponsor_id and o.tab_key = _tab_key),
        exists (
          select 1 from public.sponsors s
          join public.quota_modules q on q.quota = s.quota and q.tab_key = _tab_key
          where s.id = _sponsor_id
        )
      )
    )
$$;
REVOKE ALL ON FUNCTION public.quota_allows(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.quota_allows(uuid, text) TO authenticated, service_role;