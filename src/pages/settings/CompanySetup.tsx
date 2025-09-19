import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useCompanySettings } from "@/hooks/use-company-settings";
import { setupStorageBucket } from "@/utils/setup-storage";
import { manualSetupStorage, setupInstructions } from "@/utils/manual-setup";
import { debugDatabase, checkStorageBucket, testDirectBucketAccess, testDatabaseSave } from "@/utils/debug-database";
import { 
  Building2, 
  Phone, 
  Banknote, 
  Image, 
  Upload, 
  Save,
  FileText,
  Loader2,
  Database
} from "lucide-react";
import supabase from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface CompanySettings {
  id: string;
  company_name: string;
  company_address: string | null;
  company_city: string | null;
  company_state: string | null;
  company_pincode: string | null;
  company_gstin: string | null;
  company_phone: string | null;
  company_email: string | null;
  bank_name: string | null;
  account_number: string | null;
  ifsc_code: string | null;
  branch: string | null;
  company_logo_url: string | null;
  auth_logo_url: string | null;
  sidebar_logo_url: string | null;
  header_logo_url: string | null;
  favicon_url: string | null;
  logo_size_auth: number;
  logo_size_header: number;
  logo_size_sidebar: number;
  logo_size_favicon: number;
  created_at: string | null;
  updated_at: string | null;
}

const defaultSettings: Omit<CompanySettings, 'id' | 'created_at' | 'updated_at'> = {
  company_name: "",
  company_address: null,
  company_city: null,
  company_state: null,
  company_pincode: null,
  company_gstin: null,
  company_phone: null,
  company_email: null,
  bank_name: null,
  account_number: null,
  ifsc_code: null,
  branch: null,
  company_logo_url: null,
  auth_logo_url: null,
  sidebar_logo_url: null,
  header_logo_url: null,
  favicon_url: null,
  logo_size_auth: 48,
  logo_size_header: 24,
  logo_size_sidebar: 28,
  logo_size_favicon: 32, // Standard favicon size
};

export default function CompanySetup() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState(defaultSettings);
  const [uploading, setUploading] = useState<string | null>(null);

  // Fetch company settings
  const { data: settings, isLoading } = useCompanySettings();

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: Partial<CompanySettings>) => {
      const { error } = await supabase
        .from('company_settings')
        .update(data)
        .eq('id', settings?.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-settings'] });
      toast.success("Company settings updated successfully!");
    },
    onError: (error) => {
      toast.error("Failed to update company settings");
      console.error('Update error:', error);
    },
  });

  // File upload function
  const uploadFile = async (file: File, type: string): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${type}_${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    console.log('📤 Starting file upload:', { type, fileName, filePath });

    // Upload the file directly (bucket listing is not working, but direct access works)
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('branding_assets')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error details:', uploadError);
      throw uploadError;
    }

    console.log('✅ File uploaded successfully:', uploadData);

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('branding_assets')
      .getPublicUrl(filePath);

    console.log('🔗 Public URL generated:', publicUrl);
    return publicUrl;
  };

  // Handle file upload
  const handleFileUpload = async (file: File, type: string) => {
    if (!file) return;

    setUploading(type);
    try {
      const publicUrl = await uploadFile(file, type);
      
      const updateData = {
        [`${type}_url`]: publicUrl
      };

      await updateMutation.mutateAsync(updateData);
      setFormData(prev => ({ ...prev, [`${type}_url`]: publicUrl }));
      
      toast.success(`${type.replace('_', ' ')} uploaded successfully!`);
    } catch (error) {
      toast.error(`Failed to upload ${type.replace('_', ' ')}`);
      console.error('Upload error:', error);
    } finally {
      setUploading(null);
    }
  };

  // Update form data when settings load
  useEffect(() => {
    if (settings) {
      console.log('🔄 Updating form data from settings:', settings);
      setFormData(settings);
    }
  }, [settings]);

  // Handle form input changes
  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Handle slider changes
  const handleSliderChange = (field: string, value: number[]) => {
    setFormData(prev => ({ ...prev, [field]: value[0] }));
  };

  // Save all changes
  const handleSave = async () => {
    try {
      console.log('🔍 Saving form data:', formData);
      console.log('🔍 Current settings ID:', settings?.id);
      
      // Filter out null/undefined values and ensure we have the settings ID
      const dataToSave = Object.fromEntries(
        Object.entries(formData).filter(([key, value]) => 
          key !== 'id' && key !== 'created_at' && key !== 'updated_at' && value !== undefined
        )
      );
      
      console.log('🔍 Data to save:', dataToSave);
      
      if (!settings?.id) {
        toast.error("No settings ID found. Please refresh the page.");
        return;
      }
      
      await updateMutation.mutateAsync(dataToSave);
    } catch (error) {
      console.error('❌ Save error:', error);
      toast.error("Failed to save company settings. Check console for details.");
    }
  };

  // Setup storage bucket
  const handleSetupStorage = async () => {
    try {
      const result = await setupStorageBucket();
      if (result.success) {
        toast.success(result.message || "Storage bucket setup completed!");
      } else {
        toast.error("Failed to setup storage bucket automatically");
        console.log('Manual setup instructions:', setupInstructions);
        toast.error("Please check console for manual setup instructions");
      }
    } catch (error) {
      toast.error("Error setting up storage bucket");
      console.error('Setup error:', error);
      console.log('Manual setup instructions:', setupInstructions);
    }
  };

  // Manual setup storage bucket
  const handleManualSetup = async () => {
    try {
      const result = await manualSetupStorage();
      if (result.success) {
        toast.success(result.message || "Manual storage setup completed!");
      } else {
        toast.error("Manual setup failed. Please follow console instructions.");
        console.log('Manual setup instructions:', setupInstructions);
      }
    } catch (error) {
      toast.error("Manual setup error");
      console.error('Manual setup error:', error);
      console.log('Manual setup instructions:', setupInstructions);
    }
  };

  // Debug database
  const handleDebugDatabase = async () => {
    try {
      const result = await debugDatabase();
      if (result.success) {
        toast.success("Database debug completed! Check console for details.");
      } else {
        toast.error("Database debug failed. Check console for details.");
      }
    } catch (error) {
      toast.error("Debug error");
      console.error('Debug error:', error);
    }
  };

  // Debug storage
  const handleDebugStorage = async () => {
    try {
      const result = await checkStorageBucket();
      if (result.success) {
        toast.success("Storage debug completed! Check console for details.");
      } else {
        toast.error("Storage debug failed. Check console for details.");
      }
    } catch (error) {
      toast.error("Storage debug error");
      console.error('Storage debug error:', error);
    }
  };

  // Test direct bucket access
  const handleTestDirectAccess = async () => {
    try {
      const result = await testDirectBucketAccess();
      if (result.success) {
        toast.success("Direct bucket access test successful! Check console for details.");
      } else {
        toast.error("Direct bucket access test failed. Check console for details.");
      }
    } catch (error) {
      toast.error("Direct access test error");
      console.error('Direct access test error:', error);
    }
  };

  // Test database save
  const handleTestDatabaseSave = async () => {
    try {
      const result = await testDatabaseSave();
      if (result.success) {
        toast.success("Database save test successful! Check console for details.");
      } else {
        toast.error("Database save test failed. Check console for details.");
      }
    } catch (error) {
      toast.error("Database save test error");
      console.error('Database save test error:', error);
    }
  };

  // Debug current state
  const handleDebugCurrentState = async () => {
    console.log('🔍 Current State Debug:');
    console.log('📋 Form Data:', formData);
    console.log('📋 Settings from DB:', settings);
    console.log('📋 Is Loading:', isLoading);
    
    // Check what's in the database
    const { data: dbData, error } = await supabase
      .from('company_settings')
      .select('*')
      .single();
    
    console.log('📋 Raw DB Data:', dbData);
    console.log('📋 DB Error:', error);
    
    toast.success("Debug info logged to console!");
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent className="space-y-4">
                {[1, 2, 3].map((j) => (
                  <div key={j}>
                    <Skeleton className="h-4 w-24 mb-2" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ))}
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
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Company Configuration
        </h1>
        <p className="text-lg text-muted-foreground">
          Manage your company information and branding assets.
        </p>
      </div>

      {/* Storage Setup Alert */}
      <Alert>
        <AlertDescription>
          <strong>Important:</strong> Before uploading files, make sure the storage bucket is set up. 
          Click "Setup Storage" or "Manual Setup" button below if you encounter upload errors.
        </AlertDescription>
      </Alert>

      {/* Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Company Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Company Information
            </CardTitle>
            <CardDescription>
              Basic company details and address information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="company_name">Company Name</Label>
              <Input
                id="company_name"
                placeholder="Enter company name"
                value={formData.company_name}
                onChange={(e) => handleInputChange('company_name', e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="company_address">Address</Label>
              <Textarea
                id="company_address"
                placeholder="Enter company address"
                value={formData.company_address || ''}
                onChange={(e) => handleInputChange('company_address', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="company_city">City</Label>
                <Input
                  id="company_city"
                  placeholder="City"
                  value={formData.company_city || ''}
                  onChange={(e) => handleInputChange('company_city', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="company_state">State</Label>
                <Input
                  id="company_state"
                  placeholder="State"
                  value={formData.company_state || ''}
                  onChange={(e) => handleInputChange('company_state', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="company_pincode">Pincode</Label>
                <Input
                  id="company_pincode"
                  placeholder="Pincode"
                  value={formData.company_pincode || ''}
                  onChange={(e) => handleInputChange('company_pincode', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="company_gstin">GSTIN</Label>
                <Input
                  id="company_gstin"
                  placeholder="GSTIN"
                  value={formData.company_gstin || ''}
                  onChange={(e) => handleInputChange('company_gstin', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Contact Information
            </CardTitle>
            <CardDescription>
              Company contact details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="company_phone">Phone Number</Label>
              <Input
                id="company_phone"
                placeholder="Enter phone number"
                value={formData.company_phone || ''}
                onChange={(e) => handleInputChange('company_phone', e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="company_email">Email</Label>
              <Input
                id="company_email"
                type="email"
                placeholder="Enter email address"
                value={formData.company_email || ''}
                onChange={(e) => handleInputChange('company_email', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Bank Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Banknote className="h-5 w-5" />
              Bank Details
            </CardTitle>
            <CardDescription>
              Company banking information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="bank_name">Bank Name</Label>
              <Input
                id="bank_name"
                placeholder="Enter bank name"
                value={formData.bank_name || ''}
                onChange={(e) => handleInputChange('bank_name', e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="account_number">Account Number</Label>
              <Input
                id="account_number"
                placeholder="Enter account number"
                value={formData.account_number || ''}
                onChange={(e) => handleInputChange('account_number', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="ifsc_code">IFSC Code</Label>
                <Input
                  id="ifsc_code"
                  placeholder="IFSC Code"
                  value={formData.ifsc_code || ''}
                  onChange={(e) => handleInputChange('ifsc_code', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="branch">Branch</Label>
                <Input
                  id="branch"
                  placeholder="Branch"
                  value={formData.branch || ''}
                  onChange={(e) => handleInputChange('branch', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Branding Assets */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Image className="h-5 w-5" />
              Branding Assets
            </CardTitle>
            <CardDescription>
              Upload and configure company logos and favicon
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Company Logo */}
            <div className="space-y-3">
              <Label>Company Logo</Label>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file, 'company_logo');
                    }}
                    disabled={uploading === 'company_logo'}
                  />
                </div>
                {uploading === 'company_logo' && <Loader2 className="h-4 w-4 animate-spin" />}
              </div>
              
              {/* Preview Section */}
              {formData.company_logo_url && (
                <div className="border rounded-lg p-4 bg-muted/20">
                  <Label className="text-sm font-medium mb-2 block">Preview (Auth Page)</Label>
                  <div className="flex items-center justify-center p-4 bg-background rounded border">
                    <img 
                      src={formData.company_logo_url} 
                      alt="Company Logo Preview" 
                      style={{ 
                        width: `${formData.logo_size_auth}px`, 
                        height: `${formData.logo_size_auth}px` 
                      }}
                      className="object-contain transition-all duration-200"
                    />
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <Label className="text-sm">Logo Size: {formData.logo_size_auth}px</Label>
                <Slider
                  value={[formData.logo_size_auth]}
                  onValueChange={(value) => handleSliderChange('logo_size_auth', value)}
                  max={100}
                  min={16}
                  step={1}
                  className="w-full"
                />
              </div>
            </div>

            <Separator />

            {/* Auth Logo */}
            <div className="space-y-3">
              <Label>Auth Page Logo</Label>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file, 'auth_logo');
                    }}
                    disabled={uploading === 'auth_logo'}
                  />
                </div>
                {uploading === 'auth_logo' && <Loader2 className="h-4 w-4 animate-spin" />}
              </div>
              
              {/* Preview Section */}
              {formData.auth_logo_url && (
                <div className="border rounded-lg p-4 bg-muted/20">
                  <Label className="text-sm font-medium mb-2 block">Preview (Auth Page)</Label>
                  <div className="flex items-center justify-center p-4 bg-background rounded border">
                    <img 
                      src={formData.auth_logo_url} 
                      alt="Auth Logo Preview" 
                      style={{ 
                        width: `${formData.logo_size_auth}px`, 
                        height: `${formData.logo_size_auth}px` 
                      }}
                      className="object-contain transition-all duration-200"
                    />
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <Label className="text-sm">Logo Size: {formData.logo_size_auth}px</Label>
                <Slider
                  value={[formData.logo_size_auth]}
                  onValueChange={(value) => handleSliderChange('logo_size_auth', value)}
                  max={100}
                  min={16}
                  step={1}
                  className="w-full"
                />
              </div>
            </div>

            <Separator />

            {/* Sidebar Logo */}
            <div className="space-y-3">
              <Label>Sidebar Logo</Label>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file, 'sidebar_logo');
                    }}
                    disabled={uploading === 'sidebar_logo'}
                  />
                </div>
                {uploading === 'sidebar_logo' && <Loader2 className="h-4 w-4 animate-spin" />}
              </div>
              
              {/* Preview Section */}
              {formData.sidebar_logo_url && (
                <div className="border rounded-lg p-4 bg-muted/20">
                  <Label className="text-sm font-medium mb-2 block">Preview (Sidebar)</Label>
                  <div className="flex items-center gap-3 p-4 bg-background rounded border">
                    <img 
                      src={formData.sidebar_logo_url} 
                      alt="Sidebar Logo Preview" 
                      style={{ 
                        width: `${formData.logo_size_sidebar}px`, 
                        height: `${formData.logo_size_sidebar}px` 
                      }}
                      className="object-contain transition-all duration-200"
                    />
                    <span className="text-sm text-muted-foreground">
                      {formData.company_name || "Company Name"}
                    </span>
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <Label className="text-sm">Logo Size: {formData.logo_size_sidebar}px</Label>
                <Slider
                  value={[formData.logo_size_sidebar]}
                  onValueChange={(value) => handleSliderChange('logo_size_sidebar', value)}
                  max={100}
                  min={16}
                  step={1}
                  className="w-full"
                />
              </div>
            </div>

            <Separator />

            {/* Header Logo */}
            <div className="space-y-3">
              <Label>Header Logo</Label>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file, 'header_logo');
                    }}
                    disabled={uploading === 'header_logo'}
                  />
                </div>
                {uploading === 'header_logo' && <Loader2 className="h-4 w-4 animate-spin" />}
              </div>
              
              {/* Preview Section */}
              {formData.header_logo_url && (
                <div className="border rounded-lg p-4 bg-muted/20">
                  <Label className="text-sm font-medium mb-2 block">Preview (Header)</Label>
                  <div className="flex items-center gap-3 p-3 bg-background rounded border">
                    <img 
                      src={formData.header_logo_url} 
                      alt="Header Logo Preview" 
                      style={{ 
                        width: `${formData.logo_size_header}px`, 
                        height: `${formData.logo_size_header}px` 
                      }}
                      className="object-contain transition-all duration-200"
                    />
                    <div className="text-sm">
                      <div className="font-medium">Welcome back, User!</div>
                      <div className="text-muted-foreground">Today's date</div>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <Label className="text-sm">Logo Size: {formData.logo_size_header}px</Label>
                <Slider
                  value={[formData.logo_size_header]}
                  onValueChange={(value) => handleSliderChange('logo_size_header', value)}
                  max={100}
                  min={16}
                  step={1}
                  className="w-full"
                />
              </div>
            </div>

            <Separator />

            {/* Favicon */}
            <div className="space-y-3">
              <Label>Favicon</Label>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file, 'favicon');
                    }}
                    disabled={uploading === 'favicon'}
                  />
                </div>
                {uploading === 'favicon' && <Loader2 className="h-4 w-4 animate-spin" />}
              </div>
              
              {/* Preview Section */}
              {formData.favicon_url && (
                <div className="border rounded-lg p-4 bg-muted/20">
                  <Label className="text-sm font-medium mb-2 block">Preview (Browser Tab)</Label>
                  <div className="flex items-center gap-3 p-3 bg-background rounded border">
                    <div className="flex items-center gap-2 p-2 bg-muted rounded">
                      <img 
                        src={formData.favicon_url} 
                        alt="Favicon Preview" 
                        style={{ 
                          width: `${formData.logo_size_favicon}px`, 
                          height: `${formData.logo_size_favicon}px` 
                        }}
                        className="object-contain transition-all duration-200"
                      />
                      <span className="text-sm font-medium">
                        {formData.company_name || "Company"} - Dashboard
                      </span>
                    </div>
                  </div>
                </div>
              )}
              
                             <div className="space-y-2">
                 <Label className="text-sm">Favicon Size: {formData.logo_size_favicon}px</Label>
                 <Slider
                   value={[formData.logo_size_favicon]}
                   onValueChange={(value) => handleSliderChange('logo_size_favicon', value)}
                   max={64}
                   min={16}
                   step={16}
                   className="w-full"
                 />
                 <div className="text-xs text-muted-foreground">
                   Standard sizes: 16px, 32px, 48px, 64px
                 </div>
               </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Debug Section */}
      {process.env.NODE_ENV === 'development' && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-sm">Debug Info (Development Only)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs space-y-2">
              <div><strong>Current Form Data:</strong></div>
              <pre className="bg-muted p-2 rounded text-xs overflow-auto max-h-40">
                {JSON.stringify(formData, null, 2)}
              </pre>
              <div><strong>Database Settings:</strong></div>
              <pre className="bg-muted p-2 rounded text-xs overflow-auto max-h-40">
                {JSON.stringify(settings, null, 2)}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex justify-start gap-4">
        <Button 
          onClick={handleSave}
          disabled={updateMutation.isPending}
          className="flex items-center gap-2"
        >
          {updateMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save Configuration
        </Button>
        
        <Button 
          variant="outline"
          onClick={handleSetupStorage}
          className="flex items-center gap-2"
        >
          <Database className="h-4 w-4" />
          Setup Storage
        </Button>
        
        <Button 
          variant="outline"
          onClick={handleManualSetup}
          className="flex items-center gap-2"
        >
          <Database className="h-4 w-4" />
          Manual Setup
        </Button>
        
        <Button 
          variant="outline"
          onClick={handleDebugDatabase}
          className="flex items-center gap-2"
        >
          <Database className="h-4 w-4" />
          Debug DB
        </Button>
        
        <Button 
          variant="outline"
          onClick={handleDebugStorage}
          className="flex items-center gap-2"
        >
          <Database className="h-4 w-4" />
          Debug Storage
        </Button>
        
        <Button 
          variant="outline"
          onClick={handleTestDirectAccess}
          className="flex items-center gap-2"
        >
          <Database className="h-4 w-4" />
          Test Direct Access
        </Button>
        
        <Button 
          variant="outline"
          onClick={handleTestDatabaseSave}
          className="flex items-center gap-2"
        >
          <Database className="h-4 w-4" />
          Test DB Save
        </Button>
        
        <Button 
          variant="outline"
          onClick={handleDebugCurrentState}
          className="flex items-center gap-2"
        >
          <Database className="h-4 w-4" />
          Debug State
        </Button>
      </div>
    </div>
  );
}

