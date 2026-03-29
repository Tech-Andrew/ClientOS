-- Securely allows an authenticated user to delete their own account
-- We use SECURITY DEFINER so that the function runs with the privileges of the creator (postgres superuser)
-- This allows it to delete from auth.users bypassing RLS momentarily, but securely restricted by auth.uid().

CREATE OR REPLACE FUNCTION public.delete_user_account()
RETURNS void AS $$
BEGIN
  -- Double check the user is actually authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Delete the user from auth.users (cascade will handle public tables like clients, projects, etc.)
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
