import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

interface OnboardClientDialogProps {
  open: boolean;
  onClose: () => void;
}

const DEFAULT_TASKS = [
  { title: "Kickoff meeting", is_milestone: true, sort_order: 0 },
  { title: "Gather brand assets", is_milestone: false, sort_order: 1 },
  { title: "Define project scope", is_milestone: false, sort_order: 2 },
  { title: "Create project timeline", is_milestone: true, sort_order: 3 },
  { title: "Initial strategy presentation", is_milestone: true, sort_order: 4 },
  { title: "Client review & approval", is_milestone: true, sort_order: 5 },
];

const OnboardClientDialog = ({ open, onClose }: OnboardClientDialogProps) => {
  const queryClient = useQueryClient();
  const [step, setStep] = useState<"form" | "creating" | "done">("form");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [projectName, setProjectName] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!name.trim() || !projectName.trim()) {
      setError("Client name and project name are required");
      return;
    }

    setStep("creating");
    setError("");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // 1. Create client
      const { data: client, error: clientErr } = await supabase
        .from("clients")
        .insert({
          user_id: user.id,
          name: name.trim(),
          email: email.trim() || null,
          company: company.trim() || null,
          avatar_initial: name.trim().charAt(0).toUpperCase(),
          status: "onboarding",
        })
        .select()
        .single();

      if (clientErr) throw clientErr;

      // 2. Create default project
      const { data: project, error: projErr } = await supabase
        .from("projects")
        .insert({
          user_id: user.id,
          client_id: client.id,
          name: projectName.trim(),
          status: "planning",
          progress: 0,
        })
        .select()
        .single();

      if (projErr) throw projErr;

      // 3. Create default tasks
      const tasks = DEFAULT_TASKS.map((t) => ({
        user_id: user.id,
        project_id: project.id,
        ...t,
      }));

      const { error: tasksErr } = await supabase.from("tasks").insert(tasks);
      if (tasksErr) throw tasksErr;

      // 4. Create initial approval
      await supabase.from("approvals").insert({
        user_id: user.id,
        client_id: client.id,
        project_id: project.id,
        title: `${projectName.trim()} — Initial Strategy`,
        type: "Strategy",
        status: "pending",
      });

      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setStep("done");

      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
      setStep("form");
    }
  };

  const handleClose = () => {
    setStep("form");
    setName("");
    setEmail("");
    setCompany("");
    setProjectName("");
    setError("");
    onClose();
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="glass-card rounded-2xl p-6 w-full max-w-md"
        >
          {step === "form" && (
            <>
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-heading text-xl font-bold text-foreground">Onboard New Client</h2>
                <button onClick={handleClose} className="p-1 text-muted-foreground hover:text-foreground transition">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Client Name *</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Acme Corp"
                    className="w-full px-3 py-2.5 bg-secondary border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Email</label>
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="client@company.com"
                    className="w-full px-3 py-2.5 bg-secondary border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Company</label>
                  <input
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="Company name"
                    className="w-full px-3 py-2.5 bg-secondary border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">First Project Name *</label>
                  <input
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="e.g. Brand Redesign"
                    className="w-full px-3 py-2.5 bg-secondary border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
                  />
                </div>

                {error && <p className="text-sm text-destructive">{error}</p>}

                <div className="p-3 bg-secondary/50 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-2">Auto-created on onboarding:</p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    {DEFAULT_TASKS.map((t, i) => (
                      <li key={i} className="flex items-center gap-1.5">
                        {t.is_milestone ? (
                          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                        ) : (
                          <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50" />
                        )}
                        {t.title}
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={handleSubmit}
                  className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition glow-primary"
                >
                  Start Onboarding
                </button>
              </div>
            </>
          )}

          {step === "creating" && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
              <p className="text-sm text-muted-foreground">Setting up workspace...</p>
            </div>
          )}

          {step === "done" && (
            <div className="flex flex-col items-center justify-center py-12">
              <CheckCircle2 className="w-8 h-8 text-success mb-4" />
              <p className="text-sm font-medium text-foreground">Client onboarded successfully!</p>
              <p className="text-xs text-muted-foreground mt-1">Project, tasks, and approval created.</p>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default OnboardClientDialog;
