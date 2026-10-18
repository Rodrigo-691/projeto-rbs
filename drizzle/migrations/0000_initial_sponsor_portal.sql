CREATE TYPE public.app_role AS ENUM ('admin_rbs');
CREATE TYPE public.quota_level AS ENUM ('master','subcota_g','subcota');

CREATE TABLE public.admin_emails (email text PRIMARY KEY);
CREATE TABLE public.user_roles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
CREATE TABLE public.sponsors (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  quota public.quota_level DEFAULT 'subcota' NOT NULL,
  segment text, contact_name text, contact_phone text, notes text,
  signer_name text, signer_email text, signer_document text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);
CREATE TABLE public.sponsor_members (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  sponsor_id uuid NOT NULL REFERENCES public.sponsors(id) ON DELETE CASCADE,
  email text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE (sponsor_id, email)
);
CREATE TABLE public.quota_modules (
  quota public.quota_level NOT NULL, tab_key text NOT NULL,
  PRIMARY KEY (quota, tab_key)
);
CREATE TABLE public.audit_log (
  id bigserial PRIMARY KEY,
  sponsor_id uuid, actor_email text,
  table_name text NOT NULL, action text NOT NULL, summary text,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;
CREATE FUNCTION public.current_email() RETURNS text LANGUAGE sql STABLE AS $$
  select lower(coalesce(auth.jwt() ->> 'email',''))
$$;
CREATE FUNCTION public.can_access_sponsor(_sponsor_id uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  select public.has_role(auth.uid(),'admin_rbs')
    or exists (select 1 from public.sponsor_members m where m.sponsor_id = _sponsor_id and lower(m.email) = public.current_email())
$$;
CREATE FUNCTION public.is_email_allowed(_email text) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  select exists (select 1 from public.admin_emails where lower(email) = lower(_email))
      or exists (select 1 from public.sponsor_members where lower(email) = lower(_email))
      or not exists (select 1 from public.user_roles)
$$;

CREATE TABLE public.media_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  sponsor_id uuid NOT NULL REFERENCES public.sponsors(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind = ANY (ARRAY['material','report','post_link'])),
  channel text, title text NOT NULL, body text, url text, reach integer,
  created_by uuid DEFAULT auth.uid(),
  created_by_email text DEFAULT public.current_email(),
  created_at timestamptz DEFAULT now() NOT NULL
);
CREATE TABLE public.sponsor_files (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  sponsor_id uuid NOT NULL REFERENCES public.sponsors(id) ON DELETE CASCADE,
  tab text NOT NULL, category text NOT NULL, file_name text NOT NULL,
  storage_path text NOT NULL, size_bytes bigint DEFAULT 0 NOT NULL, mime_type text,
  uploaded_by uuid DEFAULT auth.uid(),
  uploaded_by_email text DEFAULT public.current_email(),
  created_at timestamptz DEFAULT now() NOT NULL
);
CREATE TABLE public.survey_questions (
  sponsor_id uuid PRIMARY KEY REFERENCES public.sponsors(id) ON DELETE CASCADE,
  q1 text, q2 text, q3 text,
  locked boolean DEFAULT false NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);
CREATE TABLE public.survey_results (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  sponsor_id uuid NOT NULL REFERENCES public.sponsors(id) ON DELETE CASCADE,
  question text NOT NULL, answer text NOT NULL, percent numeric NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

GRANT ALL ON public.admin_emails, public.user_roles, public.sponsors, public.sponsor_members, public.quota_modules, public.audit_log, public.media_items, public.sponsor_files, public.survey_questions, public.survey_results TO authenticated, service_role;
GRANT ALL ON SEQUENCE public.audit_log_id_seq TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_email_allowed(text) TO anon;

CREATE FUNCTION public.guard_sponsor_update() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
begin
  if not public.has_role(auth.uid(),'admin_rbs') then
    if new.name is distinct from old.name or new.quota is distinct from old.quota or new.segment is distinct from old.segment
       or new.contact_name is distinct from old.contact_name or new.contact_phone is distinct from old.contact_phone or new.notes is distinct from old.notes then
      raise exception 'Somente a RBS pode alterar estes dados';
    end if;
  end if;
  new.updated_at = now();
  return new;
end $$;
CREATE FUNCTION public.log_change() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
declare r jsonb; sid uuid; s text;
begin
  r := to_jsonb(coalesce(new, old));
  sid := coalesce((r->>'sponsor_id')::uuid, case when tg_table_name = 'sponsors' then (r->>'id')::uuid end);
  s := coalesce(r->>'file_name', r->>'title', r->>'email', r->>'question', r->>'name', '');
  insert into public.audit_log (sponsor_id, actor_email, table_name, action, summary)
  values (sid, nullif(public.current_email(),''), tg_table_name, lower(tg_op), s);
  return coalesce(new, old);
end $$;
CREATE FUNCTION public.handle_new_user() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
begin
  if not exists (select 1 from public.user_roles where role = 'admin_rbs')
     or exists (select 1 from public.admin_emails where lower(email) = lower(new.email)) then
    insert into public.user_roles (user_id, role) values (new.id, 'admin_rbs') on conflict do nothing;
    insert into public.admin_emails (email) values (lower(new.email)) on conflict do nothing;
  end if;
  return new;
end $$;

CREATE TRIGGER audit_files AFTER INSERT OR DELETE ON public.sponsor_files FOR EACH ROW EXECUTE FUNCTION public.log_change();
CREATE TRIGGER audit_media AFTER INSERT OR DELETE ON public.media_items FOR EACH ROW EXECUTE FUNCTION public.log_change();
CREATE TRIGGER audit_members AFTER INSERT OR DELETE ON public.sponsor_members FOR EACH ROW EXECUTE FUNCTION public.log_change();
CREATE TRIGGER audit_sponsors AFTER INSERT OR UPDATE ON public.sponsors FOR EACH ROW EXECUTE FUNCTION public.log_change();
CREATE TRIGGER audit_survey_q AFTER INSERT OR UPDATE ON public.survey_questions FOR EACH ROW EXECUTE FUNCTION public.log_change();
CREATE TRIGGER audit_survey_r AFTER INSERT OR DELETE ON public.survey_results FOR EACH ROW EXECUTE FUNCTION public.log_change();
CREATE TRIGGER trg_guard_sponsor BEFORE UPDATE ON public.sponsors FOR EACH ROW EXECUTE FUNCTION public.guard_sponsor_update();
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

ALTER TABLE public.admin_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsor_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quota_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsor_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins manage admin emails" ON public.admin_emails TO authenticated USING (public.has_role(auth.uid(),'admin_rbs')) WITH CHECK (public.has_role(auth.uid(),'admin_rbs'));
CREATE POLICY "own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "view own sponsor" ON public.sponsors FOR SELECT TO authenticated USING (public.can_access_sponsor(id));
CREATE POLICY "admin insert sponsor" ON public.sponsors FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin_rbs'));
CREATE POLICY "update sponsor" ON public.sponsors FOR UPDATE TO authenticated USING (public.can_access_sponsor(id)) WITH CHECK (public.can_access_sponsor(id));
CREATE POLICY "admin delete sponsor" ON public.sponsors FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin_rbs'));
CREATE POLICY "view members" ON public.sponsor_members FOR SELECT TO authenticated USING (public.can_access_sponsor(sponsor_id));
CREATE POLICY "admin manage members ins" ON public.sponsor_members FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin_rbs'));
CREATE POLICY "admin manage members del" ON public.sponsor_members FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin_rbs'));
CREATE POLICY "read quota modules" ON public.quota_modules FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin write quota modules" ON public.quota_modules TO authenticated USING (public.has_role(auth.uid(),'admin_rbs')) WITH CHECK (public.has_role(auth.uid(),'admin_rbs'));
CREATE POLICY "view audit" ON public.audit_log FOR SELECT TO authenticated USING (sponsor_id IS NOT NULL AND public.can_access_sponsor(sponsor_id));
CREATE POLICY "view media" ON public.media_items FOR SELECT TO authenticated USING (public.can_access_sponsor(sponsor_id));
CREATE POLICY "insert media" ON public.media_items FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin_rbs') OR (public.can_access_sponsor(sponsor_id) AND kind = 'material'));
CREATE POLICY "delete media" ON public.media_items FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin_rbs'));
CREATE POLICY "view files" ON public.sponsor_files FOR SELECT TO authenticated USING (public.can_access_sponsor(sponsor_id));
CREATE POLICY "insert files" ON public.sponsor_files FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin_rbs') OR (public.can_access_sponsor(sponsor_id) AND category = ANY (ARRAY['material','miv','logo','briefing'])));
CREATE POLICY "delete files" ON public.sponsor_files FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin_rbs') OR (public.can_access_sponsor(sponsor_id) AND uploaded_by = auth.uid()));
CREATE POLICY "view survey q" ON public.survey_questions FOR SELECT TO authenticated USING (public.can_access_sponsor(sponsor_id));
CREATE POLICY "insert survey q" ON public.survey_questions FOR INSERT TO authenticated WITH CHECK (public.can_access_sponsor(sponsor_id));
CREATE POLICY "update survey q" ON public.survey_questions FOR UPDATE TO authenticated USING (public.can_access_sponsor(sponsor_id) AND (NOT locked OR public.has_role(auth.uid(),'admin_rbs'))) WITH CHECK (public.can_access_sponsor(sponsor_id));
CREATE POLICY "view results" ON public.survey_results FOR SELECT TO authenticated USING (public.can_access_sponsor(sponsor_id));
CREATE POLICY "admin insert results" ON public.survey_results FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin_rbs'));
CREATE POLICY "admin delete results" ON public.survey_results FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin_rbs'));

INSERT INTO public.admin_emails (email) VALUES ('fodacjrbd@gmail.com') ON CONFLICT DO NOTHING;
INSERT INTO public.quota_modules (quota, tab_key)
SELECT q, t FROM unnest(enum_range(NULL::public.quota_level)) q,
 unnest(ARRAY['perfil','aplicacoes','midia','cortesias','credenciamento','pesquisa','contrato']) t
ON CONFLICT DO NOTHING;

CREATE POLICY "sponsor files read" ON storage.objects FOR SELECT TO authenticated USING (bucket_id='sponsor-files' AND public.can_access_sponsor(((storage.foldername(name))[1])::uuid));
CREATE POLICY "sponsor files insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id='sponsor-files' AND public.can_access_sponsor(((storage.foldername(name))[1])::uuid));
CREATE POLICY "sponsor files delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id='sponsor-files' AND (public.has_role(auth.uid(),'admin_rbs') OR owner = auth.uid()));