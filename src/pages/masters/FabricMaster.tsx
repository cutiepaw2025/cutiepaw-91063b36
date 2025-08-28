import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Upload, Download, Eye, Edit, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';

// UI Components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

// Types
interface FabricMaster {
  id: string;
  fabric_name: string;
  fabric_type: string | null;
  gsm: number | null;
  uom: string | null;
  price: number | null;
  supplier: string | null;
  main_image_url: string | null;
  created_at: string | null;
  updated_at: string | null;
}

interface FabricColor {
  id: string;
  fabric_id: string;
  description: string | null;
  color: string | null;
  hex_code: string | null;
  image_url: string | null;
  created_at: string | null;
  updated_at: string | null;
}

interface FabricWithColors extends FabricMaster {
  colors: FabricColor[];
}

// CSV Template
const csvTemplate = `code,fabric_name,fabric_type,gsm,uom,price,supplier,color,description,hex_code
DK-180,DOT KNIT,Polyester,180,KGS,343,Supplier A,BLACK,Black color variant,#000000
DK-180,DOT KNIT,Polyester,180,KGS,343,Supplier A,WHITE,White color variant,#FFFFFF
DK-180,DOT KNIT,Polyester,180,KGS,343,Supplier A,RED,Red color variant,#FF0000`;

const FabricMaster: React.FC = () => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedFabric, setSelectedFabric] = useState<FabricWithColors | null>(null);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<any[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Form state
  const [formData, setFormData] = useState({
    id: '',
    fabric_name: '',
    fabric_type: '',
    gsm: '',
    uom: '',
    price: '',
    supplier: '',
    main_image: null as File | null,
    colors: [] as Array<{
      id: string;
      color: string;
      description: string;
      hex_code: string;
      image: File | null;
    }>
  });

  // Fetch fabrics with colors
  const { data: fabrics, isLoading } = useQuery({
    queryKey: ['fabrics'],
    queryFn: async (): Promise<FabricWithColors[]> => {
      const { data: fabricData, error: fabricError } = await supabase
        .from('fabric_master')
        .select('*')
        .order('fabric_name');

      if (fabricError) throw fabricError;

      const { data: colorData, error: colorError } = await supabase
        .from('fabric_colors')
        .select('*');

      if (colorError) throw colorError;

      // Group colors by fabric_id
      const colorsByFabric = colorData.reduce((acc, color) => {
        if (!acc[color.fabric_id]) acc[color.fabric_id] = [];
        acc[color.fabric_id].push(color);
        return acc;
      }, {} as Record<string, FabricColor[]>);

      return fabricData.map(fabric => ({
        ...fabric,
        colors: colorsByFabric[fabric.id] || []
      }));
    }
  });

  // Mutations
  const fabricMutation = useMutation({
    mutationFn: async (data: Partial<FabricMaster>) => {
      const { data: result, error } = await supabase
        .from('fabric_master')
        .insert([data])
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fabrics'] });
      toast.success('Fabric created successfully');
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(`Failed to create fabric: ${error.message}`);
    }
  });

  const colorMutation = useMutation({
    mutationFn: async (colors: Array<Partial<FabricColor>>) => {
      const { data: result, error } = await supabase
        .from('fabric_colors')
        .insert(colors)
        .select();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fabrics'] });
      toast.success('Colors added successfully');
    },
    onError: (error) => {
      toast.error(`Failed to add colors: ${error.message}`);
    }
  });

  // File upload function
  const uploadFile = async (file: File, path: string): Promise<string> => {
    const { data, error } = await supabase.storage
      .from('fabric')
      .upload(path, file);

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('fabric')
      .getPublicUrl(data.path);

    return publicUrl;
  };

  // Form handlers
  const resetForm = () => {
    setFormData({
      id: '',
      fabric_name: '',
      fabric_type: '',
      gsm: '',
      uom: '',
      price: '',
      supplier: '',
      main_image: null,
      colors: []
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      let mainImageUrl = null;
      if (formData.main_image) {
        const timestamp = Date.now();
        mainImageUrl = await uploadFile(formData.main_image, `main_${formData.id}_${timestamp}.jpg`);
      }

      // Create fabric
      await fabricMutation.mutateAsync({
        id: formData.id,
        fabric_name: formData.fabric_name,
        fabric_type: formData.fabric_type || null,
        gsm: formData.gsm ? parseInt(formData.gsm) : null,
        uom: formData.uom || null,
        price: formData.price ? parseFloat(formData.price) : null,
        supplier: formData.supplier || null,
        main_image_url: mainImageUrl
      });

      // Upload color images and create colors
      if (formData.colors.length > 0) {
        const colorsToInsert = [];
        
        for (const color of formData.colors) {
          let colorImageUrl = null;
          if (color.image) {
            const timestamp = Date.now();
            colorImageUrl = await uploadFile(color.image, `color_${color.id}_${timestamp}.jpg`);
          }

          colorsToInsert.push({
            id: color.id,
            fabric_id: formData.id,
            color: color.color,
            description: color.description,
            hex_code: color.hex_code,
            image_url: colorImageUrl
          });
        }

        await colorMutation.mutateAsync(colorsToInsert);
      }
    } catch (error) {
      console.error('Submit error:', error);
    }
  };

  const addColor = () => {
    setFormData(prev => ({
      ...prev,
      colors: [...prev.colors, {
        id: `${formData.id}-${formData.colors.length + 1}`,
        color: '',
        description: '',
        hex_code: '',
        image: null
      }]
    }));
  };

  const removeColor = (index: number) => {
    setFormData(prev => ({
      ...prev,
      colors: prev.colors.filter((_, i) => i !== index)
    }));
  };

  // CSV handlers
  const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvFile(file);
    
    // Preview first 4 rows
    const text = await file.text();
    const lines = text.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',');
    const preview = lines.slice(1, 5).map(line => {
      const values = line.split(',');
      return headers.reduce((obj, header, index) => {
        obj[header.trim()] = values[index]?.trim() || '';
        return obj;
      }, {} as any);
    });

    setCsvPreview(preview);
  };

  const processBulkUpload = async () => {
    if (!csvFile) return;

    try {
      setUploadProgress(0);
      const text = await csvFile.text();
      const lines = text.split('\n').filter(line => line.trim());
      const headers = lines[0].split(',');
      
      // Group by fabric code
      const fabricGroups = new Map<string, any[]>();
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        const row = headers.reduce((obj, header, index) => {
          obj[header.trim()] = values[index]?.trim() || '';
          return obj;
        }, {} as any);

        const code = row.code;
        if (!fabricGroups.has(code)) {
          fabricGroups.set(code, []);
        }
        fabricGroups.get(code)!.push(row);
      }

      let processed = 0;
      const total = fabricGroups.size;

      for (const [code, rows] of fabricGroups) {
        const firstRow = rows[0];
        
        // Create fabric
        await fabricMutation.mutateAsync({
          id: code,
          fabric_name: firstRow.fabric_name,
          fabric_type: firstRow.fabric_type || null,
          gsm: firstRow.gsm ? parseInt(firstRow.gsm) : null,
          uom: firstRow.uom || null,
          price: firstRow.price ? parseFloat(firstRow.price) : null,
          supplier: firstRow.supplier || null
        });

        // Create colors
        const colors = rows.map((row, index) => ({
          id: `${code}-${row.color || index + 1}`,
          fabric_id: code,
          color: row.color,
          description: row.description,
          hex_code: row.hex_code,
          image_url: null
        }));

        if (colors.length > 0) {
          await colorMutation.mutateAsync(colors);
        }

        processed++;
        setUploadProgress((processed / total) * 100);
      }

      toast.success(`Successfully uploaded ${total} fabrics with colors`);
      setIsBulkUploadOpen(false);
      setCsvFile(null);
      setCsvPreview([]);
      setUploadProgress(0);
    } catch (error) {
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
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Bulk Upload Fabrics</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Button variant="outline" onClick={downloadTemplate}>
                    <Download className="w-4 h-4 mr-2" />
                    Download Template
                  </Button>
                </div>
                <div>
                  <Label htmlFor="csv-file">Upload CSV File</Label>
                  <Input
                    id="csv-file"
                    type="file"
                    accept=".csv"
                    onChange={handleCsvUpload}
                  />
                </div>
                {csvPreview.length > 0 && (
                  <div>
                    <Label>Preview (First 4 rows)</Label>
                    <div className="border rounded-md p-4 max-h-64 overflow-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            {Object.keys(csvPreview[0] || {}).map(key => (
                              <TableHead key={key}>{key}</TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {csvPreview.map((row, index) => (
                            <TableRow key={index}>
                              {Object.values(row).map((value, i) => (
                                <TableCell key={i}>{String(value)}</TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
                {uploadProgress > 0 && (
                  <div>
                    <Label>Upload Progress: {Math.round(uploadProgress)}%</Label>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}
                <div className="flex justify-end gap-2">
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
                    Upload
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Fabric
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Fabric</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="code">Code *</Label>
                    <Input
                      id="code"
                      value={formData.id}
                      onChange={(e) => setFormData(prev => ({ ...prev, id: e.target.value }))}
                      placeholder="e.g., DK-180"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="fabric_name">Fabric Name *</Label>
                    <Input
                      id="fabric_name"
                      value={formData.fabric_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, fabric_name: e.target.value }))}
                      placeholder="e.g., DOT KNIT"
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fabric_type">Fabric Type</Label>
                    <Input
                      id="fabric_type"
                      value={formData.fabric_type}
                      onChange={(e) => setFormData(prev => ({ ...prev, fabric_type: e.target.value }))}
                      placeholder="e.g., Polyester"
                    />
                  </div>
                  <div>
                    <Label htmlFor="gsm">GSM</Label>
                    <Input
                      id="gsm"
                      type="number"
                      value={formData.gsm}
                      onChange={(e) => setFormData(prev => ({ ...prev, gsm: e.target.value }))}
                      placeholder="e.g., 180"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="uom">UOM</Label>
                    <Input
                      id="uom"
                      value={formData.uom}
                      onChange={(e) => setFormData(prev => ({ ...prev, uom: e.target.value }))}
                      placeholder="e.g., KGS"
                    />
                  </div>
                  <div>
                    <Label htmlFor="price">Price</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                      placeholder="e.g., 343"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="supplier">Supplier</Label>
                  <Input
                    id="supplier"
                    value={formData.supplier}
                    onChange={(e) => setFormData(prev => ({ ...prev, supplier: e.target.value }))}
                    placeholder="e.g., Supplier A"
                  />
                </div>

                <div>
                  <Label htmlFor="main_image">Main Image</Label>
                  <Input
                    id="main_image"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      main_image: e.target.files?.[0] || null 
                    }))}
                  />
                </div>

                <Separator />

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <Label>Colors</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addColor}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Color
                    </Button>
                  </div>
                  
                  {formData.colors.map((color, index) => (
                    <div key={index} className="border rounded-md p-4 mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <Label>Color {index + 1}</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeColor(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Color Name</Label>
                          <Input
                            value={color.color}
                            onChange={(e) => {
                              const newColors = [...formData.colors];
                              newColors[index].color = e.target.value;
                              setFormData(prev => ({ ...prev, colors: newColors }));
                            }}
                            placeholder="e.g., BLACK"
                          />
                        </div>
                        <div>
                          <Label>Hex Code</Label>
                          <Input
                            value={color.hex_code}
                            onChange={(e) => {
                              const newColors = [...formData.colors];
                              newColors[index].hex_code = e.target.value;
                              setFormData(prev => ({ ...prev, colors: newColors }));
                            }}
                            placeholder="e.g., #000000"
                          />
                        </div>
                      </div>
                      
                      <div className="mt-2">
                        <Label>Description</Label>
                        <Textarea
                          value={color.description}
                          onChange={(e) => {
                            const newColors = [...formData.colors];
                            newColors[index].description = e.target.value;
                            setFormData(prev => ({ ...prev, colors: newColors }));
                          }}
                          placeholder="Color description"
                        />
                      </div>
                      
                      <div className="mt-2">
                        <Label>Color Image</Label>
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const newColors = [...formData.colors];
                            newColors[index].image = e.target.files?.[0] || null;
                            setFormData(prev => ({ ...prev, colors: newColors }));
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={fabricMutation.isPending}>
                    {fabricMutation.isPending ? 'Creating...' : 'Create Fabric'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
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
                    <p className="text-sm text-gray-600">Code: {fabric.id}</p>
                  </div>
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
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  {/* Main Image */}
                  <div className="w-24 h-24 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                    {fabric.main_image_url ? (
                      <img
                        src={fabric.main_image_url}
                        alt={fabric.fabric_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        No Image
                      </div>
                    )}
                  </div>
                  
                  {/* Details */}
                  <div className="flex-1 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">GSM:</span>
                      <span className="text-sm">{fabric.gsm || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Price:</span>
                      <span className="text-sm">{fabric.price ? `₹${fabric.price}` : 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Supplier:</span>
                      <span className="text-sm">{fabric.supplier || 'N/A'}</span>
                    </div>
                    
                    {/* Color Swatches */}
                    {fabric.colors.length > 0 && (
                      <div>
                        <span className="text-sm font-medium">Colors:</span>
                        <div className="flex gap-1 mt-1">
                          {fabric.colors.slice(0, 5).map((color) => (
                            <div
                              key={color.id}
                              className="w-4 h-4 rounded-full border border-gray-300"
                              style={{
                                backgroundColor: color.hex_code || '#ccc',
                                cursor: 'pointer'
                              }}
                              title={color.color || 'Unknown'}
                            />
                          ))}
                          {fabric.colors.length > 5 && (
                            <Badge variant="secondary" className="text-xs">
                              +{fabric.colors.length - 5}
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
          <p className="text-gray-500">No fabrics found. Add your first fabric to get started.</p>
        </div>
      )}

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
                  <Label className="font-medium">Code</Label>
                  <p>{selectedFabric.id}</p>
                </div>
                <div>
                  <Label className="font-medium">Fabric Type</Label>
                  <p>{selectedFabric.fabric_type || 'N/A'}</p>
                </div>
                <div>
                  <Label className="font-medium">GSM</Label>
                  <p>{selectedFabric.gsm || 'N/A'}</p>
                </div>
                <div>
                  <Label className="font-medium">UOM</Label>
                  <p>{selectedFabric.uom || 'N/A'}</p>
                </div>
                <div>
                  <Label className="font-medium">Price</Label>
                  <p>{selectedFabric.price ? `₹${selectedFabric.price}` : 'N/A'}</p>
                </div>
                <div>
                  <Label className="font-medium">Supplier</Label>
                  <p>{selectedFabric.supplier || 'N/A'}</p>
                </div>
              </div>

              {/* Main Image */}
              {selectedFabric.main_image_url && (
                <div>
                  <Label className="font-medium">Main Image</Label>
                  <img
                    src={selectedFabric.main_image_url}
                    alt={selectedFabric.fabric_name}
                    className="w-32 h-32 object-cover rounded-md"
                  />
                </div>
              )}

              <Separator />

              {/* Colors Table */}
              <div>
                <Label className="font-medium">Colors ({selectedFabric.colors.length})</Label>
                {selectedFabric.colors.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Color</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Hex Code</TableHead>
                        <TableHead>Image</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedFabric.colors.map((color) => (
                        <TableRow key={color.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div
                                className="w-6 h-6 rounded-full border border-gray-300"
                                style={{
                                  backgroundColor: color.hex_code || '#ccc'
                                }}
                              />
                              {color.color || 'N/A'}
                            </div>
                          </TableCell>
                          <TableCell>{color.description || 'N/A'}</TableCell>
                          <TableCell>{color.hex_code || 'N/A'}</TableCell>
                          <TableCell>
                            {color.image_url ? (
                              <img
                                src={color.image_url}
                                alt={color.color || 'Color'}
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
                  <p className="text-gray-500">No colors added for this fabric.</p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FabricMaster;
