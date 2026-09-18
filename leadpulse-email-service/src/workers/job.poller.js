const { EmailProcessingJob, Campaign } = require("leadpulse-data-model");
const emailService = require("../services/email.service");
const { summaryLogger } = require("../utils/logger");

const POLL_INTERVAL_MS = Number(process.env.POLL_INTERVAL_MS) || 5000;

class JobPoller {
    constructor() {
        this.running = false;
        this.processingJob = false;
    }

    stop() {
        this.running = false;
        summaryLogger.info("Shutdown requested. Job Poller stopping...");
    }

    async start() {
        if (this.running) return;
        this.running = true;

        summaryLogger.info(`Email job poller started. Polling every ${POLL_INTERVAL_MS}ms`);

        while (this.running) {
            try {
                if (!this.processingJob) {
                    const job = await this.grabNextJob();

                    if (job) {
                        this.processingJob = true;
                        try {
                            await emailService.processJob(job);
                        } finally {
                            this.processingJob = false;
                        }
                    } else {
                        await this.sleep(POLL_INTERVAL_MS);
                    }
                } else {
                    await this.sleep(POLL_INTERVAL_MS);
                }
            } catch (error) {
                summaryLogger.error("Unhandled polling error:", { error: error.message });
                await this.sleep(POLL_INTERVAL_MS);
            }
        }

        summaryLogger.info("Email job poller stopped.");
    }

    async grabNextJob() {
        const job = await EmailProcessingJob.findOne({
            where: { status: "Queued" },
            order: [["createdAt", "ASC"]]
        });

        if (!job) return null;

        await job.update({ status: "Processing" });
        await Campaign.update({ dispatchStatus: "sending" }, { where: { id: job.campaignId } });

        summaryLogger.info(`Picked queued job ${job.id}`);
        return job;
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = new JobPoller();
