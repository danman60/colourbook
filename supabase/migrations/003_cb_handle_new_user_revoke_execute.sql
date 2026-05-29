-- 003 — Security hardening: cb_handle_new_user is a trigger-only SECURITY
-- DEFINER function, but the default PUBLIC EXECUTE grant let the anon and
-- authenticated roles call it directly via /rest/v1/rpc/cb_handle_new_user
-- (flagged by Supabase security advisor). Triggers fire the function regardless
-- of EXECUTE grants, so revoking direct access closes the hole without affecting
-- signup profile creation (verified: post-revoke signup still creates a profile).
REVOKE EXECUTE ON FUNCTION public.cb_handle_new_user() FROM PUBLIC, anon, authenticated;
