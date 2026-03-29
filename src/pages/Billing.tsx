import { motion } from "framer-motion";
import { Plus, DollarSign, TrendingUp, Receipt, BarChart3, Download, Loader2 } from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AppLayout from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Billing = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [clientId, setClientId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleDownloadInvoice = async (inv: any) => {
    setDownloadingId(inv.id);
    try {
      const { data, error } = await supabase.functions.invoke('generate-invoice', {
        body: {
          invoiceNumber: inv.invoice_number,
          amount: inv.amount,
          dueDate: inv.due_date,
          clientName: inv.clients?.name,
        },
      });
      if (error) throw error;
      
      const blob = data instanceof Blob ? data : new Blob([data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice_${inv.invoice_number}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      toast.error(err.message || 'Failed to generate invoice PDF');
    } finally {
      setDownloadingId(null);
    }
  };

  const { data: invoices = [] } = useQuery({
    queryKey: ["invoices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select("*, clients(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["clients-list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("clients").select("id, name").order("name");
      if (error) throw error;
      return data || [];
    },
  });

  const createInvoice = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("invoices").insert({
        invoice_number: invoiceNumber,
        amount: parseFloat(amount),
        client_id: clientId,
        user_id: user.id,
        due_date: dueDate || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-revenue"] });
      setShowDialog(false);
      setInvoiceNumber("");
      setAmount("");
      setClientId("");
      setDueDate("");
      toast.success("Invoice created!");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const totalRevenue = invoices.reduce((sum, inv: any) => sum + Number(inv.amount || 0), 0);
  const paidAmount = invoices.filter((inv: any) => inv.status === "paid").reduce((sum, inv: any) => sum + Number(inv.amount || 0), 0);
  const outstandingAmount = totalRevenue - paidAmount;

  const billingStats = [
    { label: "Revenue (Total)", value: `$${totalRevenue.toLocaleString()}`, icon: DollarSign },
    { label: "Outstanding", value: `$${outstandingAmount.toLocaleString()}`, icon: Receipt },
    { label: "Collected", value: `$${paidAmount.toLocaleString()}`, icon: TrendingUp },
    { label: "Invoices", value: String(invoices.length), icon: BarChart3 },
  ];

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-8">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground">Billing</h1>
            <p className="text-muted-foreground mt-1">Revenue & payment tracking</p>
          </div>
          <button
            onClick={() => setShowDialog(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition glow-primary"
          >
            <Plus className="w-4 h-4" />
            Create Invoice
          </button>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {billingStats.map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-card rounded-xl p-5">
              <stat.icon className="w-5 h-5 text-muted-foreground mb-3" />
              <p className="text-2xl font-heading font-bold text-foreground">{stat.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        <div className="glass-card rounded-xl p-6">
          <h2 className="font-heading font-semibold text-foreground mb-4">All Invoices</h2>
          {invoices.length === 0 ? (
            <p className="text-sm text-muted-foreground">No invoices yet. Create your first one above.</p>
          ) : (
            <div className="space-y-3">
              {invoices.map((inv: any) => (
                <div key={inv.id} className="flex items-center justify-between py-3 border-b border-border/50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-foreground">{inv.invoice_number}</p>
                    <p className="text-xs text-muted-foreground">{inv.clients?.name || "Unknown"} · {new Date(inv.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-heading font-bold text-foreground">${Number(inv.amount).toLocaleString()}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        inv.status === "paid" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
                      }`}>
                        {inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-primary"
                      disabled={downloadingId === inv.id}
                      onClick={() => handleDownloadInvoice(inv)}
                    >
                      {downloadingId === inv.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-heading">Create Invoice</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Invoice Number</Label>
              <Input placeholder="INV-1001" value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Client</Label>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                <SelectContent>
                  {clients.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Amount ($)</Label>
              <Input type="number" placeholder="1000" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Due Date (optional)</Label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button
              onClick={() => createInvoice.mutate()}
              disabled={!invoiceNumber || !amount || !clientId || createInvoice.isPending}
            >
              {createInvoice.isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default Billing;
