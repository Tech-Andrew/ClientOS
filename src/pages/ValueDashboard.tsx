import { motion } from "framer-motion";
import { TrendingUp, DollarSign, CheckCircle2, Target, BarChart3, PieChart } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart as RechartsPieChart, Pie, Cell } from "recharts";
import AppLayout from "@/components/AppLayout";

const monthlyRevenue = [
  { month: "Oct", revenue: 28000, delivered: 12 },
  { month: "Nov", revenue: 31000, delivered: 15 },
  { month: "Dec", revenue: 35000, delivered: 18 },
  { month: "Jan", revenue: 33000, delivered: 14 },
  { month: "Feb", revenue: 38000, delivered: 20 },
  { month: "Mar", revenue: 42800, delivered: 22 },
];

const clientValue = [
  { name: "Acme Corp", value: 12400, tasks: 28, color: "hsl(217, 91%, 60%)" },
  { name: "TechStart", value: 8200, tasks: 18, color: "hsl(142, 71%, 45%)" },
  { name: "GreenLeaf", value: 15600, tasks: 35, color: "hsl(38, 92%, 50%)" },
  { name: "CloudNine", value: 6800, tasks: 12, color: "hsl(280, 67%, 55%)" },
];

const deliverables = [
  { category: "Design", completed: 24, total: 28 },
  { category: "Development", completed: 15, total: 22 },
  { category: "Content", completed: 18, total: 20 },
  { category: "SEO", completed: 8, total: 12 },
  { category: "Strategy", completed: 6, total: 6 },
];

const roiMetrics = [
  { label: "Total Value Delivered", value: "$207.8k", icon: TrendingUp, sub: "Across all clients" },
  { label: "Tasks Completed", value: "142", icon: CheckCircle2, sub: "This quarter" },
  { label: "Avg. Client ROI", value: "3.2x", icon: Target, sub: "Return on retainer" },
  { label: "Revenue Growth", value: "+18%", icon: BarChart3, sub: "vs. last quarter" },
];

const tooltipStyle = {
  contentStyle: {
    backgroundColor: "hsl(220, 20%, 9%)",
    border: "1px solid hsl(220, 15%, 16%)",
    borderRadius: "8px",
    color: "hsl(220, 20%, 95%)",
    fontSize: "12px",
  },
};

const ValueDashboard = () => {
  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-8">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-heading font-bold text-foreground">Value Dashboard</h1>
          <p className="text-muted-foreground mt-1">ROI tracking & results delivered</p>
        </motion.div>

        {/* Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {roiMetrics.map((m, i) => (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card rounded-xl p-5"
            >
              <m.icon className="w-5 h-5 text-primary mb-3" />
              <p className="text-2xl font-heading font-bold text-foreground">{m.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{m.label}</p>
              <p className="text-xs text-muted-foreground/60 mt-0.5">{m.sub}</p>
            </motion.div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Trend */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card rounded-xl p-6"
          >
            <h2 className="font-heading font-semibold text-foreground mb-4">Revenue Trend</h2>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 16%)" />
                <XAxis dataKey="month" stroke="hsl(220, 10%, 50%)" fontSize={12} />
                <YAxis stroke="hsl(220, 10%, 50%)" fontSize={12} tickFormatter={(v) => `$${v / 1000}k`} />
                <Tooltip {...tooltipStyle} formatter={(value: number) => [`$${value.toLocaleString()}`, "Revenue"]} />
                <Line type="monotone" dataKey="revenue" stroke="hsl(217, 91%, 60%)" strokeWidth={2} dot={{ r: 4, fill: "hsl(217, 91%, 60%)" }} />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Client Value Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="glass-card rounded-xl p-6"
          >
            <h2 className="font-heading font-semibold text-foreground mb-4">Client Value Distribution</h2>
            <ResponsiveContainer width="100%" height={250}>
              <RechartsPieChart>
                <Pie
                  data={clientValue}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {clientValue.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip {...tooltipStyle} formatter={(value: number) => [`$${value.toLocaleString()}`, "Revenue"]} />
              </RechartsPieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-3 mt-2">
              {clientValue.map((c) => (
                <div key={c.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
                  {c.name}
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Deliverables + Work Done */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Deliverables */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card rounded-xl p-6"
          >
            <h2 className="font-heading font-semibold text-foreground mb-4">Deliverables by Category</h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={deliverables} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 16%)" />
                <XAxis type="number" stroke="hsl(220, 10%, 50%)" fontSize={12} />
                <YAxis type="category" dataKey="category" stroke="hsl(220, 10%, 50%)" fontSize={12} width={80} />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="completed" fill="hsl(142, 71%, 45%)" radius={[0, 4, 4, 0]} name="Completed" />
                <Bar dataKey="total" fill="hsl(220, 15%, 20%)" radius={[0, 4, 4, 0]} name="Total" />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Work Output */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="glass-card rounded-xl p-6"
          >
            <h2 className="font-heading font-semibold text-foreground mb-4">Work Delivered per Month</h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 16%)" />
                <XAxis dataKey="month" stroke="hsl(220, 10%, 50%)" fontSize={12} />
                <YAxis stroke="hsl(220, 10%, 50%)" fontSize={12} />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="delivered" fill="hsl(217, 91%, 60%)" radius={[4, 4, 0, 0]} name="Deliverables" />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>
      </div>
    </AppLayout>
  );
};

export default ValueDashboard;
