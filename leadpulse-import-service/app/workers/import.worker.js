const { ImportJob } = require('leadpulse-data-model');
const logger = require('../utils/logger');
const importService = require('../services/import.service');

class ImportWorker {
  constructor() {
    this.pollInterval = process.env.POLL_INTERVAL || 10000; // 10 seconds
    this.isRunning = false;
  }

  start() {
    logger.info(`Starting ImportWorker polling every ${this.pollInterval}ms`);
    setInterval(() => this.poll(), this.pollInterval);
    this.poll(); // Immediate first run
  }

  async poll() {
    if (this.isRunning) return; // Prevent overlapping runs
    
    this.isRunning = true;
    try {
      // 1. Find the oldest job that is 'Uploaded'
      const job = await ImportJob.findOne({
        where: { status: 'Uploaded' },
        order: [['createdAt', 'ASC']]
      });

      if (!job) {
        this.isRunning = false;
        return; // No jobs found
      }

      logger.info(`Found new import job: ${job.id}. Locking for processing...`);

      // 2. Lock the job by changing status to 'Processing'
      job.status = 'Processing';
      await job.save();

      // 3. Process the file
      logger.info(`Starting data ingestion for job: ${job.id}...`);
      await importService.processJob(job.id);
      
      logger.info(`Job ${job.id} processing cycle complete.`);
      
    } catch (error) {
      logger.error('Error during ImportWorker polling cycle', { error: error.message, stack: error.stack });
    } finally {
      this.isRunning = false;
    }
  }
}

module.exports = new ImportWorker();
