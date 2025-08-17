export class TikTokAdsService {
  private accessToken: string | null = null;
  private advertiserId: string | null = null;
  private appId: string | null = null;
  private secret: string | null = null;

  constructor() {
    this.accessToken = process.env.TIKTOK_ACCESS_TOKEN || null;
    this.advertiserId = process.env.TIKTOK_ADVERTISER_ID || null;
    this.appId = process.env.TIKTOK_APP_ID || null;
    this.secret = process.env.TIKTOK_SECRET || null;
  }

  isConfigured(): boolean {
    return !!(this.accessToken && this.advertiserId);
  }

  private async makeRequest(endpoint: string, params: any = {}) {
    if (!this.accessToken) {
      throw new Error('TikTok Ads access token not configured');
    }

    const url = `https://business-api.tiktok.com/open_api/v1.3/${endpoint}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Access-Token': this.accessToken,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`TikTok Ads API error: ${response.status} ${errorText}`);
    }

    const result = await response.json();
    
    if (result.code !== 0) {
      throw new Error(`TikTok Ads API error: ${result.message}`);
    }

    return result.data;
  }

  async getCampaignPerformance(dateRange: string = '7'): Promise<any[]> {
    if (!this.advertiserId) {
      throw new Error('TikTok Advertiser ID not configured');
    }

    const today = new Date();
    const daysAgo = new Date();
    daysAgo.setDate(today.getDate() - parseInt(dateRange));

    try {
      // Get campaigns
      const campaigns = await this.makeRequest('campaign/get/', {
        advertiser_id: this.advertiserId,
        filtering: {
          campaign_ids: [],
          primary_status: 'STATUS_ENABLE'
        }
      });

      const campaignMetrics = await Promise.all(
        campaigns.list.map(async (campaign: any) => {
          try {
            // Get campaign reporting data
            const reports = await this.makeRequest('reports/integrated/get/', {
              advertiser_id: this.advertiserId,
              report_type: 'BASIC',
              dimensions: ['campaign_id'],
              metrics: [
                'spend',
                'impressions', 
                'clicks',
                'ctr',
                'cpc',
                'conversions',
                'cost_per_conversion'
              ],
              start_date: daysAgo.toISOString().split('T')[0],
              end_date: today.toISOString().split('T')[0],
              filtering: {
                campaign_ids: [campaign.campaign_id]
              }
            });

            const data = reports.list[0] || {};
            
            return {
              id: campaign.campaign_id,
              name: campaign.campaign_name,
              platform: 'tiktok_ads',
              leads: parseInt(data.conversions || '0'),
              spend: parseFloat(data.spend || '0'),
              impressions: parseInt(data.impressions || '0'),
              clicks: parseInt(data.clicks || '0'),
              ctr: data.ctr || '0.00',
              cpc: data.cpc || '0.00',
              cpl: data.cost_per_conversion || '0.00',
              status: campaign.primary_status.toLowerCase().includes('enable') ? 'active' : 'paused'
            };
          } catch (error) {
            console.error(`Error getting metrics for TikTok campaign ${campaign.campaign_id}:`, error);
            return {
              id: campaign.campaign_id,
              name: campaign.campaign_name,
              platform: 'tiktok_ads',
              leads: 0,
              spend: 0,
              status: campaign.primary_status.toLowerCase(),
              error: 'Failed to load metrics'
            };
          }
        })
      );

      return campaignMetrics;
    } catch (error) {
      console.error('Error getting TikTok campaign performance:', error);
      return [];
    }
  }

  async getTodayMetrics(): Promise<{
    leads: number;
    spend: number;
    impressions: number;
    clicks: number;
  }> {
    if (!this.advertiserId) {
      throw new Error('TikTok Advertiser ID not configured');
    }

    const today = new Date().toISOString().split('T')[0];

    try {
      const reports = await this.makeRequest('reports/integrated/get/', {
        advertiser_id: this.advertiserId,
        report_type: 'BASIC',
        dimensions: ['advertiser_id'],
        metrics: ['spend', 'impressions', 'clicks', 'conversions'],
        start_date: today,
        end_date: today
      });

      const data = reports.list[0] || {};

      return {
        leads: parseInt(data.conversions || '0'),
        spend: parseFloat(data.spend || '0'),
        impressions: parseInt(data.impressions || '0'),
        clicks: parseInt(data.clicks || '0')
      };
    } catch (error) {
      console.error('Error getting TikTok today metrics:', error);
      return { leads: 0, spend: 0, impressions: 0, clicks: 0 };
    }
  }

  async getAdvertiserInfo(): Promise<any> {
    if (!this.advertiserId) {
      throw new Error('TikTok Advertiser ID not configured');
    }

    try {
      return await this.makeRequest('advertiser/info/', {
        advertiser_ids: [this.advertiserId]
      });
    } catch (error) {
      console.error('Error getting TikTok advertiser info:', error);
      return null;
    }
  }

  isConfigured(): boolean {
    return !!(this.accessToken && this.advertiserId);
  }
}