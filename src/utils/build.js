import { exec } from 'child_process';
import { promisify } from 'util';
import { logger } from './logger.js';

const execAsync = promisify(exec);

export async function buildApp({ environment, buildConfig }) {
  try {
    logger.info('Installing dependencies...');
    await execAsync('yarn install', { cwd: './temp-repo' });

    logger.info(`Building application for ${environment}...`);
    await execAsync(`${buildConfig.command}`, {
      cwd: './temp-repo',
      env: {
        ...process.env,
        NODE_ENV: environment
      }
    });

    logger.info('Build completed successfully');
  } catch (error) {
    logger.error('Build failed:', error);
    throw error;
  }
}