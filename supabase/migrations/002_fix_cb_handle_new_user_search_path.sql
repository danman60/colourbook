-- 002 — Fix signup onboarding: cb_handle_new_user created no profile row.
--
-- The on_auth_user_created_cb trigger runs as supabase_auth_admin, whose
-- search_path is `auth` only. The SECURITY DEFINER function had no explicit
-- search_path, so the unqualified `cb_profiles` reference resolved to nothing,
-- the INSERT raised "relation cb_profiles does not exist", and the
-- EXCEPTION WHEN OTHERS block swallowed it silently. Result: every signup
-- produced an auth user with NO cb_profiles row, and the (protected) layout
-- redirects profile-less users to /login — so new users could never enter the app.
--
-- Fix: pin search_path = public and fully-qualify the table. Keep the
-- non-blocking exception handler but surface failures via RAISE WARNING
-- instead of swallowing them silently.
CREATE OR REPLACE FUNCTION public.cb_handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  IF COALESCE(NEW.raw_user_meta_data->>'app', '') IN ('compportal', 'choreobits', '') THEN
    INSERT INTO public.cb_profiles (id, email, full_name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name')
    ON CONFLICT (id) DO NOTHING;
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'cb_handle_new_user failed for %: % (%)', NEW.id, SQLERRM, SQLSTATE;
  RETURN NEW;
END;
$function$;
