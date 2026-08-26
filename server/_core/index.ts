import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import path from "path";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { getMetaConfig } from "../meta/config";
import { logSafe } from "../meta/safeLog";
import { handleWebhookVerify, processWebhookPayload, verifyWebhookSignature } from "../meta/webhooks";
import { registerYouTubeOAuthRoutes } from "../youtube/oauth";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  app.disable("x-powered-by");
  app.get("/api/audit/evidence.pdf", (_req, res) => {
    const evidencePath = path.resolve(process.cwd(), "docs/audit/LEGAL_AND_OAUTH_EVIDENCE_EN.pdf");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'inline; filename="small-stories-youtube-audit-evidence.pdf"');
    res.sendFile(evidencePath, (error) => {
      if (error && !res.headersSent) res.status(404).json({ error: "Audit evidence is unavailable" });
    });
  });
  // The raw route must be registered before generic JSON parsing. Meta signs
  // the exact bytes of the notification body.
  app.get("/api/meta/webhook", (req, res) => {
    const config = getMetaConfig();
    const result = handleWebhookVerify({
      mode: req.query["hub.mode"] as string | undefined,
      token: req.query["hub.verify_token"] as string | undefined,
      challenge: req.query["hub.challenge"] as string | undefined,
    }, config?.verifyToken);
    res.status(result.status).type("text/plain").send(result.body);
  });
  app.post("/api/meta/webhook", express.raw({ type: "application/json", limit: "1mb" }), async (req, res) => {
    const config = getMetaConfig();
    const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from(req.body ?? "");
    if (!config || !verifyWebhookSignature(rawBody, req.header("x-hub-signature-256"), config.appSecret)) {
      res.status(401).json({ error: "Invalid signature" });
      return;
    }
    res.status(200).json({ received: true });
    let payload: unknown;
    try {
      payload = JSON.parse(rawBody.toString("utf8"));
    } catch {
      logSafe("warn", "Received non-JSON webhook body with a valid signature");
      return;
    }
    try {
      await processWebhookPayload(rawBody, payload);
    } catch (error) {
      logSafe("error", "Webhook processing pipeline error", error);
    }
  });
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  registerYouTubeOAuthRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
