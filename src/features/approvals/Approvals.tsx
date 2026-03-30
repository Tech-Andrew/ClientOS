import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Clock, Eye, AlertCircle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AppLayout from "@/shared/components/layout/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Approvals = () => {
  const queryClient = useQueryClient();

  const { data: approvals = [], isLoading } = useQuery({
    queryKey: ["approvals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("approvals")
        .select("*, clients(name), projects(name)")
        .order("created_at", { ascending: false });
      
      if (error) {
        toast.error("Failed to sync approvals");
        throw error;
      }

      return (data || []).map((a: any) => ({
        id: a.id,
        title: a.title,
        client: a.clients?.name || "Private Client",
        project: a.projects?.name || "Internal",
        submitted: new Date(a.created_at).toLocaleDateString(),
        type: a.type || "Deliverable",
        status: a.status as "pending" | "approved" | "rejected",
      }));
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("approvals")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["approvals"] });
      toast.success(`Request ${variables.status === "approved" ? "Authorized" : "Rejected"}`);
    },
    onError: () => {
      toast.error("Critical: Operation Failed");
    },
  });

  const handleAction = (id: string, action: "approved" | "rejected") => {
    updateStatus.mutate({ id, status: action });
  };

  const pending = approvals.filter((a) => a.status === "pending");
  const resolved = approvals.filter((a) => a.status !== "pending");

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-10 pb-20">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }} 
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-4"
        >
          <div>
            <h1 className="text-[36px] font-bold text-[#F8FAFC] tracking-tight leading-tight">
              Approvals
            </h1>
            <p className="text-[#94A3B8] text-[15px] mt-1.5 font-medium flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#2B63EB] animate-pulse" />
              {pending.length} critical items awaiting your authorization
            </p>
          </div>
        </motion.div>

        {/* Loading State */}
        {isLoading && (
          <div className="py-20 flex flex-col items-center justify-center gap-4 text-[#475569]">
            <motion.div 
              animate={{ rotate: 360 }} 
              transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
              className="w-8 h-8 border-2 border-[#2B63EB]/20 border-t-[#2B63EB] rounded-full" 
            />
            <p className="text-[12px] font-bold uppercase tracking-widest">Syncing Grid...</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && approvals.length === 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="panel-card py-20 flex flex-col items-center justify-center text-center space-y-4 border-dashed border-[#334155]/40"
          >
            <div className="p-4 rounded-full bg-[#1E293B] border border-[#334155]/30">
              <Check className="w-8 h-8 text-[#2B63EB]" />
            </div>
            <div>
              <h3 className="text-[18px] font-bold text-[#F8FAFC]">Queue Cleared</h3>
              <p className="text-[14px] text-[#475569] mt-1 max-w-[280px]">No pending items require your attention at this time.</p>
            </div>
          </motion.div>
        )}

        <AnimatePresence mode="popLayout">
          {pending.length > 0 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <h2 className="text-[11px] font-bold text-[#475569] uppercase tracking-[0.2em] px-1 opacity-80">
                Awaiting Review
              </h2>
              <div className="grid gap-4">
                {pending.map((item, i) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.3 }}
                    className="panel-card group flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 bg-[#030B1E] border-[#334155]/30 hover:border-[#2B63EB]/40 transition-all duration-300"
                  >
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 rounded-[12px] bg-[#1E293B] flex items-center justify-center border border-[#334155]/40 shadow-inner group-hover:border-[#2B63EB]/30 transition-colors">
                        <Clock className="w-6 h-6 text-[#2B63EB]" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-[16px] font-bold text-[#F8FAFC] tracking-tight group-hover:text-[#2B63EB] transition-colors">{item.title}</h3>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#2B63EB]/10 text-[#2B63EB] font-bold uppercase tracking-wider">
                            {item.type}
                          </span>
                        </div>
                        <p className="text-[13px] text-[#94A3B8] font-medium">
                          {item.client} <span className="mx-1.5 text-[#334155]">/</span> {item.project}
                          <span className="ml-3 text-[12px] text-[#475569]">Submitted {item.submitted}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-[10px] bg-[#1E293B] hover:bg-[#334155] border border-[#334155]/40 text-[#94A3B8] hover:text-[#F8FAFC] transition-all text-[13px] font-bold">
                        <Eye className="w-4 h-4" />
                        <span className="sm:hidden">Preview</span>
                      </button>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleAction(item.id, "rejected")} 
                          className="p-2.5 rounded-[10px] bg-[#F54444]/10 text-[#F54444] border border-[#F54444]/20 hover:bg-[#F54444] hover:text-white transition-all duration-300"
                          title="Reject"
                        >
                          <X className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => handleAction(item.id, "approved")} 
                          className="p-2.5 rounded-[10px] bg-[#22D0EE]/10 text-[#22D0EE] border border-[#22D0EE]/20 hover:bg-[#22D0EE] hover:text-[#030B1E] transition-all duration-300 shadow-[0_0_20px_rgba(34,208,238,0.1)]"
                          title="Approve"
                        >
                          <Check className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {resolved.length > 0 && (
            <motion.div 
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6 pt-10"
            >
              <h2 className="text-[11px] font-bold text-[#475569] uppercase tracking-[0.2em] px-1 opacity-80 border-t border-[#1E293B] pt-8">
                History
              </h2>
              <div className="grid gap-3">
                {resolved.map((item, i) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.7 }}
                    whileHover={{ opacity: 1 }}
                    className="panel-card flex items-center justify-between p-4 bg-[#0F172A]/30 border-[#1E293B]/50"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-9 h-9 rounded-[8px] flex items-center justify-center border ${item.status === "approved" ? "border-[#22D0EE]/20 bg-[#22D0EE]/5" : "border-[#F54444]/20 bg-[#F54444]/5"}`}>
                        {item.status === "approved" ? <Check className="w-4 h-4 text-[#22D0EE]" /> : <X className="w-4 h-4 text-[#F54444]" />}
                      </div>
                      <div>
                        <h3 className="text-[14px] font-bold text-[#F8FAFC]">{item.title}</h3>
                        <p className="text-[12px] text-[#475569] font-medium">{item.client} · {item.project}</p>
                      </div>
                    </div>
                    <span className={`text-[10px] px-3 py-1 rounded-[6px] font-bold uppercase tracking-[0.1em] ${item.status === "approved" ? "bg-[#22D0EE]/10 text-[#22D0EE]" : "bg-[#F54444]/10 text-[#F54444]"}`}>
                      {item.status}
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
};

export default Approvals;
