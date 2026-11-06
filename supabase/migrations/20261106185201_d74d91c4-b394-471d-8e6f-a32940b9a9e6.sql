CREATE OR REPLACE FUNCTION public.lock_survey_on_sponsor_save()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin_rbs') THEN
    NEW.locked := true;
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.lock_survey_on_sponsor_save() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS lock_survey_on_sponsor_save ON public.survey_questions;
CREATE TRIGGER lock_survey_on_sponsor_save BEFORE INSERT OR UPDATE ON public.survey_questions
FOR EACH ROW EXECUTE FUNCTION public.lock_survey_on_sponsor_save();