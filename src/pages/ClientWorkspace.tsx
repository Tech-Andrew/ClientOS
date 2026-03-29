import { motion } from "framer-motion";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, FileText, DollarSign, Bell, CheckCircle2, Circle, Clock, Upload, Share2, Copy, Check, Sparkles, Loader2, Download, Trash2, File, MessageSquare, Send } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import AppLayout from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const tabs = ["Timeline", "Files", "Invoices", "Updates", "Messages"];

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const ClientWorkspace = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("Timeline");
  const [portalLink, setPortalLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: client } = useQuery({
    queryKey: ["client", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("clients").select("*").eq("id", id!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: projects = [] } = useQuery({
    queryKey: ["client-projects", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("projects").select("*").eq("client_id", id!);
      if (error) throw error;
      return data || [];
    },
    enabled: !!id,
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ["client-tasks", id],
    queryFn: async () => {
      if (projects.length === 0) return [];
      const projectIds = projects.map((p) => p.id);
      const { data, error } = await supabase.from("tasks").select("*").in("project_id", projectIds).order("sort_order");
      if (error) throw error;
      return data || [];
    },
    enabled: projects.length > 0,
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ["client-invoices", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("invoices").select("*").eq("client_id", id!).order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!id,
  });

  const { data: updates = [] } = useQuery({
    queryKey: ["client-updates", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("client_updates").select("*").eq("client_id", id!).order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!id,
  });

  const { data: files = [] } = useQuery({
    queryKey: ["client-files", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("client_files").select("*").eq("client_id", id!).order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!id,
  });

  const { data: messages = [] } = useQuery({
    queryKey: ["client-messages", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("messages").select("*").eq("client_id", id!).order("created_at", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!id,
  });

  useEffect(() => {
    if (!id) return;
    const channel = supabase
      .channel(`workspace-messages-${id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `client_id=eq.${id}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["client-messages", id] });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id, queryClient]);

  const generatePortalLink = useMutation({
    mutationFn: async () => {
      if (!user || !id) throw new Error("Missing data");
      const { data, error } = await supabase
        .from("client_portal_tokens")
        .insert({ client_id: id, user_id: user.id })
        .select("token")
        .single();
      if (error) throw error;
      return `${window.location.origin}/portal/${data.token}`;
    },
    onSuccess: (link) => { setPortalLink(link); toast.success("Portal link generated!"); },
    onError: (err: any) => toast.error(err.message),
  });

  const generateUpdate = useMutation({
    mutationFn: async () => {
      if (!user || !id || !client || projects.length === 0) throw new Error("Need client with projects");
      const { data, error } = await supabase.functions.invoke("generate-client-update", {
        body: { tasks, clientName: client.name, projectName: projects[0].name },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      const { error: insertErr } = await supabase.from("client_updates").insert({
        client_id: id,
        user_id: user.id,
        title: data.title,
        body: data.body,
      });
      if (insertErr) throw insertErr;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-updates", id] });
      toast.success("AI update generated & saved!");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const [newMessage, setNewMessage] = useState("");

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!user || !id) throw new Error("Missing data");
      const { error } = await supabase.from("messages").insert([{
        client_id: id,
        user_id: user.id,
        content,
        sender_type: "business",
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      setNewMessage("");
      queryClient.invalidateQueries({ queryKey: ["client-messages", id] });
    },
    onError: (err: any) => toast.error(err.message || "Failed to send message"),
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || !user || !id) return;
    setUploading(true);

    try {
      for (const file of Array.from(selectedFiles)) {
        const storagePath = `${user.id}/${id}/${Date.now()}_${file.name}`;
        const { error: uploadErr } = await supabase.storage
          .from("client-files")
          .upload(storagePath, file);
        if (uploadErr) throw uploadErr;

        const { error: metaErr } = await supabase.from("client_files").insert({
          client_id: id,
          user_id: user.id,
          file_name: file.name,
          file_size: file.size,
          storage_path: storagePath,
          content_type: file.type || "application/octet-stream",
        });
        if (metaErr) throw metaErr;
      }
      queryClient.invalidateQueries({ queryKey: ["client-files", id] });
      toast.success("File(s) uploaded!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDownload = async (file: any) => {
    const { data, error } = await supabase.storage
      .from("client-files")
      .download(file.storage_path);
    if (error) { toast.error("Download failed"); return; }
    const url = URL.createObjectURL(data);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.file_name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const deleteFile = useMutation({
    mutationFn: async (file: any) => {
      const { error: storageErr } = await supabase.storage.from("client-files").remove([file.storage_path]);
      if (storageErr) throw storageErr;
      const { error: metaErr } = await supabase.from("client_files").delete().eq("id", file.id);
      if (metaErr) throw metaErr;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-files", id] });
      toast.success("File deleted");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const copyLink = () => {
    navigator.clipboard.writeText(portalLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getFileIcon = (contentType: string) => {
    if (contentType?.startsWith("image/")) return "🖼️";
    if (contentType?.includes("pdf")) return "📄";
    if (contentType?.includes("zip") || contentType?.includes("rar")) return "📦";
    return "📎";
  };

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <Link to="/clients" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to Clients
          </Link>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <span className="text-lg font-bold text-primary">{client?.avatar_initial || client?.name?.charAt(0) || "?"}</span>
              </div>
              <div>
                <h1 className="text-2xl font-heading font-bold text-foreground">{client?.name || "Client"}</h1>
                <p className="text-sm text-muted-foreground">{projects.length} project{projects.length !== 1 ? "s" : ""} · {client?.company || ""}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {portalLink ? (
                <div className="flex items-center gap-2">
                  <input readOnly value={portalLink} className="px-3 py-2 bg-secondary border border-border rounded-lg text-xs text-foreground w-48 truncate" />
                  <button onClick={copyLink} className="p-2 rounded-lg bg-secondary hover:bg-muted transition text-muted-foreground hover:text-foreground">
                    {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              ) : (
                <button onClick={() => generatePortalLink.mutate()} disabled={generatePortalLink.isPending} className="flex items-center gap-2 px-4 py-2.5 bg-secondary border border-border rounded-lg text-sm text-muted-foreground hover:text-foreground transition">
                  <Share2 className="w-4 h-4" />
                  Share Portal
                </button>
              )}
            </div>
          </div>
        </motion.div>

        <div className="flex gap-1 p-1 bg-secondary rounded-lg w-fit">
          {tabs.map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === tab ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}>
              {tab}
            </button>
          ))}
        </div>

        <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          {activeTab === "Timeline" && (
            <div className="space-y-4">
              {tasks.length === 0 && <p className="text-sm text-muted-foreground">No tasks yet for this client.</p>}
              {tasks.map((task: any, i: number) => (
                <div key={task.id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    {task.status === "completed" ? (
                      <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" />
                    ) : task.status === "in-progress" ? (
                      <Clock className="w-5 h-5 text-primary flex-shrink-0" />
                    ) : (
                      <Circle className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    )}
                    {i < tasks.length - 1 && <div className="w-px h-full bg-border/50 mt-2" />}
                  </div>
                  <div className="glass-card rounded-xl p-4 flex-1 mb-2">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-medium text-foreground text-sm">{task.title}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        task.status === "completed" ? "bg-success/10 text-success" :
                        task.status === "in-progress" ? "bg-primary/10 text-primary" :
                        "bg-secondary text-muted-foreground"
                      }`}>{task.status}</span>
                    </div>
                    {task.is_milestone && <span className="text-xs text-warning">★ Milestone</span>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "Files" && (
            <div className="space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleFileUpload}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition glow-primary disabled:opacity-50"
              >
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {uploading ? "Uploading..." : "Upload Files"}
              </button>

              {files.length === 0 && !uploading && (
                <p className="text-sm text-muted-foreground">No files uploaded yet. Click above to add files.</p>
              )}

              {files.map((file: any) => (
                <div key={file.id} className="glass-card rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-lg">
                      {getFileIcon(file.content_type)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{file.file_name}</p>
                      <p className="text-xs text-muted-foreground">{formatFileSize(file.file_size)} · {new Date(file.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDownload(file)}
                      className="p-2 rounded-lg bg-secondary hover:bg-muted transition text-muted-foreground hover:text-foreground"
                      title="Download"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteFile.mutate(file)}
                      className="p-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "Invoices" && (
            <div className="space-y-3">
              {invoices.length === 0 && <p className="text-sm text-muted-foreground">No invoices for this client yet.</p>}
              {invoices.map((inv: any) => (
                <div key={inv.id} className="glass-card rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{inv.invoice_number}</p>
                      <p className="text-xs text-muted-foreground">{new Date(inv.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-heading font-bold text-foreground">${Number(inv.amount).toLocaleString()}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      inv.status === "paid" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
                    }`}>{inv.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "Updates" && (
            <div className="space-y-4">
              <button
                onClick={() => generateUpdate.mutate()}
                disabled={generateUpdate.isPending || tasks.length === 0}
                className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition glow-primary disabled:opacity-50"
              >
                {generateUpdate.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Generate AI Update
              </button>
              {updates.length === 0 && !generateUpdate.isPending && (
                <p className="text-sm text-muted-foreground">No updates yet. Use AI to generate one from your task progress.</p>
              )}
              {updates.map((update: any) => (
                <div key={update.id} className="glass-card rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Bell className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-medium text-foreground">{update.title}</h3>
                    <span className="text-xs text-muted-foreground ml-auto">{new Date(update.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{update.body}</p>
                </div>
              ))}
            </div>
          )}

          {activeTab === "Messages" && (
            <div className="flex flex-col h-[500px] glass-card rounded-xl border border-border/50 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                    <MessageSquare className="w-8 h-8 opacity-50 mb-2" />
                    <p className="text-sm">No messages yet. Send one below.</p>
                  </div>
                )}
                {messages.map((msg: any) => {
                  const isAgency = msg.sender_type === 'business';
                  return (
                    <div key={msg.id} className={`flex ${isAgency ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                        isAgency ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-secondary text-secondary-foreground rounded-bl-none'
                      }`}>
                        <p className="text-sm">{msg.content}</p>
                        <p className={`text-[10px] mt-1 opacity-70 ${isAgency ? 'text-right' : 'text-left'}`}>
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
                  <input
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    disabled={sendMessageMutation.isPending}
                    className="flex-1 px-4 py-2 border border-border/50 rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                  />
                  <button type="submit" disabled={!newMessage.trim() || sendMessageMutation.isPending} className="px-3 py-2 bg-primary text-primary-foreground rounded-md disabled:opacity-50">
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default ClientWorkspace;
