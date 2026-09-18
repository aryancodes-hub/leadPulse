const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { MasterContact, ClientLead, LeadListMembership, ImportJob, sequelize } = require('leadpulse-data-model');
const logger = require('../utils/logger');

// Resolve workspace root uploads directory
const UPLOADS_DIR = path.resolve(__dirname, '../../../uploads');

class ImportService {
  async processJob(jobId) {
    const job = await ImportJob.findByPk(jobId);
    if (!job) {
      logger.error(`ImportJob ${jobId} not found`);
      return;
    }

    const sourceFilePath = path.join(UPLOADS_DIR, job.s3SourceFileKey);
    
    // In local dev, uploads dir might not exist until first upload. Create if missing.
    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }

    if (!fs.existsSync(sourceFilePath)) {
      logger.error(`Source file not found for job ${jobId}: ${sourceFilePath}`);
      job.status = 'Failed';
      await job.save();
      return;
    }

    const errorFileName = `error_${job.id}.csv`;
    const errorFilePath = path.join(UPLOADS_DIR, errorFileName);
    
    let totalRows = 0;
    let successfulRows = 0;
    let failedRows = 0;
    let errorStream = null;

    const processRow = async (row) => {
      totalRows++;
      
      const email = row.email ? row.email.trim().toLowerCase() : null;
      if (!email) {
        throw new Error('Email field is missing or empty');
      }

      // 1. Upsert MasterContact
      const [contact] = await MasterContact.findOrCreate({
        where: { email },
        defaults: {
          firstName: row.firstName || null,
          lastName: row.lastName || null,
          phone: row.phone || null,
          company: row.company || null,
          jobTitle: row.jobTitle || null,
          industry: row.industry || null
        }
      });
      
      // 2. Upsert ClientLead
      const [clientLead] = await ClientLead.findOrCreate({
        where: { clientId: job.clientId, masterContactId: contact.id },
        defaults: {
          source: row.source || 'CSV Import'
        }
      });

      // 3. Insert LeadListMembership
      await LeadListMembership.findOrCreate({
        where: { leadListId: job.leadListId, clientLeadId: clientLead.id },
        defaults: { status: 'Pending' }
      });
    };

    return new Promise((resolve, reject) => {
      const rows = [];
      fs.createReadStream(sourceFilePath)
        .pipe(csv())
        .on('data', (data) => rows.push(data))
        .on('end', async () => {
          try {
            logger.info(`Parsed ${rows.length} rows for job ${job.id}. Starting database inserts...`);
            
            // Sequential processing for safety on DB connections
            for (const row of rows) {
              try {
                await processRow(row);
                successfulRows++;
              } catch (err) {
                failedRows++;
                if (!errorStream) {
                  errorStream = fs.createWriteStream(errorFilePath);
                  errorStream.write('email,error_message\n'); // CSV Header
                }
                const safeEmail = row.email ? `"${row.email.replace(/"/g, '""')}"` : '""';
                const safeError = `"${err.message.replace(/"/g, '""')}"`;
                errorStream.write(`${safeEmail},${safeError}\n`);
              }
              
              // Report progress every 50 rows
              if (totalRows % 50 === 0) {
                 job.processedRows = totalRows;
                 job.progressPercentage = Math.round((totalRows / rows.length) * 100);
                 await job.save();
              }
            }

            if (errorStream) {
              errorStream.end();
              job.s3ErrorFileKey = errorFileName;
            }

            job.totalRows = totalRows;
            job.processedRows = totalRows;
            job.successfulRows = successfulRows;
            job.failedRows = failedRows;
            job.progressPercentage = 100;
            job.status = failedRows > 0 ? 'Completed_with_Errors' : 'Completed';
            
            await job.save();
            logger.info(`Job ${job.id} finished processing. Success: ${successfulRows}, Failed: ${failedRows}`);
            resolve();
          } catch (fatalErr) {
            logger.error(`Fatal error processing job ${job.id}`, { error: fatalErr.message });
            job.status = 'Failed';
            await job.save();
            reject(fatalErr);
          }
        })
        .on('error', async (streamErr) => {
          logger.error(`Stream error reading CSV for job ${job.id}`, { error: streamErr.message });
          job.status = 'Failed';
          await job.save();
          reject(streamErr);
        });
    });
  }
}

module.exports = new ImportService();
