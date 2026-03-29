import { motion } from "framer-motion";
import { useState, useMemo, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Circle, Clock, DollarSign, Zap, Lock, MessageSquare, Send } from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import { supabase as globalSupabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const tabs = ["Timeline", "Files", "Invoices", "Messages"];

const ClientPortal = () => {
  const { token } = useParams<{ token: string }>();
  const [activeTab, setActiveTab] = useState("Timeline");
  const queryClient = useQueryClient();

  // Create an explicit portal client to send the special header required by the verify_portal_access RLS.
  const portalSupabase = useMemo(() => {
    if (!token) return globalSupabase;
    return createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      global: {
        headers: {
          "x-portal-token": token,
        },
      },
      auth: { persistSession: false },
    });
  }, [token]);

  // Validate token and get client_id (bypassing RLS or using anon policy allowed by the token header)
  const { data: portalData, isLoading: tokenLoading, error: tokenError } = useQuery({
    queryKey: ["portal-token", token],
    queryFn: async () => {
      const { data, error } = await portalSupabase
        .from("client_portal_tokens")
        .select("client_id, expires_at")
        .eq("token", token!)
        .single();
      if (error || !data) throw new Error("Invalid or expired link");
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        throw new Error("This portal link has expired");
      }
      return data;
    },
    enabled: !!token,
    retry: false,
  });

  const clientId = portalData?.client_id;

  const { data: client } = useQuery({
    queryKey: ["portal-client", clientId],
    queryFn: async () => {
      const { data, error } = await portalSupabase.from("clients").select("*").eq("id", clientId!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!clientId,
  });

  const { data: projects = [] } = useQuery({
    queryKey: ["portal-projects", clientId],
    queryFn: async () => {
      const { data } = await portalSupabase.from("projects").select("*").eq("client_id", clientId!);
      return data || [];
    },
    enabled: !!clientId,
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ["portal-tasks", clientId, projects],
    queryFn: async () => {
      const ids = projects.map((p) => p.id);
      if (!ids.length) return [];
      const { data } = await portalSupabase.from("tasks").select("*").in("project_id", ids).order("sort_order");
      return data || [];
    },
    enabled: projects.length > 0,
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ["portal-invoices", clientId],
    queryFn: async () => {
      const { data } = await portalSupabase.from("invoices").select("*").eq("client_id", clientId!);
      return data || [];
    },
    enabled: !!clientId,
  });

  const { data: messages = [] } = useQuery({
    queryKey: ["portal-messages", clientId],
    queryFn: async () => {
      const { data } = await portalSupabase.from("messages").select("*").eq("client_id", clientId!).order("created_at", { ascending: true });
      return data || [];
    },
    enabled: !!clientId,
  });

  useEffect(() => {
    if (!clientId) return;
    const channel = portalSupabase
      .channel(`portal-messages-${clientId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `client_id=eq.${clientId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["portal-messages", clientId] });
        }
      )
      .subscribe();
    return () => { portalSupabase.removeChannel(channel); };
  }, [clientId, portalSupabase, queryClient]);

  const [newMessage, setNewMessage] = useState("");

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const { error } = await portalSupabase.from("messages").insert([{
        client_id: clientId!,
        content,
        sender_type: "client",
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      setNewMessage("");
      queryClient.invalidateQueries({ queryKey: ["portal-messages", clientId] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to send message");
    }
  });

  if (tokenLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (tokenError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="glass-card rounded-2xl p-8 text-center max-w-sm">
          <Lock className="w-10 h-10 text-destructive mx-auto mb-4" />
          <h2 className="font-heading text-xl font-bold text-foreground mb-2">Access Denied</h2>
          <p className="text-sm text-muted-foreground">{(tokenError as Error).message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-body">
      <header className="border-b border-border bg-card/50 backdrop-blur-xl sticky top-0 z-10 transition-colors">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center glow-primary">
              <Zap className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <p className="font-heading font-bold text-foreground text-sm">{client?.name || "Client"} Portal</p>
              <p className="text-xs text-muted-foreground">{client?.company || ""}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto p-4 pt-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Active Projects", value: projects.length },
            { label: "Tasks Completed", value: tasks.filter((t) => t.status === "completed").length },
            { label: "Total Tasks", value: tasks.length },
            { label: "Invoices", value: invoices.length },
          ].map((stat, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-card rounded-xl p-4 text-center border-border/50">
              <p className="text-2xl font-heading font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        <div className="flex gap-1 p-1 bg-secondary rounded-lg w-fit border border-border/50">
          {tabs.map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === tab ? "bg-card text-foreground shadow-sm glow-primary border border-border/50" : "text-muted-foreground hover:text-foreground"}`}>
              {tab}
            </button>
          ))}
        </div>

        <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          {/* TIMELINE */}
          {activeTab === "Timeline" && (
            <div className="space-y-4">
              {tasks.length === 0 && <p className="text-sm text-muted-foreground">No tasks yet.</p>}
              {tasks.map((task, i) => (
                <div key={task.id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    {task.status === "completed" ? <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" /> : task.status === "in-progress" ? <Clock className="w-5 h-5 text-primary flex-shrink-0" /> : <Circle className="w-5 h-5 text-muted-foreground flex-shrink-0" />}
                    {i < tasks.length - 1 && <div className="w-px h-full bg-border/50 mt-2" />}
                  </div>
                  <div className="glass-card rounded-xl p-4 flex-1 mb-2 border-border/50">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-foreground text-sm">{task.title}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${task.status === "completed" ? "bg-success/10 text-success" : task.status === "in-progress" ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"}`}>{task.status}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* FILES */}
          {activeTab === "Files" && <p className="text-sm text-muted-foreground">File sharing coming soon.</p>}

          {/* INVOICES */}
          {activeTab === "Invoices" && (
            <div className="space-y-3">
              {invoices.length === 0 && <p className="text-sm text-muted-foreground">No invoices yet.</p>}
              {invoices.map((inv) => (
                <div key={inv.id} className="glass-card rounded-xl p-4 flex items-center justify-between border-border/50">
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{inv.invoice_number}</p>
                      <p className="text-xs text-muted-foreground">{inv.due_date || "No due date"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-heading font-bold text-foreground">${Number(inv.amount).toLocaleString()}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${inv.status === "paid" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>{inv.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* MESSAGES */}
          {activeTab === "Messages" && (
            <div className="flex flex-col h-[500px] glass-card rounded-xl border border-border/50 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                    <MessageSquare className="w-8 h-8 opacity-50 mb-2" />
                    <p className="text-sm">No messages yet. Send one below.</p>
                  </div>
                )}
                {messages.map((msg) => {
                  const isClient = msg.sender_type === 'client';
                  return (
                    <div key={msg.id} className={`flex ${isClient ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                        isClient ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-secondary text-secondary-foreground rounded-bl-none'
                      }`}>
                        <p className="text-sm">{msg.content}</p>
                        <p className={`text-[10px] mt-1 opacity-70 ${isClient ? 'text-right' : 'text-left'}`}>
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="p-4 border-t border-border/50 bg-background/50">
                <form 
                  onSubmit={(e) => { 
                    e.preventDefault(); 
                    if (newMessage.trim()) sendMessageMutation.mutate(newMessage.trim()); 
                  }} 
                  className="flex gap-2"
                >
                  <Input
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    disabled={sendMessageMutation.isPending}
                    className="flex-1 bg-background"
                  />
                  <Button type="submit" disabled={!newMessage.trim() || sendMessageMutation.isPending} size="icon">
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default ClientPortal;
