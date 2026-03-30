import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import {
  User,
  Lock,
  Bell,
  Palette,
  Shield,
  Save,
  Eye,
  EyeOff,
  Link as LinkIcon,
  Server,
  AlertTriangle,
  Plus,
  Trash2,
} from "lucide-react";
import AppLayout from "@/shared/components/layout/AppLayout";
import { useAuth } from "@/shared/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Switch } from "@/shared/components/ui/switch";
import { useTheme } from "next-themes";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

const TABS = [
  { id: "profile", label: "Profile", icon: User },
  { id: "security", label: "Security", icon: Lock },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "integrations", label: "Integrations", icon: LinkIcon },
  { id: "danger", label: "Danger Zone", icon: AlertTriangle },
];

const Settings = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("profile");
  const { theme, setTheme } = useTheme();

  // Profile state
  const [displayName, setDisplayName] = useState(
    user?.user_metadata?.full_name ?? ""
  );
  const [savingProfile, setSavingProfile] = useState(false);

  // Security state
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  // Notifications state
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifApp, setNotifApp] = useState(true);
  const [notifMarketing, setNotifMarketing] = useState(false);
  const [savingNotif, setSavingNotif] = useState(false);

  // Integrations state
  const [newWebhookUrl, setNewWebhookUrl] = useState("");

  // Appearance state (others maintained locally for demo if not in DB)
  const [compactMode, setCompactMode] = useState(false);
  const [animations, setAnimations] = useState(true);

  // Danger Zone state
  const [deleteInput, setDeleteInput] = useState("");
  const [deleting, setDeleting] = useState(false);

  // Load user settings on mount
  useEffect(() => {
    if (!user) return;
    const fetchSettings = async () => {
      const { data, error } = await supabase
        .from("user_settings")
        .select("*")
        .eq("user_id", user.id)
        .single();
      
      if (data && !error) {
        setNotifEmail(data.email_notifications);
        setNotifApp(data.app_notifications);
        setNotifMarketing(data.marketing_emails);
        // We sync theme with DB
        if (data.theme) setTheme(data.theme);
      }
    };
    fetchSettings();
  }, [user, setTheme]);

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: displayName },
      });
      if (error) throw error;
      toast.success("Profile updated successfully!");
    } catch (err: any) {
      toast.error(err.message ?? "Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPw !== confirmPw) {
      toast.error("New passwords do not match");
      return;
    }
    if (newPw.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setSavingPw(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPw });
      if (error) throw error;
      toast.success("Password changed successfully!");
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
    } catch (err: any) {
      toast.error(err.message ?? "Failed to change password");
    } finally {
      setSavingPw(false);
    }
  };

  const handleSaveNotifications = async () => {
    if (!user) return;
    setSavingNotif(true);
    try {
      const payload = {
        user_id: user.id,
        email_notifications: notifEmail,
        app_notifications: notifApp,
        marketing_emails: notifMarketing,
      };

      const { error } = await supabase
        .from("user_settings")
        .upsert(payload, { onConflict: "user_id" });

      if (error) throw error;
      toast.success("Notification preferences saved!");
    } catch (error: any) {
      toast.error(error.message || "Failed to save settings. Run migrations first.");
    } finally {
      setSavingNotif(false);
    }
  };

  const handleThemeChange = async (newTheme: string) => {
    setTheme(newTheme);
    if (!user) return;
    try {
      await supabase
        .from("user_settings")
        .upsert({ user_id: user.id, theme: newTheme }, { onConflict: "user_id" });
    } catch (err) {
      // ignore
    }
  }

  // --- Integrations Queries ---
  const { data: apiKeys, isLoading: loadingKeys } = useQuery({
    queryKey: ["apiKeys"],
    queryFn: async () => {
      const { data, error } = await supabase.from("api_keys").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: activeTab === "integrations",
  });

  const { data: webhooks, isLoading: loadingWebhooks } = useQuery({
    queryKey: ["webhooks"],
    queryFn: async () => {
      const { data, error } = await supabase.from("webhooks").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: activeTab === "integrations",
  });

  const generateApiKey = useMutation({
    mutationFn: async () => {
      const key = `sk_test_${Math.random().toString(36).substr(2, 24)}`;
      const { error } = await supabase.from("api_keys").insert([{
        user_id: user!.id,
        name: "New API Key",
        prefix: key.slice(0, 12) + "...",
        key_hash: "hashed", // In production, hash this properly
      }]);
      if (error) throw error;
      return key;
    },
    onSuccess: (key) => {
      queryClient.invalidateQueries({ queryKey: ["apiKeys"] });
      // In real prod, show modal with key once
      toast.success(`Key Generated: ${key} (Save this!)`, { duration: 10000 });
    },
    onError: (err: any) => toast.error(err.message)
  });

  const revokeApiKey = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("api_keys").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["apiKeys"] }),
    onError: (err: any) => toast.error(err.message)
  });

  const createWebhook = useMutation({
    mutationFn: async (endpoint: string) => {
      const secret = `whsec_${Math.random().toString(36).substr(2, 24)}`;
      const { error } = await supabase.from("webhooks").insert([{
        user_id: user!.id,
        name: "Webhook",
        endpoint_url: endpoint,
        secret_key: secret,
      }]);
      if (error) throw error;
      return secret;
    },
    onSuccess: (secret) => {
      queryClient.invalidateQueries({ queryKey: ["webhooks"] });
      toast.success(`Webhook added! Secret: ${secret}`, { duration: 10000 });
      setNewWebhookUrl("");
    },
    onError: (err: any) => toast.error(err.message)
  });

  const deleteWebhook = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("webhooks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["webhooks"] }),
    onError: (err: any) => toast.error(err.message)
  });

  // --- Danger Zone ---
  const handleExportData = async () => {
    toast.info("Preparing data export...");
    try {
      const [{ data: profile }, { data: clients }, { data: projects }, { data: tasks }, { data: invoices }] = await Promise.all([
        supabase.auth.getUser(),
        supabase.from("clients").select("*"),
        supabase.from("projects").select("*"),
        supabase.from("tasks").select("*"),
        supabase.from("invoices").select("*")
      ]);

      const exportObject = {
        user: profile?.user?.email,
        timestamp: new Date().toISOString(),
        clients: clients || [],
        projects: projects || [],
        tasks: tasks || [],
        invoices: invoices || []
      };
      const blob = new Blob([JSON.stringify(exportObject, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `client-flow-export-${new Date().getTime()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Data export downloaded.");
    } catch (err: any) {
      toast.error("Export failed");
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteInput !== "DELETE") {
      toast.error("Please type DELETE to confirm");
      return;
    }
    setDeleting(true);
    try {
      const { error } = await (supabase.rpc as any)('delete_user_account');
      if (error) throw error;
      
      toast.success("Account deleted successfully.");
      await supabase.auth.signOut();
      navigate('/auth');
    } catch (err: any) {
      toast.error(err.message || "Failed to delete account");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-[32px] font-bold text-[#F8FAFC] tracking-tight">
            Settings
          </h1>
          <p className="text-[#94A3B8] text-[14px] mt-1 font-medium">
            Manage your account preferences
          </p>
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar tabs */}
          <motion.aside
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.05 }}
            className="lg:w-56 flex-shrink-0"
          >
            <div className="panel-card p-2 space-y-1 bg-[#030B1E]">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-[8px] text-[13px] font-bold uppercase tracking-wider transition-all duration-200 ${
                    activeTab === tab.id
                      ? tab.id === 'danger' ? "bg-[#F54444]/10 text-[#F54444] border border-[#F54444]/20" : "bg-[#1E293B] text-[#F8FAFC] border border-[#334155]/30 shadow-lg"
                      : "text-[#475569] hover:text-[#F8FAFC] hover:bg-[#1E293B]/50"
                  }`}
                >
                  <tab.icon
                    className={`w-4 h-4 flex-shrink-0 ${
                      activeTab === tab.id ? (tab.id === 'danger' ? "text-[#F54444]" : "text-[#2B63EB]") : ""
                    }`}
                  />
                  {tab.label}
                </button>
              ))}
            </div>
          </motion.aside>

          {/* Content */}
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="flex-1"
          >
            {/* ── PROFILE ── */}
            {activeTab === "profile" && (
              <div className="panel-card p-8 space-y-8">
                <div className="flex items-center gap-4 border-b border-[#1E293B] pb-6 mb-2">
                  <div className="p-3 rounded-[10px] bg-[#1E293B] border border-[#334155]/30">
                    <User className="w-6 h-6 text-[#2B63EB]" />
                  </div>
                  <div>
                    <h2 className="text-[20px] font-bold text-[#F8FAFC] tracking-tight">
                      Profile
                    </h2>
                    <p className="text-[12px] text-[#475569] font-bold uppercase tracking-widest mt-1">Personal Identity</p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 rounded-full bg-[#1E293B] border-2 border-[#2B63EB]/40 flex items-center justify-center text-3xl font-bold text-[#F8FAFC] shadow-xl">
                    {(displayName || user?.email || "?")[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-[14px] font-bold text-[#F8FAFC]">
                      {user?.email}
                    </p>
                    <p className="text-[12px] text-[#475569] font-medium mt-1">
                      Account email · Read-only access
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2.5">
                    <Label htmlFor="display-name" className="text-[12px] font-bold text-[#475569] uppercase tracking-widest">Display Name</Label>
                    <Input
                      id="display-name"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="bg-[#0F172A] border border-[#1E293B] text-[#F8FAFC] focus:border-[#2B63EB] rounded-[10px] py-6"
                      placeholder="Your name"
                    />
                  </div>
                </div>

                <button
                  onClick={handleSaveProfile}
                  disabled={savingProfile}
                  className="flex items-center gap-2 btn-primary px-8"
                >
                  <Save className="w-4 h-4" />
                  {savingProfile ? "Saving…" : "Save Profile"}
                </button>
              </div>
            )}

            {/* ── SECURITY ── */}
            {activeTab === "security" && (
              <div className="panel-card p-8 space-y-8">
                <div className="flex items-center gap-4 border-b border-[#1E293B] pb-6 mb-2">
                  <div className="p-3 rounded-[10px] bg-[#1E293B] border border-[#334155]/30">
                    <Shield className="w-6 h-6 text-[#2B63EB]" />
                  </div>
                  <div>
                    <h2 className="text-[20px] font-bold text-[#F8FAFC] tracking-tight">
                      Security
                    </h2>
                    <p className="text-[12px] text-[#475569] font-bold uppercase tracking-widest mt-1">Access Control</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2.5">
                    <Label htmlFor="new-pw" className="text-[12px] font-bold text-[#475569] uppercase tracking-widest">New Password</Label>
                    <div className="relative">
                      <Input
                        id="new-pw"
                        type={showNew ? "text" : "password"}
                        value={newPw}
                        onChange={(e) => setNewPw(e.target.value)}
                        className="bg-[#0F172A] border border-[#1E293B] text-[#F8FAFC] focus:border-[#2B63EB] rounded-[10px] py-6 pr-12"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNew(!showNew)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#475569] hover:text-[#F8FAFC] transition-colors"
                      >
                        {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2.5">
                    <Label htmlFor="confirm-pw" className="text-[12px] font-bold text-[#475569] uppercase tracking-widest">Confirm Password</Label>
                    <div className="relative">
                      <Input
                        id="confirm-pw"
                        type={showConfirm ? "text" : "password"}
                        value={confirmPw}
                        onChange={(e) => setConfirmPw(e.target.value)}
                        className="bg-[#0F172A] border border-[#1E293B] text-[#F8FAFC] focus:border-[#2B63EB] rounded-[10px] py-6 pr-12"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#475569] hover:text-[#F8FAFC] transition-colors"
                      >
                        {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleChangePassword}
                  disabled={savingPw || !newPw || !confirmPw}
                  className="flex items-center gap-2 btn-primary px-8"
                >
                  <Lock className="w-4 h-4" />
                  {savingPw ? "Updating…" : "Change Password"}
                </button>
              </div>
            )}

            {/* ── NOTIFICATIONS ── */}
            {activeTab === "notifications" && (
              <div className="panel-card p-8 space-y-8">
                <div className="flex items-center gap-4 border-b border-[#1E293B] pb-6 mb-2">
                  <div className="p-3 rounded-[10px] bg-[#1E293B] border border-[#334155]/30">
                    <Bell className="w-6 h-6 text-[#2B63EB]" />
                  </div>
                  <div>
                    <h2 className="text-[20px] font-bold text-[#F8FAFC] tracking-tight">
                      Notifications
                    </h2>
                    <p className="text-[12px] text-[#475569] font-bold uppercase tracking-widest mt-1">Alert Channels</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between py-5 border-b border-[#1E293B] px-2 hover:bg-[#0F172A] rounded-[8px] transition-colors">
                    <div>
                      <p className="text-[14px] font-bold text-[#F8FAFC]">Email Notifications</p>
                      <p className="text-[12px] text-[#475569] font-medium mt-0.5">Receive performance metrics and alerts via email</p>
                    </div>
                    <Switch checked={notifEmail} onCheckedChange={setNotifEmail} />
                  </div>
                  <div className="flex items-center justify-between py-5 border-b border-[#1E293B] px-2 hover:bg-[#0F172A] rounded-[8px] transition-colors">
                    <div>
                      <p className="text-[14px] font-bold text-[#F8FAFC]">In-App Notifications</p>
                      <p className="text-[12px] text-[#475569] font-medium mt-0.5">Push alerts system directly inside the workspace</p>
                    </div>
                    <Switch checked={notifApp} onCheckedChange={setNotifApp} />
                  </div>
                  <div className="flex items-center justify-between py-5 px-2 hover:bg-[#0F172A] rounded-[8px] transition-colors">
                    <div>
                      <p className="text-[14px] font-bold text-[#F8FAFC]">Client Activity</p>
                      <p className="text-[12px] text-[#475569] font-medium mt-0.5">Alert when clients view portals or documents</p>
                    </div>
                    <Switch checked={notifMarketing} onCheckedChange={setNotifMarketing} />
                  </div>
                </div>

                <button onClick={handleSaveNotifications} disabled={savingNotif} className="flex items-center gap-2 btn-primary px-8">
                  <Save className="w-4 h-4" />
                  {savingNotif ? "Saving..." : "Save Preferences"}
                </button>
              </div>
            )}

            {/* ── APPEARANCE ── */}
            {activeTab === "appearance" && (
              <div className="panel-card p-8 space-y-8">
                <div className="flex items-center gap-4 border-b border-[#1E293B] pb-6 mb-2">
                  <div className="p-3 rounded-[10px] bg-[#1E293B] border border-[#334155]/30">
                    <Palette className="w-6 h-6 text-[#2B63EB]" />
                  </div>
                  <div>
                    <h2 className="text-[20px] font-bold text-[#F8FAFC] tracking-tight">
                      Appearance
                    </h2>
                    <p className="text-[12px] text-[#475569] font-bold uppercase tracking-widest mt-1">Interface Styling</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-[12px] font-bold text-[#475569] uppercase tracking-widest">Global Theme</p>
                  <div className="grid grid-cols-3 gap-4">
                    <button 
                      onClick={() => handleThemeChange("light")}
                      className={`py-4 rounded-[10px] text-[13px] font-bold transition-all ${theme === "light" ? "bg-[#2B63EB] text-[#F8FAFC] shadow-lg shadow-[#2B63EB]/20" : "bg-[#1E293B] text-[#475569] hover:text-[#F8FAFC]"}`}
                    >
                      Light
                    </button>
                    <button 
                      onClick={() => handleThemeChange("dark")}
                      className={`py-4 rounded-[10px] text-[13px] font-bold transition-all ${theme === "dark" || theme === "system" ? "bg-[#2B63EB] text-[#F8FAFC] shadow-lg shadow-[#2B63EB]/20" : "bg-[#1E293B] text-[#475569] hover:text-[#F8FAFC]"}`}
                    >
                      Dark
                    </button>
                    <button 
                      onClick={() => handleThemeChange("system")}
                      className={`py-4 rounded-[10px] text-[13px] font-bold transition-all ${theme === "system" ? "bg-[#2B63EB] text-[#F8FAFC] shadow-lg shadow-[#2B63EB]/20" : "bg-[#1E293B] text-[#475569] hover:text-[#F8FAFC]"}`}
                    >
                      System
                    </button>
                  </div>
                </div>

                <div className="space-y-2 pt-4">
                  <div className="flex items-center justify-between py-5 border-b border-[#1E293B] px-2 hover:bg-[#0F172A] rounded-[8px] transition-colors">
                    <div>
                      <p className="text-[14px] font-bold text-[#F8FAFC]">Compact UI</p>
                      <p className="text-[12px] text-[#475569] font-medium mt-0.5">High-density layout for power users</p>
                    </div>
                    <Switch checked={compactMode} onCheckedChange={setCompactMode} />
                  </div>
                  <div className="flex items-center justify-between py-5 px-2 hover:bg-[#0F172A] rounded-[8px] transition-colors">
                    <div>
                      <p className="text-[14px] font-bold text-[#F8FAFC]">Motion Effects</p>
                      <p className="text-[12px] text-[#475569] font-medium mt-0.5">Toggle smooth interface animations</p>
                    </div>
                    <Switch checked={animations} onCheckedChange={setAnimations} />
                  </div>
                </div>

                <button onClick={() => toast.success("Appearance saved (Local Only)")} className="btn-primary px-8">
                  <Save className="w-4 h-4 mr-2" />
                  Apply Changes
                </button>
              </div>
            )}

            {/* ── INTEGRATIONS ── */}
            {activeTab === "integrations" && (
              <div className="panel-card p-8 space-y-8">
                <div className="flex items-center gap-4 border-b border-[#1E293B] pb-6 mb-2">
                  <div className="p-3 rounded-[10px] bg-[#1E293B] border border-[#334155]/30">
                    <Server className="w-6 h-6 text-[#2B63EB]" />
                  </div>
                  <div>
                    <h2 className="text-[20px] font-bold text-[#F8FAFC] tracking-tight">
                      Integrations
                    </h2>
                    <p className="text-[12px] text-[#475569] font-bold uppercase tracking-widest mt-1">API & Webhooks</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-[14px] font-bold text-[#F8FAFC]">Key Management</h3>
                      <p className="text-[12px] text-[#475569] mt-1 font-medium">Generate and manage secret access keys</p>
                    </div>
                    <button onClick={() => generateApiKey.mutate()} disabled={generateApiKey.isPending} className="btn-primary py-2 px-4 text-[12px]">
                      <Plus className="w-4 h-4 mr-1" /> Generate
                    </button>
                  </div>

                  {loadingKeys ? (
                    <div className="py-8 text-center text-[#475569] font-bold uppercase tracking-widest text-[11px]">Syncing...</div>
                  ) : apiKeys && apiKeys.length > 0 ? (
                    <div className="space-y-3">
                      {apiKeys.map(key => (
                        <div key={key.id} className="flex items-center justify-between bg-[#0F172A] p-4 rounded-[10px] border border-[#1E293B]">
                          <div>
                            <p className="text-[13px] font-bold text-[#F8FAFC]">API Key</p>
                            <p className="text-[11px] text-[#475569] font-mono mt-0.5">{key.prefix}</p>
                          </div>
                          <button className="p-2.5 rounded-[8px] hover:bg-[#F54444]/10 text-[#475569] hover:text-[#F54444] transition-all" 
                            onClick={() => revokeApiKey.mutate(key.id)} disabled={revokeApiKey.isPending}>
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center p-8 bg-[#0F172A]/50 rounded-[10px] border border-dashed border-[#1E293B] text-[12px] text-[#475569] font-medium">
                      Vault is empty. Generate a key to begin integration.
                    </div>
                  )}
                </div>

                <div className="space-y-6 pt-6 border-t border-[#1E293B]">
                  <div className="flex flex-col gap-4">
                    <div>
                      <h3 className="text-[14px] font-bold text-[#F8FAFC]">Event Webhooks</h3>
                      <p className="text-[12px] text-[#475569] mt-1 font-medium">Push real-time workspace updates to external systems</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Input
                        placeholder="https://api.yoursite.com/webhook"
                        value={newWebhookUrl}
                        onChange={(e) => setNewWebhookUrl(e.target.value)}
                        className="bg-[#0F172A] border border-[#1E293B] text-[#F8FAFC] focus:border-[#2B63EB] rounded-[10px] py-6 flex-1"
                      />
                      <button onClick={() => createWebhook.mutate(newWebhookUrl)} disabled={!newWebhookUrl || createWebhook.isPending} className="btn-primary py-3.5 px-6 whitespace-nowrap">
                        Add Target
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── DANGER ZONE ── */}
            {activeTab === "danger" && (
              <div className="panel-card p-8 space-y-8 border-[#F54444]/20 bg-[#F54444]/5">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-[10px] bg-[#F54444]/10 border border-[#F54444]/20">
                    <AlertTriangle className="w-6 h-6 text-[#F54444]" />
                  </div>
                  <div>
                    <h2 className="text-[20px] font-bold text-[#F54444] tracking-tight">
                      Danger Zone
                    </h2>
                    <p className="text-[12px] text-[#F54444]/60 font-bold uppercase tracking-widest mt-1">Irreversible Actions</p>
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="flex items-center justify-between py-6 border-b border-[#F54444]/10">
                    <div className="pr-8">
                      <p className="text-[14px] font-bold text-[#F8FAFC]">Export Data Vault</p>
                      <p className="text-[12px] text-[#475569] mt-1 font-medium">Download an offline JSON copy of all your clients, invoices, and activity logs.</p>
                    </div>
                    <button className="px-6 py-2.5 rounded-[8px] bg-[#1E293B] hover:bg-[#334155] text-[#F8FAFC] text-[13px] font-bold transition-all" onClick={handleExportData}>
                      Export JSON
                    </button>
                  </div>

                  <div className="pt-2">
                    <p className="text-[14px] font-bold text-[#F8FAFC]">Delete Workspace</p>
                    <p className="text-[12px] text-[#475569] mt-2 mb-6 font-medium leading-relaxed">
                      All data will be permanently wiped from the ClientFlow grid immediately. This operation cannot be undone by support staff.
                    </p>
                    
                    <div className="space-y-4 max-w-sm">
                      <Label className="text-[11px] text-[#475569] font-bold uppercase tracking-widest">Type <span className="text-[#F8FAFC]">DELETE</span> to confirm</Label>
                      <div className="flex gap-3">
                        <Input 
                          value={deleteInput} 
                          onChange={(e) => setDeleteInput(e.target.value)} 
                          placeholder="DELETE"
                          className="bg-[#0F172A] border-[#F54444]/20 text-[#F8FAFC] focus:border-[#F54444] rounded-[10px] py-6"
                        />
                        <button 
                          className={`px-6 rounded-[10px] font-bold text-[13px] transition-all bg-[#F54444] text-[#F8FAFC] shadow-lg shadow-[#F54444]/20 hover:scale-[1.02] active:scale-[0.98] ${deleteInput !== "DELETE" || deleting ? "opacity-30 grayscale cursor-not-allowed" : ""}`}
                          disabled={deleteInput !== "DELETE" || deleting}
                          onClick={handleDeleteAccount}
                        >
                          {deleting ? "Purging..." : "Confirm Purge"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </motion.div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Settings;
