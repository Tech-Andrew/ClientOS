import { motion } from "framer-motion";
import { Plus, CheckCircle2, Circle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import AppLayout from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";

const Projects = () => {
  const { data: projects = [] } = useQuery({
    queryKey: ["projects-with-tasks"],
    queryFn: async () => {
      const { data: projectsData, error: pErr } = await supabase
        .from("projects")
        .select("*, clients(name)")
        .order("created_at", { ascending: false });
      if (pErr) throw pErr;

      const { data: tasksData, error: tErr } = await supabase
        .from("tasks")
        .select("*")
        .eq("is_milestone", true)
        .order("sort_order", { ascending: true });
      if (tErr) throw tErr;

      return (projectsData || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        client: p.clients?.name || "Unknown",
        progress: p.progress || 0,
        status: p.status === "in-progress" ? "In Progress" : p.status.charAt(0).toUpperCase() + p.status.slice(1),
        milestones: (tasksData || [])
          .filter((t: any) => t.project_id === p.id)
          .map((t: any) => ({ name: t.title, done: t.status === "completed" })),
      }));
    },
  });

  const fallbackProjects = [
    { name: "Brand Redesign", client: "Acme Corp", progress: 75, status: "In Progress", milestones: [{ name: "Discovery", done: true }, { name: "Design", done: true }, { name: "Development", done: false }, { name: "Launch", done: false }] },
    { name: "SEO Optimization", client: "TechStart", progress: 40, status: "In Progress", milestones: [{ name: "Audit", done: true }, { name: "On-Page", done: false }, { name: "Off-Page", done: false }, { name: "Report", done: false }] },
  ];

  const displayProjects = projects.length > 0 ? projects : fallbackProjects;

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground">Projects</h1>
            <p className="text-muted-foreground mt-1">{displayProjects.length} active projects</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition glow-primary">
            <Plus className="w-4 h-4" />
            New Project
          </button>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {displayProjects.map((project, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card rounded-xl p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-heading font-semibold text-foreground">{project.name}</h3>
                  <p className="text-sm text-muted-foreground">{project.client}</p>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                  project.status === "Review" ? "bg-warning/10 text-warning" : "bg-primary/10 text-primary"
                }`}>
                  {project.status}
                </span>
              </div>

              <div className="mb-4">
                <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                  <span>Progress</span>
                  <span>{project.progress}%</span>
                </div>
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${project.progress}%` }} />
                </div>
              </div>

              <div className="flex gap-3 flex-wrap">
                {project.milestones.map((m, j) => (
                  <div key={j} className="flex items-center gap-1.5 text-xs">
                    {m.done ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                    ) : (
                      <Circle className="w-3.5 h-3.5 text-muted-foreground" />
                    )}
                    <span className={m.done ? "text-foreground" : "text-muted-foreground"}>{m.name}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
};

export default Projects;
