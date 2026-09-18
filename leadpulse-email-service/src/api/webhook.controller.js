const express = require("express");
const { EventWebhook, EventWebhookHeader } = require("@sendgrid/eventwebhook");
const webhookService = require("../services/webhook.service");
const { summaryLogger, failureLogger } = require("../utils/logger");

const router = express.Router();
const SENDGRID_WEBHOOK_PUBLIC_KEY = process.env.SENDGRID_WEBHOOK_PUBLIC_KEY;

/*
 * IMPORTANT:
 * express.raw is required because SendGrid signs the raw bytes.
 * If JSON is parsed first, the signature validation fails.
 */
router.post(
    "/sendgrid",
    express.raw({ type: "application/json" }),
    async (req, res) => {
        try {
            if (!SENDGRID_WEBHOOK_PUBLIC_KEY) {
                return res.status(500).json({ message: "Webhook verification is not configured" });
            }

            const signature = req.get(EventWebhookHeader.SIGNATURE());
            const timestamp = req.get(EventWebhookHeader.TIMESTAMP());

            if (!signature || !timestamp) {
                return res.status(401).json({ message: "Missing SendGrid webhook signature" });
            }

            const eventWebhook = new EventWebhook();
            const publicKey = eventWebhook.convertPublicKeyToECDSA(SENDGRID_WEBHOOK_PUBLIC_KEY);

            const verified = eventWebhook.verifySignature(publicKey, req.body, signature, timestamp);
            if (!verified) {
                return res.status(401).json({ message: "Invalid webhook signature" });
            }

            let events;
            try {
                events = JSON.parse(req.body.toString("utf8"));
            } catch (error) {
                return res.status(400).json({ message: "Invalid webhook JSON" });
            }

            if (!Array.isArray(events)) {
                return res.status(400).json({ message: "Webhook payload must be an array" });
            }

            // Immediately dump raw events into DB Queue
            const { RawWebhook } = require("leadpulse-data-model");
            await RawWebhook.create({
                provider: "sendgrid",
                payload: events,
                status: "pending"
            });

            // Immediately acknowledge SendGrid so the network connection is freed.
            res.status(204).send();

            summaryLogger.info("Webhook batch accepted and queued", { eventCount: events.length });

        } catch (error) {
            failureLogger.error("Webhook route error", { error: error.message });
            // Since we might have already sent a 204, check if headers are sent
            if (!res.headersSent) {
                res.status(500).json({ message: "Internal Server Error" });
            }
        }
    }
);

module.exports = router;
