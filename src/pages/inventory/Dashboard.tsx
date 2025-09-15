import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { BarChart3, Table as TableIcon, Upload, Download, Share2, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { fetchInventorySnapshot } from "@/integrations/unicommerce/client";

export default function InventoryDashboard() {
  const queryClient = useQueryClient();
  const [view, setView] = useState<'table' | 'charts'>('table');

  // Products
  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_master')
        .select('id, sku, class_name, image_url');
      if (error) throw error;
      return data || [];
    }
  });

  // Local inventory from DB
  const { data: inventory, isLoading: invLoading } = useQuery({
    queryKey: ['product_inventory'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_inventory')
        .select('*');
      if (error) throw error;
      return data || [];
    }
  });

  // Merge products with inventory totals
  const merged = useMemo(() => {
    const bySku: Record<string, { available: number; reserved: number; facility?: string }> = {};
    (inventory || []).forEach((row: any) => {
      const key = row.sku;
      if (!bySku[key]) bySku[key] = { available: 0, reserved: 0, facility: row.facility };
      bySku[key].available += row.quantity_available || 0;
      bySku[key].reserved += row.quantity_reserved || 0;
    });
    return (products || []).map((p: any) => ({
      ...p,
      available: bySku[p.sku]?.available ?? 0,
      reserved: bySku[p.sku]?.reserved ?? 0,
      facility: bySku[p.sku]?.facility ?? undefined,
    }));
  }, [products, inventory]);

  // Mutation to upsert inventory entries
  const upsertInventory = useMutation({
    mutationFn: async (entries: { sku: string; facility?: string; available?: number; reserved?: number }[]) => {
      if (!entries || entries.length === 0) return;

      // Map to DB rows. Try to link product_id by sku.
      const { data: productRows } = await supabase
        .from('product_master')
        .select('id, sku')
        .in('sku', entries.map(e => e.sku));

      const skuToId: Record<string, string> = {};
      (productRows || []).forEach((r: any) => (skuToId[r.sku] = r.id));

      const rows = entries.map(e => ({
        product_id: skuToId[e.sku] || null,
        sku: e.sku,
        facility: e.facility || undefined,
        source: 'unicommerce',
        quantity_available: e.available ?? 0,
        quantity_reserved: e.reserved ?? 0,
        snapshot_at: new Date().toISOString(),
      }));

      const { error } = await supabase
        .from('product_inventory')
        .upsert(rows, { onConflict: 'sku,facility,source' });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Inventory updated');
      queryClient.invalidateQueries({ queryKey: ['product_inventory'] });
    },
    onError: (e) => {
      toast.error('Failed to save inventory');
      console.error(e);
    }
  });

  const handleFetchFromUnicommerce = async () => {
    try {
      const skus = (products || []).map((p: any) => p.sku).filter(Boolean);
      const entries = await fetchInventorySnapshot(skus);
      if (!entries || entries.length === 0) {
        toast.message('No inventory entries returned from Unicommerce');
        return;
      }
      upsertInventory.mutate(entries);
    } catch (e) {
      // error toasted in client
    }
  };

  const loading = productsLoading || invLoading || upsertInventory.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Inventory Dashboard</h1>
          <p className="text-lg text-muted-foreground">Track and manage inventory across Products, Fabric and Items.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant={view === 'table' ? 'default' : 'outline'} onClick={() => setView('table')} className="flex items-center gap-2">
            <TableIcon className="h-4 w-4" /> Table
          </Button>
          <Button variant={view === 'charts' ? 'default' : 'outline'} onClick={() => setView('charts')} className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" /> Charts
          </Button>
        </div>
      </div>

      <Tabs defaultValue="products" className="w-full">
        <TabsList>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="fabric">Fabric</TabsTrigger>
          <TabsTrigger value="items" disabled>Items (coming soon)</TabsTrigger>
        </TabsList>

        <TabsContent value="products">
          <Card>
            <CardHeader>
              <CardTitle>Product Inventory</CardTitle>
              <CardDescription>Import latest stock, export, and share as PDF.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Button className="flex items-center gap-2" onClick={() => toast.success('Import started')}>
                  <Upload className="h-4 w-4" /> Import Inventory
                </Button>
                <Button variant="outline" className="flex items-center gap-2" onClick={() => toast.success('Export queued')}>
                  <Download className="h-4 w-4" /> Export
                </Button>
                <Button variant="outline" className="flex items-center gap-2" onClick={() => toast.success('Share link generated')}>
                  <Share2 className="h-4 w-4" /> Share PDF
                </Button>
                <Button variant="outline" className="flex items-center gap-2" onClick={handleFetchFromUnicommerce} disabled={loading}>
                  <RefreshCw className={loading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} /> Fetch from Unicommerce
                </Button>
              </div>

              <Separator />

              {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ) : view === 'table' ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>SKU</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Available</TableHead>
                        <TableHead>Reserved</TableHead>
                        <TableHead>Facility</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {merged.map((row: any) => (
                        <TableRow key={row.sku}>
                          <TableCell>{row.sku}</TableCell>
                          <TableCell>{row.class_name}</TableCell>
                          <TableCell>{row.available}</TableCell>
                          <TableCell>{row.reserved}</TableCell>
                          <TableCell>{row.facility || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="h-64 rounded border bg-muted/30 flex items-center justify-center">Bar chart (coming soon)</div>
                  <div className="h-64 rounded border bg-muted/30 flex items-center justify-center">Pie chart (coming soon)</div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fabric">
          <Card>
            <CardHeader>
              <CardTitle>Fabric Inventory</CardTitle>
              <CardDescription>View inventory for actual fabric masters (hook to DB later).</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fabric</TableHead>
                      <TableHead>Available</TableHead>
                      <TableHead>Reserved</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>Cotton 180 GSM</TableCell>
                      <TableCell>400 m</TableCell>
                      <TableCell>20 m</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
