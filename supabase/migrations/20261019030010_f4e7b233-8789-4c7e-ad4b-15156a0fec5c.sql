ALTER TABLE public.media_items ADD CONSTRAINT media_items_id_sponsor_unique UNIQUE (id, sponsor_id);
ALTER TABLE public.sponsor_files ADD COLUMN media_item_id uuid;
ALTER TABLE public.sponsor_files ADD CONSTRAINT sponsor_files_media_item_sponsor_fkey FOREIGN KEY (media_item_id, sponsor_id) REFERENCES public.media_items (id, sponsor_id) ON DELETE CASCADE;
CREATE INDEX sponsor_files_media_item_idx ON public.sponsor_files(media_item_id);
ALTER POLICY "insert files" ON public.sponsor_files TO authenticated WITH CHECK (
 (public.has_role(auth.uid(), 'admin_rbs'::public.app_role) OR (public.can_access_sponsor(sponsor_id) AND category = ANY (ARRAY['material','miv','logo','briefing']::text[])))
 AND (media_item_id IS NULL OR (category = 'material' AND tab = 'midia' AND EXISTS (
 SELECT 1 FROM public.media_items m WHERE m.id = media_item_id AND m.sponsor_id = sponsor_files.sponsor_id AND m.kind = 'material'
 AND (public.has_role(auth.uid(), 'admin_rbs'::public.app_role) OR m.created_by = auth.uid())
 )))
);