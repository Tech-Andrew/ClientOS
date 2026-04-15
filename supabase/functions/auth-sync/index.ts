import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import * as jose from "https://esm.sh/jose@5.2.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * ClientFlow OS - Auth Synchronizer (Identity Bridge)
 * This Edge Function synchronizes Apple identities from Firebase into Supabase.
 * Enforces server-side JWT verification for high-fidelity security.
 */
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { idToken, provider = 'apple' } = await req.json();

    if (!idToken) {
      throw new Error("ClientFlow Security Error: Missing ID Token for identity synchronization.");
    }

    // 1. Initialize Supabase Admin (Single Source of Truth)
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // 2. Securely Verify Firebase Token (Remote Public Key Check)
    // Firebase Public Keys: https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com
    // We use 'jose' to handle the FETCH and VERIFY sequence against Google's OIDC keys.
    const JWKS = jose.createRemoteJWKSet(new URL(`https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com`));
    
    // The Firebase Project ID from ENV must match the 'aud' claim
    const projectId = Deno.env.get("FIREBASE_PROJECT_ID") || "clientos-dc899";
    
    const { payload } = await jose.jwtVerify(idToken, JWKS, {
      issuer: `https://securetoken.google.com/${projectId}`,
      audience: projectId,
    });

    const { email, name, picture, sub: firebaseUid } = payload;

    if (!email) {
      throw new Error("ClientFlow Security Error: Identity payload is missing a verified email address.");
    }

    console.log(`[AuthSync] Identity Verified Successfully: ${email} (UID: ${firebaseUid})`);

    // 3. Resolve identity in Supabase Auth
    const { data: existingUser } = await supabaseAdmin.auth.admin.getUserByEmail(email);
    let supabaseUserId;

    if (!existingUser?.user) {
      // 4. Create fresh Supabase Auth identity
      const { data, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: { 
          firebase_uid: firebaseUid, 
          full_name: name, 
          avatar_url: picture,
          auth_provider: provider 
        },
      });

      if (createError) throw createError;
      supabaseUserId = data.user.id;
    } else {
      supabaseUserId = existingUser.user.id;
    }

    // 5. Hard-sync metadata to the 'clients' registry
    // This ensures all app data references the Supabase user ID.
    const { error: upsertError } = await supabaseAdmin
      .from("clients")
      .upsert({
        user_id: supabaseUserId,
        name: name || email.split("@")[0],
        email: email,
        status: "active",
        auth_provider: provider,
        firebase_uid: provider === 'apple' ? firebaseUid : null,
        avatar_initial: (name || email).charAt(0).toUpperCase(),
      }, { onConflict: 'user_id' });

    if (upsertError) throw upsertError;

    return new Response(JSON.stringify({ 
      success: true, 
      userId: supabaseUserId,
      message: "Identity synchronization verified and complete."
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("[AuthSync Secure Error]", error.message);
    return new Response(JSON.stringify({ error: `Verification Failed: ${error.message}` }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
