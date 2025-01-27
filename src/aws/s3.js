import AWS from 'aws-sdk';
import { createReadStream } from 'fs';
import { readdir, stat } from 'fs/promises';
import { join } from 'path';
import { logger } from '../utils/logger.js';

export async function uploadArtifacts({ bucket, artifacts, imageTag }) {
  const s3 = new AWS.S3({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
  });

  try {
    for (const artifactPath of artifacts) {
      const fullPath = join('./temp-repo', artifactPath);
      const stats = await stat(fullPath);

      if (stats.isDirectory()) {
        const files = await readdir(fullPath, { recursive: true });
        for (const file of files) {
          const filePath = join(fullPath, file);
          const fileStats = await stat(filePath);
          
          if (fileStats.isFile()) {
            const fileStream = createReadStream(filePath);
            const uploadParams = {
              Bucket: bucket,
              Key: `${imageTag}/${artifactPath}/${file}`,
              Body: fileStream
            };
            await s3.upload(uploadParams).promise();
            logger.info(`Uploaded ${file} to S3`);
          }
        }
      } else {
        const fileStream = createReadStream(fullPath);
        const uploadParams = {
          Bucket: bucket,
          Key: `${imageTag}/${artifactPath}`,
          Body: fileStream
        };
        await s3.upload(uploadParams).promise();
        logger.info(`Uploaded ${artifactPath} to S3`);
      }
    }
  } catch (error) {
    logger.error('Failed to upload artifacts:', error);
    throw error;
  }
}