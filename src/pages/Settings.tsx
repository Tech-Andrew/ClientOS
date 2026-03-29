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
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
      a.download = `client-os-export-${new Date().getTime()}.json`;
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
          <h1 className="text-3xl font-heading font-bold text-foreground">
            Settings
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your account preferences
          </p>
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar tabs */}
          <motion.aside
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.05 }}
            className="lg:w-52 flex-shrink-0"
          >
            <div className="glass-card rounded-xl p-2 space-y-1">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    activeTab === tab.id
                      ? tab.id === 'danger' ? "bg-destructive/10 text-destructive" : "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50"
                  }`}
                >
                  <tab.icon
                    className={`w-4 h-4 flex-shrink-0 ${
                      activeTab === tab.id ? (tab.id === 'danger' ? "text-destructive" : "text-primary") : ""
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
              <div className="glass-card rounded-xl p-6 space-y-6">
                <div className="flex items-center gap-3 mb-2">
                  <User className="w-5 h-5 text-primary" />
                  <h2 className="font-heading font-semibold text-foreground text-lg">
                    Profile
                  </h2>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-primary/20 border-2 border-primary/40 flex items-center justify-center text-2xl font-heading font-bold text-primary">
                    {(displayName || user?.email || "?")[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {user?.email}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Account email · cannot be changed here
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="display-name">Display Name</Label>
                    <Input
                      id="display-name"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Your name"
                    />
                  </div>
                </div>

                <Button
                  onClick={handleSaveProfile}
                  disabled={savingProfile}
                  className="flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {savingProfile ? "Saving…" : "Save Profile"}
                </Button>
              </div>
            )}

            {/* ── SECURITY ── */}
            {activeTab === "security" && (
              <div className="glass-card rounded-xl p-6 space-y-6">
                <div className="flex items-center gap-3 mb-2">
                  <Shield className="w-5 h-5 text-primary" />
                  <h2 className="font-heading font-semibold text-foreground text-lg">
                    Security
                  </h2>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-pw">New Password</Label>
                    <div className="relative">
                      <Input
                        id="new-pw"
                        type={showNew ? "text" : "password"}
                        value={newPw}
                        onChange={(e) => setNewPw(e.target.value)}
                        placeholder="At least 6 characters"
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNew(!showNew)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-pw">Confirm New Password</Label>
                    <div className="relative">
                      <Input
                        id="confirm-pw"
                        type={showConfirm ? "text" : "password"}
                        value={confirmPw}
                        onChange={(e) => setConfirmPw(e.target.value)}
                        placeholder="Re-enter new password"
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleChangePassword}
                  disabled={savingPw || !newPw || !confirmPw}
                  className="flex items-center gap-2"
                >
                  <Lock className="w-4 h-4" />
                  {savingPw ? "Updating…" : "Change Password"}
                </Button>
              </div>
            )}

            {/* ── NOTIFICATIONS ── */}
            {activeTab === "notifications" && (
              <div className="glass-card rounded-xl p-6 space-y-6">
                <div className="flex items-center gap-3 mb-2">
                  <Bell className="w-5 h-5 text-primary" />
                  <h2 className="font-heading font-semibold text-foreground text-lg">
                    Notifications
                  </h2>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b border-border/50">
                    <div>
                      <p className="text-sm font-medium text-foreground">Email Notifications</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Receive key updates via email</p>
                    </div>
                    <Switch checked={notifEmail} onCheckedChange={setNotifEmail} />
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-border/50">
                    <div>
                      <p className="text-sm font-medium text-foreground">In-App Notifications</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Show notifications inside the portal</p>
                    </div>
                    <Switch checked={notifApp} onCheckedChange={setNotifApp} />
                  </div>
                  <div className="flex items-center justify-between py-3 border-border/50">
                    <div>
                      <p className="text-sm font-medium text-foreground">Marketing & Updates</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Occasional product news</p>
                    </div>
                    <Switch checked={notifMarketing} onCheckedChange={setNotifMarketing} />
                  </div>
                </div>

                <Button onClick={handleSaveNotifications} disabled={savingNotif} className="flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  {savingNotif ? "Saving..." : "Save Preferences"}
                </Button>
              </div>
            )}

            {/* ── APPEARANCE ── */}
            {activeTab === "appearance" && (
              <div className="glass-card rounded-xl p-6 space-y-6">
                <div className="flex items-center gap-3 mb-2">
                  <Palette className="w-5 h-5 text-primary" />
                  <h2 className="font-heading font-semibold text-foreground text-lg">
                    Appearance
                  </h2>
                </div>

                <div className="space-y-3">
                  <p className="text-sm font-medium text-foreground">Theme Source</p>
                  <div className="flex gap-3 mt-2">
                    <Button variant={theme === "light" ? "default" : "secondary"} onClick={() => handleThemeChange("light")}>Light</Button>
                    <Button variant={theme === "dark" ? "default" : "secondary"} onClick={() => handleThemeChange("dark")}>Dark</Button>
                    <Button variant={theme === "system" ? "default" : "secondary"} onClick={() => handleThemeChange("system")}>System</Button>
                  </div>
                </div>

                <div className="space-y-4 mt-6">
                  <div className="flex items-center justify-between py-3 border-b border-border/50">
                    <div>
                      <p className="text-sm font-medium text-foreground">Compact Mode</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Reduce spacing for denser layout</p>
                    </div>
                    <Switch checked={compactMode} onCheckedChange={setCompactMode} />
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">Animations</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Toggle motion and transitions</p>
                    </div>
                    <Switch checked={animations} onCheckedChange={setAnimations} />
                  </div>
                </div>

                <Button onClick={() => toast.success("Appearance saved (Local Only)")}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Preferences
                </Button>
              </div>
            )}

            {/* ── INTEGRATIONS ── */}
            {activeTab === "integrations" && (
              <div className="glass-card rounded-xl p-6 space-y-6">
                <div className="flex items-center gap-3 mb-2">
                  <Server className="w-5 h-5 text-primary" />
                  <h2 className="font-heading font-semibold text-foreground text-lg">
                    Integrations & API
                  </h2>
                </div>

                <div className="space-y-4 border-b border-border/50 pb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-foreground">API Keys</h3>
                      <p className="text-xs text-muted-foreground mt-1">Manage secret keys for API access</p>
                    </div>
                    <Button size="sm" onClick={() => generateApiKey.mutate()} disabled={generateApiKey.isPending}>
                      <Plus className="w-4 h-4 mr-1" /> Generate Key
                    </Button>
                  </div>

                  {loadingKeys ? (
                    <p className="text-sm text-muted-foreground">Loading keys...</p>
                  ) : apiKeys && apiKeys.length > 0 ? (
                    <div className="space-y-2">
                      {apiKeys.map(key => (
                        <div key={key.id} className="flex items-center justify-between bg-background p-3 rounded-lg border border-border">
                          <div>
                            <p className="text-sm font-medium font-mono">{key.prefix}</p>
                            <p className="text-xs text-muted-foreground">Created {new Date(key.created_at).toLocaleDateString()}</p>
                          </div>
                          <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" 
                            onClick={() => revokeApiKey.mutate(key.id)} disabled={revokeApiKey.isPending}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center p-4 bg-background/50 rounded-lg border border-dashed border-border text-sm text-muted-foreground">
                      No API keys generated
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex flex-col gap-3">
                    <div>
                      <h3 className="text-sm font-medium text-foreground">Webhooks</h3>
                      <p className="text-xs text-muted-foreground mt-1">Push real-time events to your endpoints</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder="https://example.com/webhook"
                        value={newWebhookUrl}
                        onChange={(e) => setNewWebhookUrl(e.target.value)}
                        className="flex-1"
                      />
                      <Button size="sm" onClick={() => createWebhook.mutate(newWebhookUrl)} disabled={!newWebhookUrl || createWebhook.isPending}>
                        <Plus className="w-4 h-4 mr-1" /> Add Endpoint
                      </Button>
                    </div>
                  </div>
                  
                  {loadingWebhooks ? (
                    <p className="text-sm text-muted-foreground">Loading...</p>
                  ) : webhooks && webhooks.length > 0 ? (
                    <div className="space-y-2">
                      {webhooks.map(wh => (
                        <div key={wh.id} className="flex items-center justify-between p-3 bg-background rounded-lg border border-border">
                          <div>
                            <p className="text-sm font-medium">{wh.endpoint_url}</p>
                            <p className="text-xs text-muted-foreground">Status: Active</p>
                          </div>
                          <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" 
                            onClick={() => deleteWebhook.mutate(wh.id)} disabled={deleteWebhook.isPending}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center p-4 bg-background/50 rounded-lg border border-dashed border-border text-sm text-muted-foreground">
                      No webhooks configured
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── DANGER ZONE ── */}
            {activeTab === "danger" && (
              <div className="glass-card rounded-xl p-6 space-y-6 border-destructive/20 bg-destructive/5">
                <div className="flex items-center gap-3 mb-2">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                  <h2 className="font-heading font-semibold text-destructive text-lg">
                    Danger Zone
                  </h2>
                </div>

                <div className="space-y-5">
                  <div className="flex items-center justify-between py-4 border-b border-destructive/10">
                    <div className="pr-4">
                      <p className="text-sm font-medium text-foreground">Export Data</p>
                      <p className="text-xs text-muted-foreground mt-1">Download a JSON copy of all your clients, projects, invoices, and settings.</p>
                    </div>
                    <Button variant="secondary" onClick={handleExportData}>
                      Download JSON
                    </Button>
                  </div>

                  <div className="pt-2">
                    <p className="text-sm font-medium text-foreground">Delete Account</p>
                    <p className="text-xs text-muted-foreground mt-1 mb-4 text-destructive/80">
                      This action is irreversible. All clients, tasks, and data will be permanently wiped from our servers immediately.
                    </p>
                    
                    <div className="space-y-3">
                      <Label className="text-xs text-muted-foreground">Type <span className="font-mono text-foreground font-bold">DELETE</span> to confirm</Label>
                      <div className="flex gap-3">
                        <Input 
                          value={deleteInput} 
                          onChange={(e) => setDeleteInput(e.target.value)} 
                          placeholder="DELETE"
                          className="max-w-[200px]"
                        />
                        <Button 
                          variant="destructive" 
                          disabled={deleteInput !== "DELETE" || deleting}
                          onClick={handleDeleteAccount}
                        >
                          {deleting ? "Deleting..." : "Permanently Delete"}
                        </Button>
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
