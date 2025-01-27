import { getDeploymentStatus } from '../aws/ec2.js';
import { loadConfig } from '../utils/config.js';
import { logger } from '../utils/logger.js';

export async function statusCommand(options) {
  try {
    const config = await loadConfig(options.config);
    const status = await getDeploymentStatus(config.aws.ec2);
    logger.info('Current deployment status:', status);
  } catch (error) {
    logger.error('Failed to get deployment status:', error);
    process.exit(1);
  }
}