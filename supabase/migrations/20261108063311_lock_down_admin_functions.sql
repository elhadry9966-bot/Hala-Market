/*
# Lock down admin-only database functions

1. Summary
- Removes public API access to the user-role function and the click report function.
- Administrators still get the click report through the signed-in admin session.
- User-role changes remain possible only through the server-side user management function.

2. Security changes
- `set_catalog_user_role`: EXECUTE revoked from anon and authenticated. Only service_role can call it.
- `get_admin_click_report`: EXECUTE revoked from anon. authenticated keeps access, and the function still checks for an administrator internally.
- `is_catalog_admin`: unchanged. Product visibility rules for visitors depend on it.

3. Notes
- Supabase grants EXECUTE on new public functions to anon and authenticated by default. Revoking from PUBLIC alone does not remove those, so the roles are revoked explicitly.
- Re-running this migration is safe.
*/

REVOKE ALL ON FUNCTION public.set_catalog_user_role(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.set_catalog_user_role(uuid, text) TO service_role;

REVOKE ALL ON FUNCTION public.get_admin_click_report(date, date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_admin_click_report(date, date) TO authenticated;
