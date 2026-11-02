CREATE OR REPLACE FUNCTION public.log_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
declare r jsonb; sid uuid; s text;
begin
  r := to_jsonb(coalesce(new, old));
  sid := coalesce((r->>'sponsor_id')::uuid, case when tg_table_name = 'sponsors' then (r->>'id')::uuid end);
  s := coalesce(r->>'file_name', r->>'title', r->>'email', r->>'question', r->>'name', '');
  if tg_table_name = 'sponsor_files' and r->>'category' = 'plano_comercial' then
    s := 'Plano comercial: ' || s;
  end if;
  insert into public.audit_log (sponsor_id, actor_email, table_name, action, summary)
  values (sid, nullif(public.current_email(),''), tg_table_name, lower(tg_op), s);
  return coalesce(new, old);
end $function$;

UPDATE public.audit_log a
SET summary = 'Plano comercial: ' || a.summary
WHERE a.table_name = 'sponsor_files' AND a.action = 'insert'
AND a.summary NOT LIKE 'Plano comercial: %'
AND EXISTS (
  SELECT 1 FROM public.sponsor_files f
  WHERE f.sponsor_id = a.sponsor_id AND f.category = 'plano_comercial'
  AND f.file_name = a.summary AND f.created_at = a.created_at
);

DO $test$
DECLARE sid uuid; created_count integer; plan_count integer;
BEGIN
  BEGIN
    INSERT INTO public.sponsors(name, quota) VALUES ('Teste transacional de histórico', 'subcota') RETURNING id INTO sid;
    INSERT INTO public.sponsor_files(sponsor_id, tab, category, file_name, storage_path, mime_type)
    VALUES (sid, 'perfil', 'plano_comercial', 'teste-historico.pdf', sid::text || '/plano_comercial/teste-historico.pdf', 'application/pdf');
    SELECT count(*) INTO created_count FROM public.audit_log WHERE sponsor_id = sid AND table_name = 'sponsors' AND action = 'insert' AND summary = 'Teste transacional de histórico';
    SELECT count(*) INTO plan_count FROM public.audit_log WHERE sponsor_id = sid AND table_name = 'sponsor_files' AND action = 'insert' AND summary = 'Plano comercial: teste-historico.pdf';
    IF created_count <> 1 OR plan_count <> 1 THEN RAISE EXCEPTION 'Falha no registro automático do cadastro ou do plano comercial'; END IF;
    RAISE SQLSTATE 'ZX001' USING MESSAGE = 'Rollback dos dados temporários após teste bem-sucedido';
  EXCEPTION WHEN SQLSTATE 'ZX001' THEN NULL;
  END;
END $test$;