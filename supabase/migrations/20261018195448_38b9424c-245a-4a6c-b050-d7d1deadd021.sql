CREATE OR REPLACE FUNCTION public.quota_allows(_sponsor_id uuid, _tab_key text) RETURNS boolean
LANGUAGE sql STABLE SECURITY INVOKER SET search_path TO 'public' AS $$
  select public.has_role(auth.uid(),'admin_rbs')
    or (
      public.can_access_sponsor(_sponsor_id)
      and exists (
        select 1
        from public.sponsors s
        join public.quota_modules q on q.quota = s.quota and q.tab_key = _tab_key
        where s.id = _sponsor_id
      )
    )
$$;
REVOKE ALL ON FUNCTION public.quota_allows(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.quota_allows(uuid, text) TO authenticated;