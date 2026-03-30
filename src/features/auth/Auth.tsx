import { useState } from "react";
import { motion } from "framer-motion";
import { Zap, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/shared/hooks/useAuth";
import { toast } from "sonner";

const Auth = () => {
  const { user, loading } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [useMagicLink, setUseMagicLink] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [confirmMsg, setConfirmMsg] = useState("");

  if (loading) return null;
  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setConfirmMsg("");
    setSubmitting(true);

    try {
      if (useMagicLink) {
        const { error } = await supabase.auth.signInWithOtp({ 
          email,
          options: { emailRedirectTo: window.location.origin + "/auth" }
        });
        if (error) throw error;
        setConfirmMsg("Magic Link dispatched! Check your terminal.");
      } else if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin + "/auth" },
        });
        if (error) throw error;
        setConfirmMsg("Check your email to confirm your account.");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#03031B] flex flex-col items-center justify-center p-6 selection:bg-[#2B63EB]/30">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[440px]"
      >
        <div className="flex justify-center mb-12">
          <img 
            src="/brand/logo-full.png" 
            alt="ClientFlow OS" 
            className="h-10 object-contain drop-shadow-[0_0_15px_rgba(43,99,235,0.4)]" 
          />
        </div>

        <div className="panel-card !p-10">
          <div className="mb-10 text-center">
            <h2 className="text-[28px] font-extrabold text-[#F8FAFC] tracking-tighter mb-3">
              {useMagicLink ? "Magic Terminal" : (isLogin ? "System Access" : "Create Account")}
            </h2>
            <p className="text-[14px] text-[#94A3B8] leading-relaxed max-w-[280px] mx-auto">
              {useMagicLink 
                ? "Passwordless authentication via secure email bridge." 
                : (isLogin ? "Authenticate to access the ClientFlow operating environment." : "Initialize your workspace in the next generation of client operations.")}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-[#64748B] uppercase tracking-[0.1em] ml-1">Email Terminal</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-[#03031B]/50 border border-[#1E293B] rounded-[12px] text-[15px] text-[#F8FAFC] placeholder:text-[#334155] focus:outline-none focus:border-[#2B63EB] focus:ring-4 focus:ring-[#2B63EB]/10 transition-all"
                placeholder="you@company.com"
              />
            </div>
            {!useMagicLink && (
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-[#64748B] uppercase tracking-[0.1em] ml-1">Secure Passkey</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-4 py-3 bg-[#03031B]/50 border border-[#1E293B] rounded-[12px] text-[15px] text-[#F8FAFC] placeholder:text-[#334155] focus:outline-none focus:border-[#2B63EB] focus:ring-4 focus:ring-[#2B63EB]/10 transition-all"
                  placeholder="••••••••"
                />
              </div>
            )}

            {error && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }} 
                animate={{ opacity: 1, x: 0 }}
                className="bg-[#EF4444]/10 border border-[#EF4444]/20 p-3 rounded-[10px]"
              >
                <p className="text-[13px] text-[#EF4444] font-medium">{error}</p>
              </motion.div>
            )}
            
            {confirmMsg && <p className="text-[13px] text-[#10B983] font-medium text-center">{confirmMsg}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full btn-primary !py-3.5 disabled:opacity-50 flex items-center justify-center gap-2 group"
            >
              {submitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <span className="font-bold tracking-tight">{useMagicLink ? "SEND MAGIC LINK" : (isLogin ? "LOGIN TO OS" : "INITIALIZE ACCOUNT")}</span>
                  <Zap className="w-4 h-4 fill-white group-hover:scale-125 transition-transform" />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => { setUseMagicLink(!useMagicLink); setError(""); setConfirmMsg(""); }}
              className="w-full text-[13px] text-[#64748B] hover:text-[#2B63EB] font-bold transition-all uppercase tracking-[0.1em]"
            >
              {useMagicLink ? "Use Passkey Identity" : "Try Magic Link Access"}
            </button>
          </form>

          <div className="relative my-10">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-[#1E293B]/50"></span>
            </div>
            <div className="relative flex justify-center text-[10px] font-black uppercase tracking-[0.2em] text-[#475569] mb-6">
              <span className="bg-[#030B1E] px-4">Federated Auth</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { id: "google", name: "Google", icon: (
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z" />
                  </svg>
                )},
                { id: "azure", name: "Microsoft", icon: (
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M1 1h10v10H1z" opacity="0.9"/><path fill="currentColor" d="M13 1h10v10H13z" opacity="0.9"/><path fill="currentColor" d="M1 13h10v10H1z" opacity="0.9"/><path fill="currentColor" d="M13 13h10v10H13z" opacity="0.9"/>
                  </svg>
                )},
                { id: "apple", name: "Apple", icon: (
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M17.05 20.28c-.96.95-2.04 1.72-3.41 1.72-1.34 0-1.84-.73-3.41-.73s-2.11.73-3.4 0c-1.29-.73-2.31-1.46-3.35-2.82C3 17.5 2 15 2 12.5c0-2.5 1.5-4.5 3-5.5 1-.67 2.31-.75 3.31-.75.7 0 1.25.13 2.11.13.86 0 1.4-.13 2.12-.13 1 0 2.35.08 3.38.75 1.5 1 3 3 3 5.5 0 .08 0 .16-.01.24-1.2.6-2.03 1.83-2.03 3.26 0 1.34.72 2.51 1.79 3.14-.15.42-.35.8-.57 1.14M12 6c.07-1.34.62-2.5 1.4-3.4C14.18 1.7 15.35 1 16.5 1c.07 1.34-.6 2.5-1.4 3.4-.78.9-1.95 1.6-3.1 1.6z"/>
                  </svg>
                )},
                { id: "github", name: "GitHub", icon: (
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2.2c-3.3.7-4-1.4-4-1.4-.6-1.4-1.4-1.8-1.4-1.8-1-.7.1-.7.1-.7 1.2.1 1.9 1.2 1.9 1.2 1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-6 0-1.2.5-2.3 1.3-3.1-.2-.4-.6-1.6.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.7 1.6.3 2.8.1 3.2.9.8 1.3 1.9 1.3 3.2 0 4.6-2.8 5.6-5.5 5.9.4.3.8 1 .8 2.2V23c0 .3.2.7.8.6A12 12 0 0 0 12 .3"/>
                  </svg>
                )}
              ].map((provider) => (
                <button
                  key={provider.id}
                  onClick={async () => {
                    setSubmitting(true);
                    try {
                      const { signIn } = await import("@/core/services/auth-service");
                      await signIn(provider.id as any);
                      if (provider.id === 'apple') {
                        toast.success("Apple identity verification dispatched.");
                        window.location.href = "/";
                      }
                    } catch (err: any) {
                      setError(err.message);
                    } finally {
                      setSubmitting(false);
                    }
                  }}
                  className="flex items-center justify-center gap-2 py-3 bg-[#03031B]/30 border border-[#1E293B] rounded-[12px] text-[13px] font-bold hover:bg-[#1E293B]/50 hover:border-[#2B63EB]/50 transition-all text-[#F8FAFC]"
                >
                  {provider.icon}
                  {provider.name}
                </button>
              ))}
            </div>
          </div>

          <p className="text-[14px] text-[#94A3B8] mt-10 text-center font-medium">
            {isLogin ? "New to ClientFlow?" : "Already initialized?"}{" "}
            <button
              onClick={() => { setIsLogin(!isLogin); setError(""); setConfirmMsg(""); }}
              className="text-[#2B63EB] font-bold hover:text-[#22D0EE] transition-colors decoration-2 underline-offset-4 hover:underline"
            >
              {isLogin ? "Get Started" : "Sign In"}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;
