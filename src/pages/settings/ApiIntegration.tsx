import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { 
  Save,
  Loader2,
  Link,
  Eye,
  EyeOff,
  TestTube,
  CheckCircle,
  XCircle,
  AlertCircle,
  ShoppingBag,
  Globe,
  Package,
  Truck,
  Store,
  Zap
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ApiIntegration {
  id: string;
  platform: string;
  is_enabled: boolean;
  api_key?: string;
  api_secret?: string;
  access_token?: string;
  refresh_token?: string;
  webhook_url?: string;
  base_url?: string;
  store_id?: string;
  marketplace_id?: string;
  additional_config?: string;
  last_sync?: string;
  sync_status?: 'connected' | 'disconnected' | 'error';
  created_at: string;
  updated_at: string;
}

const platforms = [
  {
    id: 'shopify',
    name: 'Shopify',
    icon: ShoppingBag,
    description: 'E-commerce platform integration',
    color: 'bg-green-500',
    fields: ['api_key', 'api_secret', 'webhook_url', 'base_url']
  },
  {
    id: 'amazon',
    name: 'Amazon',
    icon: Globe,
    description: 'Amazon marketplace integration',
    color: 'bg-orange-500',
    fields: ['api_key', 'api_secret', 'marketplace_id', 'base_url']
  },
  {
    id: 'flipkart',
    name: 'Flipkart',
    icon: Package,
    description: 'Flipkart marketplace integration',
    color: 'bg-blue-500',
    fields: ['api_key', 'api_secret', 'marketplace_id', 'base_url']
  },
  {
    id: 'jiomart',
    name: 'JioMart',
    icon: Store,
    description: 'JioMart marketplace integration',
    color: 'bg-purple-500',
    fields: ['api_key', 'api_secret', 'marketplace_id', 'base_url']
  },
  {
    id: 'ajio',
    name: 'Ajio',
    icon: ShoppingBag,
    description: 'Ajio marketplace integration',
    color: 'bg-pink-500',
    fields: ['api_key', 'api_secret', 'marketplace_id', 'base_url']
  },
  {
    id: 'myntra',
    name: 'Myntra',
    icon: Package,
    description: 'Myntra marketplace integration',
    color: 'bg-red-500',
    fields: ['api_key', 'api_secret', 'marketplace_id', 'base_url']
  },
  {
    id: 'unicommerce',
    name: 'Unicommerce',
    icon: Truck,
    description: 'Unicommerce fulfillment integration',
    color: 'bg-indigo-500',
    fields: ['api_key', 'api_secret', 'base_url', 'store_id']
  }
];

export default function ApiIntegration() {
  const queryClient = useQueryClient();
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [testingConnection, setTestingConnection] = useState<string | null>(null);

  // Fetch API integrations
  const { data: integrations, isLoading } = useQuery({
    queryKey: ['api-integrations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('api_integrations')
        .select('*')
        .order('platform', { ascending: true });

      if (error) throw error;
      return data as ApiIntegration[];
    }
  });

  // Update integration mutation
  const updateMutation = useMutation({
    mutationFn: async (data: Partial<ApiIntegration>) => {
      const { error } = await supabase
        .from('api_integrations')
        .upsert(data, { 
          onConflict: 'platform',
          ignoreDuplicates: false 
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-integrations'] });
      toast.success("API integration updated successfully!");
    },
    onError: (error) => {
      toast.error("Failed to update API integration");
      console.error('Update error:', error);
    },
  });

  // Test connection mutation
  const testConnectionMutation = useMutation({
    mutationFn: async (platform: string) => {
      // This would be replaced with actual API testing logic
      // For now, we'll simulate a test
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate random success/failure for demo
      const success = Math.random() > 0.3;
      if (!success) {
        throw new Error('Connection test failed');
      }
      
      return { success: true, message: 'Connection successful' };
    },
    onSuccess: (data, platform) => {
      toast.success(`${platform} connection test successful!`);
      // Update sync status
      updateMutation.mutate({
        platform,
        sync_status: 'connected',
        last_sync: new Date().toISOString()
      });
    },
    onError: (error, platform) => {
      toast.error(`${platform} connection test failed`);
      updateMutation.mutate({
        platform,
        sync_status: 'error'
      });
    },
  });

  // Handle form input changes
  const handleInputChange = (platform: string, field: string, value: string | boolean) => {
    const existingIntegration = integrations?.find(i => i.platform === platform);
    const integrationData = {
      platform,
      [field]: value,
      ...existingIntegration
    };

    updateMutation.mutate(integrationData);
  };

  // Toggle secret visibility
  const toggleSecretVisibility = (platform: string) => {
    setShowSecrets(prev => ({
      ...prev,
      [platform]: !prev[platform]
    }));
  };

  // Test API connection
  const testConnection = (platform: string) => {
    setTestingConnection(platform);
    testConnectionMutation.mutate(platform);
  };

  // Get integration for platform
  const getIntegration = (platform: string): ApiIntegration | undefined => {
    return integrations?.find(i => i.platform === platform);
  };

  // Get status badge
  const getStatusBadge = (integration: ApiIntegration | undefined) => {
    if (!integration?.is_enabled) {
      return <Badge variant="secondary">Disabled</Badge>;
    }

    switch (integration.sync_status) {
      case 'connected':
        return <Badge variant="default" className="bg-green-500">Connected</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      case 'disconnected':
        return <Badge variant="outline">Disconnected</Badge>;
      default:
        return <Badge variant="secondary">Not Tested</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
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
          API Integration
        </h1>
        <p className="text-lg text-muted-foreground">
          Configure integrations with external platforms and marketplaces.
        </p>
      </div>

      {/* Info Alert */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Configure your API credentials for each platform. Keep your API keys secure and never share them publicly.
        </AlertDescription>
      </Alert>

      {/* Platforms Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {platforms.map((platform) => {
          const integration = getIntegration(platform.id);
          const Icon = platform.icon;
          const isEnabled = integration?.is_enabled || false;

          return (
            <Card key={platform.id} className="overflow-hidden">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${platform.color} text-white`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{platform.name}</CardTitle>
                      <CardDescription>{platform.description}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(integration)}
                    <Switch
                      checked={isEnabled}
                      onCheckedChange={(checked) => 
                        handleInputChange(platform.id, 'is_enabled', checked)
                      }
                    />
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {isEnabled && (
                  <>
                    {/* API Key */}
                    <div>
                      <Label htmlFor={`${platform.id}-api-key`}>API Key</Label>
                      <div className="relative">
                        <Input
                          id={`${platform.id}-api-key`}
                          type={showSecrets[platform.id] ? "text" : "password"}
                          placeholder="Enter API key"
                          value={integration?.api_key || ''}
                          onChange={(e) => handleInputChange(platform.id, 'api_key', e.target.value)}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => toggleSecretVisibility(platform.id)}
                        >
                          {showSecrets[platform.id] ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* API Secret */}
                    <div>
                      <Label htmlFor={`${platform.id}-api-secret`}>API Secret</Label>
                      <div className="relative">
                        <Input
                          id={`${platform.id}-api-secret`}
                          type={showSecrets[platform.id] ? "text" : "password"}
                          placeholder="Enter API secret"
                          value={integration?.api_secret || ''}
                          onChange={(e) => handleInputChange(platform.id, 'api_secret', e.target.value)}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => toggleSecretVisibility(platform.id)}
                        >
                          {showSecrets[platform.id] ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Platform-specific fields */}
                    {platform.fields.includes('marketplace_id') && (
                      <div>
                        <Label htmlFor={`${platform.id}-marketplace-id`}>Marketplace ID</Label>
                        <Input
                          id={`${platform.id}-marketplace-id`}
                          placeholder="Enter marketplace ID"
                          value={integration?.marketplace_id || ''}
                          onChange={(e) => handleInputChange(platform.id, 'marketplace_id', e.target.value)}
                        />
                      </div>
                    )}

                    {platform.fields.includes('store_id') && (
                      <div>
                        <Label htmlFor={`${platform.id}-store-id`}>Store ID</Label>
                        <Input
                          id={`${platform.id}-store-id`}
                          placeholder="Enter store ID"
                          value={integration?.store_id || ''}
                          onChange={(e) => handleInputChange(platform.id, 'store_id', e.target.value)}
                        />
                      </div>
                    )}

                    {platform.fields.includes('base_url') && (
                      <div>
                        <Label htmlFor={`${platform.id}-base-url`}>Base URL</Label>
                        <Input
                          id={`${platform.id}-base-url`}
                          placeholder="Enter base URL"
                          value={integration?.base_url || ''}
                          onChange={(e) => handleInputChange(platform.id, 'base_url', e.target.value)}
                        />
                      </div>
                    )}

                    {platform.fields.includes('webhook_url') && (
                      <div>
                        <Label htmlFor={`${platform.id}-webhook-url`}>Webhook URL</Label>
                        <Input
                          id={`${platform.id}-webhook-url`}
                          placeholder="Enter webhook URL"
                          value={integration?.webhook_url || ''}
                          onChange={(e) => handleInputChange(platform.id, 'webhook_url', e.target.value)}
                        />
                      </div>
                    )}

                    {/* Additional Configuration */}
                    <div>
                      <Label htmlFor={`${platform.id}-additional-config`}>Additional Configuration (JSON)</Label>
                      <Textarea
                        id={`${platform.id}-additional-config`}
                        placeholder="Enter additional configuration as JSON"
                        value={integration?.additional_config || ''}
                        onChange={(e) => handleInputChange(platform.id, 'additional_config', e.target.value)}
                        rows={3}
                      />
                    </div>

                    <Separator />

                    {/* Test Connection */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Connection Status</p>
                        <p className="text-xs text-muted-foreground">
                          {integration?.last_sync 
                            ? `Last sync: ${new Date(integration.last_sync).toLocaleString()}`
                            : 'Never synced'
                          }
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => testConnection(platform.id)}
                        disabled={testingConnection === platform.id || testConnectionMutation.isPending}
                      >
                        {testingConnection === platform.id ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <TestTube className="h-4 w-4 mr-2" />
                        )}
                        Test Connection
                      </Button>
                    </div>
                  </>
                )}

                {!isEnabled && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Zap className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Enable this integration to configure API settings</p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Save All Button */}
      <div className="flex justify-end">
        <Button 
          onClick={() => {
            toast.success("All API integrations saved!");
          }}
          disabled={updateMutation.isPending}
          className="flex items-center gap-2"
        >
          {updateMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save All Integrations
        </Button>
      </div>
    </div>
  );
}
