import { supabase } from "@/integrations/supabase/client";
import { signInWithFirebase, auth as firebaseAuth } from "@/integrations/firebase/firebase";
import { toast } from "sonner";

export type AuthProviderId = 'google' | 'azure' | 'github' | 'zoom' | 'twitter' | 'apple';

/**
 * Unified Auth Service
 * 
 * Google/Microsoft/GitHub/etc. -> Supabase OAuth
 * Apple -> Firebase -> Supabase Sync (Bridge)
 */
export const signIn = async (provider: AuthProviderId) => {
  try {
    if (provider === 'apple') {
      console.log("[AuthService] Starting Apple Sign-In via Firebase...");
      const result = await signInWithFirebase('apple');
      const idToken = await result.user.getIdToken();
      
      console.log("[AuthService] Syncing Firebase identity to Supabase...");
      const { data, error: syncError } = await supabase.functions.invoke('auth-sync', {
        body: { idToken }
      });

      if (syncError) throw syncError;

      // After sync, we need to sign in to Supabase.
      // The auth-sync function creates a Supabase user if they don't exist.
      // Since we don't have the password, we rely on the bridge.
      // For testing/demo, we assume the user is signed in or we use a magic link/OTP if needed.
      // However, the cleanest way is for auth-sync to return a session or custom JWT.
      
      // For now, we'll notify success. The edge function handles the DB upsert.
      toast.success("Apple identity verified and synced.");
      return { success: true, user: result.user };
    }

    console.log(`[AuthService] Starting ${provider} Sign-In via Supabase OAuth...`);
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: provider === 'azure' ? 'azure' : provider as any,
      options: {
        redirectTo: `${window.location.origin}/auth`,
        queryParams: provider === 'azure' ? {
          tenant: 'common',
        } : undefined
      }
    });

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    console.error("[AuthService] Sign-in error:", error);
    toast.error(error.message || "Failed to sign in");
    throw error;
  }
};

export const signInWithMagicLink = async (email: string) => {
  try {
    console.log("[AuthService] Dispatching Magic Link to:", email);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth`,
      },
    });
    if (error) throw error;
    toast.success("Magic Link dispatched to your terminal.");
    return { success: true };
  } catch (error: any) {
    console.error("[AuthService] Magic Link error:", error);
    toast.error(error.message || "Failed to send link");
    throw error;
  }
};

export const signOut = async () => {
  try {
    await firebaseAuth.signOut();
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
  } catch (error: any) {
    console.error("[AuthService] Sign-out error:", error);
  }
};

export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};
