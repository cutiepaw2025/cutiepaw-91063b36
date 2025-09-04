import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Eye, Search, X, Edit, Trash2, Dog, Cat } from 'lucide-react';
import { toast } from 'sonner';

// UI Components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Types
import { PetBreed, SizeType, SizeChart, SizeTypeWithCharts } from '@/integrations/supabase/types';

const SizeMaster: React.FC = () => {
  const queryClient = useQueryClient();
  
  // Dialog states
  const [isAddBreedOpen, setIsAddBreedOpen] = useState(false);
  const [isEditBreedOpen, setIsEditBreedOpen] = useState(false);
  const [isEditSizeTypeOpen, setIsEditSizeTypeOpen] = useState(false);
  const [isAddSizeTypeOpen, setIsAddSizeTypeOpen] = useState(false);
  const [isAddSizeChartOpen, setIsAddSizeChartOpen] = useState(false);
  const [isViewSizeTypeOpen, setIsViewSizeTypeOpen] = useState(false);
  const [isDeleteSizeTypeOpen, setIsDeleteSizeTypeOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'sizeTypes' | 'breeds'>('sizeTypes');
  const [selectedSizeType, setSelectedSizeType] = useState<SizeTypeWithCharts | null>(null);
  const [selectedBreed, setSelectedBreed] = useState<PetBreed | null>(null);

  // Form states
  const [breedForm, setBreedForm] = useState({
    breed_name: '',
    description: '',
    pet_type: 'dog' as 'dog' | 'cat',
    image: null as File | null
  });

  const [sizeTypeForm, setSizeTypeForm] = useState({
    size_type_name: '',
    description: '',
    pet_type: 'dog' as 'dog' | 'cat',
    ideal_for_breed_ids: [] as string[],
    sizes: [
      {
        size: '',
        neck: '',
        chest: '',
        length: '',
        front_leg_length: '',
        back_leg_length: ''
      }
    ]
  });

  const [editSizeTypeForm, setEditSizeTypeForm] = useState({
    size_type_name: '',
    description: '',
    pet_type: 'dog' as 'dog' | 'cat',
    ideal_for_breed_ids: [] as string[],
    sizes: [
      {
        size: '',
        neck: '',
        chest: '',
        length: '',
        front_leg_length: '',
        back_leg_length: ''
      }
    ]
  });

  const [sizeChartForm, setSizeChartForm] = useState({
    size: '',
    neck: '',
    chest: '',
    length: '',
    front_leg_length: '',
    back_leg_length: ''
  });

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Mutations
  const breedMutation = useMutation({
    mutationFn: async (data: { breed_name: string; description?: string; pet_type: 'dog' | 'cat'; image_url?: string }) => {
      // Ensure required fields are present for insert
      if (!data.breed_name || !data.pet_type) {
        throw new Error('Breed name and pet type are required');
      }
      const { data: result, error } = await supabase
        .from('pet_breeds')
        .insert([data])
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pet-breeds'] });
      toast.success('Pet breed created successfully');
      setIsAddBreedOpen(false);
      resetBreedForm();
    },
    onError: (error) => {
      toast.error(`Failed to create pet breed: ${error.message}`);
    }
  });

  const updateBreedMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<{ breed_name: string; description?: string; pet_type: 'dog' | 'cat'; image_url?: string }> }) => {
      const { data: result, error } = await supabase
        .from('pet_breeds')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pet-breeds'] });
      toast.success('Pet breed updated successfully');
      setIsEditBreedOpen(false);
      setSelectedBreed(null);
      resetBreedForm();
    },
    onError: (error) => {
      toast.error(`Failed to update pet breed: ${error.message}`);
    }
  });

  const sizeTypeMutation = useMutation({
    mutationFn: async (data: { size_type_name: string; pet_type: 'dog' | 'cat'; description?: string; ideal_for_breed_ids?: string[] }) => {
      const { data: result, error } = await supabase
        .from('size_types')
        .insert([data])
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['size-types'] });
      toast.success('Size type created successfully');
      setIsAddSizeTypeOpen(false);
      resetSizeTypeForm();
    },
    onError: (error) => {
      toast.error(`Failed to create size type: ${error.message}`);
    }
  });

  const updateSizeTypeMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<{ size_type_name: string; pet_type: 'dog' | 'cat'; description?: string; ideal_for_breed_ids?: string[] }> }) => {
      const { data: result, error } = await supabase
        .from('size_types')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['size-types'] });
      toast.success('Size type updated successfully');
      setIsEditSizeTypeOpen(false);
      setSelectedSizeType(null);
      resetEditSizeTypeForm();
    },
    onError: (error) => {
      toast.error(`Failed to update size type: ${error.message}`);
    }
  });

  const deleteSizeTypeMutation = useMutation({
    mutationFn: async (id: string) => {
      // First delete all size charts for this size type
      const { error: chartError } = await supabase
        .from('size_charts')
        .delete()
        .eq('size_type_id', id);

      if (chartError) throw chartError;

      // Then delete the size type
      const { error } = await supabase
        .from('size_types')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['size-types'] });
      toast.success('Size type deleted successfully');
      setIsDeleteSizeTypeOpen(false);
      setSelectedSizeType(null);
    },
    onError: (error) => {
      toast.error(`Failed to delete size type: ${error.message}`);
    }
  });

  const sizeChartMutation = useMutation({
    mutationFn: async (data: { size_type_id: string; size: string; neck?: number; chest?: number; length?: number; front_leg_length?: number; back_leg_length?: number }) => {
      const { data: result, error } = await supabase
        .from('size_charts')
        .insert([data])
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['size-types'] });
      toast.success('Size chart added successfully');
      setIsAddSizeChartOpen(false);
      resetSizeChartForm();
    },
    onError: (error) => {
      toast.error(`Failed to add size chart: ${error.message}`);
    }
  });

  // Form handlers
  const resetBreedForm = () => {
    setBreedForm({
      breed_name: '',
      description: '',
      pet_type: 'dog',
      image: null
    });
  };

  const resetSizeTypeForm = () => {
    setSizeTypeForm({
      size_type_name: '',
      description: '',
      pet_type: 'dog',
      ideal_for_breed_ids: [],
      sizes: [
        {
          size: '',
          neck: '',
          chest: '',
          length: '',
          front_leg_length: '',
          back_leg_length: ''
        }
      ]
    });
  };

  const resetEditSizeTypeForm = () => {
    setEditSizeTypeForm({
      size_type_name: '',
      description: '',
      pet_type: 'dog',
      ideal_for_breed_ids: [],
      sizes: [
        {
          size: '',
          neck: '',
          chest: '',
          length: '',
          front_leg_length: '',
          back_leg_length: ''
        }
      ]
    });
  };

  const resetSizeChartForm = () => {
    setSizeChartForm({
      size: '',
      neck: '',
      chest: '',
      length: '',
      front_leg_length: '',
      back_leg_length: ''
    });
  };

  // File upload function
  const uploadFile = async (file: File, path: string): Promise<string> => {
    try {
      const { data, error } = await supabase.storage
        .from('pet-breeds')
        .upload(path, file);

      if (error) {
        console.error('Storage upload error:', error);
        if (error.message.includes('Bucket not found')) {
          toast.error('Storage bucket not found. Please create a "pet-breeds" bucket in your Supabase dashboard.');
          throw new Error('Storage bucket "pet-breeds" not found. Please create it in Supabase dashboard.');
        }
        throw error;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('pet-breeds')
        .getPublicUrl(data.path);

      return publicUrl;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  };

  const handleAddBreed = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      let imageUrl = null;
      if (breedForm.image) {
        const timestamp = Date.now();
        imageUrl = await uploadFile(breedForm.image, `breed_${breedForm.breed_name}_${timestamp}.jpg`);
      }

      await breedMutation.mutateAsync({
        breed_name: breedForm.breed_name,
        description: breedForm.description || null,
        pet_type: breedForm.pet_type,
        image_url: imageUrl
      });
    } catch (error) {
      console.error('Add breed error:', error);
    }
  };

  const handleEditBreed = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedBreed) return;
    
    try {
      let imageUrl = selectedBreed.image_url;
      if (breedForm.image) {
        const timestamp = Date.now();
        imageUrl = await uploadFile(breedForm.image, `breed_${breedForm.breed_name}_${timestamp}.jpg`);
      }

      await updateBreedMutation.mutateAsync({
        id: selectedBreed.id,
        data: {
          breed_name: breedForm.breed_name,
          description: breedForm.description || null,
          pet_type: breedForm.pet_type,
          image_url: imageUrl
        }
      });
    } catch (error) {
      console.error('Update breed error:', error);
    }
  };

  const handleEditBreedClick = (breed: PetBreed) => {
    setSelectedBreed(breed);
    setBreedForm({
      breed_name: breed.breed_name,
      description: breed.description || '',
      pet_type: breed.pet_type,
      image: null
    });
    setIsEditBreedOpen(true);
  };

  const handleAddSizeType = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
              // First create the size type
        const { data: sizeTypeResult, error: sizeTypeError } = await supabase
          .from('size_types')
          .insert([{
            size_type_name: sizeTypeForm.size_type_name,
            description: sizeTypeForm.description || null,
            pet_type: sizeTypeForm.pet_type,
            ideal_for_breed_ids: sizeTypeForm.ideal_for_breed_ids.length > 0 ? sizeTypeForm.ideal_for_breed_ids : null
          }])
          .select()
          .single();

      if (sizeTypeError) throw sizeTypeError;

      // Then create all the size charts
      const sizeChartsToInsert: { size_type_id: string; size: string; neck: number | null; chest: number | null; length: number | null; front_leg_length: number | null; back_leg_length: number | null }[] = sizeTypeForm.sizes
        .filter(size => size.size.trim() !== '') // Only insert sizes with a name
        .map(size => ({
          size_type_id: sizeTypeResult.id,
          size: size.size,
          neck: size.neck ? parseFloat(size.neck) : null,
          chest: size.chest ? parseFloat(size.chest) : null,
          length: size.length ? parseFloat(size.length) : null,
          front_leg_length: size.front_leg_length ? parseFloat(size.front_leg_length) : null,
          back_leg_length: size.back_leg_length ? parseFloat(size.back_leg_length) : null
        }));

      if (sizeChartsToInsert.length > 0) {
        const { error: sizeChartError } = await supabase
          .from('size_charts')
          .insert(sizeChartsToInsert);

        if (sizeChartError) throw sizeChartError;
      }

      queryClient.invalidateQueries({ queryKey: ['size-types'] });
      toast.success('Size type and sizes created successfully');
      setIsAddSizeTypeOpen(false);
      resetSizeTypeForm();
    } catch (error) {
      console.error('Add size type error:', error);
      toast.error(`Failed to create size type: ${error.message}`);
    }
  };

  const addSizeField = () => {
    setSizeTypeForm(prev => ({
      ...prev,
      sizes: [...prev.sizes, {
        size: '',
        neck: '',
        chest: '',
        length: '',
        front_leg_length: '',
        back_leg_length: ''
      }]
    }));
  };

  const removeSizeField = (index: number) => {
    setSizeTypeForm(prev => ({
      ...prev,
      sizes: prev.sizes.filter((_, i) => i !== index)
    }));
  };

  const updateSizeField = (index: number, field: string, value: string) => {
    setSizeTypeForm(prev => ({
      ...prev,
      sizes: prev.sizes.map((size, i) => 
        i === index ? { ...size, [field]: value } : size
      )
    }));
  };

  const handleAddSizeChart = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedSizeType) return;

    try {
      await sizeChartMutation.mutateAsync({
        size_type_id: selectedSizeType.id,
        size: sizeChartForm.size,
        neck: sizeChartForm.neck ? parseFloat(sizeChartForm.neck) : null,
        chest: sizeChartForm.chest ? parseFloat(sizeChartForm.chest) : null,
        length: sizeChartForm.length ? parseFloat(sizeChartForm.length) : null,
        front_leg_length: sizeChartForm.front_leg_length ? parseFloat(sizeChartForm.front_leg_length) : null,
        back_leg_length: sizeChartForm.back_leg_length ? parseFloat(sizeChartForm.back_leg_length) : null
      });
    } catch (error) {
      console.error('Add size chart error:', error);
    }
  };

  const handleAddSizeChartClick = (sizeType: SizeTypeWithCharts) => {
    setSelectedSizeType(sizeType);
    setIsAddSizeChartOpen(true);
  };

  const handleViewSizeType = (sizeType: SizeTypeWithCharts) => {
    setSelectedSizeType(sizeType);
    setIsViewSizeTypeOpen(true);
  };

  const handleEditSizeType = (sizeType: SizeTypeWithCharts) => {
    setSelectedSizeType(sizeType);
    setEditSizeTypeForm({
      size_type_name: sizeType.size_type_name,
      description: sizeType.description || '',
      pet_type: sizeType.pet_type,
      ideal_for_breed_ids: sizeType.ideal_for_breed_ids || [],
      sizes: sizeType.size_charts.length > 0 ? sizeType.size_charts.map(chart => ({
        size: chart.size,
        neck: chart.neck?.toString() || '',
        chest: chart.chest?.toString() || '',
        length: chart.length?.toString() || '',
        front_leg_length: chart.front_leg_length?.toString() || '',
        back_leg_length: chart.back_leg_length?.toString() || ''
      })) : [{
        size: '',
        neck: '',
        chest: '',
        length: '',
        front_leg_length: '',
        back_leg_length: ''
      }]
    });
    setIsEditSizeTypeOpen(true);
  };

  const handleDeleteSizeType = (sizeType: SizeTypeWithCharts) => {
    setSelectedSizeType(sizeType);
    setIsDeleteSizeTypeOpen(true);
  };

  const handleConfirmDeleteSizeType = () => {
    if (!selectedSizeType) return;
    deleteSizeTypeMutation.mutate(selectedSizeType.id);
  };

  const handleUpdateSizeType = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedSizeType) return;
    
    try {
      // Update the size type
      await updateSizeTypeMutation.mutateAsync({
        id: selectedSizeType.id,
        data: {
          size_type_name: editSizeTypeForm.size_type_name,
          description: editSizeTypeForm.description || null,
          pet_type: editSizeTypeForm.pet_type,
          ideal_for_breed_ids: editSizeTypeForm.ideal_for_breed_ids.length > 0 ? editSizeTypeForm.ideal_for_breed_ids : null
        }
      });

      // Update size charts if any changes
      const validSizes = editSizeTypeForm.sizes.filter(size => size.size.trim() !== '');
      if (validSizes.length > 0) {
        // Delete existing charts
        await supabase
          .from('size_charts')
          .delete()
          .eq('size_type_id', selectedSizeType.id);

        // Insert new charts
        const sizeChartsToInsert = validSizes.map(size => ({
          size_type_id: selectedSizeType.id,
          size: size.size,
          neck: size.neck ? parseFloat(size.neck) : null,
          chest: size.chest ? parseFloat(size.chest) : null,
          length: size.length ? parseFloat(size.length) : null,
          front_leg_length: size.front_leg_length ? parseFloat(size.front_leg_length) : null,
          back_leg_length: size.back_leg_length ? parseFloat(size.back_leg_length) : null
        }));

        await supabase
          .from('size_charts')
          .insert(sizeChartsToInsert);
      }

      queryClient.invalidateQueries({ queryKey: ['size-types'] });
      toast.success('Size type and charts updated successfully');
    } catch (error) {
      console.error('Update size type error:', error);
      toast.error(`Failed to update size type: ${error.message}`);
    }
  };

  const addEditSizeField = () => {
    setEditSizeTypeForm(prev => ({
      ...prev,
      sizes: [...prev.sizes, {
        size: '',
        neck: '',
        chest: '',
        length: '',
        front_leg_length: '',
        back_leg_length: ''
      }]
    }));
  };

  const removeEditSizeField = (index: number) => {
    setEditSizeTypeForm(prev => ({
      ...prev,
      sizes: prev.sizes.filter((_, i) => i !== index)
    }));
  };

  const updateEditSizeField = (index: number, field: string, value: string) => {
    setEditSizeTypeForm(prev => ({
      ...prev,
      sizes: prev.sizes.map((size, i) => 
        i === index ? { ...size, [field]: value } : size
      )
    }));
  };

  // Fetch pet breeds
  const { data: breeds, isLoading: breedsLoading } = useQuery({
    queryKey: ['pet-breeds'],
    queryFn: async (): Promise<PetBreed[]> => {
      const { data, error } = await supabase
        .from('pet_breeds')
        .select('*')
        .order('breed_name');

      if (error) throw error;
      return data || [];
    }
  });

  // Fetch size types with charts
  const { data: sizeTypes, isLoading: sizeTypesLoading } = useQuery({
    queryKey: ['size-types'],
    queryFn: async (): Promise<SizeTypeWithCharts[]> => {
      const { data: sizeTypeData, error: sizeTypeError } = await supabase
        .from('size_types')
        .select('*')
        .order('size_type_name');

      if (sizeTypeError) throw sizeTypeError;

      const { data: chartData, error: chartError } = await supabase
        .from('size_charts')
        .select('*');

      if (chartError) throw chartError;

      // Group charts by size_type_id
      const chartsByType = chartData.reduce((acc, chart) => {
        if (!acc[chart.size_type_id]) acc[chart.size_type_id] = [];
        acc[chart.size_type_id].push(chart);
        return acc;
      }, {} as Record<string, SizeChart[]>);

      return sizeTypeData.map(type => ({
        ...type,
        size_charts: chartsByType[type.id] || []
      }));
    }
  });

  // Filter data based on search
  const filteredBreeds = breeds?.filter(breed =>
    breed.breed_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    breed.description?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const filteredSizeTypes = sizeTypes?.filter(sizeType =>
    sizeType.size_type_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sizeType.description?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  if (breedsLoading || sizeTypesLoading) {
    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
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
        <h1 className="text-2xl font-bold">Size Master</h1>
        <div className="flex gap-2">
          <Dialog open={isAddBreedOpen} onOpenChange={setIsAddBreedOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Pet Breed
              </Button>
            </DialogTrigger>
          </Dialog>
          <Dialog open={isAddSizeTypeOpen} onOpenChange={setIsAddSizeTypeOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Add Size Type
              </Button>
            </DialogTrigger>
          </Dialog>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6">
        <button
          onClick={() => setActiveTab('sizeTypes')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'sizeTypes'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Size Types ({sizeTypes?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('breeds')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'breeds'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Pet Breeds ({breeds?.length || 0})
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="max-w-md">
          <Label htmlFor="search">Search {activeTab === 'breeds' ? 'Breeds' : 'Size Types'}</Label>
          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              id="search"
              placeholder={`Search ${activeTab === 'breeds' ? 'breed name...' : 'size type name...'}`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'sizeTypes' ? (
        /* Size Types Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSizeTypes.map((sizeType) => (
            <Card key={sizeType.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    {sizeType.pet_type === 'dog' ? (
                      <Dog className="w-5 h-5 text-blue-600" />
                    ) : (
                      <Cat className="w-5 h-5 text-purple-600" />
                    )}
                    <div>
                      <CardTitle className="text-lg">{sizeType.size_type_name}</CardTitle>
                      <Badge variant="secondary" className="mt-1">
                        {sizeType.pet_type.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewSizeType(sizeType)}
                      className="h-8 w-8 p-0 hover:bg-gray-100"
                    >
                      <Eye className="w-4 h-4 text-gray-600" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditSizeType(sizeType)}
                      className="h-8 w-8 p-0 hover:bg-gray-100"
                    >
                      <Edit className="w-4 h-4 text-gray-600" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteSizeType(sizeType)}
                      className="h-8 w-8 p-0 hover:bg-red-50 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">
                    {sizeType.description || 'No description available'}
                  </p>
                  
                  {/* Ideal For Breeds */}
                  {sizeType.ideal_for_breed_ids && sizeType.ideal_for_breed_ids.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-sm font-medium">Ideal For:</span>
                      <div className="flex flex-wrap gap-2">
                        {sizeType.ideal_for_breed_ids.map((breedId) => {
                          const breed = breeds?.find(b => b.id === breedId);
                          return breed ? (
                                                         <div key={breedId} className="flex items-center gap-2 bg-gray-100 rounded-md p-2">
                               <div className="w-14 h-14 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                                 {breed.image_url ? (
                                   <img
                                     src={breed.image_url}
                                     alt={breed.breed_name}
                                     className="w-full h-full object-cover"
                                   />
                                 ) : (
                                   <div className="w-full h-full flex items-center justify-center text-gray-400 text-base">
                                     {breed.pet_type === 'dog' ? '🐕' : '🐱'}
                                   </div>
                                 )}
                               </div>
                               <span className="text-sm text-gray-700">{breed.breed_name}</span>
                             </div>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}
                  
                  {/* Sizes Row */}
                  {sizeType.size_charts.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-sm font-medium">Sizes:</span>
                      <div className="flex flex-wrap gap-1">
                        {sizeType.size_charts.map((chart) => (
                          <Badge key={chart.id} variant="outline" className="text-xs">
                            {chart.size}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => handleAddSizeChartClick(sizeType)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Sizes
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        /* Pet Breeds Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBreeds.map((breed) => (
            <Card key={breed.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                <div className="flex gap-4">
                  {/* Breed Image - Made Bigger */}
                  <div className="w-32 h-32 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                    {breed.image_url ? (
                      <img
                        src={breed.image_url}
                        alt={breed.breed_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        No Image
                      </div>
                    )}
                  </div>
                  
                  {/* Breed Info */}
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 line-clamp-3">
                      {breed.description || 'No description available'}
                    </p>
                  </div>
                  
                  {/* Highlighted Elements - Moved to Upper Right */}
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-2">
                      {breed.pet_type === 'dog' ? (
                        <Dog className="w-6 h-6 text-blue-600" />
                      ) : (
                        <Cat className="w-6 h-6 text-purple-600" />
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditBreedClick(breed)}
                        className="h-8 w-8 p-0 hover:bg-gray-100"
                      >
                        <Edit className="w-4 h-4 text-gray-600" />
                      </Button>
                    </div>
                    <div className="text-right">
                      <CardTitle className="text-xl font-bold text-yellow-600">{breed.breed_name}</CardTitle>
                      <Badge variant="secondary" className="mt-1 bg-green-500 text-white">
                        {breed.pet_type.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

             {/* Add Pet Breed Dialog */}
       <Dialog open={isAddBreedOpen} onOpenChange={setIsAddBreedOpen}>
         <DialogContent className="max-w-2xl">
           <DialogHeader>
             <DialogTitle>Add Pet Breed</DialogTitle>
           </DialogHeader>
           <form onSubmit={handleAddBreed} className="space-y-4">
             <div>
               <Label htmlFor="breed_name">Breed Name *</Label>
               <Input
                 id="breed_name"
                 value={breedForm.breed_name}
                 onChange={(e) => setBreedForm(prev => ({ ...prev, breed_name: e.target.value }))}
                 placeholder="e.g., Golden Retriever"
                 required
               />
             </div>

             <div>
               <Label htmlFor="pet_type">Pet Type *</Label>
               <Select
                 value={breedForm.pet_type}
                 onValueChange={(value: 'dog' | 'cat') => setBreedForm(prev => ({ ...prev, pet_type: value }))}
               >
                 <SelectTrigger>
                   <SelectValue />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="dog">Dog</SelectItem>
                   <SelectItem value="cat">Cat</SelectItem>
                 </SelectContent>
               </Select>
             </div>

                          <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={breedForm.description}
                  onChange={(e) => setBreedForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Breed description..."
                />
              </div>

              <div>
                <Label htmlFor="breed_image">Breed Image</Label>
                <Input
                  id="breed_image"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setBreedForm(prev => ({ 
                    ...prev, 
                    image: e.target.files?.[0] || null 
                  }))}
                />
                {breedForm.image && (
                  <div className="mt-2">
                    <Label className="text-sm text-gray-600">Selected Image:</Label>
                    <div className="mt-1">
                      <img
                        src={URL.createObjectURL(breedForm.image)}
                        alt="Preview"
                        className="w-20 h-20 object-cover rounded-md"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2">
               <Button type="button" variant="outline" onClick={() => setIsAddBreedOpen(false)}>
                 Cancel
               </Button>
               <Button type="submit" disabled={breedMutation.isPending}>
                 {breedMutation.isPending ? 'Adding...' : 'Add Breed'}
               </Button>
             </div>
           </form>
         </DialogContent>
       </Dialog>

       {/* Edit Pet Breed Dialog */}
       <Dialog open={isEditBreedOpen} onOpenChange={setIsEditBreedOpen}>
         <DialogContent className="max-w-2xl">
           <DialogHeader>
             <DialogTitle>Edit Pet Breed</DialogTitle>
           </DialogHeader>
           <form onSubmit={handleEditBreed} className="space-y-4">
             <div>
               <Label htmlFor="edit_breed_name">Breed Name *</Label>
               <Input
                 id="edit_breed_name"
                 value={breedForm.breed_name}
                 onChange={(e) => setBreedForm(prev => ({ ...prev, breed_name: e.target.value }))}
                 placeholder="e.g., Golden Retriever"
                 required
               />
             </div>

             <div>
               <Label htmlFor="edit_pet_type">Pet Type *</Label>
               <Select
                 value={breedForm.pet_type}
                 onValueChange={(value: 'dog' | 'cat') => setBreedForm(prev => ({ ...prev, pet_type: value }))}
               >
                 <SelectTrigger>
                   <SelectValue />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="dog">Dog</SelectItem>
                   <SelectItem value="cat">Cat</SelectItem>
                 </SelectContent>
               </Select>
             </div>

             <div>
               <Label htmlFor="edit_description">Description</Label>
               <Textarea
                 id="edit_description"
                 value={breedForm.description}
                 onChange={(e) => setBreedForm(prev => ({ ...prev, description: e.target.value }))}
                 placeholder="Breed description..."
               />
             </div>

             <div>
               <Label htmlFor="edit_breed_image">Breed Image</Label>
               <Input
                 id="edit_breed_image"
                 type="file"
                 accept="image/*"
                 onChange={(e) => setBreedForm(prev => ({ 
                   ...prev, 
                   image: e.target.files?.[0] || null 
                 }))}
               />
               {breedForm.image && (
                 <div className="mt-2">
                   <Label className="text-sm text-gray-600">New Image Preview:</Label>
                   <div className="mt-1">
                     <img
                       src={URL.createObjectURL(breedForm.image)}
                       alt="Preview"
                       className="w-20 h-20 object-cover rounded-md"
                     />
                   </div>
                 </div>
               )}
               {selectedBreed?.image_url && !breedForm.image && (
                 <div className="mt-2">
                   <Label className="text-sm text-gray-600">Current Image:</Label>
                   <div className="mt-1">
                     <img
                       src={selectedBreed.image_url}
                       alt="Current"
                       className="w-20 h-20 object-cover rounded-md"
                     />
                   </div>
                 </div>
               )}
             </div>

             <div className="flex justify-end gap-2">
               <Button type="button" variant="outline" onClick={() => setIsEditBreedOpen(false)}>
                 Cancel
               </Button>
               <Button type="submit" disabled={updateBreedMutation.isPending}>
                 {updateBreedMutation.isPending ? 'Updating...' : 'Update Breed'}
               </Button>
             </div>
           </form>
         </DialogContent>
       </Dialog>

             {/* Add Size Type Dialog */}
       <Dialog open={isAddSizeTypeOpen} onOpenChange={setIsAddSizeTypeOpen}>
         <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
           <DialogHeader>
             <DialogTitle>Add Size Type with Sizes</DialogTitle>
           </DialogHeader>
           <form onSubmit={handleAddSizeType} className="space-y-6">
             {/* Basic Size Type Info */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                 <Label htmlFor="size_type_name">Size Type Name *</Label>
                 <Input
                   id="size_type_name"
                   value={sizeTypeForm.size_type_name}
                   onChange={(e) => setSizeTypeForm(prev => ({ ...prev, size_type_name: e.target.value }))}
                   placeholder="e.g., Small Dog Sizes"
                   required
                 />
               </div>

               <div>
                 <Label htmlFor="size_pet_type">Pet Type *</Label>
                 <Select
                   value={sizeTypeForm.pet_type}
                   onValueChange={(value: 'dog' | 'cat') => setSizeTypeForm(prev => ({ ...prev, pet_type: value }))}
                 >
                   <SelectTrigger>
                     <SelectValue />
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="dog">Dog</SelectItem>
                     <SelectItem value="cat">Cat</SelectItem>
                   </SelectContent>
                 </Select>
               </div>
             </div>

                           <div>
                <Label htmlFor="ideal_for_breed">Ideal For Breeds (Optional)</Label>
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2 min-h-[40px] p-2 border rounded-md bg-white">
                    {sizeTypeForm.ideal_for_breed_ids.map((breedId) => {
                      const breed = breeds?.find(b => b.id === breedId);
                      return breed ? (
                        <Badge key={breedId} variant="secondary" className="flex items-center gap-1">
                          {breed.breed_name}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-4 w-4 p-0 hover:bg-transparent"
                            onClick={() => setSizeTypeForm(prev => ({
                              ...prev,
                              ideal_for_breed_ids: prev.ideal_for_breed_ids.filter(id => id !== breedId)
                            }))}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </Badge>
                      ) : null;
                    })}
                    {sizeTypeForm.ideal_for_breed_ids.length === 0 && (
                      <span className="text-gray-500 text-sm">No breeds selected</span>
                    )}
                  </div>
                  <Select
                    onValueChange={(value) => {
                      if (!sizeTypeForm.ideal_for_breed_ids.includes(value)) {
                        setSizeTypeForm(prev => ({
                          ...prev,
                          ideal_for_breed_ids: [...prev.ideal_for_breed_ids, value]
                        }));
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Add a breed..." />
                    </SelectTrigger>
                    <SelectContent>
                      {breeds?.filter(breed => 
                        breed.pet_type === sizeTypeForm.pet_type && 
                        !sizeTypeForm.ideal_for_breed_ids.includes(breed.id)
                      ).map(breed => (
                        <SelectItem key={breed.id} value={breed.id}>
                          {breed.breed_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

             <div>
               <Label htmlFor="size_description">Description</Label>
               <Textarea
                 id="size_description"
                 value={sizeTypeForm.description}
                 onChange={(e) => setSizeTypeForm(prev => ({ ...prev, description: e.target.value }))}
                 placeholder="Size type description..."
               />
             </div>

                           {/* Size Charts Section */}
              <div className="space-y-4">
                <Label className="text-lg font-semibold">Size Charts</Label>
                
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Size Name *</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Neck (cm)</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Chest (cm)</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Length (cm)</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Front Leg (cm)</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Back Leg (cm)</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 w-12"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {sizeTypeForm.sizes.map((size, index) => (
                        <tr key={index} className="border-t border-gray-200 hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <Input
                              value={size.size}
                              onChange={(e) => updateSizeField(index, 'size', e.target.value)}
                              placeholder="e.g., XS, S, M, L, XL"
                              className="w-full"
                              required
                            />
                          </td>
                          <td className="px-4 py-3">
                            <Input
                              type="number"
                              step="0.1"
                              value={size.neck}
                              onChange={(e) => updateSizeField(index, 'neck', e.target.value)}
                              placeholder="e.g., 25.5"
                              className="w-full"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <Input
                              type="number"
                              step="0.1"
                              value={size.chest}
                              onChange={(e) => updateSizeField(index, 'chest', e.target.value)}
                              placeholder="e.g., 45.0"
                              className="w-full"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <Input
                              type="number"
                              step="0.1"
                              value={size.length}
                              onChange={(e) => updateSizeField(index, 'length', e.target.value)}
                              placeholder="e.g., 35.0"
                              className="w-full"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <Input
                              type="number"
                              step="0.1"
                              value={size.front_leg_length}
                              onChange={(e) => updateSizeField(index, 'front_leg_length', e.target.value)}
                              placeholder="e.g., 20.0"
                              className="w-full"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <Input
                              type="number"
                              step="0.1"
                              value={size.back_leg_length}
                              onChange={(e) => updateSizeField(index, 'back_leg_length', e.target.value)}
                              placeholder="e.g., 22.0"
                              className="w-full"
                            />
                          </td>
                          <td className="px-4 py-3">
                            {sizeTypeForm.sizes.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeSizeField(index)}
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  {/* Add Row Button */}
                  <div className="p-4 border-t border-gray-200 bg-gray-50">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addSizeField}
                      className="flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Add Size Row
                    </Button>
                  </div>
                </div>
              </div>

             <div className="flex justify-end gap-2 pt-4 border-t">
               <Button type="button" variant="outline" onClick={() => setIsAddSizeTypeOpen(false)}>
                 Cancel
               </Button>
               <Button type="submit" disabled={sizeTypeMutation.isPending}>
                 {sizeTypeMutation.isPending ? 'Creating...' : 'Create Size Type & Sizes'}
               </Button>
             </div>
           </form>
         </DialogContent>
       </Dialog>

      {/* Add Size Chart Dialog */}
      <Dialog open={isAddSizeChartOpen} onOpenChange={setIsAddSizeChartOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Size Chart to {selectedSizeType?.size_type_name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddSizeChart} className="space-y-4">
            <div>
              <Label htmlFor="size">Size Name *</Label>
              <Input
                id="size"
                value={sizeChartForm.size}
                onChange={(e) => setSizeChartForm(prev => ({ ...prev, size: e.target.value }))}
                placeholder="e.g., XS, S, M, L, XL"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="neck">Neck (cm)</Label>
                <Input
                  id="neck"
                  type="number"
                  step="0.1"
                  value={sizeChartForm.neck}
                  onChange={(e) => setSizeChartForm(prev => ({ ...prev, neck: e.target.value }))}
                  placeholder="e.g., 25.5"
                />
              </div>
              <div>
                <Label htmlFor="chest">Chest (cm)</Label>
                <Input
                  id="chest"
                  type="number"
                  step="0.1"
                  value={sizeChartForm.chest}
                  onChange={(e) => setSizeChartForm(prev => ({ ...prev, chest: e.target.value }))}
                  placeholder="e.g., 45.0"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="length">Length (cm)</Label>
                <Input
                  id="length"
                  type="number"
                  step="0.1"
                  value={sizeChartForm.length}
                  onChange={(e) => setSizeChartForm(prev => ({ ...prev, length: e.target.value }))}
                  placeholder="e.g., 35.0"
                />
              </div>
              <div>
                <Label htmlFor="front_leg_length">Front Leg (cm)</Label>
                <Input
                  id="front_leg_length"
                  type="number"
                  step="0.1"
                  value={sizeChartForm.front_leg_length}
                  onChange={(e) => setSizeChartForm(prev => ({ ...prev, front_leg_length: e.target.value }))}
                  placeholder="e.g., 20.0"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="back_leg_length">Back Leg (cm)</Label>
              <Input
                id="back_leg_length"
                type="number"
                step="0.1"
                value={sizeChartForm.back_leg_length}
                onChange={(e) => setSizeChartForm(prev => ({ ...prev, back_leg_length: e.target.value }))}
                placeholder="e.g., 22.0"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsAddSizeChartOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={sizeChartMutation.isPending}>
                {sizeChartMutation.isPending ? 'Adding...' : 'Add Size'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Size Type Dialog */}
      <Dialog open={isViewSizeTypeOpen} onOpenChange={setIsViewSizeTypeOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Size Type Details: {selectedSizeType?.size_type_name}</DialogTitle>
          </DialogHeader>
          
          {selectedSizeType && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Size Type Name</Label>
                  <p className="text-sm">{selectedSizeType.size_type_name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Pet Type</Label>
                  <p className="text-sm">{selectedSizeType.pet_type.toUpperCase()}</p>
                </div>
                <div className="col-span-2">
                  <Label className="text-sm font-medium">Description</Label>
                  <p className="text-sm">{selectedSizeType.description || 'No description available'}</p>
                </div>
              </div>

              {/* Ideal For Breeds */}
              {selectedSizeType.ideal_for_breed_ids && selectedSizeType.ideal_for_breed_ids.length > 0 && (
                <div>
                  <Label className="text-sm font-medium">Ideal For Breeds</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-2">
                    {selectedSizeType.ideal_for_breed_ids.map((breedId) => {
                      const breed = breeds?.find(b => b.id === breedId);
                      return breed ? (
                        <div key={breedId} className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
                          <div className="w-12 h-12 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                            {breed.image_url ? (
                              <img
                                src={breed.image_url}
                                alt={breed.breed_name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400">
                                {breed.pet_type === 'dog' ? '🐕' : '🐱'}
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{breed.breed_name}</p>
                            <p className="text-xs text-gray-600">{breed.pet_type.toUpperCase()}</p>
                          </div>
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
              )}

              {/* Size Charts Table */}
              {selectedSizeType.size_charts.length > 0 && (
                <div>
                  <Label className="text-sm font-medium">Size Charts</Label>
                  <div className="mt-2 border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Size</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Neck (cm)</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Chest (cm)</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Length (cm)</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Front Leg (cm)</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Back Leg (cm)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedSizeType.size_charts.map((chart) => (
                          <tr key={chart.id} className="border-t border-gray-200 hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-medium">{chart.size}</td>
                            <td className="px-4 py-3 text-sm">{chart.neck || '-'}</td>
                            <td className="px-4 py-3 text-sm">{chart.chest || '-'}</td>
                            <td className="px-4 py-3 text-sm">{chart.length || '-'}</td>
                            <td className="px-4 py-3 text-sm">{chart.front_leg_length || '-'}</td>
                            <td className="px-4 py-3 text-sm">{chart.back_leg_length || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setIsViewSizeTypeOpen(false)}>
                  Close
                </Button>
                <Button onClick={() => {
                  setIsViewSizeTypeOpen(false);
                  handleEditSizeType(selectedSizeType);
                }}>
                  Edit Size Type
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Size Type Dialog */}
      <Dialog open={isEditSizeTypeOpen} onOpenChange={setIsEditSizeTypeOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Size Type</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateSizeType} className="space-y-6">
            {/* Basic Size Type Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit_size_type_name">Size Type Name *</Label>
                <Input
                  id="edit_size_type_name"
                  value={editSizeTypeForm.size_type_name}
                  onChange={(e) => setEditSizeTypeForm(prev => ({ ...prev, size_type_name: e.target.value }))}
                  placeholder="e.g., Small Dog Sizes"
                  required
                />
              </div>

              <div>
                <Label htmlFor="edit_size_pet_type">Pet Type *</Label>
                <Select
                  value={editSizeTypeForm.pet_type}
                  onValueChange={(value: 'dog' | 'cat') => setEditSizeTypeForm(prev => ({ ...prev, pet_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dog">Dog</SelectItem>
                    <SelectItem value="cat">Cat</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="edit_ideal_for_breed">Ideal For Breeds (Optional)</Label>
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2 min-h-[40px] p-2 border rounded-md bg-white">
                  {editSizeTypeForm.ideal_for_breed_ids.map((breedId) => {
                    const breed = breeds?.find(b => b.id === breedId);
                    return breed ? (
                      <Badge key={breedId} variant="secondary" className="flex items-center gap-1">
                        {breed.breed_name}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 hover:bg-transparent"
                          onClick={() => setEditSizeTypeForm(prev => ({
                            ...prev,
                            ideal_for_breed_ids: prev.ideal_for_breed_ids.filter(id => id !== breedId)
                          }))}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </Badge>
                    ) : null;
                  })}
                  {editSizeTypeForm.ideal_for_breed_ids.length === 0 && (
                    <span className="text-gray-500 text-sm">No breeds selected</span>
                  )}
                </div>
                <Select
                  onValueChange={(value) => {
                    if (!editSizeTypeForm.ideal_for_breed_ids.includes(value)) {
                      setEditSizeTypeForm(prev => ({
                        ...prev,
                        ideal_for_breed_ids: [...prev.ideal_for_breed_ids, value]
                      }));
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Add a breed..." />
                  </SelectTrigger>
                  <SelectContent>
                    {breeds?.filter(breed => 
                      breed.pet_type === editSizeTypeForm.pet_type && 
                      !editSizeTypeForm.ideal_for_breed_ids.includes(breed.id)
                    ).map(breed => (
                      <SelectItem key={breed.id} value={breed.id}>
                        {breed.breed_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="edit_size_description">Description</Label>
              <Textarea
                id="edit_size_description"
                value={editSizeTypeForm.description}
                onChange={(e) => setEditSizeTypeForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Size type description..."
              />
            </div>

            {/* Size Charts Section */}
            <div className="space-y-4">
              <Label className="text-lg font-semibold">Size Charts</Label>
              
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Size Name *</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Neck (cm)</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Chest (cm)</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Length (cm)</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Front Leg (cm)</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Back Leg (cm)</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 w-12"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {editSizeTypeForm.sizes.map((size, index) => (
                      <tr key={index} className="border-t border-gray-200 hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <Input
                            value={size.size}
                            onChange={(e) => updateEditSizeField(index, 'size', e.target.value)}
                            placeholder="e.g., XS, S, M, L, XL"
                            className="w-full"
                            required
                          />
                        </td>
                        <td className="px-4 py-3">
                          <Input
                            type="number"
                            step="0.1"
                            value={size.neck}
                            onChange={(e) => updateEditSizeField(index, 'neck', e.target.value)}
                            placeholder="e.g., 25.5"
                            className="w-full"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <Input
                            type="number"
                            step="0.1"
                            value={size.chest}
                            onChange={(e) => updateEditSizeField(index, 'chest', e.target.value)}
                            placeholder="e.g., 45.0"
                            className="w-full"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <Input
                            type="number"
                            step="0.1"
                            value={size.length}
                            onChange={(e) => updateEditSizeField(index, 'length', e.target.value)}
                            placeholder="e.g., 35.0"
                            className="w-full"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <Input
                            type="number"
                            step="0.1"
                            value={size.front_leg_length}
                            onChange={(e) => updateEditSizeField(index, 'front_leg_length', e.target.value)}
                            placeholder="e.g., 20.0"
                            className="w-full"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <Input
                            type="number"
                            step="0.1"
                            value={size.back_leg_length}
                            onChange={(e) => updateEditSizeField(index, 'back_leg_length', e.target.value)}
                            placeholder="e.g., 22.0"
                            className="w-full"
                          />
                        </td>
                        <td className="px-4 py-3">
                          {editSizeTypeForm.sizes.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeEditSizeField(index)}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {/* Add Row Button */}
                <div className="p-4 border-t border-gray-200 bg-gray-50">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addEditSizeField}
                    className="flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Size Row
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setIsEditSizeTypeOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateSizeTypeMutation.isPending}>
                {updateSizeTypeMutation.isPending ? 'Updating...' : 'Update Size Type'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Size Type Confirmation Dialog */}
      <Dialog open={isDeleteSizeTypeOpen} onOpenChange={setIsDeleteSizeTypeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Size Type</DialogTitle>
          </DialogHeader>
          
          {selectedSizeType && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Are you sure you want to delete the size type "{selectedSizeType.size_type_name}"? 
                This will also delete all associated size charts. This action cannot be undone.
              </p>
              
              <div className="p-4 bg-red-50 rounded-lg">
                <h4 className="font-medium text-red-800 mb-2">Size Type Details:</h4>
                <p className="text-sm text-red-700">
                  <strong>Name:</strong> {selectedSizeType.size_type_name}
                </p>
                <p className="text-sm text-red-700">
                  <strong>Pet Type:</strong> {selectedSizeType.pet_type.toUpperCase()}
                </p>
                <p className="text-sm text-red-700">
                  <strong>Size Charts:</strong> {selectedSizeType.size_charts.length}
                </p>
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsDeleteSizeTypeOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={handleConfirmDeleteSizeType}
                  disabled={deleteSizeTypeMutation.isPending}
                >
                  {deleteSizeTypeMutation.isPending ? 'Deleting...' : 'Delete Size Type'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
     </div>
   );
 };

export default SizeMaster;
