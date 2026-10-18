CREATE OR REPLACE FUNCTION public.quota_allows(_sponsor_id uuid, _tab_key text) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
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
GRANT EXECUTE ON FUNCTION public.quota_allows(uuid, text) TO authenticated;

DROP POLICY "view survey q" ON public.survey_questions;
CREATE POLICY "view survey q" ON public.survey_questions FOR SELECT TO authenticated USING (public.quota_allows(sponsor_id,'pesquisa'));
DROP POLICY "insert survey q" ON public.survey_questions;
CREATE POLICY "insert survey q" ON public.survey_questions FOR INSERT TO authenticated WITH CHECK (public.quota_allows(sponsor_id,'pesquisa'));
DROP POLICY "update survey q" ON public.survey_questions;
CREATE POLICY "update survey q" ON public.survey_questions FOR UPDATE TO authenticated USING (public.quota_allows(sponsor_id,'pesquisa') AND (NOT locked OR public.has_role(auth.uid(),'admin_rbs'))) WITH CHECK (public.quota_allows(sponsor_id,'pesquisa'));
DROP POLICY "view results" ON public.survey_results;
CREATE POLICY "view results" ON public.survey_results FOR SELECT TO authenticated USING (public.quota_allows(sponsor_id,'pesquisa'));
DROP POLICY "view files" ON public.sponsor_files;
CREATE POLICY "view files" ON public.sponsor_files FOR SELECT TO authenticated USING (public.can_access_sponsor(sponsor_id) AND (category <> 'resultado_pesquisa' OR public.quota_allows(sponsor_id,'pesquisa')));