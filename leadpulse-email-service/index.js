const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "..", ".env") });

const express = require("express");
const webhookController = require("./src/api/webhook.controller");
const trackingController = require("./src/api/tracking.controller.js");
const jobPoller = require("./src/workers/job.poller");
const webhookPoller = require("./src/workers/webhook.poller");
const { summaryLogger } = require("./src/utils/logger");

const PORT = Number(process.env.EMAIL_SERVICE_PORT) || 4000;
const app = express();

// Register routes
app.use("/api/v1/webhooks", webhookController);
app.use("/api/v1/track", trackingController);

app.get("/health", (req, res) => {
    res.status(200).json({ service: "leadpulse-email-service", status: "ok" });
});

// Start HTTP Server
const server = app.listen(PORT, () => {
    summaryLogger.info(`HTTP server listening on port ${PORT}`);
    summaryLogger.info(`SendGrid webhook mapped to: http://localhost:${PORT}/api/v1/webhooks/sendgrid`);
});

// Start Background Workers
jobPoller.start();
webhookPoller.start();

// Graceful Shutdown
async function shutdown(signal) {
    summaryLogger.info(`${signal} received. Shutting down...`);
    
    // 1. Stop taking new jobs
    jobPoller.stop();
    webhookPoller.stop();

    // 2. Stop accepting HTTP traffic
    server.close(() => {
        summaryLogger.info("HTTP server closed.");
        process.exit(0);
    });

    // 3. Fallback killswitch
    setTimeout(() => {
        console.error("Forced shutdown due to timeout.");
        process.exit(1);
    }, 10000);
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

process.on("uncaughtException", (error) => {
    summaryLogger.error("Uncaught exception:", { error: error.message, stack: error.stack });
});

process.on("unhandledRejection", (error) => {
    summaryLogger.error("Unhandled rejection:", { error: error.message });
});
