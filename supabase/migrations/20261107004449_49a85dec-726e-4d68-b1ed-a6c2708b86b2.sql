CREATE TABLE public.media_material_replies (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 sponsor_id uuid NOT NULL REFERENCES public.sponsors(id) ON DELETE CASCADE,
 media_item_id uuid NOT NULL,
 title text NOT NULL DEFAULT 'Resposta RBS',
 body text NOT NULL CHECK (length(btrim(body)) > 0),
 file_name text,
 storage_path text,
 size_bytes bigint NOT NULL DEFAULT 0,
 mime_type text,
 created_by uuid NOT NULL DEFAULT auth.uid(),
 created_by_email text DEFAULT public.current_email(),
 created_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT reply_material_sponsor_fk FOREIGN KEY (media_item_id, sponsor_id) REFERENCES public.media_items(id, sponsor_id) ON DELETE CASCADE,
 CONSTRAINT reply_attachment_complete CHECK ((file_name IS NULL AND storage_path IS NULL AND mime_type IS NULL AND size_bytes = 0) OR (file_name IS NOT NULL AND storage_path IS NOT NULL AND mime_type IS NOT NULL AND size_bytes >= 0 AND storage_path LIKE sponsor_id::text || '/comprovacao/%'))
);
GRANT SELECT, INSERT, DELETE ON public.media_material_replies TO authenticated;
GRANT ALL ON public.media_material_replies TO service_role;
ALTER TABLE public.media_material_replies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "view material replies" ON public.media_material_replies FOR SELECT TO authenticated USING (public.can_access_sponsor(sponsor_id));
CREATE POLICY "admin insert material replies" ON public.media_material_replies FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin_rbs') AND public.can_access_sponsor(sponsor_id) AND created_by = auth.uid() AND EXISTS (SELECT 1 FROM public.media_items m WHERE m.id = media_item_id AND m.sponsor_id = media_material_replies.sponsor_id AND m.kind = 'material'));
CREATE POLICY "admin delete material replies" ON public.media_material_replies FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin_rbs') AND public.can_access_sponsor(sponsor_id));
CREATE INDEX media_material_replies_material_idx ON public.media_material_replies(sponsor_id, media_item_id);
CREATE TRIGGER audit_material_replies AFTER INSERT OR UPDATE OR DELETE ON public.media_material_replies FOR EACH ROW EXECUTE FUNCTION public.log_change();