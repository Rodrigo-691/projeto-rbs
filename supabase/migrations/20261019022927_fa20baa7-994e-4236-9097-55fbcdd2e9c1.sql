ALTER TABLE public.sponsors ADD COLUMN IF NOT EXISTS cnpj text;

CREATE OR REPLACE FUNCTION public.guard_sponsor_update()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not public.has_role(auth.uid(),'admin_rbs') then
    if new.name is distinct from old.name or new.quota is distinct from old.quota or new.segment is distinct from old.segment
       or new.contact_name is distinct from old.contact_name or new.contact_phone is distinct from old.contact_phone or new.notes is distinct from old.notes
       or new.cnpj is distinct from old.cnpj then
      raise exception 'Somente a RBS pode alterar estes dados';
    end if;
  end if;
  new.updated_at = now();
  return new;
end $function$;

CREATE TABLE IF NOT EXISTS public.contract_signers (
  id uuid not null default gen_random_uuid() primary key,
  sponsor_id uuid not null references public.sponsors(id) on delete cascade,
  name text not null,
  email text,
  document text,
  created_by uuid default auth.uid(),
  created_by_email text default public.current_email(),
  created_at timestamp with time zone not null default now()
);
GRANT SELECT, INSERT, DELETE ON public.contract_signers TO authenticated;
GRANT ALL ON public.contract_signers TO service_role;
ALTER TABLE public.contract_signers ENABLE ROW LEVEL SECURITY;
DO $$
begin
  if not exists (select 1 from pg_policies where tablename='contract_signers' and policyname='view signers') then
    create policy "view signers" on public.contract_signers for select to authenticated using (public.can_access_sponsor(sponsor_id));
  end if;
  if not exists (select 1 from pg_policies where tablename='contract_signers' and policyname='insert signers') then
    create policy "insert signers" on public.contract_signers for insert to authenticated with check (public.can_access_sponsor(sponsor_id));
  end if;
  if not exists (select 1 from pg_policies where tablename='contract_signers' and policyname='delete signers') then
    create policy "delete signers" on public.contract_signers for delete to authenticated using (public.can_access_sponsor(sponsor_id));
  end if;
end $$;

DROP TRIGGER IF EXISTS audit_signers ON public.contract_signers;
CREATE TRIGGER audit_signers AFTER INSERT OR DELETE ON public.contract_signers FOR EACH ROW EXECUTE FUNCTION public.log_change();
DROP TRIGGER IF EXISTS audit_sponsors_del ON public.sponsors;
CREATE TRIGGER audit_sponsors_del AFTER DELETE ON public.sponsors FOR EACH ROW EXECUTE FUNCTION public.log_change();