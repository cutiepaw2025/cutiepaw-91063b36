import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Download, Upload, FileSpreadsheet, CheckCircle2, XCircle, Save, Loader2, Plus, Edit, Trash2, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

// Define headers in lowercase matching user's request
const TEMPLATE_HEADERS = [
  "sku",
  "size",
  "class name",
  "color",
  "brand",
  "category",
  "hsn",
  "gst %",
  "mrp",
  "cost price",
  "selling price",
  "image"
] as const;

type ProductCsvRow = Record<(typeof TEMPLATE_HEADERS)[number], string>;

type ParsedRow = {
  row: ProductCsvRow;
  isValid: boolean;
  errors: string[];
};

function downloadCsvTemplate() {
  const headerRow = TEMPLATE_HEADERS.join(",");
  const exampleRow = [
    "NF-PET-T-GRE-XL",
    "XL",
    "NF-PET-T-GRE",
    "GREEN",
    "Cutiepaw",
    "Pet T-shirts",
    "610099",
    "5",
    "999",
    "199",
    "399",
    "https://example.com/image.jpg"
  ].join(",");

  const csv = [headerRow, exampleRow].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "products_template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function parseCsv(text: string): ProductCsvRow[] {
  // Simple CSV parser that handles commas and trims spaces. Not for quoted commas.
  const lines = text.replace(/\r/g, "").split("\n").filter(Boolean);
  if (lines.length === 0) return [];

  const headers = lines[0].split(",").map(h => h.trim());
  // Basic header validation
  const missing = TEMPLATE_HEADERS.filter(h => !headers.includes(h));
  if (missing.length > 0) {
    throw new Error(`Missing columns: ${missing.join(", ")}`);
  }

  const rows: ProductCsvRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",");
    const row: any = {};
    TEMPLATE_HEADERS.forEach((header) => {
      const idx = headers.indexOf(header);
      row[header] = (cols[idx] ?? "").trim();
    });
    rows.push(row as ProductCsvRow);
  }
  return rows;
}

function validateRow(row: ProductCsvRow): ParsedRow {
  const errors: string[] = [];

  if (!row["sku"]) errors.push("sku required");

  const num = (v: string) => (v ? Number(v) : 0);
  const isNum = (v: string) => v === "" || !Number.isNaN(Number(v));

  if (!isNum(row["gst %"])) errors.push("gst % must be a number");
  if (!isNum(row["mrp"])) errors.push("mrp must be a number");
  if (!isNum(row["cost price"])) errors.push("cost price must be a number");
  if (!isNum(row["selling price"])) errors.push("selling price must be a number");

  if (num(row["mrp"]) < num(row["selling price"])) errors.push("mrp < selling price");
  if (row["image"] && !/^https?:\/\//i.test(row["image"])) errors.push("image must be a URL");

  return { row, isValid: errors.length === 0, errors };
}

export default function ProductMaster() {
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [parsed, setParsed] = useState<ParsedRow[] | null>(null);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [isEditOpen, setIsEditOpen] = useState(false);

  const validCount = useMemo(() => parsed?.filter(p => p.isValid).length ?? 0, [parsed]);

  // Fetch all products
  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_master')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    }
  });

  // Save to database mutation (bulk)
  const saveMutation = useMutation({
    mutationFn: async (validRows: ParsedRow[]) => {
      const products = validRows.map(p => ({
        sku: p.row["sku"],
        size: p.row["size"] || null,
        class_name: p.row["class name"] || null,
        color: p.row["color"] || null,
        brand: p.row["brand"] || null,
        category: p.row["category"] || null,
        hsn: p.row["hsn"] || null,
        gst_percent: p.row["gst %"] ? parseFloat(p.row["gst %"]) : 0,
        mrp: p.row["mrp"] ? parseFloat(p.row["mrp"]) : 0,
        cost_price: p.row["cost price"] ? parseFloat(p.row["cost price"]) : 0,
        selling_price: p.row["selling price"] ? parseFloat(p.row["selling price"]) : 0,
        image_url: p.row["image"] || null,
      }));

      const { error } = await supabase
        .from('product_master')
        .upsert(products, { onConflict: 'sku' });

      if (error) throw error;
    },
    onSuccess: (_, validRows) => {
      toast.success(`Successfully saved ${validRows.length} products to database!`);
      setParsed(null);
      setIsBulkUploadOpen(false);
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (error) => {
      toast.error("Failed to save products to database");
      console.error('Save error:', error);
    },
  });

  // Edit mutation
  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from('product_master')
        .update(data)
        .eq('id', data.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Product updated');
      setIsEditOpen(false);
      setEditing(null);
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (e) => {
      toast.error('Failed to update');
      console.error(e);
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('product_master')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Product deleted');
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (e) => {
      toast.error('Failed to delete');
      console.error(e);
    }
  });

  const onFileChange = async (file: File | null) => {
    if (!file) return;
    setUploading(true);
    try {
      const text = await file.text();
      const rows = parseCsv(text);
      const validated = rows.map(validateRow);
      setParsed(validated);
      toast.success(`Parsed ${rows.length} rows`);
    } catch (e: any) {
      setParsed(null);
      toast.error(e?.message || "Failed to parse file");
    } finally {
      setUploading(false);
    }
  };

  const openEdit = (product: any) => {
    setEditing(product);
    setEditForm({ ...product });
    setIsEditOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Product Master</h1>
          <p className="text-lg text-muted-foreground">Manage your product inventory and bulk upload products.</p>
        </div>
        
        <Dialog open={isBulkUploadOpen} onOpenChange={setIsBulkUploadOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Bulk Upload
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5" />
                Bulk Upload Products
              </DialogTitle>
              <DialogDescription>
                Download the template, fill details, and upload for bulk import. Image column can contain direct links.
                <br />Columns: {TEMPLATE_HEADERS.join(", ")}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <Button onClick={downloadCsvTemplate} className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Download CSV Template
                </Button>

                <div className="flex items-center gap-2">
                  <Label htmlFor="csv" className="text-sm">Upload CSV</Label>
                  <Input id="csv" type="file" accept=".csv" onChange={(e) => onFileChange(e.target.files?.[0] ?? null)} />
                </div>
              </div>

              <Separator />

              {!parsed && uploading && (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-24 w-full" />
                </div>
              )}

              {parsed && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="flex items-center gap-1 text-green-600"><CheckCircle2 className="h-4 w-4" /> {validCount} valid</div>
                    <div className="flex items-center gap-1 text-red-600"><XCircle className="h-4 w-4" /> {parsed.length - validCount} invalid</div>
                  </div>

                  <div className="max-h-96 overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {TEMPLATE_HEADERS.map(h => (
                            <TableHead key={h}>{h}</TableHead>
                          ))}
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {parsed.slice(0, 5).map((p, idx) => (
                          <TableRow key={idx} className={p.isValid ? "bg-emerald-50" : "bg-red-50"}>
                            {TEMPLATE_HEADERS.map(h => (
                              <TableCell key={h}>
                                {h === "image" && p.row[h] ? (
                                  <img src={p.row[h]} alt="preview" className="h-10 w-10 object-cover rounded border" />
                                ) : (
                                  p.row[h]
                                )}
                              </TableCell>
                            ))}
                            <TableCell className={p.isValid ? "text-green-700" : "text-red-700"}>
                              {p.isValid ? "OK" : p.errors.join("; ")}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  <p className="text-xs text-muted-foreground">Showing first 5 rows for preview. Full file will be processed on import.</p>
                  
                  {/* Save Button */}
                  <div className="flex justify-end pt-4">
                    <Button 
                      onClick={() => {
                        const validRows = parsed.filter(p => p.isValid);
                        if (validRows.length === 0) {
                          toast.error("No valid rows to save");
                          return;
                        }
                        saveMutation.mutate(validRows);
                      }}
                      disabled={saveMutation.isPending || validCount === 0}
                      className="flex items-center gap-2"
                    >
                      {saveMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      Save {validCount} Valid Products to Database
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            All Products ({products?.length || 0})
          </CardTitle>
          <CardDescription>View and manage all uploaded products</CardDescription>
        </CardHeader>
        <CardContent>
          {productsLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
          ) : products && products.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Image</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Class Name</TableHead>
                    <TableHead>Color</TableHead>
                    <TableHead>Brand</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>HSN</TableHead>
                    <TableHead>GST %</TableHead>
                    <TableHead>MRP</TableHead>
                    <TableHead>Cost Price</TableHead>
                    <TableHead>Selling Price</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        {product.image_url ? (
                          <img 
                            src={product.image_url} 
                            alt={product.sku} 
                            className="h-12 w-12 object-cover rounded border"
                          />
                        ) : (
                          <div className="h-12 w-12 bg-muted rounded border flex items-center justify-center">
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{product.sku}</TableCell>
                      <TableCell>{product.size}</TableCell>
                      <TableCell>{product.class_name}</TableCell>
                      <TableCell>{product.color}</TableCell>
                      <TableCell>{product.brand}</TableCell>
                      <TableCell>{product.category}</TableCell>
                      <TableCell>{product.hsn}</TableCell>
                      <TableCell>{product.gst_percent}%</TableCell>
                      <TableCell>₹{product.mrp}</TableCell>
                      <TableCell>₹{product.cost_price}</TableCell>
                      <TableCell>₹{product.selling_price}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(product)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(product.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <FileSpreadsheet className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">No products yet</h3>
              <p className="text-muted-foreground">Upload your first products using the Bulk Upload button.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>Update the product details and save.</DialogDescription>
          </DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div>
                <Label>SKU</Label>
                <Input value={editForm.sku || ''} onChange={(e) => setEditForm({ ...editForm, sku: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Size</Label>
                  <Input value={editForm.size || ''} onChange={(e) => setEditForm({ ...editForm, size: e.target.value })} />
                </div>
                <div>
                  <Label>Class Name</Label>
                  <Input value={editForm.class_name || ''} onChange={(e) => setEditForm({ ...editForm, class_name: e.target.value })} />
                </div>
                <div>
                  <Label>Color</Label>
                  <Input value={editForm.color || ''} onChange={(e) => setEditForm({ ...editForm, color: e.target.value })} />
                </div>
                <div>
                  <Label>Brand</Label>
                  <Input value={editForm.brand || ''} onChange={(e) => setEditForm({ ...editForm, brand: e.target.value })} />
                </div>
                <div>
                  <Label>Category</Label>
                  <Input value={editForm.category || ''} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })} />
                </div>
                <div>
                  <Label>HSN</Label>
                  <Input value={editForm.hsn || ''} onChange={(e) => setEditForm({ ...editForm, hsn: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>GST %</Label>
                  <Input type="number" value={editForm.gst_percent ?? 0} onChange={(e) => setEditForm({ ...editForm, gst_percent: Number(e.target.value) })} />
                </div>
                <div>
                  <Label>MRP</Label>
                  <Input type="number" value={editForm.mrp ?? 0} onChange={(e) => setEditForm({ ...editForm, mrp: Number(e.target.value) })} />
                </div>
                <div>
                  <Label>Selling Price</Label>
                  <Input type="number" value={editForm.selling_price ?? 0} onChange={(e) => setEditForm({ ...editForm, selling_price: Number(e.target.value) })} />
                </div>
                <div>
                  <Label>Cost Price</Label>
                  <Input type="number" value={editForm.cost_price ?? 0} onChange={(e) => setEditForm({ ...editForm, cost_price: Number(e.target.value) })} />
                </div>
              </div>
              <div>
                <Label>Image URL</Label>
                <Input value={editForm.image_url || ''} onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })} />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                <Button onClick={() => updateMutation.mutate(editForm)} disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Changes'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
