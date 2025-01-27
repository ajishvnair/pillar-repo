import Docker from 'dockerode';
import { logger } from '../utils/logger.js';

export async function runContainer({ imageTag, containerConfig }) {
  const docker = new Docker();

  try {
    logger.info(`Starting container from image ${imageTag}`);

    const container = await docker.createContainer({
      Image: imageTag,
      ExposedPorts: {
        '3000/tcp': {}
      },
      HostConfig: {
        PortBindings: {
          '3000/tcp': [{ HostPort: '80' }]
        },
        RestartPolicy: {
          Name: 'always'
        }
      },
      Env: [
        `NODE_ENV=${containerConfig.environment}`,
        ...Object.entries(containerConfig.env || {}).map(([k, v]) => `${k}=${v}`)
      ]
    });

    await container.start();
    logger.info('Container started successfully');

    return container.id;
  } catch (error) {
    logger.error('Failed to run container:', error);
    throw error;
  }
}

export async function stopContainer(containerId) {
  const docker = new Docker();

  try {
    const container = docker.getContainer(containerId);
    await container.stop();
    await container.remove();
    logger.info(`Container ${containerId} stopped and removed`);
  } catch (error) {
    logger.error('Failed to stop container:', error);
    throw error;
  }
}