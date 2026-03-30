import { motion, AnimatePresence } from "framer-motion";
import { Send, Search, Info, PlusCircle, MessageCircle } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AppLayout from "@/shared/components/layout/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/shared/hooks/useAuth";
import { toast } from "sonner";

const Messages = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeClientId, setActiveClientId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [search, setSearch] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: clients = [], isLoading: loadingClients } = useQuery({
    queryKey: ["message-clients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("id, name, company, avatar_initial")
        .order("name", { ascending: true });
      if (error) {
        toast.error("Failed to sync neural link");
        throw error;
      }
      return data || [];
    },
  });

  const activeClient = clients.find((c: any) => c.id === activeClientId);

  const { data: projects = [] } = useQuery({
    queryKey: ["projects", activeClientId],
    queryFn: async () => {
      if (!activeClientId) return [];
      const { data, error } = await supabase
        .from("projects")
        .select("id")
        .eq("client_id", activeClientId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!activeClientId,
  });

  const { data: messages = [], isLoading: loadingMessages } = useQuery({
    queryKey: ["messages", activeClientId],
    queryFn: async () => {
      if (!activeClientId) return [];
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("client_id", activeClientId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!activeClientId,
  });

  // Real-time synchronization
  useEffect(() => {
    if (!activeClientId) return;
    const channel = supabase
      .channel(`rt-messages-${activeClientId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `client_id=eq.${activeClientId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["messages", activeClientId] });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activeClientId, queryClient]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-selection of priority client
  useEffect(() => {
    if (clients.length > 0 && !activeClientId) {
      setActiveClientId(clients[0].id);
    }
  }, [clients, activeClientId]);

  const sendMessage = useMutation({
    mutationFn: async () => {
      if (!user || !activeClientId) throw new Error("Missing credentials");
      
      const projectId = projects[0]?.id;
      if (!projectId) throw new Error("Client has no active projects for uplink");

      const { error } = await supabase.from("messages").insert([{
        client_id: activeClientId,
        user_id: user.id,
        project_id: projectId,
        sender_type: "agency",
        content: newMessage.trim(),
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      setNewMessage("");
      queryClient.invalidateQueries({ queryKey: ["messages", activeClientId] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Uplink failed");
    }
  });

  const handleSend = () => {
    if (newMessage.trim() && !sendMessage.isPending) {
      sendMessage.mutate();
    }
  };

  const filteredClients = clients.filter((c: any) =>
    !search ||
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.company && c.company.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto h-[calc(100vh-160px)] flex flex-col">
        {/* Page Header */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="mb-6 flex items-center justify-between"
        >
          <div>
            <h1 className="text-[32px] font-bold text-[#F8FAFC] tracking-tight">Messages</h1>
            <p className="text-[#94A3B8] text-[14px]">Direct encrypted communication channel</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-[#2B63EB] text-[#F8FAFC] rounded-[10px] text-[13px] font-bold hover:bg-[#1E40AF] transition-all shadow-lg shadow-[#2B63EB]/20">
            <PlusCircle className="w-4 h-4" />
            New Thread
          </button>
        </motion.div>

        <div className="flex-1 min-h-0 flex gap-6">
          {/* Sidebar - Threads List */}
          <div className="w-[340px] flex flex-col bg-[#030B1E] border border-[#334155]/20 rounded-[20px] overflow-hidden">
            <div className="p-4 border-b border-[#334155]/20 bg-[#0F172A]/30">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#475569]" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Filter transmissions..."
                  className="w-full pl-10 pr-4 py-3 bg-[#0F172A] border border-[#1E293B] rounded-[12px] text-[13px] text-[#F8FAFC] placeholder:text-[#475569] focus:outline-none focus:border-[#2B63EB] transition-all"
                />
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {loadingClients ? (
                Array(5).fill(0).map((_, i) => (
                  <div key={i} className="h-16 bg-[#0F172A]/40 rounded-[12px] animate-pulse m-2" />
                ))
              ) : filteredClients.length === 0 ? (
                <div className="py-20 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-[#1E293B] flex items-center justify-center mx-auto opacity-50">
                    <MessageCircle className="w-6 h-6 text-[#475569]" />
                  </div>
                  <p className="text-[12px] font-bold text-[#475569] uppercase tracking-widest px-6 leading-relaxed">
                    No active link found
                  </p>
                </div>
              ) : (
                filteredClients.map((client: any) => (
                  <button
                    key={client.id}
                    onClick={() => setActiveClientId(client.id)}
                    className={`w-full text-left p-3.5 rounded-[14px] transition-all flex items-center gap-4 relative group ${activeClientId === client.id
                        ? "bg-[#2B63EB]/10 border border-[#2B63EB]/20 shadow-sm"
                        : "hover:bg-[#1E293B] border border-transparent"
                      }`}
                  >
                    {activeClientId === client.id && (
                      <motion.div layoutId="active-pill" className="absolute left-0 w-1 h-6 bg-[#2B63EB] rounded-r-full" />
                    )}
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-[16px] transition-all border ${activeClientId === client.id ? 'bg-[#2B63EB] border-[#2B63EB] text-[#F8FAFC]' : 'bg-[#1E293B] border-[#334155]/30 text-[#94A3B8]'}`}>
                      {client.avatar_initial || (client.name?.[0] || '?').toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <p className={`text-[14px] font-bold truncate ${activeClientId === client.id ? 'text-[#F8FAFC]' : 'text-[#F8FAFC]/80'}`}>
                          {client.name}
                        </p>
                        <span className="text-[10px] text-[#475569] font-medium">12:30 PM</span>
                      </div>
                      <p className="text-[12px] text-[#475569] truncate font-medium">{client.company || "No Workspace"}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Main Workspace - Chat Feed */}
          <div className="flex-1 flex flex-col bg-[#030B1E] border border-[#334155]/20 rounded-[24px] overflow-hidden relative shadow-2xl shadow-black/40">
            {activeClient ? (
              <>
                {/* Interface Header */}
                <div className="px-8 py-5 border-b border-[#334155]/20 bg-[#0F172A]/40 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-full bg-[#2B63EB]/10 border border-[#2B63EB]/30 flex items-center justify-center font-bold text-[#2B63EB] text-[15px]">
                      {activeClient.avatar_initial || (activeClient.name?.[0] || '?').toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-[18px] font-bold text-[#F8FAFC] tracking-tight">{activeClient.name}</h3>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#22D0EE] shadow-[0_0_8px_#22D0EE]" />
                        <p className="text-[11px] text-[#475569] font-bold uppercase tracking-widest">{activeClient.company || "Standard Security"}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-2.5 rounded-[10px] hover:bg-[#1E293B] text-[#475569] hover:text-[#F8FAFC] transition-all">
                      <Info className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Packet Stream */}
                <div className="flex-1 overflow-y-auto px-8 py-8 space-y-6 scrollbar-hide">
                  {loadingMessages ? (
                    <div className="space-y-6 py-10">
                      <div className="flex justify-end opacity-20"><div className="w-64 h-12 bg-[#2B63EB] rounded-[16px]" /></div>
                      <div className="flex justify-start opacity-20"><div className="w-48 h-12 bg-[#1E293B] rounded-[16px]" /></div>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-5">
                      <div className="w-20 h-20 rounded-full bg-[#1E293B]/40 flex items-center justify-center border border-[#334155]/20">
                        <Send className="w-8 h-8 text-[#475569] opacity-30" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-[15px] font-bold text-[#F8FAFC]">Secure Link Established</p>
                        <p className="text-[13px] text-[#475569] max-w-[280px]">Initiate communication with {activeClient.name} to begin the data exchange.</p>
                      </div>
                    </div>
                  ) : (
                    <AnimatePresence initial={false}>
                      {messages.map((msg: any) => {
                        const isAgency = msg.sender_type === "agency";
                        return (
                          <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 15, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            className={`flex ${isAgency ? "justify-end" : "justify-start"}`}
                          >
                            <div className={`flex flex-col max-w-[70%] ${isAgency ? 'items-end' : 'items-start'}`}>
                              <div className={`relative px-5 py-3.5 rounded-[20px] text-[14px] font-medium leading-relaxed shadow-lg ${isAgency
                                  ? "bg-[#2B63EB] text-[#F8FAFC] rounded-tr-none shadow-[#2B63EB]/10"
                                  : "bg-[#1E293B] text-[#F8FAFC] border border-[#334155]/40 rounded-tl-none shadow-black/20"
                                }`}>
                                <p className="whitespace-pre-wrap">{msg.content}</p>
                              </div>
                              <span className="text-[10px] text-[#475569] mt-2 font-bold uppercase tracking-widest px-1 opacity-60">
                                {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              </span>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Matrix */}
                <div className="p-6 border-t border-[#334155]/20 bg-[#0F172A]/30">
                  <div className="relative flex items-end gap-3 p-2 bg-[#0F172A] border border-[#1E293B] rounded-[18px] focus-within:border-[#2B63EB]/50 focus-within:ring-4 focus-within:ring-[#2B63EB]/5 transition-all duration-300">
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      placeholder="Input message packets..."
                      className="flex-1 max-h-32 min-h-[48px] bg-transparent border-none text-[14px] text-[#F8FAFC] placeholder:text-[#475569] focus:outline-none focus:ring-0 resize-none py-3 px-4"
                      rows={1}
                    />
                    <button
                      onClick={handleSend}
                      disabled={!newMessage.trim() || sendMessage.isPending}
                      className={`h-11 w-11 flex items-center justify-center rounded-[12px] bg-[#2B63EB] text-[#F8FAFC] transition-all hover:scale-[1.05] active:scale-[0.95] disabled:opacity-30 disabled:grayscale disabled:hover:scale-100 shadow-xl shadow-[#2B63EB]/20 ${sendMessage.isPending ? 'animate-pulse' : ''}`}
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="flex justify-between items-center mt-3 px-2">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#475569]" />
                      <p className="text-[10px] text-[#475569] font-bold uppercase tracking-widest opacity-60">Neural Uplink Ready</p>
                    </div>
                    {sendMessage.isPending && <p className="text-[10px] text-[#2B63EB] font-bold uppercase tracking-widest animate-pulse">Syncing...</p>}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
                <div className="w-24 h-24 rounded-full bg-[#1E293B]/40 flex items-center justify-center border border-[#334155]/20 animate-pulse">
                  <MessageCircle className="w-10 h-10 text-[#475569] opacity-30" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-[18px] font-bold text-[#F8FAFC]">No Transmission Selected</h3>
                  <p className="text-[14px] text-[#475569] max-w-[280px]">Select a neural link from the sidebar to start decrypting messages.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Messages;
