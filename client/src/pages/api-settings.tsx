
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
      toast({
        title: "Settings Updated",
        description: `${variables.platform} configuration has been updated successfully.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: `Failed to update API configuration: ${error.message}`,
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
    if (!connection) return;

    const config = configs[platform] || {};
    const isConnected = Object.values(config).some(value => value.trim() !== '');

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
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">API Settings</h1>
          <p className="text-gray-600 mt-2">Configure your marketing platform integrations</p>
        </div>

        <Tabs defaultValue="hubspot" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
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
                      {config.fields.map((field) => (
                        <div key={field.key} className="space-y-2">
                          <Label htmlFor={`${platform}-${field.key}`}>
                            {field.label}
                          </Label>
                          <Input
                            id={`${platform}-${field.key}`}
                            type={field.type}
                            placeholder={field.placeholder}
                            value={configs[platform]?.[field.key] || ''}
                            onChange={(e) => handleConfigChange(platform, field.key, e.target.value)}
                          />
                        </div>
                      ))}
                    </div>

                    <div className="flex space-x-2 pt-4">
                      <Button
                        onClick={() => handleSave(platform)}
                        disabled={updateConnectionMutation.isPending}
                      >
                        {updateConnectionMutation.isPending ? "Saving..." : "Save Configuration"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleTest(platform)}
                        disabled={testConnectionMutation.isPending || !isConnected}
                      >
                        {testConnectionMutation.isPending ? "Testing..." : "Test Connection"}
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
    </div>
  );
}
