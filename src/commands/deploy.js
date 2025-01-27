import { cloneRepo } from '../utils/git.js';
import { buildApp } from '../utils/build.js';
import { createDockerImage } from '../docker/image.js';
import { uploadArtifacts } from '../aws/s3.js';
import { deployToEC2 } from '../aws/ec2.js';
import { loadConfig } from '../utils/config.js';
import { logger } from '../utils/logger.js';
import { pushDockerImage } from '../docker/push.js';
import dotenv from 'dotenv';
import { resolve } from 'path';
import fs from 'fs';


function loadEnvConfig(environment) {
    const envPath = resolve('config', `.env.${environment}`);
    console.log('Environment file path:', process.cwd());

    if (!fs.existsSync(envPath)) {
        throw new Error(`Environment config file not found at path: ${envPath}`);
    }

    const result = dotenv.config({ path: envPath });
    if (result.error) {
        throw new Error(`Failed to load environment config: ${result.error}`);
    }
    return result.parsed;
}

export async function deployCommand(options) {
  try {
    logger.info('Starting deployment process');
    const config = await loadConfig(options.config);
    
    // Load environment-specific AWS credentials
    await loadEnvConfig(options.environment);

    // Clone repository
    await cloneRepo(config.repository);

    logger.info('config', config)

    // Build application
    await buildApp({
      environment: options.environment,
      buildConfig: config.build
    });

    // Create Docker image
    const imageTag = await createDockerImage({
      dockerConfig: config.docker,
      environment: options.environment
    });

    // Upload artifacts to S3
    await uploadArtifacts({
      bucket: config.aws.s3.bucket,
      artifacts: config.build.artifacts,
      imageTag
    });

    // Push Docker image to the registry
    const pushedImageTag = await pushDockerImage(imageTag);

    // Deploy to EC2
    await deployToEC2({
      imageTag: pushedImageTag,
      environment: options.environment
    });

    logger.info('Deployment completed successfully');
  } catch (error) {
    logger.error('Deployment failed:', error);
    process.exit(1);
  }
}
