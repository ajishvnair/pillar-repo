import { rollbackDeployment } from '../aws/ec2.js';
import { loadConfig } from '../utils/config.js';
import { logger } from '../utils/logger.js';

export async function rollbackCommand(options) {
  try {
    const config = await loadConfig(options.config);
    await rollbackDeployment(config.aws.ec2);
    logger.info('Rollback completed successfully');
  } catch (error) {
    logger.error('Rollback failed:', error);
    process.exit(1);
  }
}