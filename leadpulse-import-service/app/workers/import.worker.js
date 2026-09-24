const { ImportJob, sequelize } = require('leadpulse-data-model');
const logger = require('../utils/logger');
const importService = require('../services/import.service');

class ImportWorker {
  constructor() {
    this.pollInterval = process.env.POLL_INTERVAL || 10000;
    this.isRunning = false;
    this.isShuttingDown = false; 
  }

  start() {
    logger.info(`Starting ImportWorker polling every ${this.pollInterval}ms`);
    
    // Listen for AWS scale-down signals
    process.on('SIGTERM', () => this.gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => this.gracefulShutdown('SIGINT'));

    this.timer = setInterval(() => this.poll(), this.pollInterval);
    this.poll();
  }

  gracefulShutdown(signal) {
    logger.info(`Received ${signal}. Preventing new jobs from starting...`);
    this.isShuttingDown = true;
    clearInterval(this.timer);
    
    if (!this.isRunning) {
      logger.info('No jobs running. Shutting down safely.');
      process.exit(0);
    } else {
      logger.info('Waiting for current CSV import to finish before shutting down...');
    }
  }

  async poll() {
    // Prevent overlapping or grabbing new jobs if AWS is shutting us down
    if (this.isRunning || this.isShuttingDown) return; 
    
    this.isRunning = true;
    try {
      const job = await sequelize.transaction(async (t) => {
        const lockedJob = await ImportJob.findOne({
          where: { status: 'Uploaded' },
          order: [['createdAt', 'ASC']],
          lock: true,
          skipLocked: true, // If another container locked it, skip to the next one
          transaction: t
        });

        if (lockedJob) {
          lockedJob.status = 'Processing';
          await lockedJob.save({ transaction: t });
        }
        return lockedJob;
      });

      if (!job) {
        this.isRunning = false;
        return; 
      }

      logger.info(`Successfully locked job ${job.id}. Starting data ingestion...`);
      await importService.processJob(job.id);
      logger.info(`Job ${job.id} processing cycle complete.`);
      
    } catch (error) {
      logger.error('Error during ImportWorker polling cycle', { error: error.message, stack: error.stack });
    } finally {
      this.isRunning = false;
      
      // If AWS asked us to shut down, and we just finished the job, exit safely now
      if (this.isShuttingDown) {
        logger.info('Job finished. Safely shutting down container now.');
        process.exit(0);
      }
    }
  }
}

module.exports = new ImportWorker();