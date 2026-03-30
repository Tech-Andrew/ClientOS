import { motion } from "framer-motion";
import { Plus, DollarSign, TrendingUp, Receipt, BarChart3, Download, Loader2 } from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AppLayout from "@/shared/components/layout/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/shared/hooks/useAuth";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";

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
            <h1 className="text-[32px] font-bold text-[#F8FAFC] tracking-tight">Billing</h1>
            <p className="text-[#94A3B8] text-[14px] mt-1 font-medium">Revenue & payment tracking</p>
          </div>
          <button
            onClick={() => setShowDialog(true)}
            className="flex items-center gap-2 px-5 py-2.5 btn-primary"
          >
            <Plus className="w-4 h-4" />
            Create Invoice
          </button>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {billingStats.map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="panel-card flex flex-col justify-between min-h-[140px]">
              <div className="flex items-center justify-between">
                <div className="p-2.5 rounded-[8px] bg-[#1E293B] border border-[#334155]/20">
                  <stat.icon className="w-5 h-5 text-[#2B63EB]" />
                </div>
              </div>
              <div>
                <p className="text-[24px] font-bold text-[#F8FAFC] tracking-tight">{stat.value}</p>
                <p className="text-[12px] text-[#475569] font-bold uppercase tracking-widest mt-1">{stat.label}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="panel-card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[18px] font-bold text-[#F8FAFC]">All Invoices</h2>
            <div className="flex gap-2">
              <span className="text-[11px] px-2.5 py-1 rounded-[4px] bg-[#1E293B] text-[#94A3B8] font-bold uppercase tracking-wider">Internal Filter</span>
            </div>
          </div>
          
          {invoices.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <Receipt className="w-12 h-12 text-[#1E293B] mb-4" />
              <p className="text-[14px] text-[#475569] font-medium max-w-[280px]">No invoices yet. Create your first one to begin tracking revenue.</p>
            </div>
          ) : (
            <div className="space-y-1">
              {invoices.map((inv: any) => (
                <div key={inv.id} className="flex items-center justify-between py-4 px-4 hover:bg-[#0F172A] rounded-[8px] border-b border-[#1E293B] last:border-0 transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-[8px] bg-[#1E293B] flex items-center justify-center border border-[#334155]/10">
                      <Receipt className="w-5 h-5 text-[#475569] group-hover:text-[#2B63EB] transition-colors" />
                    </div>
                    <div>
                      <p className="text-[14px] font-bold text-[#F8FAFC]">{inv.invoice_number}</p>
                      <p className="text-[12px] text-[#475569] font-medium">{inv.clients?.name || "Unknown"} · {new Date(inv.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-4">
                      <span className="text-[16px] font-bold text-[#F8FAFC] tracking-tight">${Number(inv.amount).toLocaleString()}</span>
                      <span className={`text-[11px] px-3 py-1 rounded-[4px] font-bold uppercase tracking-wider ${
                        inv.status === "paid" ? "bg-[#22D0EE]/10 text-[#22D0EE]" : "bg-[#FACC15]/10 text-[#FACC15]"
                      }`}>
                        {inv.status}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 rounded-[8px] text-[#475569] hover:text-[#2B63EB] hover:bg-[#1E293B]"
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
