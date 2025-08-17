import { storage } from '../storage';
import type { InsertReport } from '@shared/schema';

export interface ReportData {
  period: string;
  metrics: {
    totalLeads: number;
    conversionRate: number;
    dailyRevenue: number;
    avgCPA: number;
  };
  campaigns: Array<{
    name: string;
    platform: string;
    leads: number;
    spend: number;
    roi: number;
  }>;
  leadSources: Record<string, number>;
  activities: Array<{
    type: string;
    source: string;
    details: string;
    timestamp: Date;
  }>;
}

export class ReportGenerator {
  async generateDailyReport(): Promise<string> {
    try {
      const reportData = await this.collectReportData('daily');
      const reportContent = this.formatHTMLReport(reportData);
      
      const report: InsertReport = {
        title: `Daily Marketing Report - ${new Date().toLocaleDateString()}`,
        type: 'daily',
        format: 'html',
        data: reportData as any,
      };

      await storage.createReport(report);
      
      return reportContent;
    } catch (error) {
      console.error('Error generating daily report:', error);
      throw error;
    }
  }

  async generateWeeklyReport(): Promise<string> {
    try {
      const reportData = await this.collectReportData('weekly');
      const reportContent = this.formatHTMLReport(reportData);
      
      const report: InsertReport = {
        title: `Weekly Marketing Report - Week of ${new Date().toLocaleDateString()}`,
        type: 'weekly',
        format: 'html',
        data: reportData as any,
      };

      await storage.createReport(report);
      
      return reportContent;
    } catch (error) {
      console.error('Error generating weekly report:', error);
      throw error;
    }
  }

  private async collectReportData(period: 'daily' | 'weekly'): Promise<ReportData> {
    const [latestMetrics, campaigns, activities] = await Promise.all([
      storage.getLatestMetrics(),
      storage.getCampaigns(),
      storage.getRecentActivities(10),
    ]);

    if (!latestMetrics) {
      throw new Error('No metrics data available for report generation');
    }

    return {
      period,
      metrics: {
        totalLeads: latestMetrics.totalLeads,
        conversionRate: parseFloat(latestMetrics.conversionRate),
        dailyRevenue: parseFloat(latestMetrics.dailyRevenue),
        avgCPA: parseFloat(latestMetrics.avgCPA),
      },
      campaigns: campaigns.slice(0, 5).map(campaign => ({
        name: campaign.name,
        platform: campaign.platform,
        leads: campaign.leads,
        spend: parseFloat(campaign.spend),
        roi: parseFloat(campaign.roi),
      })),
      leadSources: latestMetrics.leadSources,
      activities: activities.map(activity => ({
        type: activity.type,
        source: activity.source,
        details: activity.details,
        timestamp: activity.timestamp,
      })),
    };
  }

  private formatHTMLReport(data: ReportData): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Marketing Report - ${data.period}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #2563EB; color: white; padding: 20px; border-radius: 8px; }
        .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .metric-card { background: #f8fafc; padding: 20px; border-radius: 8px; text-align: center; }
        .metric-value { font-size: 2em; font-weight: bold; color: #2563EB; }
        .metric-label { color: #64748b; margin-top: 5px; }
        .section { margin: 30px 0; }
        .section h2 { color: #1e293b; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
        th { background: #f1f5f9; font-weight: 600; }
        .positive { color: #10b981; }
        .negative { color: #ef4444; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Marketing Dashboard - ${data.period.toUpperCase()} Report</h1>
        <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
    </div>

    <div class="section">
        <h2>Key Metrics</h2>
        <div class="metrics">
            <div class="metric-card">
                <div class="metric-value">${data.metrics.totalLeads.toLocaleString()}</div>
                <div class="metric-label">Total Leads</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${data.metrics.conversionRate.toFixed(1)}%</div>
                <div class="metric-label">Conversion Rate</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">$${data.metrics.dailyRevenue.toLocaleString()}</div>
                <div class="metric-label">Revenue</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">$${data.metrics.avgCPA.toFixed(2)}</div>
                <div class="metric-label">Avg. CPA</div>
            </div>
        </div>
    </div>

    <div class="section">
        <h2>Campaign Performance</h2>
        <table>
            <thead>
                <tr>
                    <th>Campaign</th>
                    <th>Platform</th>
                    <th>Leads</th>
                    <th>Spend</th>
                    <th>ROI</th>
                </tr>
            </thead>
            <tbody>
                ${data.campaigns.map(campaign => `
                    <tr>
                        <td>${campaign.name}</td>
                        <td>${campaign.platform.replace('_', ' ').toUpperCase()}</td>
                        <td>${campaign.leads.toLocaleString()}</td>
                        <td>$${campaign.spend.toLocaleString()}</td>
                        <td class="${campaign.roi > 0 ? 'positive' : 'negative'}">${campaign.roi.toFixed(1)}%</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>

    <div class="section">
        <h2>Lead Sources</h2>
        <table>
            <thead>
                <tr>
                    <th>Source</th>
                    <th>Leads</th>
                    <th>Percentage</th>
                </tr>
            </thead>
            <tbody>
                ${Object.entries(data.leadSources).map(([source, leads]) => {
                  const percentage = (leads / data.metrics.totalLeads * 100).toFixed(1);
                  return `
                    <tr>
                        <td>${source}</td>
                        <td>${leads.toLocaleString()}</td>
                        <td>${percentage}%</td>
                    </tr>
                  `;
                }).join('')}
            </tbody>
        </table>
    </div>

    <div class="section">
        <h2>Recent Activities</h2>
        <table>
            <thead>
                <tr>
                    <th>Type</th>
                    <th>Source</th>
                    <th>Details</th>
                    <th>Time</th>
                </tr>
            </thead>
            <tbody>
                ${data.activities.map(activity => `
                    <tr>
                        <td>${activity.type.replace('_', ' ').toUpperCase()}</td>
                        <td>${activity.source}</td>
                        <td>${activity.details}</td>
                        <td>${new Date(activity.timestamp).toLocaleString()}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>

    <div class="section">
        <p style="text-align: center; color: #64748b; margin-top: 40px;">
            This report was automatically generated by MarketingHub Dashboard
        </p>
    </div>
</body>
</html>
    `;
  }

  async sendReportEmail(reportContent: string, recipient: string): Promise<void> {
    // This would integrate with email service like SendGrid, Nodemailer, etc.
    console.log(`Sending report to ${recipient}`);
    console.log('Report content length:', reportContent.length);
    
    // For now, just log the action
    const activity = {
      type: 'report_sent',
      source: 'Email System',
      details: `Daily report sent to ${recipient}`,
    };
    
    await storage.createActivity(activity);
  }

  async sendReportSlack(reportContent: string, webhookUrl: string): Promise<void> {
    // This would integrate with Slack API
    console.log(`Sending report to Slack webhook: ${webhookUrl}`);
    
    const activity = {
      type: 'report_sent',
      source: 'Slack',
      details: 'Daily report sent to Slack channel',
    };
    
    await storage.createActivity(activity);
  }
}
