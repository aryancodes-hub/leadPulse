const fs = require('fs');
const path = require('path');
const os = require('os'); // Added for temp dir
const csv = require('csv-parser');
const { MasterContact, ClientLead, LeadListMembership, ImportJob, sequelize } = require('leadpulse-data-model');
const logger = require('../utils/logger');
const { S3Client, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3'); // AWS SDK

// Resolve workspace variables
const UPLOADS_DIR = path.resolve(__dirname, '../../../uploads');
const TEMP_DIR = os.tmpdir();
const STORAGE_PROVIDER = process.env.STORAGE_PROVIDER || 'local';
const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME;

const s3Client = STORAGE_PROVIDER === 's3' 
  ? new S3Client({ region: process.env.AWS_REGION || 'us-east-1' }) 
  : null;

class ImportService {
  
  // 🚀 Helper to seamlessly stream from either Local or S3
  async getReadStream(fileKey) {
    if (STORAGE_PROVIDER === 's3') {
      const command = new GetObjectCommand({ Bucket: S3_BUCKET_NAME, Key: fileKey });
      const response = await s3Client.send(command);
      return response.Body; // S3 returns a readable stream!
    } else {
      const filePath = path.join(UPLOADS_DIR, fileKey);
      if (!fs.existsSync(filePath)) throw new Error(`Local file not found: ${filePath}`);
      return fs.createReadStream(filePath);
    }
  }

  // 🚀 Helper to upload error CSVs to either Local or S3
  async uploadErrorFile(fileKey, localFilePath) {
    if (STORAGE_PROVIDER === 's3') {
      const fileStream = fs.createReadStream(localFilePath);
      const command = new PutObjectCommand({ Bucket: S3_BUCKET_NAME, Key: fileKey, Body: fileStream });
      await s3Client.send(command);
    } else {
      if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
      fs.copyFileSync(localFilePath, path.join(UPLOADS_DIR, fileKey));
    }
  }

  async processJob(jobId) {
    const job = await ImportJob.findByPk(jobId);
    if (!job) {
      logger.error(`ImportJob ${jobId} not found`);
      return;
    }

    const errorFileName = `error_${job.id}.csv`;
    const tempErrorFilePath = path.join(TEMP_DIR, errorFileName); // Write error logs locally first
    
    let totalRows = 0;
    let successfulRows = 0;
    let failedRows = 0;
    let errorStream = null;

    const processRow = async (row) => {
      totalRows++;
      
      const email = row.email ? row.email.trim().toLowerCase() : null;
      if (!email) throw new Error('Email field is missing or empty');

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
        defaults: { source: row.source || 'CSV Import' }
      });

      // 3. Insert LeadListMembership
      await LeadListMembership.findOrCreate({
        where: { leadListId: job.leadListId, clientLeadId: clientLead.id },
        defaults: { status: 'Pending' }
      });
    };

    return new Promise(async (resolve, reject) => {
      try {
        const stream = await this.getReadStream(job.s3SourceFileKey);
        const rows = [];
        
        stream
          .pipe(csv())
          .on('data', (data) => rows.push(data))
          .on('end', async () => {
            try {
              logger.info(`Parsed ${rows.length} rows for job ${job.id}. Starting database inserts...`);
              
              for (const row of rows) {
                try {
                  await processRow(row);
                  successfulRows++;
                } catch (err) {
                  failedRows++;
                  if (!errorStream) {
                    errorStream = fs.createWriteStream(tempErrorFilePath);
                    errorStream.write('email,error_message\n'); 
                  }
                  const safeEmail = row.email ? `"${row.email.replace(/"/g, '""')}"` : '""';
                  const safeError = `"${err.message.replace(/"/g, '""')}"`;
                  errorStream.write(`${safeEmail},${safeError}\n`);
                }
                
                if (totalRows % 50 === 0) {
                   job.processedRows = totalRows;
                   job.progressPercentage = Math.round((totalRows / rows.length) * 100);
                   await job.save();
                }
              }

              // 🚀 If errors happened, safely upload the error CSV to S3 (or Local)
              if (errorStream) {
                errorStream.end();
                await new Promise((res) => errorStream.on('finish', res)); // Wait for local write to finish
                await this.uploadErrorFile(errorFileName, tempErrorFilePath);
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
      } catch (err) {
        logger.error(`Failed to initialize read stream for job ${job.id}`, { error: err.message });
        job.status = 'Failed';
        await job.save();
        reject(err);
      }
    });
  }
}

module.exports = new ImportService();