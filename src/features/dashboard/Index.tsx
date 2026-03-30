import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  FolderKanban,
  DollarSign,
  CheckSquare,
  TrendingUp,
  Clock,
  ArrowUpRight,
  Plus,
  Zap,
  MoreHorizontal,
  Calendar,
  Activity,
  ChevronRight
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import AppLayout from "@/shared/components/layout/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/shared/hooks/useAuth";

const Dashboard = () => {
  const { user } = useAuth();
  
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
        .select("name, company, created_at, status")
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
        .limit(3);
      if (error) throw error;
      return data || [];
    },
  });

  const stats = [
    { label: "Active Clients", value: String(clientCount), icon: Users, color: "#2B63EB" },
    { label: "Active Projects", value: String(projectCount), icon: FolderKanban, color: "#22D0EE" },
    { label: "Pending Approvals", value: String(pendingApprovals), icon: CheckSquare, color: "#8B5CF6" },
    { label: "Revenue (MTD)", value: `$${(totalRevenue / 1000).toFixed(1)}k`, icon: DollarSign, color: "#10B981" },
  ];

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

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
      <div className="max-w-7xl mx-auto space-y-10 pb-20">
        
        {/* Dynamic Hero Section */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="flex flex-col lg:flex-row lg:items-center justify-between gap-6"
        >
          <div className="space-y-1.5">
            <h1 className="text-[36px] font-bold text-[#F8FAFC] tracking-tight leading-tight flex items-center gap-3">
              {getTimeGreeting()}, {user?.email?.split('@')[0] || 'Andrew'}
              <motion.span 
                animate={{ rotate: [0, 14, 0] }}
                transition={{ repeat: Infinity, duration: 2, repeatDelay: 1 }}
              >👋</motion.span>
            </h1>
            <p className="text-[#94A3B8] text-[15px] font-medium max-w-[500px]">
              The ClientFlow neural engine is synchronized. You have <span className="text-[#2B63EB] font-bold">{pendingApprovals} pending approvals</span> requiring your attention today.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-5 py-2.5 bg-[#030B1E] border border-[#1E293B] hover:border-[#334155] rounded-[12px] text-[#F8FAFC] text-[13px] font-bold transition-all">
              <Calendar className="w-4 h-4 text-[#475569]" />
              Schedule
            </button>
            <button className="flex items-center gap-2 px-5 py-2.5 bg-[#2B63EB] text-[#F8FAFC] rounded-[12px] text-[13px] font-bold hover:bg-[#1E40AF] transition-all shadow-xl shadow-[#2B63EB]/20">
              <Plus className="w-4 h-4" />
              New Project
            </button>
          </div>
        </motion.div>

        {/* Primary Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="group relative p-6 bg-[#030B1E] border border-[#1E293B] hover:border-[#2B63EB]/40 rounded-[20px] transition-all duration-300"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#2B63EB]/5 to-transparent rounded-tr-[20px] pointer-events-none" />
              <div className="flex items-center justify-between mb-6">
                <div 
                  className="w-10 h-10 rounded-[12px] flex items-center justify-center transition-all bg-[#0F172A]"
                  style={{ color: stat.color }}
                >
                  <stat.icon className="w-5 h-5" />
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1 bg-[#10B981]/10 rounded-full">
                  <TrendingUp className="w-3 h-3 text-[#10B981]" />
                  <span className="text-[10px] font-bold text-[#10B981]">12%</span>
                </div>
              </div>
              <p className="text-[28px] font-bold text-[#F8FAFC] tracking-tight leading-none mb-2">{stat.value}</p>
              <p className="text-[12px] font-bold text-[#475569] uppercase tracking-[0.08em] font-sans">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Growth Chart Visualization (SVG) */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="lg:col-span-2 relative overflow-hidden bg-[#030B1E] border border-[#1E293B] rounded-[24px] p-8"
          >
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-[18px] font-bold text-[#F8FAFC] tracking-tight flex items-center gap-2">
                  <Zap className="w-4 h-4 text-[#22D0EE]" />
                  Growth Trajectory
                </h3>
                <p className="text-[13px] text-[#475569] font-medium">Projected revenue vs actual performance</p>
              </div>
              <div className="flex items-center gap-2 p-1 bg-[#0F172A] rounded-lg border border-[#1E293B]">
                <button className="px-3 py-1.5 rounded-md bg-[#1E293B] text-[11px] font-bold text-[#F8FAFC]">W</button>
                <button className="px-3 py-1.5 rounded-md hover:bg-[#1E293B] text-[11px] font-bold text-[#475569]">M</button>
                <button className="px-3 py-1.5 rounded-md hover:bg-[#1E293B] text-[11px] font-bold text-[#475569]">Y</button>
              </div>
            </div>

            <div className="h-[200px] w-full mt-4 group cursor-crosshair">
              {/* Mock SVG Chart */}
              <svg viewBox="0 0 800 200" className="w-full h-full overflow-visible">
                <defs>
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2B63EB" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#2B63EB" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path
                  d="M 0 160 Q 100 140 200 150 T 400 100 T 600 120 T 800 40"
                  fill="url(#chartGradient)"
                  stroke="none"
                />
                <motion.path
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 2, ease: "easeInOut" }}
                  d="M 0 160 Q 100 140 200 150 T 400 100 T 600 120 T 800 40"
                  fill="none"
                  stroke="#2B63EB"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <circle cx="200" cy="150" r="4" fill="#030B1E" stroke="#2B63EB" strokeWidth="2" className="drop-shadow-[0_0_8px_#2B63EB]" />
                <circle cx="400" cy="100" r="4" fill="#030B1E" stroke="#2B63EB" strokeWidth="2" className="drop-shadow-[0_0_8px_#2B63EB]" />
                <circle cx="800" cy="40" r="6" fill="#F8FAFC" stroke="#2B63EB" strokeWidth="3" className="drop-shadow-[0_0_12px_#2B63EB]" />
              </svg>
            </div>

            <div className="flex items-center justify-between mt-8 pt-6 border-t border-[#1E293B]">
              <div className="flex gap-8">
                <div className="space-y-1">
                  <p className="text-[11px] font-bold text-[#475569] uppercase tracking-widest leading-none">Net Volume</p>
                  <p className="text-[16px] font-bold text-[#F8FAFC] tracking-tight">$84,320</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] font-bold text-[#475569] uppercase tracking-widest leading-none">Efficiency</p>
                  <p className="text-[16px] font-bold text-[#10B981] tracking-tight">94.2%</p>
                </div>
              </div>
              <p className="text-[11px] text-[#475569] font-medium flex items-center gap-1">
                Data refreshed <span className="font-bold text-[#F8FAFC]">3 minutes ago</span>
              </p>
            </div>
          </motion.div>

          {/* Quick Actions / Activity Radar */}
          <div className="space-y-6">
            <div className="bg-[#030B1E] border border-[#1E293B] rounded-[24px] p-6">
              <h2 className="text-[15px] font-bold text-[#F8FAFC] mb-5 tracking-tight flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#2B63EB]" />
                Stream Filter
              </h2>
              <div className="space-y-3">
                {recentClients.map((client, i) => (
                  <motion.div
                    key={i}
                    className="flex items-center gap-3 p-3 bg-[#0F172A]/50 border border-transparent hover:border-[#1E293B] rounded-[14px] transition-all cursor-pointer group"
                  >
                    <div className="w-9 h-9 rounded-full bg-[#1E293B] border border-[#334155]/30 flex items-center justify-center font-bold text-[#F8FAFC] text-[13px] group-hover:bg-[#2B63EB]/10 group-hover:text-[#2B63EB] transition-colors">
                      {client.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-bold text-[#F8FAFC] truncate">{client.name}</p>
                      <p className="text-[11px] text-[#475569] font-medium truncate">{client.company || 'Private Workspace'}</p>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-[#475569] group-hover:text-[#F8FAFC] transition-colors" />
                  </motion.div>
                ))}
              </div>
              <button className="w-full mt-4 py-3 bg-[#1E293B]/40 hover:bg-[#1E293B] rounded-[14px] text-[12px] font-bold text-[#F8FAFC] transition-all border border-[#334155]/20">
                View All Activity
              </button>
            </div>

            <div className="bg-gradient-to-br from-[#2B63EB] to-[#1E40AF] rounded-[24px] p-6 text-[#F8FAFC] relative overflow-hidden shadow-2xl shadow-[#2B63EB]/20">
              <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
              <p className="text-[12px] font-bold uppercase tracking-widest opacity-80 mb-1">Elite Status</p>
              <h3 className="text-[18px] font-bold mb-4 leading-tight">Pro plan active and stable.</h3>
              <p className="text-[13px] opacity-70 mb-5 leading-relaxed font-medium">Your current operations are optimized for maximum scalability.</p>
              <button className="w-full py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-[12px] text-[12px] font-bold tracking-tight transition-all">
                Manage Subscription
              </button>
            </div>
          </div>
        </div>

        {/* Dense Feed Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-12">
          <div className="bg-[#030B1E] border border-[#1E293B] rounded-[24px] overflow-hidden">
            <div className="p-6 border-b border-[#1E293B] flex items-center justify-between">
              <h2 className="text-[16px] font-bold text-[#F8FAFC] tracking-tight">Active Transmissions</h2>
              <button className="p-1.5 hover:bg-[#1E293B] rounded-lg transition-colors text-[#475569]">
                <MoreHorizontal className="w-5 h-5" />
              </button>
            </div>
            <div className="divide-y divide-[#1E293B]">
              {recentProjects.map((project: any, i) => (
                <div key={i} className="p-5 flex items-center justify-between group hover:bg-[#0F172A]/30 transition-all cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-[12px] bg-[#0F172A] border border-[#1E293B] flex items-center justify-center">
                      <FolderKanban className="w-5 h-5 text-[#2B63EB]/70 group-hover:text-[#2B63EB] transition-colors" />
                    </div>
                    <div>
                      <h4 className="text-[14px] font-bold text-[#F8FAFC] group-hover:text-[#2B63EB] transition-colors">{project.name}</h4>
                      <p className="text-[11px] text-[#475569] font-bold uppercase tracking-[0.05em]">{project.clients?.name || "Global"}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <span className="text-[11px] px-2 py-0.5 rounded-[4px] bg-[#22D0EE]/10 text-[#22D0EE] font-bold uppercase tracking-wider">{project.status}</span>
                    <span className="text-[10px] text-[#475569] font-bold">{formatTimeAgo(project.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-[#030B1E] border border-[#1E293B] rounded-[24px] p-8 flex flex-col items-center justify-center text-center space-y-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_120%,rgba(43,99,235,0.1),transparent_70%)]" />
            <div className="w-20 h-20 rounded-[24px] bg-[#0F172A] border border-[#1E293B] flex items-center justify-center shadow-2xl">
              <Zap className="w-10 h-10 text-[#2B63EB]" />
            </div>
            <div className="space-y-2 relative z-10">
              <h3 className="text-[20px] font-bold text-[#F8FAFC] tracking-tight">Need operational support?</h3>
              <p className="text-[14px] text-[#475569] max-w-[320px] mx-auto leading-relaxed">Our neural integration specialists are ready to help you optimize your client onboarding flows.</p>
            </div>
            <button className="px-8 py-3 bg-[#F8FAFC] text-[#030B1E] rounded-[14px] text-[13px] font-bold hover:bg-[#E2E8F0] transition-all shadow-xl shadow-white/5 relative z-10">
              Deploy Concierge
            </button>
          </div>
        </div>

      </div>
    </AppLayout>
  );
};

export default Dashboard;
