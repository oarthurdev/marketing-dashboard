
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Settings, Check, AlertCircle, ExternalLink } from "lucide-react";
import type { ApiConnection } from "@shared/schema";

interface ApiConfig {
  [key: string]: string;
}

export default function ApiSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [configs, setConfigs] = useState<Record<string, ApiConfig>>({});

  const { data: connections, isLoading } = useQuery<ApiConnection[]>({
    queryKey: ['/api/dashboard/connections'],
  });

  const updateConnectionMutation = useMutation({
    mutationFn: async ({ platform, config, isConnected }: { platform: string; config: ApiConfig; isConnected: boolean }) => {
      return apiRequest('POST', '/api/connections/update', { platform, config, isConnected });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/connections'] });
      const platformName = platformConfigs[variables.platform]?.title || variables.platform;
      toast({
        title: "✅ Configuration Saved",
        description: `${platformName} settings have been saved successfully. The connection is now ${variables.isConnected ? 'active' : 'inactive'}.`,
      });
    },
    onError: (error) => {
      toast({
        title: "❌ Save Failed",
        description: `Failed to save configuration: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const testConnectionMutation = useMutation({
    mutationFn: async (platform: string) => {
      return apiRequest('POST', '/api/connections/test', { platform });
    },
    onSuccess: (_, platform) => {
      toast({
        title: "Connection Test Successful",
        description: `${platform} API connection is working correctly.`,
      });
    },
    onError: (error, platform) => {
      toast({
        title: "Connection Test Failed",
        description: `${platform} API connection test failed: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (connections) {
      const initialConfigs: Record<string, ApiConfig> = {};
      connections.forEach(conn => {
        initialConfigs[conn.platform] = conn.config as ApiConfig || {};
      });
      setConfigs(initialConfigs);
    }
  }, [connections]);

  const handleConfigChange = (platform: string, key: string, value: string) => {
    setConfigs(prev => ({
      ...prev,
      [platform]: {
        ...prev[platform],
        [key]: value
      }
    }));
  };

  const handleSave = async (platform: string) => {
    const connection = connections?.find(c => c.platform === platform);
    if (!connection) {
      toast({
        title: "Error",
        description: "Connection not found for this platform.",
        variant: "destructive",
      });
      return;
    }

    const config = configs[platform] || {};
    const configValues = Object.values(config).filter(value => value && value.trim() !== '');
    
    if (configValues.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please fill in at least one configuration field before saving.",
        variant: "destructive",
      });
      return;
    }

    const isConnected = configValues.length > 0;

    updateConnectionMutation.mutate({ platform, config, isConnected });
  };

  const handleTest = async (platform: string) => {
    testConnectionMutation.mutate(platform);
  };

  const platformConfigs = {
    hubspot: {
      title: "HubSpot CRM",
      description: "Connect to HubSpot for lead and deal data",
      fields: [
        { key: "api_key", label: "API Key", type: "password", placeholder: "Your HubSpot API key" },
        { key: "portal_id", label: "Portal ID", type: "text", placeholder: "Your HubSpot Portal ID" }
      ],
      docsUrl: "https://developers.hubspot.com/docs/api/overview"
    },
    google_ads: {
      title: "Google Ads",
      description: "Connect to Google Ads for campaign performance data",
      fields: [
        { key: "client_id", label: "Client ID", type: "text", placeholder: "Google Ads Client ID" },
        { key: "client_secret", label: "Client Secret", type: "password", placeholder: "Google Ads Client Secret" },
        { key: "developer_token", label: "Developer Token", type: "password", placeholder: "Google Ads Developer Token" },
        { key: "customer_id", label: "Customer ID", type: "text", placeholder: "Google Ads Customer ID" }
      ],
      docsUrl: "https://developers.google.com/google-ads/api/docs/first-call/overview"
    },
    shopify: {
      title: "Shopify",
      description: "Connect to Shopify for e-commerce data",
      fields: [
        { key: "store_url", label: "Store URL", type: "text", placeholder: "your-store.myshopify.com" },
        { key: "access_token", label: "Access Token", type: "password", placeholder: "Shopify Access Token" }
      ],
      docsUrl: "https://shopify.dev/docs/api/admin-rest"
    },
    meta_ads: {
      title: "Meta Ads (Facebook)",
      description: "Connect to Meta Ads for Facebook and Instagram campaign data",
      fields: [
        { key: "access_token", label: "Access Token", type: "password", placeholder: "Meta Ads Access Token" },
        { key: "ad_account_id", label: "Ad Account ID", type: "text", placeholder: "Meta Ads Account ID" }
      ],
      docsUrl: "https://developers.facebook.com/docs/marketing-api/"
    },
    tiktok_ads: {
      title: "TikTok Ads",
      description: "Connect to TikTok Ads for campaign performance data",
      fields: [
        { key: "access_token", label: "Access Token", type: "password", placeholder: "TikTok Ads Access Token" },
        { key: "advertiser_id", label: "Advertiser ID", type: "text", placeholder: "TikTok Advertiser ID" }
      ],
      docsUrl: "https://ads.tiktok.com/marketing_api/docs"
    },
    kommo: {
      title: "Kommo CRM",
      description: "Connect to Kommo CRM for leads and customer data",
      fields: [
        { key: "access_token", label: "Access Token", type: "password", placeholder: "Kommo Access Token" },
        { key: "subdomain", label: "Subdomain", type: "text", placeholder: "your-account" }
      ],
      docsUrl: "https://www.kommo.com/developers/api/"
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Settings className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading API settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">API Settings</h1>
        <p className="text-gray-600 mt-2">Configure your marketing platform integrations</p>
      </div>

      <Tabs defaultValue="hubspot" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          {Object.entries(platformConfigs).map(([platform, config]) => (
            <TabsTrigger key={platform} value={platform} className="text-sm">
              {config.title}
            </TabsTrigger>
          ))}
        </TabsList>

        {Object.entries(platformConfigs).map(([platform, config]) => {
          const connection = connections?.find(c => c.platform === platform);
          const isConnected = connection?.isConnected || false;

          return (
            <TabsContent key={platform} value={platform}>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {config.title}
                        {isConnected ? (
                          <Check className="w-5 h-5 text-green-500" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-yellow-500" />
                        )}
                      </CardTitle>
                      <CardDescription>{config.description}</CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(config.docsUrl, '_blank')}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Documentation
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id={`${platform}-enabled`}
                      checked={isConnected}
                      disabled
                    />
                    <Label htmlFor={`${platform}-enabled`}>
                      {isConnected ? "Connected" : "Not Connected"}
                    </Label>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {config.fields.map((field) => {
                      const fieldValue = configs[platform]?.[field.key] || '';
                      const hasValue = fieldValue.trim() !== '';
                      
                      return (
                        <div key={field.key} className="space-y-2">
                          <Label htmlFor={`${platform}-${field.key}`} className="flex items-center gap-2">
                            {field.label}
                            {hasValue && (
                              <Check className="w-4 h-4 text-green-500" />
                            )}
                          </Label>
                          <Input
                            id={`${platform}-${field.key}`}
                            type={field.type}
                            placeholder={field.placeholder}
                            value={fieldValue}
                            onChange={(e) => handleConfigChange(platform, field.key, e.target.value)}
                            className={hasValue ? "border-green-200 bg-green-50" : ""}
                          />
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex space-x-2 pt-4">
                    <Button
                      onClick={() => handleSave(platform)}
                      disabled={updateConnectionMutation.isPending}
                      className="min-w-[150px]"
                    >
                      {updateConnectionMutation.isPending ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          Saving...
                        </>
                      ) : (
                        "Save Configuration"
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleTest(platform)}
                      disabled={testConnectionMutation.isPending || !isConnected}
                      className="min-w-[130px]"
                    >
                      {testConnectionMutation.isPending ? (
                        <>
                          <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                          Testing...
                        </>
                      ) : (
                        "Test Connection"
                      )}
                    </Button>
                  </div>

                  {connection?.lastSync && (
                    <p className="text-sm text-gray-500">
                      Last synced: {new Date(connection.lastSync).toLocaleString()}
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
