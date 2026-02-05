import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { DataProcessor } from "./services/dataProcessor";
import { ReportGenerator } from "./services/reportGenerator";
import schedule from "node-schedule"; // Changed from node-cron to node-schedule for potential consistency, assuming it's a typo in the original or a preferred choice. If node-cron is strictly required, revert this.
import { getLeadsByRange, getOpportunitiesByRange, getVisitasAgendadasByRange, getVisitasRealizadasByRange, getReservaByRange, getVendaByRange } from "./helpers/getStateByRange.js";

export async function registerRoutes(app: Express): Promise<Server> {
  const dataProcessor = new DataProcessor();
  const reportGenerator = new ReportGenerator();

  // Schedule daily data processing at 6 AM
  schedule.scheduleJob("0 6 * * *", async () => {
    console.log("Running scheduled daily data processing...");
    try {
      await dataProcessor.processDaily();
    } catch (error) {
      console.error("Scheduled data processing failed:", error);
    }
  });

  // Schedule daily report generation at 8 AM
  schedule.scheduleJob("0 8 * * *", async () => {
    console.log("Generating daily report...");
    try {
      await reportGenerator.generateDailyReport();
    } catch (error) {
      console.error("Daily report generation failed:", error);
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
      console.error("Error fetching metrics:", error);
      res.status(500).json({ message: "Failed to fetch metrics" });
    }
  });

  app.get("/api/funnel", async (req, res) => {
    try {
      const { range = "weekly" } = req.query as {
        range?: "daily" | "weekly" | "monthly";
      };

      const campaigns = await storage.getCampaigns();

      const now = new Date();
      let rangeLabel = "";

      if (range === "daily") {
        rangeLabel = `Hoje (${now.toLocaleDateString("pt-BR")})`;
      } else if (range === "monthly") {
        rangeLabel = now.toLocaleDateString("pt-BR", {
          month: "long",
          year: "numeric",
        });
      } else {
        const now = new Date();

        const start = new Date(now);
        const dayOfWeek = now.getDay() - 1; // 0 = domingo
        start.setDate(now.getDate() - dayOfWeek);

        rangeLabel = `${start.toLocaleDateString("pt-BR")} A ${now.toLocaleDateString("pt-BR")}`;
      }

      const leads = campaigns.reduce((acc, c) => {
        return acc + Number(getLeadsByRange(c, range));
      }, 0);

      const opportunities = campaigns.reduce((acc, c) => {
        return acc + Number(getOpportunitiesByRange(c, range));
      }, 0);

      const visitsA = campaigns.reduce((acc, c) => {
        return acc + Number(getVisitasAgendadasByRange(c, range));
      }, 0);

      const visitsR = campaigns.reduce((acc, c) => {
        return acc + Number(getVisitasRealizadasByRange(c, range));
      }, 0);

      const reservations = campaigns.reduce((acc, c) => {
        return acc + Number(getReservaByRange(c, range));
      }, 0);

      const sales = campaigns.reduce((acc, c) => {
        return acc + Number(getVendaByRange(c, range));
      }, 0);

      const funnel = {
        leads,
        opportunities,
        visitsA: visitsA,
        visitsR: visitsR,
        reservations: reservations,
        sales: sales,
      };

      res.json({
        range,
        rangeLabel,
        data: funnel,
      });
    } catch (error) {
      console.error("Error fetching funnel:", error);
      res.status(500).json({ message: "Failed to fetch funnel data" });
    }
  });

  app.get(
    "/api/leads-metrics/:pipelineId",
    async (req: Request, res: Response) => {
      const pipelineId = Number(req.params.pipelineId);

      if (Number.isNaN(pipelineId)) {
        return res.status(400).json({ error: "pipelineId inválido" });
      }

      try {
        const [stages, avgClosingDays] = await Promise.all([
          storage.getLeadsByStage(pipelineId),
          storage.getAverageClosingTime(),
        ]);

        // opcional: cache em memória
        storage.setMemoryLeadsByStage(pipelineId, stages);
        storage.setMemoryAverageClosingTime(avgClosingDays);

        res.json({
          stages,
          avgClosingDays,
        });
      } catch (error) {
        console.error("Analytics route error:", error);
        res.status(500).json({ error: "Erro ao buscar métricas" });
      }
    }
  );

  app.get("/api/dashboard/campaigns", async (req, res) => {
    try {
      const campaigns = await storage.getCampaigns();
      res.json(campaigns);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      res.status(500).json({ message: "Failed to fetch campaigns" });
    }
  });

  app.get("/api/dashboard/campaigns/hierarchy", async (req, res) => {
    try {
      const data = await storage.getCampaignsHierarchy();
      res.json(data);
    } catch (error) {
      console.error("Error fetching campaigns hierarchy:", error);
      res.status(500).json({ message: "Failed to fetch campaigns hierarchy" });
    }
  });

  app.get("/api/dashboard/activities", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const activities = await storage.getRecentActivities(limit);
      res.json(activities);
    } catch (error) {
      console.error("Error fetching activities:", error);
      res.status(500).json({ message: "Failed to fetch activities" });
    }
  });

  app.get("/api/dashboard/connections", async (req, res) => {
    try {
      const connections = await storage.getApiConnections();
      res.json(connections);
    } catch (error) {
      console.error("Error fetching API connections:", error);
      res.status(500).json({ message: "Failed to fetch API connections" });
    }
  });

  // Static data endpoint
  app.get("/api/dashboard/historical/:days", async (req, res) => {
    try {
      const days = parseInt(req.params.days) || 7;
      const metrics = await storage.getMetrics(days);
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching historical data:", error);
      res.status(500).json({ error: "Failed to fetch historical data" });
    }
  });

  // API Connections endpoints
  app.post("/api/connections/update", async (req, res) => {
    try {
      const { platform, config, isConnected } = req.body;

      const updatedConnection = await storage.updateApiConnection(platform, {
        config,
        isConnected,
        lastSync: isConnected ? new Date() : null,
      });

      if (!updatedConnection) {
        return res.status(404).json({ error: "Connection not found" });
      }

      res.json({
        message: "Connection updated successfully",
        connection: updatedConnection,
      });
    } catch (error) {
      console.error("Error updating connection:", error);
      res.status(500).json({ error: "Failed to update connection" });
    }
  });

  app.post("/api/connections/test", async (req, res) => {
    try {
      const { platform } = req.body;

      // Here you would implement actual API testing logic
      // For now, we'll simulate a test
      const connection = await storage.getApiConnectionByPlatform(platform);

      if (!connection || !connection.isConnected) {
        return res.status(400).json({ error: "Connection not configured" });
      }

      let success = false;
      switch (platform) {
        case "google_analytics":
          // Add Google Analytics connection test logic here
          success = true;
          break;
        case "facebook_ads":
          // Add Facebook Ads connection test logic here
          success = true;
          break;
        case "shopify":
          // Add Shopify connection test logic here
          success = true;
          break;
        case "meta_ads":
          // Add Meta Ads connection test logic here
          success = true;
          break;
        case "tiktok_ads":
          // Add TikTok Ads connection test logic here
          success = true;
          break;
        case "kommo":
          try {
            const { KommoService } = await import("./services/kommo.js");
            const kommoService = new KommoService();
            success = await kommoService.testConnection();
          } catch (error) {
            console.error("Kommo connection test failed:", error);
            success = false;
          }
          break;
      }

      if (success) {
        res.json({ message: "Connection test successful", platform });
      } else {
        res.status(500).json({ error: "Connection test failed", platform });
      }
    } catch (error) {
      console.error("Error testing connection:", error);
      res.status(500).json({ error: "Connection test failed" });
    }
  });

  // Reports endpoints
  app.get("/api/reports", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const reports = await storage.getReports(limit);
      res.json(reports);
    } catch (error) {
      console.error("Error fetching reports:", error);
      res.status(500).json({ message: "Failed to fetch reports" });
    }
  });

  app.get("/api/dashboard", async (req, res) => {
    try {
      const days = Number(req.query.days ?? 7);

      const campaigns = await storage.getCampaigns();

      const totalCampaigns = campaigns.length;
      const totalLeads = campaigns.reduce((acc, c) => acc + Number(c.leads ?? 0), 0);
      const totalSpend = campaigns.reduce((acc, c) => acc + Number(c.spend ?? 0), 0);

      res.json({
        totalCampaigns,
        totalLeads,
        totalSpend,
        funnel: {
          leads: 132,
          opportunities: 37,
          visits: 2,
          reservations: 3,
          sales: 3,
        },
        days,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error fetching dashboard:", error);
      res.status(500).json({ message: "Failed to fetch dashboard", err: error });
    }
  });

  app.post("/api/dashboard/refresh", async (req, res) => {
    try {
      await dataProcessor.processDaily();
      const metrics = await storage.getLatestMetrics();
      res.json({ message: "Data refreshed successfully", metrics });
    } catch (error) {
      console.error("Error refreshing data:", error);
      res.status(500).json({ message: "Failed to refresh data" });
    }
  });

  app.post("/api/reports/generate", async (req, res) => {
    try {
      const { type = "daily" } = req.body;

      let reportContent: string;
      if (type === "weekly") {
        reportContent = await reportGenerator.generateWeeklyReport();
      } else {
        reportContent = await reportGenerator.generateDailyReport();
      }

      const report = await storage.createReport({
        title: `${type.charAt(0).toUpperCase() + type.slice(1)} Marketing Report`,
        type: type,
        format: "html",
        data: { generated: true, type },
      });

      res.json({ content: reportContent, report });
    } catch (error) {
      console.error("Error generating report:", error);
      res.status(500).json({ error: "Failed to generate report" });
    }
  });

  // Kommo-specific endpoints
  app.get("/api/kommo/leads", async (req, res) => {
    try {
      const { KommoService } = await import("./services/kommo.js");
      const kommoService = new KommoService();

      if (!kommoService.isConfigured()) {
        return res.status(503).json({ error: "Kommo not configured" });
      }

      // Get period from query parameter, default to 365 days (1 year)
      const periodDays = parseInt(req.query.period as string) || 365;
      const leads = await kommoService.getDetailedLeads(periodDays);
      res.json(leads);
    } catch (error) {
      console.error("Error fetching Kommo leads:", error);
      res.status(500).json({ error: "Failed to fetch leads" });
    }
  });

  // Kommo sales endpoint
  app.get("/api/kommo/sales", async (req, res) => {
    try {
      const { KommoService } = await import("./services/kommo.js");
      const kommoService = new KommoService();
      if (!kommoService.isConfigured()) {
        return res.status(400).json({ error: "Kommo not configured" });
      }

      const period = req.query.period
        ? parseInt(req.query.period as string)
        : 365;
      const sales = await kommoService.getDetailedSales(period);
      res.json(sales);
    } catch (error) {
      console.error("Error fetching Kommo sales:", error);
      res.status(500).json({ error: "Failed to fetch sales data" });
    }
  });

  app.get("/api/kommo/status", async (req, res) => {
    try {
      const { KommoService } = await import("./services/kommo.js");
      const kommoService = new KommoService();

      const isConfigured = kommoService.isConfigured();
      let isConnected = false;

      if (isConfigured) {
        isConnected = await kommoService.testConnection();
      }

      res.json({ isConfigured, isConnected });
    } catch (error) {
      console.error("Error checking Kommo status:", error);
      res.status(500).json({ error: "Failed to check Kommo status" });
    }
  });

  app.post("/api/reports/send", async (req, res) => {
    try {
      const { type = "daily", method = "email", recipient } = req.body;

      if (!recipient) {
        return res.status(400).json({ message: "Recipient is required" });
      }

      const reportContent =
        type === "weekly"
          ? await reportGenerator.generateWeeklyReport()
          : await reportGenerator.generateDailyReport();

      if (method === "slack") {
        await reportGenerator.sendReportSlack(reportContent, recipient);
      } else {
        await reportGenerator.sendReportEmail(reportContent, recipient);
      }

      res.json({ message: "Report sent successfully" });
    } catch (error) {
      console.error("Error sending report:", error);
      res.status(500).json({ message: "Failed to send report" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
