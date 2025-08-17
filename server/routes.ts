import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { DataProcessor } from "./services/dataProcessor";
import { ReportGenerator } from "./services/reportGenerator";
import cron from "node-cron";

export async function registerRoutes(app: Express): Promise<Server> {
  const dataProcessor = new DataProcessor();
  const reportGenerator = new ReportGenerator();

  // Schedule daily data processing at 6 AM
  cron.schedule('0 6 * * *', async () => {
    console.log('Running scheduled daily data processing...');
    try {
      await dataProcessor.processDaily();
    } catch (error) {
      console.error('Scheduled data processing failed:', error);
    }
  });

  // Schedule daily report generation at 8 AM
  cron.schedule('0 8 * * *', async () => {
    console.log('Generating daily report...');
    try {
      await reportGenerator.generateDailyReport();
    } catch (error) {
      console.error('Daily report generation failed:', error);
    }
  });

  // API Routes
  app.get("/api/dashboard/metrics", async (req, res) => {
    try {
      const metrics = await storage.getLatestMetrics();
      if (!metrics) {
        // If no metrics exist, trigger initial data processing
        await dataProcessor.processDaily();
        const newMetrics = await storage.getLatestMetrics();
        return res.json(newMetrics);
      }
      res.json(metrics);
    } catch (error) {
      console.error('Error fetching metrics:', error);
      res.status(500).json({ message: 'Failed to fetch metrics' });
    }
  });

  app.get("/api/dashboard/campaigns", async (req, res) => {
    try {
      const campaigns = await storage.getCampaigns();
      res.json(campaigns);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      res.status(500).json({ message: 'Failed to fetch campaigns' });
    }
  });

  app.get("/api/dashboard/activities", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const activities = await storage.getRecentActivities(limit);
      res.json(activities);
    } catch (error) {
      console.error('Error fetching activities:', error);
      res.status(500).json({ message: 'Failed to fetch activities' });
    }
  });

  app.get("/api/dashboard/connections", async (req, res) => {
    try {
      const connections = await storage.getApiConnections();
      res.json(connections);
    } catch (error) {
      console.error('Error fetching API connections:', error);
      res.status(500).json({ message: 'Failed to fetch API connections' });
    }
  });

  // Static data endpoint
  app.get('/api/dashboard/historical/:days', async (req, res) => {
    try {
      const days = parseInt(req.params.days) || 7;
      const metrics = await storage.getMetrics(days);
      res.json(metrics);
    } catch (error) {
      console.error('Error fetching historical data:', error);
      res.status(500).json({ error: 'Failed to fetch historical data' });
    }
  });

  // API Connections endpoints
  app.post('/api/connections/update', async (req, res) => {
    try {
      const { platform, config, isConnected } = req.body;

      const updatedConnection = await storage.updateApiConnection(platform, {
        config,
        isConnected,
        lastSync: isConnected ? new Date() : null
      });

      if (!updatedConnection) {
        return res.status(404).json({ error: 'Connection not found' });
      }

      res.json({ message: 'Connection updated successfully', connection: updatedConnection });
    } catch (error) {
      console.error('Error updating connection:', error);
      res.status(500).json({ error: 'Failed to update connection' });
    }
  });

  app.post('/api/connections/test', async (req, res) => {
    try {
      const { platform } = req.body;

      // Here you would implement actual API testing logic
      // For now, we'll simulate a test
      const connection = await storage.getApiConnectionByPlatform(platform);

      if (!connection || !connection.isConnected) {
        return res.status(400).json({ error: 'Connection not configured' });
      }

      // Simulate API test (replace with actual API calls)
      await new Promise(resolve => setTimeout(resolve, 1000));

      res.json({ message: 'Connection test successful', platform });
    } catch (error) {
      console.error('Error testing connection:', error);
      res.status(500).json({ error: 'Connection test failed' });
    }
  });

  // Reports endpoints
  app.get('/api/reports', async (req, res) => {
    try {
      const reports = await storage.getReports(20);
      res.json(reports);
    } catch (error) {
      console.error('Error fetching reports:', error);
      res.status(500).json({ error: 'Failed to fetch reports' });
    }
  });

  app.post("/api/dashboard/refresh", async (req, res) => {
    try {
      await dataProcessor.processDaily();
      const metrics = await storage.getLatestMetrics();
      res.json({ message: 'Data refreshed successfully', metrics });
    } catch (error) {
      console.error('Error refreshing data:', error);
      res.status(500).json({ message: 'Failed to refresh data' });
    }
  });

  app.post("/api/reports/generate", async (req, res) => {
    try {
      const { type = 'daily' } = req.body;

      let reportContent: string;
      if (type === 'weekly') {
        reportContent = await reportGenerator.generateWeeklyReport();
      } else {
        reportContent = await reportGenerator.generateDailyReport();
      }

      res.json({ 
        message: 'Report generated successfully',
        content: reportContent 
      });
    } catch (error) {
      console.error('Error generating report:', error);
      res.status(500).json({ message: 'Failed to generate report' });
    }
  });

  app.get("/api/reports", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const reports = await storage.getReports(limit);
      res.json(reports);
    } catch (error) {
      console.error('Error fetching reports:', error);
      res.status(500).json({ message: 'Failed to fetch reports' });
    }
  });

  app.post("/api/reports/send", async (req, res) => {
    try {
      const { type = 'daily', method = 'email', recipient } = req.body;

      if (!recipient) {
        return res.status(400).json({ message: 'Recipient is required' });
      }

      const reportContent = type === 'weekly' 
        ? await reportGenerator.generateWeeklyReport()
        : await reportGenerator.generateDailyReport();

      if (method === 'slack') {
        await reportGenerator.sendReportSlack(reportContent, recipient);
      } else {
        await reportGenerator.sendReportEmail(reportContent, recipient);
      }

      res.json({ message: 'Report sent successfully' });
    } catch (error) {
      console.error('Error sending report:', error);
      res.status(500).json({ message: 'Failed to send report' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}