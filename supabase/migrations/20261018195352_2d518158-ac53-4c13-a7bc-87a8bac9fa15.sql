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

DROP POLICY IF EXISTS "view survey q" ON public.survey_questions;
CREATE POLICY "view survey q" ON public.survey_questions FOR SELECT TO authenticated USING (public.quota_allows(sponsor_id,'pesquisa'));
DROP POLICY IF EXISTS "insert survey q" ON public.survey_questions;
CREATE POLICY "insert survey q" ON public.survey_questions FOR INSERT TO authenticated WITH CHECK (public.quota_allows(sponsor_id,'pesquisa'));
DROP POLICY IF EXISTS "update survey q" ON public.survey_questions;
CREATE POLICY "update survey q" ON public.survey_questions FOR UPDATE TO authenticated USING (public.quota_allows(sponsor_id,'pesquisa') AND (NOT locked OR public.has_role(auth.uid(),'admin_rbs'))) WITH CHECK (public.quota_allows(sponsor_id,'pesquisa'));
DROP POLICY IF EXISTS "view results" ON public.survey_results;
CREATE POLICY "view results" ON public.survey_results FOR SELECT TO authenticated USING (public.quota_allows(sponsor_id,'pesquisa'));
DROP POLICY IF EXISTS "view files" ON public.sponsor_files;
CREATE POLICY "view files" ON public.sponsor_files FOR SELECT TO authenticated USING (public.can_access_sponsor(sponsor_id) AND (category <> 'resultado_pesquisa' OR public.quota_allows(sponsor_id,'pesquisa')));

INSERT INTO public.quota_modules (quota, tab_key) VALUES
 ('master','perfil'),('master','aplicacoes'),('master','midia'),('master','cortesias'),('master','credenciamento'),('master','pesquisa'),('master','contrato'),
 ('subcota_g','perfil'),('subcota_g','aplicacoes'),('subcota_g','midia'),('subcota_g','cortesias'),('subcota_g','credenciamento'),('subcota_g','contrato'),
 ('subcota','perfil'),('subcota','aplicacoes'),('subcota','midia'),('subcota','cortesias'),('subcota','credenciamento'),('subcota','contrato')
ON CONFLICT DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'admin_rbs' FROM auth.users u
JOIN public.admin_emails a ON lower(a.email) = lower(u.email)
ON CONFLICT DO NOTHING;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP POLICY IF EXISTS "sponsor files read" ON storage.objects;
CREATE POLICY "sponsor files read" ON storage.objects FOR SELECT TO authenticated USING (bucket_id='sponsor-files' AND public.can_access_sponsor(((storage.foldername(name))[1])::uuid));
DROP POLICY IF EXISTS "sponsor files insert" ON storage.objects;
CREATE POLICY "sponsor files insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id='sponsor-files' AND public.can_access_sponsor(((storage.foldername(name))[1])::uuid));
DROP POLICY IF EXISTS "sponsor files delete" ON storage.objects;
CREATE POLICY "sponsor files delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id='sponsor-files' AND (public.has_role(auth.uid(),'admin_rbs') OR owner = auth.uid()));