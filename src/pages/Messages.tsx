import { motion } from "framer-motion";
import { Send, Search } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AppLayout from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const Messages = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeClientId, setActiveClientId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [search, setSearch] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: clients = [] } = useQuery({
    queryKey: ["message-clients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("id, name, company")
        .order("name", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  const activeClient = clients.find((c: any) => c.id === activeClientId);

  const { data: messages = [] } = useQuery({
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

  // Real-time subscription
  useEffect(() => {
    if (!activeClientId) return;
    const channel = supabase
      .channel(`messages-${activeClientId}`)
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

  // Auto-select first client
  useEffect(() => {
    if (clients.length > 0 && !activeClientId) {
      setActiveClientId(clients[0].id);
    }
  }, [clients, activeClientId]);

  const sendMessage = useMutation({
    mutationFn: async () => {
      if (!user || !activeClientId) throw new Error("Missing data");
      const { error } = await supabase.from("messages").insert([{
        client_id: activeClientId,
        user_id: user.id,
        sender: "agency",
        content: newMessage.trim(),
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      setNewMessage("");
      queryClient.invalidateQueries({ queryKey: ["messages", activeClientId] });
    },
  });

  const filteredClients = clients.filter((c: any) =>
    !search || 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    (c.company && c.company.toLowerCase().includes(search.toLowerCase()))
  );

  const handleSend = () => {
    if (newMessage.trim()) sendMessage.mutate();
  };

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto h-[calc(100vh-theme(spacing.24))] flex flex-col">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-6 flex-shrink-0">
          <h1 className="text-3xl font-heading font-bold text-foreground">Messages</h1>
          <p className="text-muted-foreground mt-1">Direct client communication</p>
        </motion.div>

        <div className="glass-card rounded-xl overflow-hidden flex flex-1 min-h-0 border border-border/50">
          {/* Sidebar */}
          <div className="w-80 border-r border-border/50 flex flex-col bg-card/30">
            <div className="p-4 border-b border-border/50">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search clients..."
                  className="w-full pl-9 pr-4 py-2 bg-secondary border border-border/50 rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {filteredClients.length === 0 && (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  No clients found.
                </div>
              )}
              {filteredClients.map((client: any) => (
                <button
                  key={client.id}
                  onClick={() => setActiveClientId(client.id)}
                  className={`w-full text-left p-4 border-b border-border/30 transition-all flex items-center gap-3 ${
                    activeClientId === client.id 
                      ? "bg-primary/10 border-l-2 border-l-primary" 
                      : "hover:bg-secondary/50 border-l-2 border-l-transparent"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-heading font-bold overflow-hidden border-2 ${activeClientId === client.id ? 'bg-primary/20 border-primary/40 text-primary' : 'bg-secondary border-border text-muted-foreground'}`}>
                    {(client.name?.[0] || '?').toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${activeClientId === client.id ? 'text-foreground' : 'text-foreground/80'}`}>
                      {client.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{client.company || "No company"}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Chat area */}
          <div className="flex-1 flex flex-col bg-background/50 relative">
            {activeClient ? (
              <>
                {/* Chat Header */}
                <div className="px-6 py-4 border-b border-border/50 bg-card/50 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/20 border-2 border-primary/40 flex items-center justify-center font-heading font-bold text-primary">
                    {(activeClient.name?.[0] || '?').toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-heading font-semibold text-foreground text-lg">{activeClient.name}</h3>
                    <p className="text-xs text-muted-foreground">{activeClient.company}</p>
                  </div>
                </div>

                {/* Messages List */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {messages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                      <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
                        <Send className="w-8 h-8 text-muted-foreground/50" />
                      </div>
                      <p className="font-medium text-foreground">No messages yet</p>
                      <p className="text-sm mt-1">Start the conversation with {activeClient.name}!</p>
                    </div>
                  )}
                  {messages.map((msg: any, i: number) => {
                    const isAgency = msg.sender === "agency";
                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.2 }}
                        className={`flex ${isAgency ? "justify-end" : "justify-start"}`}
                      >
                        <div className={`flex flex-col max-w-[75%] ${isAgency ? 'items-end' : 'items-start'}`}>
                          <div className={`rounded-2xl px-5 py-3 shadow-sm ${
                            isAgency
                              ? "bg-primary text-primary-foreground rounded-br-none"
                              : "bg-secondary text-foreground rounded-bl-none border border-border/50"
                          }`}>
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                          </div>
                          <span className="text-[10px] text-muted-foreground mt-1.5 font-medium px-1">
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 border-t border-border/50 bg-card/30">
                  <div className="flex items-end gap-3 bg-secondary/50 p-2 rounded-xl border border-border/50 focus-within:border-primary/50 focus-within:bg-secondary transition-all">
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      placeholder="Type a message..."
                      className="flex-1 max-h-32 min-h-[44px] bg-transparent border-none text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-0 resize-none py-2.5 px-3"
                      rows={1}
                    />
                    <Button
                      onClick={handleSend}
                      disabled={!newMessage.trim() || sendMessage.isPending}
                      className="h-10 w-10 flex-shrink-0 glow-primary rounded-lg mb-0.5"
                      size="icon"
                    >
                      <Send className="w-4 h-4 ml-0.5" />
                    </Button>
                  </div>
                  <div className="flex justify-between items-center mt-2 px-1">
                    <p className="text-[10px] text-muted-foreground">Press Enter to send, Shift+Enter for new line</p>
                    {sendMessage.isPending && <p className="text-[10px] text-primary">Sending...</p>}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
                <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
                  <Search className="w-8 h-8 text-muted-foreground/50" />
                </div>
                <p className="text-sm font-medium">Select a client to start messaging</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Messages;
