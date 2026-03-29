import { motion } from "framer-motion";
import {
  Users,
  FolderKanban,
  DollarSign,
  CheckSquare,
  TrendingUp,
  Clock,
  ArrowUpRight,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import AppLayout from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";

const Dashboard = () => {
  const { data: clientCount = 0 } = useQuery({
    queryKey: ["dashboard-clients"],
    queryFn: async () => {
      const { count, error } = await supabase.from("clients").select("*", { count: "exact", head: true });
      if (error) throw error;
      return count || 0;
    },
  });

  const { data: projectCount = 0 } = useQuery({
    queryKey: ["dashboard-projects"],
    queryFn: async () => {
      const { count, error } = await supabase.from("projects").select("*", { count: "exact", head: true });
      if (error) throw error;
      return count || 0;
    },
  });

  const { data: pendingApprovals = 0 } = useQuery({
    queryKey: ["dashboard-approvals"],
    queryFn: async () => {
      const { count, error } = await supabase.from("approvals").select("*", { count: "exact", head: true }).eq("status", "pending");
      if (error) throw error;
      return count || 0;
    },
  });

  const { data: totalRevenue = 0 } = useQuery({
    queryKey: ["dashboard-revenue"],
    queryFn: async () => {
      const { data, error } = await supabase.from("clients").select("revenue_mtd");
      if (error) throw error;
      return (data || []).reduce((sum, c) => sum + Number(c.revenue_mtd || 0), 0);
    },
  });

  const { data: recentClients = [] } = useQuery({
    queryKey: ["dashboard-recent-clients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("name, created_at, status")
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: recentProjects = [] } = useQuery({
    queryKey: ["dashboard-recent-projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("name, status, created_at, clients(name)")
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data || [];
    },
  });

  const stats = [
    { label: "Active Clients", value: String(clientCount), icon: Users },
    { label: "Projects", value: String(projectCount), icon: FolderKanban },
    { label: "Pending Approvals", value: String(pendingApprovals), icon: CheckSquare },
    { label: "Revenue (MTD)", value: `$${(totalRevenue / 1000).toFixed(1)}k`, icon: DollarSign },
  ];

  const formatTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-8">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <h1 className="text-3xl font-heading font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Overview of your client operations</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.4 }}
              className="glass-card rounded-xl p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <stat.icon className="w-5 h-5 text-muted-foreground" />
              </div>
              <p className="text-2xl font-heading font-bold text-foreground">{stat.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 glass-card rounded-xl p-6">
            <h2 className="font-heading font-semibold text-foreground mb-4">Recent Activity</h2>
            <div className="space-y-4">
              {recentClients.length === 0 && recentProjects.length === 0 && (
                <p className="text-sm text-muted-foreground">No activity yet. Add your first client to get started.</p>
              )}
              {recentClients.map((client, i) => (
                <motion.div
                  key={`c-${i}`}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.05 }}
                  className="flex items-start gap-4 py-3 border-b border-border/50 last:border-0"
                >
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-medium text-secondary-foreground">{client.name.charAt(0)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">Client "{client.name}" onboarded</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{client.status}</p>
                  </div>
                  <span className="text-xs text-muted-foreground flex-shrink-0 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatTimeAgo(client.created_at)}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="glass-card rounded-xl p-6">
            <h2 className="font-heading font-semibold text-foreground mb-4">Recent Projects</h2>
            <div className="space-y-4">
              {recentProjects.length === 0 && (
                <p className="text-sm text-muted-foreground">No projects yet.</p>
              )}
              {recentProjects.map((project: any, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.05 }}
                  className="p-4 bg-secondary/50 rounded-lg"
                >
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-medium text-foreground">{project.name}</h3>
                    <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground">{project.clients?.name || "Unknown"}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-muted-foreground">{formatTimeAgo(project.created_at)}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">{project.status}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
