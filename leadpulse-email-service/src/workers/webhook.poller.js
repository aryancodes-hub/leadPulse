const { RawWebhook } = require("leadpulse-data-model");
const webhookService = require("../services/webhook.service");
const { summaryLogger, failureLogger } = require("../utils/logger");

const POLL_INTERVAL_MS = Number(process.env.WEBHOOK_POLL_INTERVAL_MS) || 5000;

class WebhookPoller {
    constructor() {
        this.running = false;
        this.processingBatch = false;
    }

    stop() {
        this.running = false;
        summaryLogger.info("Shutdown requested. Webhook Poller stopping...");
    }

    async start() {
        if (this.running) return;
        this.running = true;

        summaryLogger.info(`Webhook queue poller started. Polling every ${POLL_INTERVAL_MS}ms`);

        while (this.running) {
            try {
                if (!this.processingBatch) {
                    const processedAny = await this.processPendingWebhooks();
                    
                    // If no webhooks were processed, sleep to prevent spamming the DB
                    if (!processedAny) {
                        await this.sleep(POLL_INTERVAL_MS);
                    }
                } else {
                    await this.sleep(POLL_INTERVAL_MS);
                }
            } catch (error) {
                failureLogger.error("Unhandled webhook polling error:", { error: error.message });
                await this.sleep(POLL_INTERVAL_MS);
            }
        }

        summaryLogger.info("Webhook queue poller stopped.");
    }

    async processPendingWebhooks() {
        this.processingBatch = true;
        
        try {
            // Grab a batch of pending webhook payloads
            const pendingWebhooks = await RawWebhook.findAll({
                where: { status: "pending" },
                limit: 50,
                order: [["createdAt", "ASC"]]
            });

            if (pendingWebhooks.length === 0) {
                return false;
            }

            for (const rawWebhook of pendingWebhooks) {
                try {
                    const events = rawWebhook.payload;
                    
                    if (Array.isArray(events)) {
                        // Using Promise.allSettled guarantees that one bad event won't fail the whole array
                        await Promise.allSettled(events.map(event => webhookService.processEvent(event)));
                    }

                    await rawWebhook.update({ status: "processed" });
                    
                } catch (error) {
                    failureLogger.error(`Failed to process RawWebhook ID ${rawWebhook.id}`, { error: error.message });
                    await rawWebhook.update({ 
                        status: "failed", 
                        errorMessage: error.message 
                    });
                }
            }

            return true;

        } finally {
            this.processingBatch = false;
        }
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = new WebhookPoller();
