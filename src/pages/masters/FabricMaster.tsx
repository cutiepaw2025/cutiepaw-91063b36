import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Upload, Download, Eye, Search, X, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

// UI Components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

// Types
interface Fabric {
  id: string;
  fabric_code: string;
  fabric_name: string;
  fabric_type: string | null;
  image_url: string | null;
  created_at: string | null;
  updated_at: string | null;
}

interface FabricVariant {
  id: string;
  fabric_id: string;
  variant_code: string;
  color: string;
  gsm: number;
  uom: string | null;
  price: number | null;
  supplier: string | null;
  description: string | null;
  hex_code: string | null;
  image_url: string | null;
  created_at: string | null;
  updated_at: string | null;
}

interface FabricWithVariants extends Fabric {
  variants: FabricVariant[];
}

// CSV Template
const csvTemplate = `fabric_code,fabric_name,fabric_type,color,gsm,uom,price,supplier,description,hex_code
COTTON,Cotton Fabric,Natural,BLACK,180,KGS,343,Supplier A,Black cotton variant,#000000
COTTON,Cotton Fabric,Natural,WHITE,180,KGS,343,Supplier A,White cotton variant,#FFFFFF
POLYESTER,Polyester Fabric,Synthetic,RED,200,KGS,450,Supplier B,Red polyester variant,#FF0000`;

const FabricMaster: React.FC = () => {
  const queryClient = useQueryClient();
  const [isAddVariantOpen, setIsAddVariantOpen] = useState(false);
  const [isEditFabricOpen, setIsEditFabricOpen] = useState(false);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [selectedFabric, setSelectedFabric] = useState<FabricWithVariants | null>(null);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<any[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Fabric[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Form state for adding variant
  const [selectedFabricForVariant, setSelectedFabricForVariant] = useState<Fabric | null>(null);
  const [editingFabric, setEditingFabric] = useState<Fabric | null>(null);
  const [deletingFabric, setDeletingFabric] = useState<Fabric | null>(null);
  const [variantForm, setVariantForm] = useState({
    color: '',
    gsm: '',
    uom: '',
    price: '',
    supplier: '',
    description: '',
    hex_code: '',
    image: null as File | null
  });

  // Form state for editing fabric
  const [editFabricForm, setEditFabricForm] = useState({
    fabric_name: '',
    fabric_type: '',
    fabric_image: null as File | null
  });

  // Fetch all fabrics with variants
  const { data: fabrics, isLoading } = useQuery({
    queryKey: ['fabrics'],
    queryFn: async (): Promise<FabricWithVariants[]> => {
      const { data: fabricData, error: fabricError } = await supabase
        .from('fabrics')
        .select('*')
        .order('fabric_name');

      if (fabricError) throw fabricError;

      const { data: variantData, error: variantError } = await supabase
        .from('fabric_variants')
        .select('*');

      if (variantError) throw variantError;

      // Group variants by fabric_id
      const variantsByFabric = variantData.reduce((acc, variant) => {
        if (!acc[variant.fabric_id]) acc[variant.fabric_id] = [];
        acc[variant.fabric_id].push(variant);
        return acc;
      }, {} as Record<string, FabricVariant[]>);

      return fabricData.map(fabric => ({
        ...fabric,
        variants: variantsByFabric[fabric.id] || []
      }));
    }
  });

  // Search fabrics
  const searchFabrics = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const { data, error } = await supabase
        .from('fabrics')
        .select('*')
        .ilike('fabric_name', `%${query}%`)
        .limit(10);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Mutations
  const fabricMutation = useMutation({
    mutationFn: async (data: Partial<Fabric>) => {
      const { data: result, error } = await supabase
        .from('fabrics')
        .insert([data])
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fabrics'] });
      toast.success('Fabric created successfully');
    },
    onError: (error) => {
      toast.error(`Failed to create fabric: ${error.message}`);
    }
  });

  const updateFabricMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Fabric> }) => {
      const { data: result, error } = await supabase
        .from('fabrics')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fabrics'] });
      toast.success('Fabric updated successfully');
      setIsEditFabricOpen(false);
      setEditingFabric(null);
      setEditFabricForm({ fabric_name: '', fabric_type: '', fabric_image: null });
    },
    onError: (error) => {
      toast.error(`Failed to update fabric: ${error.message}`);
    }
  });

  const variantMutation = useMutation({
    mutationFn: async (data: Partial<FabricVariant>) => {
      const { data: result, error } = await supabase
        .from('fabric_variants')
        .insert([data])
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fabrics'] });
      toast.success('Variant added successfully');
      setIsAddVariantOpen(false);
      resetVariantForm();
    },
    onError: (error) => {
      toast.error(`Failed to add variant: ${error.message}`);
    }
  });

  const deleteFabricMutation = useMutation({
    mutationFn: async (fabricId: string) => {
      const { error } = await supabase
        .from('fabrics')
        .delete()
        .eq('id', fabricId);

      if (error) throw error;
      return fabricId;
    },
    onSuccess: (fabricId) => {
      queryClient.invalidateQueries({ queryKey: ['fabrics'] });
      toast.success('Fabric deleted successfully');
      setIsDeleteConfirmOpen(false);
      setDeletingFabric(null);
    },
    onError: (error) => {
      toast.error(`Failed to delete fabric: ${error.message}`);
    }
  });

  // File upload function
  const uploadFile = async (file: File, path: string): Promise<string> => {
    try {
      const { data, error } = await supabase.storage
        .from('fabric')
        .upload(path, file);

      if (error) {
        console.error('Storage upload error:', error);
        // If bucket doesn't exist, create it first
        if (error.message.includes('Bucket not found')) {
          toast.error('Storage bucket not found. Please create a "fabric" bucket in your Supabase dashboard.');
          throw new Error('Storage bucket "fabric" not found. Please create it in Supabase dashboard.');
        }
        throw error;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('fabric')
        .getPublicUrl(data.path);

      return publicUrl;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  };

  // Form handlers
  const resetVariantForm = () => {
    setVariantForm({
      color: '',
      gsm: '',
      uom: '',
      price: '',
      supplier: '',
      description: '',
      hex_code: '',
      image: null
    });
    setSelectedFabricForVariant(null);
  };

  const handleEditFabric = (fabric: Fabric) => {
    setEditingFabric(fabric);
    setEditFabricForm({
      fabric_name: fabric.fabric_name,
      fabric_type: fabric.fabric_type || '',
      fabric_image: null
    });
    setIsEditFabricOpen(true);
  };

  const handleUpdateFabric = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingFabric) return;

    try {
      let imageUrl = editingFabric.image_url;
      if (editFabricForm.fabric_image) {
        const timestamp = Date.now();
        imageUrl = await uploadFile(editFabricForm.fabric_image, `fabric_${editingFabric.fabric_code}_${timestamp}.jpg`);
      }

      await updateFabricMutation.mutateAsync({
        id: editingFabric.id,
        data: {
          fabric_name: editFabricForm.fabric_name,
          fabric_type: editFabricForm.fabric_type || null,
          image_url: imageUrl
        }
      });
    } catch (error) {
      console.error('Update fabric error:', error);
    }
  };

  const handleDeleteFabric = (fabric: Fabric) => {
    setDeletingFabric(fabric);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDeleteFabric = async () => {
    if (!deletingFabric) return;
    
    try {
      await deleteFabricMutation.mutateAsync(deletingFabric.id);
    } catch (error) {
      console.error('Delete fabric error:', error);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    searchFabrics(query);
  };

  const handleAddNewFabric = async () => {
    if (!searchQuery.trim()) return;

    try {
      const fabricCode = searchQuery.toUpperCase().replace(/\s+/g, '_');
      
      const result = await fabricMutation.mutateAsync({
        fabric_code: fabricCode,
        fabric_name: searchQuery,
        fabric_type: null
      });

      setSearchQuery('');
      setSearchResults([]);
      toast.success('Fabric added successfully');
      
      // Optionally open add variant dialog for the newly created fabric
      if (result) {
        setSelectedFabricForVariant(result);
        setIsAddVariantOpen(true);
      }
    } catch (error) {
      console.error('Add fabric error:', error);
      if (error.code === '23505') {
        toast.error('Fabric with this code already exists.');
      } else {
        toast.error(`Failed to create fabric: ${error.message}`);
      }
    }
  };

  const handleAddVariant = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFabricForVariant) return;

    try {
      // First, verify the fabric exists in the database
      const { data: fabricCheck, error: fabricError } = await supabase
        .from('fabrics')
        .select('id')
        .eq('id', selectedFabricForVariant.id)
        .single();

      if (fabricError || !fabricCheck) {
        toast.error('Fabric not found in database. Please refresh and try again.');
        return;
      }

      const variantCode = `${selectedFabricForVariant.fabric_code}+${variantForm.color.toUpperCase()}+${variantForm.gsm}`;
      
      let imageUrl = null;
      if (variantForm.image) {
        try {
          const timestamp = Date.now();
          imageUrl = await uploadFile(variantForm.image, `variant_${variantCode}_${timestamp}.jpg`);
        } catch (uploadError) {
          console.error('Image upload failed:', uploadError);
          // Continue without image if upload fails
        }
      }

      await variantMutation.mutateAsync({
        fabric_id: selectedFabricForVariant.id,
        variant_code: variantCode,
        color: variantForm.color,
        gsm: parseInt(variantForm.gsm),
        uom: variantForm.uom || null,
        price: variantForm.price ? parseFloat(variantForm.price) : null,
        supplier: variantForm.supplier || null,
        description: variantForm.description || null,
        hex_code: variantForm.hex_code || null,
        image_url: imageUrl
      });
    } catch (error) {
      console.error('Add variant error:', error);
      if (error.code === '23503') {
        toast.error('Fabric not found. Please create the fabric first.');
      } else {
        toast.error(`Failed to add variant: ${error.message}`);
      }
    }
  };

  // CSV handlers
  const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvFile(file);
    
    try {
      // Preview first 10 rows for better visibility
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        toast.error('CSV file must have at least a header row and one data row');
        setCsvFile(null);
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim());
      const preview = lines.slice(1, 11).map((line, index) => {
        const values = line.split(',');
        return headers.reduce((obj, header, i) => {
          obj[header.trim()] = values[i]?.trim() || '';
          return obj;
        }, {} as any);
      });

      setCsvPreview(preview);
      
      // Validate required columns
      const requiredColumns = ['fabric_code', 'fabric_name', 'color', 'gsm'];
      const missingColumns = requiredColumns.filter(col => !headers.includes(col));
      
      if (missingColumns.length > 0) {
        toast.warning(`Missing required columns: ${missingColumns.join(', ')}`);
      }
    } catch (error) {
      console.error('Error reading CSV file:', error);
      toast.error('Error reading CSV file. Please check the file format.');
      setCsvFile(null);
      setCsvPreview([]);
    }
  };

  const processBulkUpload = async () => {
    if (!csvFile) return;

    try {
      setUploadProgress(0);
      const text = await csvFile.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        toast.error('CSV file must have at least a header row and one data row');
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim());
      const requiredColumns = ['fabric_code', 'fabric_name', 'color', 'gsm'];
      const missingColumns = requiredColumns.filter(col => !headers.includes(col));
      
      if (missingColumns.length > 0) {
        toast.error(`Missing required columns: ${missingColumns.join(', ')}`);
        return;
      }
      
      // Group by fabric_code
      const fabricGroups = new Map<string, any[]>();
      let totalRows = 0;
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        const row = headers.reduce((obj, header, index) => {
          obj[header.trim()] = values[index]?.trim() || '';
          return obj;
        }, {} as any);

        const fabricCode = row.fabric_code;
        if (!fabricCode) {
          console.warn(`Row ${i + 1}: Missing fabric_code, skipping`);
          continue;
        }

        if (!fabricGroups.has(fabricCode)) {
          fabricGroups.set(fabricCode, []);
        }
        fabricGroups.get(fabricCode)!.push(row);
        totalRows++;
      }

      if (fabricGroups.size === 0) {
        toast.error('No valid data found in CSV file');
        return;
      }

      let processed = 0;
      const total = fabricGroups.size;
      let fabricsCreated = 0;
      let variantsCreated = 0;

      for (const [fabricCode, rows] of fabricGroups) {
        try {
          const firstRow = rows[0];
          
          // Check if fabric exists, if not create it
          let fabricId: string;
          const { data: existingFabric } = await supabase
            .from('fabrics')
            .select('id')
            .eq('fabric_code', fabricCode)
            .single();

          if (existingFabric) {
            fabricId = existingFabric.id;
          } else {
            const { data: newFabric } = await fabricMutation.mutateAsync({
              fabric_code: fabricCode,
              fabric_name: firstRow.fabric_name,
              fabric_type: firstRow.fabric_type || null
            });
            fabricId = newFabric.id;
            fabricsCreated++;
          }

          // Create variants
          const variants = rows.map((row) => ({
            fabric_id: fabricId,
            variant_code: `${fabricCode}+${row.color.toUpperCase()}+${row.gsm}`,
            color: row.color,
            gsm: parseInt(row.gsm) || 0,
            uom: row.uom || null,
            price: row.price ? parseFloat(row.price) : null,
            supplier: row.supplier || null,
            description: row.description || null,
            hex_code: row.hex_code || null,
            image_url: null
          }));

          if (variants.length > 0) {
            await variantMutation.mutateAsync(variants);
            variantsCreated += variants.length;
          }

          processed++;
          setUploadProgress((processed / total) * 100);
        } catch (error) {
          console.error(`Error processing fabric ${fabricCode}:`, error);
          toast.error(`Error processing fabric ${fabricCode}: ${error.message}`);
        }
      }

      toast.success(
        `Bulk upload completed! Created ${fabricsCreated} fabrics and ${variantsCreated} variants from ${totalRows} rows.`
      );
      setIsBulkUploadOpen(false);
      setCsvFile(null);
      setCsvPreview([]);
      setUploadProgress(0);
    } catch (error) {
      console.error('Bulk upload error:', error);
      toast.error(`Bulk upload failed: ${error.message}`);
      setUploadProgress(0);
    }
  };

  const downloadTemplate = () => {
    const blob = new Blob([csvTemplate], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'fabric_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <Skeleton className="h-8 w-48" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Fabric Master</h1>
        <div className="flex gap-2">
          <Dialog open={isBulkUploadOpen} onOpenChange={setIsBulkUploadOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Upload className="w-4 h-4 mr-2" />
                Bulk Upload
              </Button>
            </DialogTrigger>
                         <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
               <DialogHeader className="flex-shrink-0">
                 <DialogTitle>Bulk Upload Fabrics</DialogTitle>
                 <p className="text-sm text-gray-600">
                   Upload a CSV file to create multiple fabrics with their variants in one go.
                 </p>
               </DialogHeader>
               
               <div className="flex flex-col h-full overflow-hidden">
                 {/* Top Section - Controls */}
                 <div className="flex-shrink-0 space-y-4 pb-4 border-b">
                   <div className="flex gap-2">
                     <Button variant="outline" onClick={downloadTemplate}>
                       <Download className="w-4 h-4 mr-2" />
                       Download Template
                     </Button>
                     <Button 
                       variant="outline" 
                       onClick={() => {
                         setCsvFile(null);
                         setCsvPreview([]);
                         setUploadProgress(0);
                       }}
                       disabled={!csvFile}
                     >
                       <X className="w-4 h-4 mr-2" />
                       Clear File
                     </Button>
                   </div>
                   
                   <div>
                     <Label htmlFor="csv-file">Upload CSV File</Label>
                     <Input
                       id="csv-file"
                       type="file"
                       accept=".csv"
                       onChange={handleCsvUpload}
                       className="mt-1"
                     />
                   </div>
                   
                   {/* Upload Progress */}
                   {uploadProgress > 0 && (
                     <div className="space-y-2">
                       <div className="flex justify-between text-sm">
                         <Label>Upload Progress</Label>
                         <span>{Math.round(uploadProgress)}%</span>
                       </div>
                       <div className="w-full bg-gray-200 rounded-full h-2">
                         <div
                           className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                           style={{ width: `${uploadProgress}%` }}
                         />
                       </div>
                     </div>
                   )}
                 </div>
                 
                 {/* Middle Section - Preview */}
                 {csvPreview.length > 0 && (
                   <div className="flex-1 overflow-hidden pt-4">
                     <div className="flex justify-between items-center mb-3">
                       <Label className="text-base font-medium">
                         Preview (First {csvPreview.length} rows)
                       </Label>
                       <Badge variant="secondary">
                         {csvPreview.length} rows loaded
                       </Badge>
                     </div>
                     
                     <div className="border rounded-md overflow-hidden h-full">
                       <div className="overflow-auto h-full">
                         <Table>
                           <TableHeader className="sticky top-0 bg-white z-10">
                             <TableRow>
                               {Object.keys(csvPreview[0] || {}).map(key => (
                                 <TableHead key={key} className="whitespace-nowrap">
                                   {key}
                                 </TableHead>
                               ))}
                             </TableRow>
                           </TableHeader>
                           <TableBody>
                             {csvPreview.map((row, index) => (
                               <TableRow key={index}>
                                 {Object.values(row).map((value, i) => (
                                   <TableCell key={i} className="whitespace-nowrap max-w-32 truncate">
                                     <span title={String(value)}>{String(value)}</span>
                                   </TableCell>
                                 ))}
                               </TableRow>
                             ))}
                           </TableBody>
                         </Table>
                       </div>
                     </div>
                   </div>
                 )}
                 
                 {/* Bottom Section - Actions */}
                 <div className="flex-shrink-0 pt-4 border-t">
                   <div className="flex justify-between items-center">
                     <div className="text-sm text-gray-600">
                       {csvFile && (
                         <span>File: {csvFile.name} ({(csvFile.size / 1024).toFixed(1)} KB)</span>
                       )}
                     </div>
                     <div className="flex gap-2">
                       <Button
                         variant="outline"
                         onClick={() => {
                           setIsBulkUploadOpen(false);
                           setCsvFile(null);
                           setCsvPreview([]);
                           setUploadProgress(0);
                         }}
                       >
                         Cancel
                       </Button>
                       <Button
                         onClick={processBulkUpload}
                         disabled={!csvFile || uploadProgress > 0}
                       >
                         {uploadProgress > 0 ? 'Uploading...' : 'Upload'}
                       </Button>
                     </div>
                   </div>
                 </div>
               </div>
             </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search Section */}
      <div className="mb-8">
        <div className="max-w-md">
          <Label htmlFor="fabric-search">Search Fabric</Label>
          <div className="flex gap-2 mt-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                id="fabric-search"
                placeholder="Search fabric name..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="pl-10"
              />
            </div>
            <Button
              onClick={handleAddNewFabric}
              disabled={!searchQuery.trim() || searchResults.length > 0}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add New
            </Button>
          </div>
          
          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="mt-4 border rounded-md max-h-60 overflow-auto">
              {searchResults.map((fabric) => (
                <div
                  key={fabric.id}
                  className="p-3 border-b last:border-b-0 hover:bg-gray-50 cursor-pointer"
                  onClick={() => {
                    setSelectedFabricForVariant(fabric);
                    setIsAddVariantOpen(true);
                    setSearchQuery('');
                    setSearchResults([]);
                  }}
                >
                  <div className="font-medium">{fabric.fabric_name}</div>
                  <div className="text-sm text-gray-600">Code: {fabric.fabric_code}</div>
                  {fabric.fabric_type && (
                    <div className="text-sm text-gray-600">Type: {fabric.fabric_type}</div>
                  )}
                </div>
              ))}
            </div>
          )}
          
          {isSearching && (
            <div className="mt-4 text-center text-gray-500">
              Searching...
            </div>
          )}
        </div>
      </div>

      {/* Fabric Grid */}
      {fabrics && fabrics.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {fabrics.map((fabric) => (
            <Card key={fabric.id} className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{fabric.fabric_name}</CardTitle>
                    <p className="text-sm text-gray-600">Code: {fabric.fabric_code}</p>
                    {fabric.fabric_type && (
                      <p className="text-sm text-gray-600">Type: {fabric.fabric_type}</p>
                    )}
                  </div>
                                     <div className="flex gap-1">
                     <Button
                       variant="ghost"
                       size="sm"
                       onClick={() => handleEditFabric(fabric)}
                     >
                       <Edit className="w-4 h-4" />
                     </Button>
                     <Button
                       variant="ghost"
                       size="sm"
                       onClick={() => {
                         setSelectedFabric(fabric);
                         setIsDetailsOpen(true);
                       }}
                     >
                       <Eye className="w-4 h-4" />
                     </Button>
                     <Button
                       variant="ghost"
                       size="sm"
                       onClick={() => handleDeleteFabric(fabric)}
                       className="text-red-600 hover:text-red-700 hover:bg-red-50"
                     >
                       <Trash2 className="w-4 h-4" />
                     </Button>
                   </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  {/* Fabric Image */}
                  <div className="w-24 h-24 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                    {fabric.image_url ? (
                      <img
                        src={fabric.image_url}
                        alt={fabric.fabric_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        No Image
                      </div>
                    )}
                  </div>
                  
                  {/* Variants Info */}
                  <div className="flex-1 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Variants:</span>
                      <span className="text-sm">{fabric.variants.length}</span>
                    </div>
                    
                    {/* Color Swatches */}
                    {fabric.variants.length > 0 && (
                      <div>
                        <span className="text-sm font-medium">Colors:</span>
                        <div className="flex gap-1 mt-1">
                          {fabric.variants.slice(0, 5).map((variant) => (
                            <div
                              key={variant.id}
                              className="w-4 h-4 rounded-full border border-gray-300"
                              style={{
                                backgroundColor: variant.hex_code || '#ccc',
                                cursor: 'pointer'
                              }}
                              title={`${variant.color} - ${variant.gsm} GSM`}
                            />
                          ))}
                          {fabric.variants.length > 5 && (
                            <Badge variant="secondary" className="text-xs">
                              +{fabric.variants.length - 5}
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500">No fabrics found. Search and add your first fabric to get started.</p>
        </div>
      )}

      {/* Add Variant Dialog */}
      <Dialog open={isAddVariantOpen} onOpenChange={setIsAddVariantOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Variant to {selectedFabricForVariant?.fabric_name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddVariant} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="color">Color *</Label>
                <Input
                  id="color"
                  value={variantForm.color}
                  onChange={(e) => setVariantForm(prev => ({ ...prev, color: e.target.value }))}
                  placeholder="e.g., BLACK"
                  required
                />
              </div>
              <div>
                <Label htmlFor="gsm">GSM *</Label>
                <Input
                  id="gsm"
                  type="number"
                  value={variantForm.gsm}
                  onChange={(e) => setVariantForm(prev => ({ ...prev, gsm: e.target.value }))}
                  placeholder="e.g., 180"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="uom">UOM</Label>
                <Input
                  id="uom"
                  value={variantForm.uom}
                  onChange={(e) => setVariantForm(prev => ({ ...prev, uom: e.target.value }))}
                  placeholder="e.g., KGS"
                />
              </div>
              <div>
                <Label htmlFor="price">Price</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={variantForm.price}
                  onChange={(e) => setVariantForm(prev => ({ ...prev, price: e.target.value }))}
                  placeholder="e.g., 343"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="supplier">Supplier</Label>
              <Input
                id="supplier"
                value={variantForm.supplier}
                onChange={(e) => setVariantForm(prev => ({ ...prev, supplier: e.target.value }))}
                placeholder="e.g., Supplier A"
              />
            </div>

            <div>
              <Label htmlFor="hex_code">Hex Code</Label>
              <Input
                id="hex_code"
                value={variantForm.hex_code}
                onChange={(e) => setVariantForm(prev => ({ ...prev, hex_code: e.target.value }))}
                placeholder="e.g., #000000"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={variantForm.description}
                onChange={(e) => setVariantForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Variant description"
              />
            </div>

            <div>
              <Label htmlFor="variant_image">Variant Image</Label>
              <Input
                id="variant_image"
                type="file"
                accept="image/*"
                onChange={(e) => setVariantForm(prev => ({ 
                  ...prev, 
                  image: e.target.files?.[0] || null 
                }))}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsAddVariantOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={variantMutation.isPending}>
                {variantMutation.isPending ? 'Adding...' : 'Add Variant'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Fabric Dialog */}
      <Dialog open={isEditFabricOpen} onOpenChange={setIsEditFabricOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Fabric: {editingFabric?.fabric_name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateFabric} className="space-y-4">
            <div>
              <Label htmlFor="edit_fabric_name">Fabric Name *</Label>
              <Input
                id="edit_fabric_name"
                value={editFabricForm.fabric_name}
                onChange={(e) => setEditFabricForm(prev => ({ ...prev, fabric_name: e.target.value }))}
                placeholder="e.g., Cotton Fabric"
                required
              />
            </div>

            <div>
              <Label htmlFor="edit_fabric_type">Fabric Type</Label>
              <Input
                id="edit_fabric_type"
                value={editFabricForm.fabric_type}
                onChange={(e) => setEditFabricForm(prev => ({ ...prev, fabric_type: e.target.value }))}
                placeholder="e.g., Natural, Synthetic"
              />
            </div>

            <div>
              <Label htmlFor="edit_fabric_image">Fabric Image</Label>
              <Input
                id="edit_fabric_image"
                type="file"
                accept="image/*"
                onChange={(e) => setEditFabricForm(prev => ({ 
                  ...prev, 
                  fabric_image: e.target.files?.[0] || null 
                }))}
              />
              {editingFabric?.image_url && (
                <div className="mt-2">
                  <Label className="text-sm text-gray-600">Current Image:</Label>
                  <img
                    src={editingFabric.image_url}
                    alt={editingFabric.fabric_name}
                    className="w-20 h-20 object-cover rounded-md mt-1"
                  />
                </div>
              )}
            </div>

            <Separator />

            <div>
              <Label className="font-medium">Add Variants</Label>
              <p className="text-sm text-gray-600 mb-4">
                Click the button below to add color and GSM variants to this fabric.
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (editingFabric) {
                    setSelectedFabricForVariant(editingFabric);
                    setIsAddVariantOpen(true);
                    setIsEditFabricOpen(false);
                  }
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Variant
              </Button>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsEditFabricOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateFabricMutation.isPending}>
                {updateFabricMutation.isPending ? 'Updating...' : 'Update Fabric'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Fabric Details: {selectedFabric?.fabric_name}</DialogTitle>
          </DialogHeader>
          {selectedFabric && (
            <div className="space-y-6">
              {/* Fabric Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-medium">Fabric Code</Label>
                  <p>{selectedFabric.fabric_code}</p>
                </div>
                <div>
                  <Label className="font-medium">Fabric Type</Label>
                  <p>{selectedFabric.fabric_type || 'N/A'}</p>
                </div>
              </div>

              {/* Fabric Image */}
              {selectedFabric.image_url && (
                <div>
                  <Label className="font-medium">Fabric Image</Label>
                  <img
                    src={selectedFabric.image_url}
                    alt={selectedFabric.fabric_name}
                    className="w-32 h-32 object-cover rounded-md"
                  />
                </div>
              )}

              <Separator />

              {/* Variants Table */}
              <div>
                <Label className="font-medium">Variants ({selectedFabric.variants.length})</Label>
                {selectedFabric.variants.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Variant Code</TableHead>
                        <TableHead>Color</TableHead>
                        <TableHead>GSM</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Supplier</TableHead>
                        <TableHead>Image</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedFabric.variants.map((variant) => (
                        <TableRow key={variant.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div
                                className="w-6 h-6 rounded-full border border-gray-300"
                                style={{
                                  backgroundColor: variant.hex_code || '#ccc'
                                }}
                              />
                              {variant.variant_code}
                            </div>
                          </TableCell>
                          <TableCell>{variant.color}</TableCell>
                          <TableCell>{variant.gsm}</TableCell>
                          <TableCell>{variant.price ? `₹${variant.price}` : 'N/A'}</TableCell>
                          <TableCell>{variant.supplier || 'N/A'}</TableCell>
                          <TableCell>
                            {variant.image_url ? (
                              <img
                                src={variant.image_url}
                                alt={variant.color}
                                className="w-12 h-12 object-cover rounded"
                              />
                            ) : (
                              'No Image'
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-gray-500">No variants added for this fabric.</p>
                )}
              </div>
            </div>
          )}
                 </DialogContent>
       </Dialog>

       {/* Delete Confirmation Dialog */}
       <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
         <DialogContent className="max-w-md">
           <DialogHeader>
             <DialogTitle>Delete Fabric</DialogTitle>
           </DialogHeader>
           <div className="space-y-4">
             <div className="flex items-start gap-3">
               <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                 <Trash2 className="w-5 h-5 text-red-600" />
               </div>
               <div>
                 <p className="font-medium">Are you sure you want to delete this fabric?</p>
                 <p className="text-sm text-gray-600 mt-1">
                   This will permanently delete <strong>{deletingFabric?.fabric_name}</strong> and all its variants.
                 </p>
                 {deletingFabric?.variants && deletingFabric.variants.length > 0 && (
                   <p className="text-sm text-red-600 mt-2">
                     ⚠️ This fabric has {deletingFabric.variants.length} variant(s) that will also be deleted.
                   </p>
                 )}
               </div>
             </div>
             
             <div className="flex justify-end gap-2">
               <Button
                 variant="outline"
                 onClick={() => {
                   setIsDeleteConfirmOpen(false);
                   setDeletingFabric(null);
                 }}
               >
                 Cancel
               </Button>
               <Button
                 variant="destructive"
                 onClick={confirmDeleteFabric}
                 disabled={deleteFabricMutation.isPending}
               >
                 {deleteFabricMutation.isPending ? 'Deleting...' : 'Delete Fabric'}
               </Button>
             </div>
           </div>
         </DialogContent>
       </Dialog>
     </div>
   );
 };

export default FabricMaster;
