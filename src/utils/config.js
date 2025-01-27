// src/utils/config.js
import yaml from 'js-yaml';
import { readFileSync, writeFileSync } from 'fs';
import { logger } from './logger.js';

export async function loadConfig(configPath) {
  try {
    const fileContents = readFileSync(configPath, 'utf8');
    return yaml.load(fileContents);
  } catch (error) {
    logger.error('Failed to load config:', error);
    throw error;
  }
}

export async function generateConfig(config) {
  try {
    const configPath = './pillar-config.yml';
    const yamlStr = yaml.dump(config);
    writeFileSync(configPath, yamlStr, 'utf8');
    logger.info('Configuration file generated successfully');
  } catch (error) {
    logger.error('Failed to generate config:', error);
    throw error;
  }
}