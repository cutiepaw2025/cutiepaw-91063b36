import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Image as ImageIcon, 
  Upload, 
  Link as LinkIcon,
  X,
  Shirt,
  PawPrint,
  Tag
} from "lucide-react";
import supabase from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

interface Subcategory {
  id: string;
  name: string;
  image_url?: string;
  category_id: string;
  created_at: string;
}

interface ProductCategory {
  id: string;
  name: string;
  description?: string;
  image_url?: string;
  created_at: string;
  subcategories?: Subcategory[];
}

export default function ProductCategoryMaster() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ProductCategory | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    subcategories: [] as { name: string; image_url: string; id?: string }[]
  });
  const [uploading, setUploading] = useState(false);

  // Fetch categories with subcategories
  const { data: categories, isLoading } = useQuery({
    queryKey: ['product-categories'],
    queryFn: async () => {
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('product_categories')
        .select('*')
        .order('created_at', { ascending: false });

      if (categoriesError) throw categoriesError;

      // Fetch subcategories for each category
      const categoriesWithSubcategories = await Promise.all(
        categoriesData.map(async (category) => {
          const { data: subcategoriesData, error: subcategoriesError } = await supabase
            .from('product_subcategories')
            .select('*')
            .eq('category_id', category.id)
            .order('created_at', { ascending: true });

          if (subcategoriesError) throw subcategoriesError;

          return {
            ...category,
            subcategories: subcategoriesData || []
          };
        })
      );

      return categoriesWithSubcategories;
    }
  });

  // Create/Update category mutation
  const categoryMutation = useMutation({
    mutationFn: async (data: Partial<ProductCategory>) => {
      if (editingCategory) {
        const { error } = await supabase
          .from('product_categories')
          .update(data)
          .eq('id', editingCategory.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('product_categories')
          .insert([data]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-categories'] });
      toast.success(editingCategory ? "Category updated successfully!" : "Category created successfully!");
      resetForm();
      setIsDialogOpen(false);
    },
    onError: (error) => {
      toast.error("Failed to save category");
      console.error('Category mutation error:', error);
    }
  });

  // Create/Update subcategories mutation
  const subcategoryMutation = useMutation({
    mutationFn: async (subcategories: { name: string; image_url: string; category_id: string; id?: string }[]) => {
      const toCreate = subcategories.filter(sub => !sub.id);
      const toUpdate = subcategories.filter(sub => sub.id);
      
      // Create new subcategories
      if (toCreate.length > 0) {
        const { error: createError } = await supabase
          .from('product_subcategories')
          .insert(toCreate.map(({ id, ...sub }) => sub));
        if (createError) throw createError;
      }
      
      // Update existing subcategories
      for (const sub of toUpdate) {
        const { error: updateError } = await supabase
          .from('product_subcategories')
          .update({ name: sub.name, image_url: sub.image_url })
          .eq('id', sub.id);
        if (updateError) throw updateError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-categories'] });
      toast.success("Subcategories saved successfully!");
    },
    onError: (error) => {
      toast.error("Failed to save subcategories");
      console.error('Subcategory mutation error:', error);
    }
  });

  // Delete category mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: async (categoryId: string) => {
      // First delete subcategories
      const { error: subcategoriesError } = await supabase
        .from('product_subcategories')
        .delete()
        .eq('category_id', categoryId);
      if (subcategoriesError) throw subcategoriesError;

      // Then delete category
      const { error } = await supabase
        .from('product_categories')
        .delete()
        .eq('id', categoryId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-categories'] });
      toast.success("Category deleted successfully!");
    },
    onError: (error) => {
      toast.error("Failed to delete category");
      console.error('Delete error:', error);
    }
  });

  // File upload function
  const uploadFile = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `subcategory_${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    console.log('🔄 Starting upload for:', fileName);

    try {
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('product_categories')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('❌ Upload error:', uploadError);
        throw uploadError;
      }

      console.log('✅ Upload successful:', uploadData);

      const { data: { publicUrl } } = supabase.storage
        .from('product_categories')
        .getPublicUrl(filePath);

      console.log('🔗 Public URL:', publicUrl);
      return publicUrl;
    } catch (error) {
      console.error('❌ Upload failed:', error);
      throw error;
    }
  };

  // Handle form input changes
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Handle subcategory changes
  const handleSubcategoryChange = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      subcategories: prev.subcategories.map((sub, i) => 
        i === index ? { ...sub, [field]: value } : sub
      )
    }));
  };

  // Add subcategory
  const addSubcategory = () => {
    setFormData(prev => ({
      ...prev,
      subcategories: [...prev.subcategories, { name: "", image_url: "" }]
    }));
  };

  // Remove subcategory
  const removeSubcategory = (index: number) => {
    setFormData(prev => ({
      ...prev,
      subcategories: prev.subcategories.filter((_, i) => i !== index)
    }));
  };

  // Handle image upload for subcategory
  const handleSubcategoryImageUpload = async (file: File, index: number) => {
    setUploading(true);
    try {
      // Test bucket access first
      console.log('🔍 Testing bucket access...');
      const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
      console.log('📦 Available buckets:', buckets);
      
      if (bucketError) {
        console.error('❌ Bucket list error:', bucketError);
        toast.error("Storage access error. Please check your connection.");
        return;
      }

      const publicUrl = await uploadFile(file);
      handleSubcategoryChange(index, 'image_url', publicUrl);
      toast.success("Image uploaded successfully!");
    } catch (error) {
      toast.error("Failed to upload image");
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error("Category name is required");
      return;
    }

    try {
      // Create/update category
      await categoryMutation.mutateAsync({
        name: formData.name,
        description: formData.description
      });

      // Handle subcategories
      if (formData.subcategories.length > 0) {
        const categoryId = editingCategory ? editingCategory.id : 
          (await supabase
            .from('product_categories')
            .select('id')
            .eq('name', formData.name)
            .single()).data?.id;

        if (categoryId) {
          const subcategoriesToSave = formData.subcategories
            .filter(sub => sub.name.trim())
            .map(sub => ({
              ...sub,
              category_id: categoryId
            }));

          if (subcategoriesToSave.length > 0) {
            await subcategoryMutation.mutateAsync(subcategoriesToSave);
          }
        }
      }
    } catch (error) {
      console.error('Submit error:', error);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      subcategories: []
    });
    setEditingCategory(null);
  };

  // Edit category
  const handleEdit = (category: ProductCategory) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || "",
      subcategories: category.subcategories?.map(sub => ({
        id: sub.id,
        name: sub.name,
        image_url: sub.image_url || ""
      })) || []
    });
    setIsDialogOpen(true);
  };

  // Delete category
  const handleDelete = (categoryId: string) => {
    if (confirm("Are you sure you want to delete this category? This will also delete all its subcategories.")) {
      deleteCategoryMutation.mutate(categoryId);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full mb-4" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Product Category Master
          </h1>
          <p className="text-lg text-muted-foreground">
            Manage product categories and subcategories
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? "Edit Product Category" : "Add Product Category"}
              </DialogTitle>
              <DialogDescription>
                {editingCategory 
                  ? "Update the product category details." 
                  : "Create a new product category. You can add sub-categories later."
                }
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Category Name */}
              <div>
                <Label htmlFor="name">Category Name</Label>
                <Input
                  id="name"
                  placeholder="Enter category name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                />
              </div>

                             {/* Category Description */}
               <div>
                 <Label htmlFor="description">Description (Optional)</Label>
                 <Textarea
                   id="description"
                   placeholder="Enter category description"
                   value={formData.description}
                   onChange={(e) => handleInputChange('description', e.target.value)}
                 />
               </div>

                             {/* Subcategories Section */}
               {(
                <>
                  <Separator />
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <Label className="text-base font-medium">Subcategories</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addSubcategory}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Subcategory
                      </Button>
                    </div>
                    
                    <div className="space-y-4">
                      {formData.subcategories.map((subcategory, index) => (
                        <Card key={index}>
                          <CardContent className="pt-6">
                            <div className="flex items-start gap-4">
                              <div className="flex-1 space-y-4">
                                <div>
                                  <Label>Subcategory Name</Label>
                                  <Input
                                    placeholder="Enter subcategory name"
                                    value={subcategory.name}
                                    onChange={(e) => handleSubcategoryChange(index, 'name', e.target.value)}
                                  />
                                </div>
                                
                                <div>
                                  <Label>Image (Optional)</Label>
                                  <div className="flex gap-2 mb-2">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        const input = document.createElement('input');
                                        input.type = 'file';
                                        input.accept = 'image/*';
                                        input.onchange = (e) => {
                                          const file = (e.target as HTMLInputElement).files?.[0];
                                          if (file) {
                                            handleSubcategoryImageUpload(file, index);
                                          }
                                        };
                                        input.click();
                                      }}
                                      disabled={uploading}
                                    >
                                      <Upload className="h-4 w-4 mr-2" />
                                      Upload Image
                                    </Button>
                                  </div>
                                  
                                  {subcategory.image_url && (
                                    <div className="relative w-24 h-24 border rounded-lg overflow-hidden">
                                      <img
                                        src={subcategory.image_url}
                                        alt={subcategory.name}
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeSubcategory(index)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
            
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={categoryMutation.isPending || subcategoryMutation.isPending}
              >
                {editingCategory ? "Update Category" : "Create Category"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories?.map((category) => (
          <Card key={category.id} className="overflow-hidden">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                                     <CardTitle className="flex items-center gap-2">
                    {category.name.toLowerCase().includes('accessor') ? (
                      <PawPrint className="h-5 w-5 text-primary" />
                    ) : (
                      <Shirt className="h-5 w-5 text-primary" />
                    )}
                    {category.name}
                  </CardTitle>
                  {category.description && (
                    <CardDescription className="mt-2">
                      {category.description}
                    </CardDescription>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(category)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(category.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            
                         <CardContent>
               {/* Subcategories */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Subcategories ({category.subcategories?.length || 0})</Label>
                                 <div className="grid grid-cols-2 gap-2">
                   {category.subcategories?.map((subcategory) => (
                     <div key={subcategory.id} className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                       {subcategory.image_url && (
                         <div className="relative w-12 h-12 border rounded overflow-hidden flex-shrink-0">
                           <img
                             src={subcategory.image_url}
                             alt={subcategory.name}
                             className="w-full h-full object-cover"
                           />
                         </div>
                       )}
                       <span className="text-sm flex-1 truncate">{subcategory.name}</span>
                     </div>
                   ))}
                  {(!category.subcategories || category.subcategories.length === 0) && (
                    <p className="text-sm text-muted-foreground">No subcategories</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {(!categories || categories.length === 0) && (
          <div className="col-span-full text-center py-12">
            <Tag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">No categories yet</h3>
            <p className="text-muted-foreground">Create your first product category to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}
