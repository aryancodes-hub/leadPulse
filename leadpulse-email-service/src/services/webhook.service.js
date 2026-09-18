const { LeadEngagement } = require("leadpulse-data-model");
const { summaryLogger, failureLogger } = require("../utils/logger");

class WebhookService {
    /**
     * Processes a single SendGrid event safely using atomic increments.
     * Prevents race conditions and minimizes database wait time.
     */
    async processEvent(event) {
        const eventType = this.normalizeEventName(event.event);
        const trackingToken = event.custom_args?.tracking_token;

        if (!trackingToken) return;

        const eventTime = event.timestamp ? new Date(Number(event.timestamp) * 1000) : new Date();

        try {
            // DELIVERY
            if (eventType === "delivered") {
                await LeadEngagement.update(
                    { status: "delivered", deliveredAt: eventTime },
                    { where: { trackingToken } }
                );
                summaryLogger.info("Email delivered", { trackingToken });
                return;
            }

            // BOUNCE
            if (eventType === "bounce") {
                await LeadEngagement.update(
                    { 
                        status: "bounced", 
                        bounceType: event.type || event.bounce_classification || "unknown",
                        errorMessage: event.reason || event.response || null
                    },
                    { where: { trackingToken } }
                );
                summaryLogger.info("Email bounced", { trackingToken });
                return;
            }

            // SPAM REPORT
            if (eventType === "spamreport") {
                await LeadEngagement.update(
                    { status: "spamreport" },
                    { where: { trackingToken } }
                );
                summaryLogger.info("Email marked as spam", { trackingToken });
                return;
            }

            // 🔥 OPTIMIZATION 2: ATOMIC DB COUNTERS (Prevents race conditions)

            // OPEN
            if (eventType === "open") {
                await LeadEngagement.increment('openCount', { by: 1, where: { trackingToken } });
                await LeadEngagement.update(
                    { openedAt: eventTime },
                    { where: { trackingToken, openedAt: null } } // Only set if null
                );
                summaryLogger.info("Email opened", { trackingToken });
                return;
            }

            // CLICK
            if (eventType === "click") {
                await LeadEngagement.increment('clickCount', { by: 1, where: { trackingToken } });
                await LeadEngagement.update(
                    { clickedAt: eventTime },
                    { where: { trackingToken, clickedAt: null } } // Only set if null
                );
                summaryLogger.info("Email link clicked", { trackingToken, url: event.url });
                return;
            }

        } catch (error) {
            failureLogger.error("Failed to update engagement for webhook", {
                trackingToken, error: error.message
            });
        }
    }

    normalizeEventName(eventName) {
        if (!eventName) return "";
        return eventName.toLowerCase().replace(/\s+/g, "");
    }
}

module.exports = new WebhookService();
