import { motion } from "framer-motion";
import { Search, Plus, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import AppLayout from "@/components/AppLayout";
import OnboardClientDialog from "@/components/OnboardClientDialog";
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
      <div className="max-w-7xl mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground">Clients</h1>
            <p className="text-muted-foreground mt-1">{clientsData.length} total clients</p>
          </div>
          <button
            onClick={() => setShowOnboard(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition glow-primary"
          >
            <Plus className="w-4 h-4" />
            Add Client
          </button>
        </motion.div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search clients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-secondary border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
          />
        </div>

        {/* Client Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((client, i) => (
            <motion.div
              key={client.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <Link
                to={`/clients/${client.id}`}
                className="block glass-card rounded-xl p-5 hover:border-primary/30 transition-all group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-bold text-primary">{client.avatar_initial}</span>
                    </div>
                    <div>
                      <h3 className="font-heading font-semibold text-foreground group-hover:text-primary transition">
                        {client.name}
                      </h3>
                      <p className="text-xs text-muted-foreground">{client.lastActive}</p>
                    </div>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition" />
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{client.projects} projects</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    client.status === "active"
                      ? "bg-success/10 text-success"
                      : client.status === "onboarding"
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground"
                  }`}>
                    {client.status}
                  </span>
                </div>

                <div className="mt-3 pt-3 border-t border-border/50">
                  <p className="text-xs text-muted-foreground">Revenue (MTD)</p>
                  <p className="text-lg font-heading font-bold text-foreground">{client.revenue}</p>
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
