export class MetaAdsService {
  private accessToken: string | null = null;
  private adAccountId: string | null = null;

  constructor() {
    this.accessToken = process.env.META_ACCESS_TOKEN || null;
    this.adAccountId = process.env.META_AD_ACCOUNT_ID || null;
  }

  private async makeRequest(endpoint: string, params: any = {}) {
    if (!this.accessToken) {
      throw new Error('Meta Ads access token not configured');
    }

    const url = new URL(`https://graph.facebook.com/v18.0/${endpoint}`);
    
    // Add access token to params
    params.access_token = this.accessToken;
    
    // Add params to URL
    Object.keys(params).forEach(key => {
      if (params[key] !== null && params[key] !== undefined) {
        url.searchParams.append(key, params[key].toString());
      }
    });

    const response = await fetch(url.toString());
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Meta Ads API error: ${response.status} ${errorText}`);
    }

    return await response.json();
  }

  async getCampaignPerformance(dateRange: string = '7'): Promise<any[]> {
    if (!this.adAccountId) {
      throw new Error('Meta Ad Account ID not configured');
    }

    const today = new Date();
    const daysAgo = new Date();
    daysAgo.setDate(today.getDate() - parseInt(dateRange));

    const campaigns = await this.makeRequest(`${this.adAccountId}/campaigns`, {
      fields: 'id,name,status,created_time,updated_time',
      effective_status: JSON.stringify(['ACTIVE', 'PAUSED']),
      time_range: JSON.stringify({
        since: daysAgo.toISOString().split('T')[0],
        until: today.toISOString().split('T')[0]
      })
    });

    const campaignMetrics = await Promise.all(
      campaigns.data.map(async (campaign: any) => {
        try {
          const insights = await this.makeRequest(`${campaign.id}/insights`, {
            fields: 'campaign_name,impressions,clicks,spend,actions,cost_per_action_type',
            time_range: JSON.stringify({
              since: daysAgo.toISOString().split('T')[0],
              until: today.toISOString().split('T')[0]
            })
          });

          const data = insights.data[0] || {};
          const leads = this.extractLeads(data.actions || []);
          
          return {
            id: campaign.id,
            name: campaign.name,
            platform: 'meta_ads',
            leads,
            spend: parseFloat(data.spend || '0'),
            impressions: parseInt(data.impressions || '0'),
            clicks: parseInt(data.clicks || '0'),
            ctr: data.clicks && data.impressions ? 
              ((parseInt(data.clicks) / parseInt(data.impressions)) * 100).toFixed(2) : '0.00',
            cpc: data.clicks && data.spend ? 
              (parseFloat(data.spend) / parseInt(data.clicks)).toFixed(2) : '0.00',
            cpl: leads > 0 && data.spend ? 
              (parseFloat(data.spend) / leads).toFixed(2) : '0.00',
            status: campaign.status.toLowerCase()
          };
        } catch (error) {
          console.error(`Error getting insights for campaign ${campaign.id}:`, error);
          return {
            id: campaign.id,
            name: campaign.name,
            platform: 'meta_ads',
            leads: 0,
            spend: 0,
            status: campaign.status.toLowerCase(),
            error: 'Failed to load metrics'
          };
        }
      })
    );

    return campaignMetrics;
  }

  private extractLeads(actions: any[]): number {
    // Look for lead generation actions
    const leadActions = actions.filter(action => 
      action.action_type === 'lead' || 
      action.action_type === 'leadgen.other'
    );
    
    return leadActions.reduce((total, action) => 
      total + parseInt(action.value || '0'), 0
    );
  }

  async getTodayMetrics(): Promise<{
    leads: number;
    spend: number;
    impressions: number;
    clicks: number;
  }> {
    if (!this.adAccountId) {
      throw new Error('Meta Ad Account ID not configured');
    }

    const today = new Date().toISOString().split('T')[0];

    try {
      const insights = await this.makeRequest(`${this.adAccountId}/insights`, {
        fields: 'impressions,clicks,spend,actions',
        time_range: JSON.stringify({
          since: today,
          until: today
        })
      });

      const data = insights.data[0] || {};
      const leads = this.extractLeads(data.actions || []);

      return {
        leads,
        spend: parseFloat(data.spend || '0'),
        impressions: parseInt(data.impressions || '0'),
        clicks: parseInt(data.clicks || '0')
      };
    } catch (error) {
      console.error('Error getting Meta Ads today metrics:', error);
      return { leads: 0, spend: 0, impressions: 0, clicks: 0 };
    }
  }

  async getAccountInfo(): Promise<any> {
    if (!this.adAccountId) {
      throw new Error('Meta Ad Account ID not configured');
    }

    try {
      return await this.makeRequest(this.adAccountId, {
        fields: 'name,account_status,amount_spent,balance,currency,timezone_name'
      });
    } catch (error) {
      console.error('Error getting Meta Ads account info:', error);
      return null;
    }
  }

  isConfigured(): boolean {
    return !!(this.accessToken && this.adAccountId);
  }
}