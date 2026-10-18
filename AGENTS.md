<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

# Project rules

- Every sponsor data table carries `sponsor_id`, and RLS uses `can_access_sponsor()` — isolation lives in the database, not the UI.
- Quota → visible tabs is configured in `quota_modules`; never hardcode quota checks in components.
- Audit history is written by DB triggers (`log_change`) on every data table; add the trigger when adding a table.
- Files live in the private `sponsor-files` bucket under `{sponsor_id}/...`, metadata in `sponsor_files`, downloads via short-lived signed URLs.
- Sign-up is limited to `admin_emails` / `sponsor_members`; Admin RBS is granted only to emails listed in `admin_emails` (no first-user bootstrap).
- Tab menu definitions live in `src/lib/portal.ts` (`TABS`) so the menu mirrors the commercial plan in one place.
- `drizzle/baseline/` holds schema snapshots for reference only — never apply or edit them; real migrations go through the migration tool.
- `src/integrations/supabase/types.ts` must keep describing the portal's target schema (the baseline tables, enums and functions) even while the live backend is empty, so the app still typechecks; regenerate it only after the schema has been applied.
