import { exec } from 'child_process';
import { promisify } from 'util';
import { logger } from '../utils/logger.js';

const execAsync = promisify(exec);

export async function pushDockerImage(imageTag) {
  try {
    const registry = `${process.env.AWS_ACCOUNT_ID}.dkr.ecr.${process.env.AWS_REGION}.amazonaws.com`;
    logger.info(`Pushing Docker image ${imageTag} to AWS ECR registry ${registry}`);

    // Authenticate with AWS ECR
    logger.info('Authenticating with AWS ECR...');
    const loginCommand = `aws ecr get-login-password --region ${process.env.AWS_REGION} | docker login --username AWS --password-stdin ${registry}`;
    await execAsync(loginCommand, { shell: '/bin/bash' });

    // Tag and push the image
    const taggedImage = `${registry}/${imageTag}`;
    logger.info(`Tagging image: ${taggedImage}`);
    await execAsync(`docker tag ${imageTag} ${taggedImage}`);
    logger.info('Pushing image to registry...');
    await execAsync(`docker push ${taggedImage}`);

    logger.info(`Docker image pushed successfully to AWS ECR: ${taggedImage}`);
    return taggedImage;
  } catch (error) {
    logger.error('Failed to push Docker image to AWS ECR:', error);
    throw error;
  }
}
