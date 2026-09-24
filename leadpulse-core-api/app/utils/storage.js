const fs = require('fs');
const path = require('path');
const logger = require('./logger');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

// Toggles between 's3' and 'local' based on .env
const STORAGE_PROVIDER = process.env.STORAGE_PROVIDER || 'local';
const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME;

// Only initialize AWS S3 if we are using it
const s3Client = STORAGE_PROVIDER === 's3' 
  ? new S3Client({ region: process.env.AWS_REGION || 'us-east-1' }) 
  : null;

class StorageService {
  constructor() {
    this.uploadDir = path.resolve(__dirname, '../../../uploads');
    if (STORAGE_PROVIDER === 'local' && !fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async uploadFile(file, prefix = 'import') {
    const fileKey = `${prefix}_${Date.now()}_${file.originalname.replace(/\s+/g, '_')}`;
    
    if (STORAGE_PROVIDER === 's3') {
      const fileStream = fs.createReadStream(file.path);
      const command = new PutObjectCommand({
        Bucket: S3_BUCKET_NAME,
        Key: fileKey,
        Body: fileStream
      });
      await s3Client.send(command);
      
      // Clean up multer's temp file
      fs.unlink(file.path, () => {}); 
      return fileKey;
    } 
    
    // Fallback: Local Disk Upload for Development
    const destPath = path.join(this.uploadDir, fileKey);
    return new Promise((resolve, reject) => {
      fs.copyFile(file.path, destPath, (err) => {
        if (err) {
          logger.error('Failed to move uploaded file', { error: err });
          return reject(err);
        }
        fs.unlink(file.path, () => {});
        resolve(fileKey);
      });
    });
  }
}

module.exports = new StorageService();