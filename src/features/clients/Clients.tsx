import { motion } from "framer-motion";
import { Search, Plus, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import AppLayout from "@/shared/components/layout/AppLayout";
import OnboardClientDialog from "@/features/clients/OnboardClientDialog";
import { supabase } from "@/integrations/supabase/client";

const fallbackClients = [
  { id: "1", name: "Acme Corp", projects: 3, status: "active", revenue: "$12,400", avatar_initial: "A", lastActive: "2 min ago" },
  { id: "2", name: "TechStart", projects: 2, status: "active", revenue: "$8,200", avatar_initial: "T", lastActive: "1 hr ago" },
  { id: "3", name: "GreenLeaf", projects: 4, status: "active", revenue: "$15,600", avatar_initial: "G", lastActive: "3 hrs ago" },
  { id: "4", name: "PixelPerfect", projects: 1, status: "onboarding", revenue: "$0", avatar_initial: "P", lastActive: "1 day ago" },
];

const Clients = () => {
  const [search, setSearch] = useState("");
  const [showOnboard, setShowOnboard] = useState(false);

  const { data: dbClients } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data, error } = await supabase.from("clients").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const clientsData = dbClients && dbClients.length > 0
    ? dbClients.map((c) => ({
        id: c.id,
        name: c.name,
        projects: 0,
        status: c.status,
        revenue: `$${Number(c.revenue_mtd || 0).toLocaleString()}`,
        avatar_initial: c.avatar_initial || c.name.charAt(0),
        lastActive: new Date(c.created_at).toLocaleDateString(),
      }))
    : fallbackClients;
  const filtered = clientsData.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-[32px] font-bold text-[#F8FAFC] tracking-tight">Clients</h1>
            <p className="text-[#94A3B8] text-[14px] mt-1">{clientsData.length} total clients</p>
          </div>
          <button
            onClick={() => setShowOnboard(true)}
            className="flex items-center gap-2 px-5 py-2.5 btn-primary"
          >
            <Plus className="w-4 h-4" />
            Add Client
          </button>
        </motion.div>

        {/* Search */}
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#475569] group-focus-within:text-[#2B63EB] transition-colors" />
          <input
            type="text"
            placeholder="Search clients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-[#0F172A] border border-[#1E293B] rounded-[10px] text-[14px] text-[#F8FAFC] placeholder:text-[#475569] focus:outline-none focus:border-[#2B63EB] transition-all"
          />
        </div>

        {/* Client Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((client, i) => (
            <motion.div
              key={client.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <Link
                to={`/clients/${client.id}`}
                className="block panel-card hover:border-[#2B63EB]/50 transition-all group relative overflow-hidden"
              >
                <div className="flex items-start justify-between mb-5">
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-[10px] bg-[#1E293B] flex items-center justify-center border border-[#334155]/30">
                      <span className="text-[14px] font-bold text-[#F8FAFC]">{client.avatar_initial}</span>
                    </div>
                    <div>
                      <h3 className="text-[18px] font-semibold text-[#F8FAFC] group-hover:text-[#2B63EB] transition-colors leading-tight">
                        {client.name}
                      </h3>
                      <p className="text-[12px] text-[#475569] font-medium mt-0.5 uppercase tracking-wider">{client.lastActive}</p>
                    </div>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-[#475569] opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>

                <div className="flex items-center justify-between text-[13px] mb-5">
                  <span className="text-[#94A3B8] font-medium">{client.projects} projects</span>
                  <span className={`px-2.5 py-0.5 rounded-[4px] text-[11px] font-bold uppercase tracking-wider ${
                    client.status === "active"
                      ? "bg-[#22D0EE]/10 text-[#22D0EE]"
                      : client.status === "onboarding"
                      ? "bg-[#2B63EB]/10 text-[#2B63EB]"
                      : "bg-[#1E293B] text-[#94A3B8]"
                  }`}>
                    {client.status}
                  </span>
                </div>

                <div className="pt-4 border-t border-[#1E293B]">
                  <p className="text-[11px] text-[#475569] font-bold uppercase tracking-widest mb-1">Revenue (MTD)</p>
                  <p className="text-[20px] font-bold text-[#F8FAFC] tracking-tight">{client.revenue}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
      <OnboardClientDialog open={showOnboard} onClose={() => setShowOnboard(false)} />
    </AppLayout>

  );
};

export default Clients;
