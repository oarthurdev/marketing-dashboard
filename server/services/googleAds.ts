export interface GoogleAdsReport {
  campaign: {
    id: string;
    name: string;
    status: string;
  };
  metrics: {
    clicks: number;
    impressions: number;
    cost_micros: number;
    conversions: number;
  };
  segments: {
    date: string;
  };
}

export class GoogleAdsService {
  private customerId: string;
  private developerToken: string;
  private clientId: string;
  private clientSecret: string;
  private refreshToken: string;
  private accessToken: string = '';

  constructor() {
    this.customerId = process.env.GOOGLE_ADS_CUSTOMER_ID || '';
    this.developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN || '';
    this.clientId = process.env.GOOGLE_ADS_CLIENT_ID || '';
    this.clientSecret = process.env.GOOGLE_ADS_CLIENT_SECRET || '';
    this.refreshToken = process.env.GOOGLE_ADS_REFRESH_TOKEN || '';
  }

  isConfigured(): boolean {
    return !!(this.customerId && this.developerToken && this.clientId && this.clientSecret && this.refreshToken);
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken) return this.accessToken;

    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: this.clientId,
          client_secret: this.clientSecret,
          refresh_token: this.refreshToken,
          grant_type: 'refresh_token',
        }),
      });

      if (!response.ok) {
        throw new Error(`OAuth error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      this.accessToken = data.access_token;
      return this.accessToken;
    } catch (error) {
      console.error('Error getting Google Ads access token:', error);
      throw error;
    }
  }

  async getCampaignPerformance(days = 7): Promise<GoogleAdsReport[]> {
    if (!this.customerId || !this.developerToken) {
      throw new Error('Google Ads credentials not configured');
    }

    try {
      const accessToken = await this.getAccessToken();
      
      const query = `
        SELECT 
          campaign.id,
          campaign.name,
          campaign.status,
          metrics.clicks,
          metrics.impressions,
          metrics.cost_micros,
          metrics.conversions,
          segments.date
        FROM campaign 
        WHERE segments.date DURING LAST_${days}_DAYS
        ORDER BY segments.date DESC
      `;

      const response = await fetch(
        `https://googleads.googleapis.com/v15/customers/${this.customerId}/googleAds:searchStream`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'developer-token': this.developerToken,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: query,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Google Ads API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.results || [];
    } catch (error) {
      console.error('Error fetching Google Ads campaign performance:', error);
      throw error;
    }
  }

  async getTodayMetrics(): Promise<{ leads: number; spend: number; cpa: number }> {
    try {
      const reports = await this.getCampaignPerformance(1);
      
      let totalLeads = 0;
      let totalSpend = 0;

      reports.forEach(report => {
        totalLeads += report.metrics.conversions || 0;
        totalSpend += (report.metrics.cost_micros || 0) / 1000000; // Convert from micros
      });

      const cpa = totalLeads > 0 ? totalSpend / totalLeads : 0;

      return {
        leads: totalLeads,
        spend: totalSpend,
        cpa: cpa
      };
    } catch (error) {
      console.error('Error getting Google Ads today metrics:', error);
      return { leads: 0, spend: 0, cpa: 0 };
    }
  }
}
