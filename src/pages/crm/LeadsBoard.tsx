import React, { useEffect, useMemo, useState } from "react";
import supabase from "@/lib/supabase/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Loader2, Calendar, DollarSign, Phone, Mail, User, Edit, Trash2, Building2, AlertCircle, Settings, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";

type Lead = {
  id: string;
  customer_name: string;
  company_name: string | null;
  email: string | null;
  phone: string | null;
  status: string | null; // 'leads' | 'negotiation' | 'lost' | 'sales'
  estimated_value: number | null;
  expected_close_date: string | null;
  notes: string | null;
  lead_number: string | null;
  priority: string | null;
  source: string | null;
  assigned_to: string | null;
  sales_manager: string | null;
  lost_reason: string | null;
};

const COLUMNS = [
  { id: "leads", title: "Leads Board", bg: "bg-green-50", border: "border-green-200" },
  { id: "negotiation", title: "Negotiation", bg: "bg-yellow-50", border: "border-yellow-200" },
  { id: "lost", title: "Lost", bg: "bg-rose-50", border: "border-rose-200" },
  { id: "sales", title: "Sales", bg: "bg-sky-50", border: "border-sky-200" },
] as const;

const CARD_FIELDS = [
  { key: "customer_name", label: "Customer Name", default: true },
  { key: "company_name", label: "Company Name", default: true },
  { key: "lead_number", label: "Lead Number", default: true },
  { key: "priority", label: "Priority", default: true },
  { key: "phone", label: "Phone", default: true },
  { key: "email", label: "Email", default: true },
  { key: "estimated_value", label: "Estimated Value", default: true },
  { key: "expected_close_date", label: "Expected Close Date", default: true },
  { key: "source", label: "Source", default: true },
  { key: "sales_manager", label: "Sales Manager", default: false },
] as const;

const getPriorityColor = (priority: string | null) => {
  switch (priority) {
    case 'urgent': return 'bg-red-50 border-red-200';
    case 'high': return 'bg-orange-50 border-orange-200';
    case 'medium': return 'bg-yellow-50 border-yellow-200';
    case 'low': return 'bg-gray-50 border-gray-200';
    default: return 'bg-blue-50 border-blue-200';
  }
};

export default function LeadsBoard() {
  const queryClient = useQueryClient();
  const [dragLeadId, setDragLeadId] = useState<string | null>(null);
  const [openNew, setOpenNew] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openSettings, setOpenSettings] = useState(false);
  const [openLostReason, setOpenLostReason] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [movingToLost, setMovingToLost] = useState<{ id: string; name: string } | null>(null);
  const [lostReason, setLostReason] = useState("");
  const [view, setView] = useState<"kanban" | "table">(() => (localStorage.getItem("leads_view") as any) || "kanban");
  const [visibleFields, setVisibleFields] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem("leads_visible_fields");
    if (saved) return JSON.parse(saved);
    const defaults: Record<string, boolean> = {};
    CARD_FIELDS.forEach(field => {
      defaults[field.key] = field.default;
    });
    return defaults;
  });
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    customer_name: "",
    company_name: "",
    email: "",
    phone: "",
    estimated_value: "",
    expected_close_date: "",
    notes: "",
    priority: "",
    source: "",
    sales_manager: "",
  });

  const { data: leads, isLoading } = useQuery({
    queryKey: ["leads"],
      queryFn: async () => {
        const { data, error } = await supabase
          .from("leads")
          .select("*")
          .order("created_at", { ascending: false });
        if (error) throw error;
        return (data || []) as Lead[];
      },
  });

  const { data: profiles } = useQuery({
    queryKey: ["profiles-basic"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("id, full_name, email");
      if (error) throw error;
      return data || [];
    },
  });

  const filteredLeads = useMemo(() => {
    const query = search.trim().toLowerCase();
    return (leads || []).filter((lead) => {
      if (!query) return true;
      return Object.values(lead).some((value) => String(value ?? "").toLowerCase().includes(query));
    });
  }, [leads, search]);

  const grouped = useMemo(() => {
    const map: Record<string, Lead[]> = { leads: [], negotiation: [], lost: [], sales: [] };
    filteredLeads.forEach((lead) => {
      const statusKey = (lead.status || "leads") as keyof typeof map;
      (map[statusKey] || map.leads).push(lead);
    });
    return map;
  }, [filteredLeads]);

  const moveMutation = useMutation({
    mutationFn: async ({ id, status, lost_reason }: { id: string; status: string; lost_reason?: string }) => {
      const payload: any = { status };
      if (status === "lost" && lost_reason) {
        payload.lost_reason = lost_reason;
      }
      const { error } = await supabase.from("leads").update(payload).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      setOpenLostReason(false);
      setMovingToLost(null);
      setLostReason("");
    },
    onError: (e: any) => toast.error(e.message || "Failed to move lead"),
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const payload: any = {
        customer_name: form.customer_name,
        company_name: form.company_name || null,
        email: form.email || null,
        phone: form.phone || null,
        estimated_value: form.estimated_value ? Number(form.estimated_value) : null,
        expected_close_date: form.expected_close_date || null,
        notes: form.notes || null,
        priority: form.priority || null,
        source: form.source || null,
        sales_manager: form.sales_manager || null,
        status: "leads",
      };
      const { error } = await supabase.from("leads").insert([payload]);
      if (error) throw error;
    },
    onSuccess: () => {
      setOpenNew(false);
      setForm({ customer_name: "", company_name: "", email: "", phone: "", estimated_value: "", expected_close_date: "", notes: "", priority: "", source: "", sales_manager: "" });
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast.success("Lead created");
    },
    onError: (e: any) => toast.error(e.message || "Failed to create lead"),
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editingLead) return;
      const payload: any = {
        customer_name: form.customer_name,
        company_name: form.company_name || null,
        email: form.email || null,
        phone: form.phone || null,
        estimated_value: form.estimated_value ? Number(form.estimated_value) : null,
        expected_close_date: form.expected_close_date || null,
        notes: form.notes || null,
        priority: form.priority || null,
        source: form.source || null,
        sales_manager: form.sales_manager || null,
      };
      const { error } = await supabase.from("leads").update(payload).eq("id", editingLead.id);
      if (error) throw error;
    },
    onSuccess: () => {
      setOpenEdit(false);
      setEditingLead(null);
      setForm({ customer_name: "", company_name: "", email: "", phone: "", estimated_value: "", expected_close_date: "", notes: "", priority: "", source: "", sales_manager: "" });
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast.success("Lead updated");
    },
    onError: (e: any) => toast.error(e.message || "Failed to update lead"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("leads").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast.success("Lead deleted");
    },
    onError: (e: any) => toast.error(e.message || "Failed to delete lead"),
  });

  const onDragStart = (id: string) => setDragLeadId(id);
  const onDropColumn = (status: string) => {
    if (!dragLeadId) return;
    
    if (status === "lost") {
      const lead = leads?.find(l => l.id === dragLeadId);
      if (lead) {
        setMovingToLost({ id: dragLeadId, name: lead.customer_name });
        setOpenLostReason(true);
        setDragLeadId(null);
        return;
      }
    }
    
    moveMutation.mutate({ id: dragLeadId, status });
    setDragLeadId(null);
  };

  const confirmMoveToLost = () => {
    if (!movingToLost || !lostReason.trim()) {
      toast.error("Please provide a reason for marking as lost");
      return;
    }
    moveMutation.mutate({ id: movingToLost.id, status: "lost", lost_reason: lostReason });
  };

  const changeStatus = (lead: Lead, nextStatus: string) => {
    if (!lead || !nextStatus || nextStatus === (lead.status || "leads")) return;
    if (nextStatus === "lost") {
      setMovingToLost({ id: lead.id, name: lead.customer_name });
      setOpenLostReason(true);
      return;
    }
    moveMutation.mutate({ id: lead.id, status: nextStatus });
  };

  const toggleFieldVisibility = (fieldKey: string) => {
    const newVisibleFields = { ...visibleFields, [fieldKey]: !visibleFields[fieldKey] };
    setVisibleFields(newVisibleFields);
    localStorage.setItem("leads_visible_fields", JSON.stringify(newVisibleFields));
  };

  const openEditLead = (lead: Lead) => {
    setEditingLead(lead);
    setForm({
      customer_name: lead.customer_name,
      company_name: lead.company_name || "",
      email: lead.email || "",
      phone: lead.phone || "",
      estimated_value: lead.estimated_value?.toString() || "",
      expected_close_date: lead.expected_close_date || "",
      notes: lead.notes || "",
      priority: lead.priority || "",
      source: lead.source || "",
      sales_manager: (lead as any).sales_manager || "",
    });
    setOpenEdit(true);
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">Leads</h1>
          <div className="flex items-center gap-2 text-sm">
            <span className={view === "kanban" ? "font-medium" : "text-muted-foreground"}>Kanban</span>
            <Switch checked={view === "table"} onCheckedChange={(checked) => {
              const v = checked ? "table" : "kanban";
              setView(v);
              localStorage.setItem("leads_view", v);
            }} />
            <span className={view === "table" ? "font-medium" : "text-muted-foreground"}>Table</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search leads..."
            className="w-64"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Dialog open={openSettings} onOpenChange={setOpenSettings}>
            <DialogTrigger asChild>
              <Button variant="outline" size="icon" title="Settings">
                <Settings className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Card Display Settings</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Choose which fields to display on cards:</p>
                {CARD_FIELDS.map((field) => (
                  <div key={field.key} className="flex items-center space-x-2">
                    <Checkbox
                      id={field.key}
                      checked={visibleFields[field.key] || false}
                      onCheckedChange={() => toggleFieldVisibility(field.key)}
                    />
                    <Label htmlFor={field.key} className="text-sm">
                      {field.label}
                    </Label>
                  </div>
                ))}
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={openNew} onOpenChange={setOpenNew}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" /> New Lead
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>Create Lead</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label>Customer Name</Label>
                <Input value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} />
              </div>
              <div className="col-span-2">
                <Label>Company Name</Label>
                <Input value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} />
              </div>
              <div>
                <Label>Email</Label>
                <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div>
                <Label>Phone</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div>
                <Label>Sales Manager</Label>
                <Select value={form.sales_manager} onValueChange={(value) => setForm({ ...form, sales_manager: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select manager" />
                  </SelectTrigger>
                  <SelectContent>
                    {(profiles || []).map((p: any) => (
                      <SelectItem key={p.id} value={p.id}>{p.full_name || p.email}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Priority</Label>
                <Select value={form.priority} onValueChange={(value) => setForm({ ...form, priority: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Source</Label>
                <Input value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} placeholder="e.g., Website, Referral, Cold Call" />
              </div>
              <div>
                <Label>Estimated Value</Label>
                <Input type="number" value={form.estimated_value} onChange={(e) => setForm({ ...form, estimated_value: e.target.value })} />
              </div>
              <div>
                <Label>Expected Close Date</Label>
                <Input type="date" value={form.expected_close_date} onChange={(e) => setForm({ ...form, expected_close_date: e.target.value })} />
              </div>
              <div className="col-span-2">
                <Label>Notes</Label>
                <Textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpenNew(false)}>Cancel</Button>
              <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
                {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      </div>

      {view === "kanban" ? (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {COLUMNS.map((col) => (
          <div key={col.id} className={`rounded-lg border ${col.border} bg-background`}>
            <div className="px-4 py-3 border-b text-sm font-semibold flex items-center justify-between">
              <span>{col.title}</span>
              <span className="text-xs text-muted-foreground">{grouped[col.id as keyof typeof grouped]?.length || 0}</span>
            </div>
            <div
              className={`p-3 min-h-[300px] ${col.bg}`}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onDropColumn(col.id)}
            >
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-16" />
                  ))}
                </div>
              ) : grouped[col.id as keyof typeof grouped].length === 0 ? (
                <div className="text-xs text-muted-foreground px-2">No items</div>
              ) : (
                <>
                {grouped[col.id as keyof typeof grouped].map((lead) => (
                  <Card
                    key={lead.id}
                    draggable
                    onDragStart={() => onDragStart(lead.id)}
                    className={`mb-3 shadow-sm hover:shadow transition ${getPriorityColor(lead.priority)}`}
                  >
                    <CardContent className="p-3 text-sm">
                <div className="font-medium mb-1 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="h-3.5 w-3.5 text-muted-foreground" /> {lead.customer_name}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openEditLead(lead)}>
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => deleteMutation.mutate(lead.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                {visibleFields.company_name && lead.company_name && (
                  <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                    <Building2 className="h-3 w-3" /> {lead.company_name}
                  </div>
                )}
                {visibleFields.lead_number && lead.lead_number && (
                  <div className="text-xs text-muted-foreground mb-1">Lead #: {lead.lead_number}</div>
                )}
                {visibleFields.sales_manager && (lead as any).sales_manager && profiles && (
                  <div className="text-xs text-muted-foreground mb-1">Sales Manager: {(profiles as any[]).find((p) => p.id === (lead as any).sales_manager)?.full_name || "—"}</div>
                )}
                {visibleFields.priority && lead.priority && (
                  <div className="text-xs mb-1">
                    <span className={`px-1.5 py-0.5 rounded text-xs ${
                      lead.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                      lead.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                      lead.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {lead.priority.toUpperCase()}
                    </span>
                  </div>
                )}
                      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                        {visibleFields.phone && lead.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" /> {lead.phone}
                          </div>
                        )}
                        {visibleFields.email && lead.email && (
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3" /> {lead.email}
                          </div>
                        )}
                        {visibleFields.estimated_value && lead.estimated_value !== null && (
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" /> {lead.estimated_value}
                          </div>
                        )}
                        {visibleFields.expected_close_date && lead.expected_close_date && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(lead.expected_close_date).toLocaleDateString()}
                          </div>
                        )}
                        {visibleFields.source && lead.source && (
                          <div className="flex items-center gap-1 col-span-2">
                            <AlertCircle className="h-3 w-3" /> Source: {lead.source}
                          </div>
                        )}
                        {lead.status === "lost" && (lead as any).lost_reason && (
                          <div className="flex items-center gap-1 col-span-2 text-red-600">
                            <X className="h-3 w-3" /> Lost: {(lead as any).lost_reason}
                          </div>
                        )}
                      </div>
                      <div className="mt-2 md:hidden">
                        <Label className="text-xs mb-1 block">Status</Label>
                        <Select
                          value={(lead.status as string) || "leads"}
                          onValueChange={(value) => changeStatus(lead, value)}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {COLUMNS.map((c) => (
                              <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                </>
              )}
            </div>
          </div>
        ))}
      </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lead #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Sales Manager</TableHead>
                <TableHead>Expected Close</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [...Array(6)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={9}><Skeleton className="h-8" /></TableCell>
                  </TableRow>
                ))
              ) : (
                (filteredLeads || []).map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell className="font-medium">{lead.lead_number || "—"}</TableCell>
                    <TableCell>{lead.customer_name}</TableCell>
                    <TableCell>{lead.company_name || "—"}</TableCell>
                    <TableCell>{lead.phone || "—"}</TableCell>
                    <TableCell>{lead.email || "—"}</TableCell>
                    <TableCell className="capitalize">{lead.status || "leads"}</TableCell>
                    <TableCell>{lead.priority ? lead.priority.toUpperCase() : "—"}</TableCell>
                    <TableCell>{(lead as any).sales_manager && profiles ? (profiles as any[]).find((p) => p.id === (lead as any).sales_manager)?.full_name || "—" : "—"}</TableCell>
                    <TableCell>{lead.expected_close_date ? new Date(lead.expected_close_date).toLocaleDateString() : "—"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditLead(lead)}>
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteMutation.mutate(lead.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

    {/* Edit Lead Dialog */}
    <Dialog open={openEdit} onOpenChange={setOpenEdit}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Edit Lead</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Label>Customer Name</Label>
            <Input value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} />
          </div>
          <div className="col-span-2">
            <Label>Company Name</Label>
            <Input value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} />
          </div>
          <div>
            <Label>Email</Label>
            <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <Label>Phone</Label>
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div>
            <Label>Sales Manager</Label>
            <Select value={form.sales_manager} onValueChange={(value) => setForm({ ...form, sales_manager: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select manager" />
              </SelectTrigger>
              <SelectContent>
                {(profiles || []).map((p: any) => (
                  <SelectItem key={p.id} value={p.id}>{p.full_name || p.email}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Priority</Label>
            <Select value={form.priority} onValueChange={(value) => setForm({ ...form, priority: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Source</Label>
            <Input value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} placeholder="e.g., Website, Referral, Cold Call" />
          </div>
          <div>
            <Label>Estimated Value</Label>
            <Input type="number" value={form.estimated_value} onChange={(e) => setForm({ ...form, estimated_value: e.target.value })} />
          </div>
          <div>
            <Label>Expected Close Date</Label>
            <Input type="date" value={form.expected_close_date} onChange={(e) => setForm({ ...form, expected_close_date: e.target.value })} />
          </div>
          <div className="col-span-2">
            <Label>Notes</Label>
            <Textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpenEdit(false)}>Cancel</Button>
          <Button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending}>
            {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>

    {/* Lost Reason Dialog */}
    <Dialog open={openLostReason} onOpenChange={setOpenLostReason}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mark Lead as Lost</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            You are about to mark <strong>{movingToLost?.name}</strong> as lost. Please provide a reason:
          </p>
          <div>
            <Label htmlFor="lost-reason">Reason for marking as lost</Label>
            <Textarea
              id="lost-reason"
              rows={3}
              value={lostReason}
              onChange={(e) => setLostReason(e.target.value)}
              placeholder="Enter the reason why this lead was lost..."
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpenLostReason(false)}>
            Cancel
          </Button>
          <Button onClick={confirmMoveToLost} disabled={moveMutation.isPending}>
            {moveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Mark as Lost"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
    </div>
  );
}


