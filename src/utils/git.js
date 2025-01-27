import { exec } from 'child_process';
import { promisify } from 'util';
import { logger } from './logger.js';

const execAsync = promisify(exec);

export async function cloneRepo(repoUrl) {
  try {
    logger.info(`Cloning repository: ${repoUrl}`);
    await execAsync(`rm -rf ./temp-repo`)
    await execAsync(`git clone ${repoUrl} ./temp-repo`);
    logger.info('Repository cloned successfully');
  } catch (error) {
    logger.error('Failed to clone repository:', error);
    throw error;
  }
}