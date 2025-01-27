import fs from 'fs/promises';
import Docker from 'dockerode';
import { logger } from '../utils/logger.js';

export async function createDockerImage({ dockerConfig, environment }) {
  const docker = new Docker();

  try {
    logger.info('Moving Dockerfile to temp-repo folder');

    // Move Dockerfile to temp-repo
    await fs.copyFile(`${process.cwd()}/Dockerfile`, `${process.cwd()}/temp-repo/Dockerfile`);

    logger.info('Dockerfile moved successfully');

    logger.info('Building Docker image');

    const imageTag = `${dockerConfig.registry}/vite-ssr-${environment}-${Date.now()}`;
    logger.info(`Image Tag: ${imageTag}`);

    await new Promise((resolve, reject) => {
      docker.buildImage(
        {
          context: `${process.cwd()}/temp-repo`,
          src: ['Dockerfile', 'package.json', 'yarn.lock', 'src/', 'scripts/', 'dist/', 'examples/', 'test/']
        },
        {
          t: imageTag,
          ...dockerConfig.buildOptions
        },
        (err, stream) => {
          if (err) return reject(err);

          stream.on('data', (data) => {
            logger.info(data.toString());
          });

          stream.on('end', resolve);
          stream.on('error', reject);
        }
      );
    });

    logger.info('Docker image built successfully');

    // Move Dockerfile back to root after building
    await fs.rename(`${process.cwd()}/temp-repo/Dockerfile`, `${process.cwd()}/Dockerfile`);
    logger.info('Dockerfile moved back to root successfully');

    return imageTag;
  } catch (error) {
    logger.error('Docker image build failed:', error);
    throw error;
  }
}