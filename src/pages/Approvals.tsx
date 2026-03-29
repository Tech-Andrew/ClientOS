import { motion } from "framer-motion";
import { Check, X, Clock, Eye } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AppLayout from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";

const Approvals = () => {
  const queryClient = useQueryClient();

  const { data: approvals = [] } = useQuery({
    queryKey: ["approvals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("approvals")
        .select("*, clients(name), projects(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []).map((a: any) => ({
        id: a.id,
        title: a.title,
        client: a.clients?.name || "Unknown",
        project: a.projects?.name || "Unknown",
        submitted: new Date(a.created_at).toLocaleDateString(),
        type: a.type,
        status: a.status as "pending" | "approved" | "rejected",
      }));
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("approvals").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["approvals"] }),
  });

  const fallbackApprovals = [
    { id: "1", title: "Homepage Final Design", client: "Acme Corp", project: "Brand Redesign", submitted: "2 hrs ago", type: "Design", status: "pending" as const },
    { id: "2", title: "Blog Post — Q1 Recap", client: "TechStart", project: "Content Strategy", submitted: "5 hrs ago", type: "Content", status: "pending" as const },
  ];

  const displayApprovals = approvals.length > 0 ? approvals : fallbackApprovals;
  const pending = displayApprovals.filter((a) => a.status === "pending");
  const resolved = displayApprovals.filter((a) => a.status !== "pending");

  const handleAction = (id: string, action: "approved" | "rejected") => {
    if (approvals.length > 0) {
      updateStatus.mutate({ id, status: action });
    }
  };

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-8">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-heading font-bold text-foreground">Approvals</h1>
          <p className="text-muted-foreground mt-1">{pending.length} pending review</p>
        </motion.div>

        {pending.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Pending</h2>
            {pending.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card rounded-xl p-5 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-warning" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground text-sm">{item.title}</h3>
                    <p className="text-xs text-muted-foreground">{item.client} · {item.project} · {item.submitted}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground mr-2">{item.type}</span>
                  <button className="p-2 rounded-lg bg-secondary hover:bg-muted transition text-muted-foreground hover:text-foreground">
                    <Eye className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleAction(item.id, "approved")} className="p-2 rounded-lg bg-success/10 text-success hover:bg-success/20 transition">
                    <Check className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleAction(item.id, "rejected")} className="p-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {resolved.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Resolved</h2>
            {resolved.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card rounded-xl p-5 flex items-center justify-between opacity-70"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${item.status === "approved" ? "bg-success/10" : "bg-destructive/10"}`}>
                    {item.status === "approved" ? <Check className="w-5 h-5 text-success" /> : <X className="w-5 h-5 text-destructive" />}
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground text-sm">{item.title}</h3>
                    <p className="text-xs text-muted-foreground">{item.client} · {item.project}</p>
                  </div>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${item.status === "approved" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
                  {item.status === "approved" ? "Approved" : "Rejected"}
                </span>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Approvals;
