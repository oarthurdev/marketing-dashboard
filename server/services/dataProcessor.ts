import { storage } from '../storage';
import { HubSpotService } from './hubspot';
import { GoogleAdsService } from './googleAds';
import { ShopifyService } from './shopify';
import { MetaAdsService } from './metaAds';
import { TikTokAdsService } from './tiktokAds';
import type { InsertMetrics, InsertActivity, InsertCampaign } from '@shared/schema';

export class DataProcessor {
  private hubspot: HubSpotService;
  private googleAds: GoogleAdsService;
  private shopify: ShopifyService;
  private metaAds: MetaAdsService;
  private tiktokAds: TikTokAdsService;
  private isDevelopmentMode: boolean;

  constructor() {
    this.hubspot = new HubSpotService();
    this.googleAds = new GoogleAdsService();
    this.shopify = new ShopifyService();
    this.metaAds = new MetaAdsService();
    this.tiktokAds = new TikTokAdsService();
    // Set development mode based on an environment variable or configuration
    this.isDevelopmentMode = process.env.NODE_ENV === 'development';
    if (this.isDevelopmentMode) {
      console.log('Running in development mode. Mock data will be used for unconfigured services.');
    }
  }

  async processDaily(): Promise<void> {
    try {
      console.log('Starting daily data processing...');

      // Collect data from all sources
      const [hubspotData, googleAdsData, shopifyData, metaAdsData, tiktokAdsData] = await Promise.allSettled([
        this.collectHubSpotData(),
        this.collectGoogleAdsData(),
        this.collectShopifyData(),
        this.collectMetaAdsData(),
        this.collectTikTokAdsData(),
      ]);

      // Process and consolidate metrics
      const metrics = await this.consolidateMetrics(hubspotData, googleAdsData, shopifyData, metaAdsData, tiktokAdsData);

      // Save consolidated metrics
      await storage.createMetrics(metrics);

      // Update campaigns data
      await this.updateCampaigns();

      console.log('Daily data processing completed successfully');
    } catch (error) {
      console.error('Error in daily data processing:', error);
      throw error;
    }
  }

  private async collectHubSpotData() {
    try {
      if (this.isDevelopmentMode && !this.hubspot.isConfigured()) {
        const leadsToday = Math.floor(Math.random() * 20) + 5;
        const revenueToday = Math.floor(Math.random() * 5000) + 2000;

        await storage.createActivity({
          type: 'data_sync',
          source: 'hubspot',
          details: `Synced ${leadsToday} leads, $${revenueToday} revenue (mock data)`,
          amount: revenueToday.toString()
        });

        return { leadsToday, revenueToday };
      }

      const [leadsToday, revenueToday] = await Promise.all([
        this.hubspot.getLeadsToday(),
        this.hubspot.getRevenueToday(),
      ]);

      await storage.createActivity({
        type: 'data_sync',
        source: 'hubspot',
        details: `Synced ${leadsToday} leads, $${revenueToday} revenue`,
        amount: revenueToday.toString()
      });

      return { leadsToday, revenueToday };
    } catch (error) {
      console.error('Error collecting HubSpot data:', error);
      if (this.isDevelopmentMode) {
        return { leadsToday: 8, revenueToday: 3200 };
      }
      return { leadsToday: 0, revenueToday: 0 };
    }
  }

  private async collectGoogleAdsData() {
    try {
      if (this.isDevelopmentMode && !this.googleAds.isConfigured()) {
        const leads = Math.floor(Math.random() * 15) + 3;
        const spend = Math.floor(Math.random() * 600) + 200;
        const cpa = spend / leads;

        await storage.createActivity({
          type: 'data_sync',
          source: 'google_ads',
          details: `Synced ${leads} leads, $${spend} spend (mock data)`,
          amount: spend.toString()
        });

        return { leads, spend, cpa };
      }

      const metrics = await this.googleAds.getTodayMetrics();

      await storage.createActivity({
        type: 'data_sync',
        source: 'google_ads',
        details: `Synced ${metrics.leads} leads, $${metrics.spend} spend`,
        amount: metrics.spend.toString()
      });

      return metrics;
    } catch (error) {
      console.error('Error collecting Google Ads data:', error);
      if (this.isDevelopmentMode) {
        return { leads: 6, spend: 420, cpa: 70 };
      }
      return { leads: 0, spend: 0, cpa: 0 };
    }
  }

  private async collectShopifyData() {
    try {
      if (this.isDevelopmentMode && !this.shopify.isConfigured()) {
        const orders = Math.floor(Math.random() * 12) + 2;
        const revenue = Math.floor(Math.random() * 4000) + 1500;

        await storage.createActivity({
          type: 'data_sync',
          source: 'shopify',
          details: `Synced ${orders} orders, $${revenue} revenue (mock data)`,
          amount: revenue.toString()
        });

        return { revenue, orders };
      }

      const [revenue, orders] = await Promise.all([
        this.shopify.getTodayRevenue(),
        this.shopify.getTodayOrders(),
      ]);

      await storage.createActivity({
        type: 'data_sync',
        source: 'shopify',
        details: `Synced ${orders} orders, $${revenue} revenue`,
        amount: revenue.toString()
      });

      return { revenue, orders };
    } catch (error) {
      console.error('Error collecting Shopify data:', error);
      if (this.isDevelopmentMode) {
        return { revenue: 2800, orders: 7 };
      }
      return { revenue: 0, orders: 0 };
    }
  }

  private async collectMetaAdsData(): Promise<any> {
    try {
      if (this.isDevelopmentMode) {
        const leads = Math.floor(Math.random() * 25) + 3;
        const spend = Math.floor(Math.random() * 800) + 150;

        await storage.createActivity({
          type: 'data_sync',
          source: 'meta_ads',
          details: `Synced ${leads} leads, $${spend} spend (mock data)`,
          amount: spend.toString()
        });

        return { leads, spend };
      }

      if (!this.metaAds.isConfigured()) {
        console.log('Meta Ads not configured, skipping...');
        return { leads: 0, spend: 0 };
      }

      const todayMetrics = await this.metaAds.getTodayMetrics();

      await storage.createActivity({
        type: 'data_sync',
        source: 'meta_ads',
        details: `Synced ${todayMetrics.leads} leads, $${todayMetrics.spend} spend`,
        amount: todayMetrics.spend.toString()
      });

      return todayMetrics;
    } catch (error) {
      console.error('Error getting today\'s metrics from Meta Ads:', error);
      if (this.isDevelopmentMode) {
        return { leads: 8, spend: 320 };
      }
      return { leads: 0, spend: 0 };
    }
  }

  private async collectTikTokAdsData(): Promise<any> {
    try {
      if (this.isDevelopmentMode && !this.tiktokAds.isConfigured()) {
        const leads = Math.floor(Math.random() * 18) + 2;
        const spend = Math.floor(Math.random() * 400) + 100;

        await storage.createActivity({
          type: 'data_sync',
          source: 'tiktok_ads',
          details: `Synced ${leads} leads, $${spend} spend (mock data)`,
          amount: spend.toString()
        });

        return { leads, spend };
      }

      if (!this.tiktokAds.isConfigured()) {
        console.log('TikTok Ads not configured, skipping...');
        return { leads: 0, spend: 0 };
      }

      const todayMetrics = await this.tiktokAds.getTodayMetrics();

      await storage.createActivity({
        type: 'data_sync',
        source: 'tiktok_ads',
        details: `Synced ${todayMetrics.leads} leads, $${todayMetrics.spend} spend`,
        amount: todayMetrics.spend.toString()
      });

      return todayMetrics;
    } catch (error) {
      console.error('Error getting today\'s metrics from TikTok Ads:', error);
      if (this.isDevelopmentMode) {
        return { leads: 5, spend: 250 };
      }
      return { leads: 0, spend: 0 };
    }
  }

  private async consolidateMetrics(
    hubspotResult: PromiseSettledResult<any>,
    googleAdsResult: PromiseSettledResult<any>,
    shopifyResult: PromiseSettledResult<any>,
    metaAdsResult: PromiseSettledResult<any>,
    tiktokAdsResult: PromiseSettledResult<any>
  ): Promise<InsertMetrics> {
    const hubspotData = hubspotResult.status === 'fulfilled' ? hubspotResult.value : { leadsToday: 0, revenueToday: 0 };
    const googleAdsData = googleAdsResult.status === 'fulfilled' ? googleAdsResult.value : { leads: 0, spend: 0, cpa: 0 };
    const shopifyData = shopifyResult.status === 'fulfilled' ? shopifyResult.value : { revenue: 0, orders: 0 };
    const metaAdsData = metaAdsResult.status === 'fulfilled' ? metaAdsResult.value : { leads: 0, spend: 0 };
    const tiktokAdsData = tiktokAdsResult.status === 'fulfilled' ? tiktokAdsResult.value : { leads: 0, spend: 0 };

    // Calculate consolidated metrics
    const totalLeads = hubspotData.leadsToday + googleAdsData.leads + metaAdsData.leads + tiktokAdsData.leads;
    const totalRevenue = hubspotData.revenueToday + shopifyData.revenue;
    const totalSpend = googleAdsData.spend + metaAdsData.spend + tiktokAdsData.spend;

    // Calculate conversion rate (orders / leads)
    const conversionRate = totalLeads > 0 ? (shopifyData.orders / totalLeads) * 100 : 0;

    // Calculate average CPA
    const avgCPA = totalLeads > 0 ? totalSpend / totalLeads : googleAdsData.cpa;

    // Lead sources breakdown
    const leadSources = {
      'HubSpot CRM': hubspotData.leadsToday,
      'Google Ads': googleAdsData.leads,
      'Meta Ads': metaAdsData.leads,
      'TikTok Ads': tiktokAdsData.leads,
      'Organic': Math.floor(totalLeads * 0.15), // Estimated organic traffic
      'Email': Math.floor(totalLeads * 0.10), // Estimated email leads
      'Social': Math.floor(totalLeads * 0.05), // Estimated other social leads
    };

    const metrics: InsertMetrics = {
      date: new Date(),
      totalLeads,
      conversionRate: conversionRate.toString(),
      dailyRevenue: totalRevenue.toString(),
      avgCPA: avgCPA.toString(),
      leadSources,
    };

    return metrics;
  }

  private async updateCampaigns(): Promise<void> {
    try {
      if (this.isDevelopmentMode && !this.googleAds.isConfigured()) {
        // Create mock campaigns for development
        const mockCampaigns = [
          {
            name: 'Summer Sale Campaign',
            platform: 'google_ads',
            leads: Math.floor(Math.random() * 25) + 10,
            spend: Math.floor(Math.random() * 800) + 300,
            status: 'active'
          },
          {
            name: 'Brand Awareness Campaign',
            platform: 'meta_ads',
            leads: Math.floor(Math.random() * 20) + 5,
            spend: Math.floor(Math.random() * 600) + 200,
            status: 'active'
          },
          {
            name: 'Retargeting Campaign',
            platform: 'google_ads',
            leads: Math.floor(Math.random() * 15) + 3,
            spend: Math.floor(Math.random() * 400) + 150,
            status: 'paused'
          },
          {
            name: 'Holiday Promotion',
            platform: 'tiktok_ads',
            leads: Math.floor(Math.random() * 30) + 8,
            spend: Math.floor(Math.random() * 500) + 250,
            status: 'active'
          }
        ];

        const existingCampaigns = await storage.getCampaigns();
        
        for (const mockCampaign of mockCampaigns) {
          const roi = mockCampaign.spend > 0 ? ((mockCampaign.leads * 50 - mockCampaign.spend) / mockCampaign.spend) * 100 : 0;
          
          const campaignData: InsertCampaign = {
            name: mockCampaign.name,
            platform: mockCampaign.platform,
            leads: mockCampaign.leads,
            spend: mockCampaign.spend.toString(),
            roi: roi.toString(),
            status: mockCampaign.status,
            startDate: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000),
          };

          const existing = existingCampaigns.find(c => c.name === mockCampaign.name && c.platform === mockCampaign.platform);

          if (existing) {
            await storage.updateCampaign(existing.id, {
              leads: campaignData.leads,
              spend: campaignData.spend,
              roi: campaignData.roi,
              status: campaignData.status,
            });
          } else {
            await storage.createCampaign(campaignData);
          }
        }

        return;
      }

      // Get Google Ads campaign data
      const campaignReports = await this.googleAds.getCampaignPerformance(1);

      for (const report of campaignReports) {
        const spend = (report.metrics.cost_micros || 0) / 1000000;
        const leads = report.metrics.conversions || 0;
        const roi = spend > 0 ? ((leads * 50 - spend) / spend) * 100 : 0; // Assume $50 average revenue per lead

        const campaignData: InsertCampaign = {
          name: report.campaign.name,
          platform: 'google_ads',
          leads: leads,
          spend: spend.toString(),
          roi: roi.toString(),
          status: report.campaign.status === 'ENABLED' ? 'active' : 'paused',
          startDate: new Date(), // This should be fetched from campaign details
        };

        // Check if campaign exists, if not create it
        const existingCampaigns = await storage.getCampaigns();
        const existing = existingCampaigns.find(c => c.name === report.campaign.name && c.platform === 'google_ads');

        if (existing) {
          await storage.updateCampaign(existing.id, {
            leads: campaignData.leads,
            spend: campaignData.spend,
            roi: campaignData.roi,
            status: campaignData.status,
          });
        } else {
          await storage.createCampaign(campaignData);
        }
      }

      // Create recent activities for significant events
      if (campaignReports.length > 0) {
        const topCampaign = campaignReports.reduce((prev, current) => 
          (prev.metrics.conversions > current.metrics.conversions) ? prev : current
        );

        const activity: InsertActivity = {
          type: 'campaign_performance',
          source: 'Google Ads',
          details: `${topCampaign.campaign.name} generated ${topCampaign.metrics.conversions} leads today`,
          amount: ((topCampaign.metrics.cost_micros || 0) / 1000000).toString(),
        };

        await storage.createActivity(activity);
      }
    } catch (error) {
      console.error('Error updating campaigns:', error);
    }
  }

  async refreshData(): Promise<void> {
    await this.processDaily();
  }
}