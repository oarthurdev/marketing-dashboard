import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { ReportGenerator } from "./services/reportGenerator";
import schedule from "node-schedule"; // Changed from node-cron to node-schedule for potential consistency, assuming it's a typo in the original or a preferred choice. If node-cron is strictly required, revert this.
import { getLeadsByRange, getOpportunitiesByRange, getVisitasAgendadasByRange, getVisitasRealizadasByRange, getReservaByRange, getVendaByRange, getVendaByMonth, getReservaByMonth, getVisitasRealizadasByMonth, getVisitasAgendadasByMonth, getOpportunitiesByMonth, getLeadsByMonth } from "./helpers/getStateByRange.js";
import { makeRequest } from "./services/kommo";
import { db } from "./db"
import { kommoStageMetricsLogs } from "@shared/schema.js";

const RATE_LIMIT_MS = 1000 / 7;

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function normalizeMonthQuery(month?: string): string | null {
  if (!month || month === "current") {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  }

  if (month === "all") {
    return "all";
  }

  if (!/^[0-9]{4}-[0-9]{2}$/.test(month)) {
    return null;
  }

  const [year, monthNum] = month.split("-").map(Number);
  if (isNaN(year) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
    return null;
  }

  return `${year}-${String(monthNum).padStart(2, "0")}`;
}

export async function registerRoutes(app: Express): Promise<Server> {
  const reportGenerator = new ReportGenerator();
  const buildRangeLabel = (monthKey: string) => {
    if (monthKey === "all") return "Todos os meses";
    const [year, mon] = monthKey.split("-").map(Number);
    const targetDate = new Date(year, mon - 1, 1);
    return targetDate.toLocaleDateString("pt-BR", {
      month: "long",
      year: "numeric",
    });
  };

  const handleFunnelRequest = async (req: Request, res: Response) => {
    try {
      const { month } = req.query as { month?: string };
      const monthKey = normalizeMonthQuery(month);

      if (!monthKey) {
        return res.status(400).json({ message: "Invalid month format. Use YYYY-MM, current, or all" });
      }

      const data = await storage.getFunnelByMonth(monthKey);

      return res.json({
        range: monthKey === "all" ? "all" : "monthly",
        rangeLabel: buildRangeLabel(monthKey),
        data,
      });
    } catch (error) {
      console.error("Error fetching funnel:", error);
      return res.status(500).json({ message: "Failed to fetch funnel data" });
    }
  };

  // Schedule daily report generation at 8 AM
  schedule.scheduleJob("0 8 * * *", async () => {
    console.log("Generating daily report...");
    try {
      await reportGenerator.generateDailyReport();
    } catch (error) {
      console.error("Daily report generation failed:", error);
    }
  });

  app.get("/api/dashboard/funnel", handleFunnelRequest);

  app.get(
    "/api/leads-metrics",
    async (_req: Request, res: Response) => {
      try {
        /**
         * Esperado do storage:
         * - getAllPipelines()
         * - getLeadsByStage(pipelineId)
         * - getAverageClosingTime(pipelineId?) ou global
         */

        const pipelines = await storage.getAllPipelines();

        const result = await Promise.all(
          pipelines.map(async (pipeline) => {
            const pipelineId = Number(pipeline.pipelineId);

            const [stages, avgClosingDays] = await Promise.all([
              storage.getLeadsByStage(pipelineId),
              storage.getAverageClosingTime(pipelineId), // 👈 ideal por pipeline
            ]);

            // cache opcional
            storage.setMemoryLeadsByStage(pipelineId, stages);
            storage.setMemoryAverageClosingTime(
              pipelineId,
              avgClosingDays
            );

            return {
              pipelineId,
              pipelineName: pipeline.pipelineName,
              avgClosingDays,
              stages,
            };
          })
        );

        res.json({ pipelines: result });
      } catch (error) {
        console.error("Analytics route error:", error);
        res.status(500).json({
          error: "Erro ao buscar métricas de pipelines",
        });
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

  app.get("/api/dashboard/tags", async (req, res) => {
    try {
      const { month } = req.query as { month?: string };
      const monthKey = normalizeMonthQuery(month);

      if (!monthKey) {
        return res.status(400).json({ message: "Invalid month format. Use YYYY-MM, current, or all" });
      }

      const tags = await storage.getTagCountsByMonth(monthKey);

      return res.json(tags);
    } catch (error) {
      console.error("Error fetching tag counts:", error);
      return res.status(500).json({ message: "Failed to fetch tag counts" });
    }
  });

  // Backward-compatible alias
  app.get("/api/funnel", handleFunnelRequest);

  app.get("/kommo/leads-by-stage-month", async (req: Request, res: Response) => {
    try {
      const { stageId, month } = req.query;

      if (!stageId)
        return res.status(400).json({ error: "stageId obrigatório" });

      let leads;
      if (month && month !== 'current') {
        // Para meses específicos, talvez precise implementar
        leads = await storage.getLeadsByStageCurrentMonth(String(stageId)); // placeholder
      } else {
        leads = await storage.getLeadsByStageCurrentMonth(String(stageId));
      }

      console.log(`Leads estágio ${stageId} mês ${month || 'atual'}:`, leads.length);
      const result = {
        stageId,
        month: month || (new Date().getMonth() + 1),
        year: new Date().getFullYear(),
        total: leads.length
      };

      await db.insert(kommoStageMetricsLogs).values({
        createdAt: new Date().toISOString(),
        payload: JSON.stringify(result)
      }).catch(() => {});

      res.json(result);

    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Erro ao buscar leads do estágio" });
    }
  });

  interface Lead {
    id: number;
    created_at: number;
    status_id: number;
  }

  async function getLeadsByStages(stageIds: string[]): Promise<Lead[]> {
    const all: Lead[] = [];
    let page = 1;

    while (true) {
      const start = Date.now();

      const query = stageIds
        .map((id, i) => `filter[statuses][${i}][pipeline_id]=11795444&filter[statuses][${i}][status_id]=${id}`)
        .join("&");

      console.log("Query:", query);
      
      const res = await makeRequest(`/leads?${query}&page=${page}&limit=250`);
      const leads = res?._embedded?.leads ?? [];

      console.log(`📥 Página ${page}: ${leads.length}`);

      if (!leads.length) break;

      all.push(...leads);

      if (leads.length < 250) break;
      page++;

      // garante limite de 7 req/s
      const elapsed = Date.now() - start;
      if (elapsed < RATE_LIMIT_MS) {
        await sleep(RATE_LIMIT_MS - elapsed);
      }
    }

    console.log("✅ Total leads:", all.length);
    return all;
  }

  /* =======================================================
    BUSCA TEMPO PRIMEIRA RESPOSTA (BATCH)
  ======================================================= */

  async function getFirstResponseTimes(
    leads: Lead[]
  ): Promise<Record<number, number | null>> {

    if (!leads.length) return {};

    const result: Record<number, number | null> = {};

    await Promise.all(
      leads.map(async (lead) => {
        try {
          const res = await makeRequest(
            `/events?filter[entity]=lead&filter[entity_id]=${lead.id}`
          );

          const events = res?._embedded?.events ?? [];

          
          const firstMsg = events.find(
            (e: any) => e.entity_id == 36153911
          );

          console.log(firstMsg)

          result[lead.id] = firstMsg
            ? firstMsg.created_at - lead.created_at
            : null;

        } catch (err) {
          console.error("Erro eventos lead:", lead.id, err);
          result[lead.id] = null;
        }
      })
    );

    return result;
  }

  

  app.get("/kommo/stage-metrics", async (req: Request, res: Response) => {
    try {
      const { month } = req.query as { month?: string };

      const response = month && month !== 'current' 
        ? await storage.getLeadResponseTimesSumsCurrentMonth() // placeholder
        : await storage.getLeadResponseTimesSumsCurrentMonth();

      
      res.json(response);

    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Erro ao calcular média de resposta entre IA x Humano" });
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
