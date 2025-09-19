import React, { useEffect, useMemo, useRef, useState } from "react";
import supabase from "@/lib/supabase/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Upload, Download, Pencil, Trash2, Loader2, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
// XLSX is loaded at runtime from CDN to avoid local install requirements
const loadXLSX = () => import("https://esm.sh/xlsx@0.18.5");

type Customer = {
  id: string;
  customer_id: string | null;
  contact_person: string | null;
  company: string | null;
  mobile: string | null;
  email: string | null;
  address_line1: string | null;
  address_line2: string | null;
  state: string | null;
  city: string | null;
  pincode: string | null;
  avatar_url: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

const TEMPLATE_HEADERS = [
  "contact_person",
  "company",
  "mobile",
  "email",
  "address_line1",
  "address_line2",
  "state",
  "city",
  "pincode",
  "avatar_url",
];

const emptyCustomer: Omit<Customer, "id"> = {
  customer_id: "",
  contact_person: "",
  company: "",
  mobile: "",
  email: "",
  address_line1: "",
  address_line2: "",
  state: "",
  city: "",
  pincode: "",
  avatar_url: "",
};

export default function CustomerMaster() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [openUpsert, setOpenUpsert] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [form, setForm] = useState(emptyCustomer);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [view, setView] = useState<"cards" | "table">(() =>
    (localStorage.getItem("customerViewMode") as "cards" | "table") || "cards"
  );

  const { data: customers, isLoading } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as Customer[];
    },
  });

  const filtered = useMemo(() => {
    if (!customers) return [];
    const q = search.toLowerCase();
    return customers.filter((c) =>
      [
        c.customer_id,
        c.company,
        c.contact_person,
        c.email,
        c.mobile,
        c.city,
        c.state,
      ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [customers, search]);

  const upsertMutation = useMutation({
    mutationFn: async () => {
      const payload = { ...form } as any;
      if (editing) {
        const { error } = await supabase
          .from("customers")
          .update(payload)
          .eq("id", editing.id);
        if (error) throw error;
      } else {
        // Do not send empty customer_id to let DB auto-generate
        if (!payload.customer_id) delete payload.customer_id;
        const { error } = await supabase.from("customers").insert([payload]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Customer saved");
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      setOpenUpsert(false);
      setEditing(null);
      setForm(emptyCustomer);
    },
    onError: (e: any) => toast.error(e.message || "Failed to save"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("customers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Customer deleted");
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
    onError: (e: any) => toast.error(e.message || "Delete failed"),
  });

  const handleAvatarUpload = async (file: File) => {
    try {
      setUploadingAvatar(true);
      const ext = file.name.split(".").pop();
      const path = `avatar_${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("avatars").upload(path, file, {
        upsert: false,
      });
      if (error) throw error;
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      setForm((p) => ({ ...p, avatar_url: data.publicUrl }));
      toast.success("Avatar uploaded");
    } catch (e: any) {
      toast.error(e.message || "Avatar upload failed");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyCustomer);
    setOpenUpsert(true);
  };

  useEffect(() => {
    localStorage.setItem("customerViewMode", view);
  }, [view]);

  const openEdit = (c: Customer) => {
    setEditing(c);
    const { id: _id, ...rest } = c as any;
    setForm(rest);
    setOpenUpsert(true);
  };

  const downloadTemplate = async () => {
    const XLSX = await loadXLSX();
    const worksheet = XLSX.utils.aoa_to_sheet([TEMPLATE_HEADERS]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template");
    XLSX.writeFile(workbook, "customers_template.xlsx");
  };

  const exportCustomers = async () => {
    const XLSX = await loadXLSX();
    const rows = (customers || []).map((c) => ({
      customer_id: c.customer_id,
      contact_person: c.contact_person,
      company: c.company,
      mobile: c.mobile,
      email: c.email,
      address_line1: c.address_line1,
      address_line2: c.address_line2,
      state: c.state,
      city: c.city,
      pincode: c.pincode,
      avatar_url: c.avatar_url,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Customers");
    XLSX.writeFile(wb, "customers.xlsx");
  };

  const handleBulkUpload = async (file: File) => {
    try {
      const XLSX = await loadXLSX();
      toast.info("Processing file...");
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(ws, { defval: "" }) as any[];

      // Validate headers
      const hdr = XLSX.utils.sheet_to_json(ws, { header: 1 })[0] as string[];
      const missing = TEMPLATE_HEADERS.filter((h) => !hdr.includes(h));
      if (missing.length) {
        throw new Error(`Missing columns: ${missing.join(", ")}`);
      }

      // Upsert rows
      const rows = json.map((r) => ({
        contact_person: r.contact_person || null,
        company: r.company || null,
        mobile: r.mobile || null,
        email: r.email || null,
        address_line1: r.address_line1 || null,
        address_line2: r.address_line2 || null,
        state: r.state || null,
        city: r.city || null,
        pincode: r.pincode || null,
        avatar_url: r.avatar_url || null,
      }));

      // Use sequential chunks to avoid payload limits
      const chunkSize = 500;
      for (let i = 0; i < rows.length; i += chunkSize) {
        const chunk = rows.slice(i, i + chunkSize);
        const { error } = await supabase
          .from("customers")
          .insert(chunk);
        if (error) throw error;
      }
      toast.success("Bulk upload complete");
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    } catch (e: any) {
      toast.error(e.message || "Bulk upload failed");
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Customer Master</h1>
        <div className="flex gap-2">
          <div className="hidden md:flex rounded-md overflow-hidden border mr-2">
            <Button variant={view === "cards" ? "default" : "outline"} onClick={() => setView("cards")}>Cards</Button>
            <Button variant={view === "table" ? "default" : "outline"} onClick={() => setView("table")}>Table</Button>
          </div>
          <Button variant="outline" onClick={exportCustomers}>
            <Download className="h-4 w-4 mr-2" /> Export
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Upload className="h-4 w-4 mr-2" /> Bulk Upload
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Bulk Upload Customers (XLSX)</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 text-sm">
                <p>Instructions:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Download the template and fill rows under the header.</li>
                  <li>Allowed columns: {TEMPLATE_HEADERS.join(", ")}</li>
                  <li>Optional: set avatar_url with a public image URL.</li>
                </ul>
                <div className="flex gap-2">
                  <Button onClick={downloadTemplate} variant="outline">
                    Download Template
                  </Button>
                  <Input
                    type="file"
                    accept=".xlsx"
                    onChange={(e) => e.target.files && handleBulkUpload(e.target.files[0])}
                  />
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" /> New Customer
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Input placeholder="Search customers..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-40" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : view === "cards" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c) => (
            <Card key={c.id} className="hover:shadow-sm transition">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">
                  {c.company || c.contact_person || c.customer_id || "Untitled"}
                </CardTitle>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(c)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(c.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="text-sm space-y-1">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded bg-muted overflow-hidden flex items-center justify-center">
                    {c.avatar_url ? (
                      <img src={c.avatar_url} className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <div>{c.contact_person}</div>
                    <div className="text-muted-foreground">{c.email}</div>
                  </div>
                </div>
                <div>
                  {c.mobile} • {c.city} {c.pincode}
                </div>
                <div className="text-muted-foreground">
                  {c.address_line1} {c.address_line2}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="rounded-md border bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer ID</TableHead>
                <TableHead>Avatar</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Mobile</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>City</TableHead>
                <TableHead>State</TableHead>
                <TableHead>Pincode</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.customer_id}</TableCell>
                  <TableCell>
                    <div className="w-12 h-12 rounded bg-muted overflow-hidden flex items-center justify-center">
                      {c.avatar_url ? (
                        <img src={c.avatar_url} className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{c.company}</TableCell>
                  <TableCell>{c.contact_person}</TableCell>
                  <TableCell>{c.mobile}</TableCell>
                  <TableCell className="truncate max-w-[220px]">{c.email}</TableCell>
                  <TableCell>{c.city}</TableCell>
                  <TableCell>{c.state}</TableCell>
                  <TableCell>{c.pincode}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(c)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(c.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={openUpsert} onOpenChange={setOpenUpsert}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Customer" : "New Customer"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 rounded bg-muted overflow-hidden flex items-center justify-center">
                {form.avatar_url ? (
                  <img src={form.avatar_url} className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              <div className="flex items-center gap-2">
                <Input ref={fileRef} type="file" accept="image/*" onChange={(e) => e.target.files && handleAvatarUpload(e.target.files[0])} />
                {uploadingAvatar && <Loader2 className="h-4 w-4 animate-spin" />}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Customer ID</Label>
                <Input value={form.customer_id || ""} onChange={(e) => setForm({ ...form, customer_id: e.target.value })} />
              </div>
              <div>
                <Label>Company</Label>
                <Input value={form.company || ""} onChange={(e) => setForm({ ...form, company: e.target.value })} />
              </div>
              <div>
                <Label>Contact Person</Label>
                <Input value={form.contact_person || ""} onChange={(e) => setForm({ ...form, contact_person: e.target.value })} />
              </div>
              <div>
                <Label>Mobile</Label>
                <Input value={form.mobile || ""} onChange={(e) => setForm({ ...form, mobile: e.target.value })} />
              </div>
              <div>
                <Label>Email</Label>
                <Input value={form.email || ""} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="col-span-2">
                <Label>Address Line 1</Label>
                <Input value={form.address_line1 || ""} onChange={(e) => setForm({ ...form, address_line1: e.target.value })} />
              </div>
              <div className="col-span-2">
                <Label>Address Line 2</Label>
                <Input value={form.address_line2 || ""} onChange={(e) => setForm({ ...form, address_line2: e.target.value })} />
              </div>
              <div>
                <Label>State</Label>
                <Input value={form.state || ""} onChange={(e) => setForm({ ...form, state: e.target.value })} />
              </div>
              <div>
                <Label>City</Label>
                <Input value={form.city || ""} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              </div>
              <div>
                <Label>Pincode</Label>
                <Input value={form.pincode || ""} onChange={(e) => setForm({ ...form, pincode: e.target.value })} />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpenUpsert(false)}>
                Cancel
              </Button>
              <Button onClick={() => upsertMutation.mutate()} disabled={upsertMutation.isPending}>
                {upsertMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}


