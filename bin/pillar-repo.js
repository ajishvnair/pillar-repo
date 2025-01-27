#!/usr/bin/env node

import { Command } from 'commander';
import { initCommand } from '../src/commands/init.js';
import { deployCommand } from '../src/commands/deploy.js';
import { statusCommand } from '../src/commands/status.js';
import { rollbackCommand } from '../src/commands/rollback.js';
import { logger } from '../src/utils/logger.js';

const program = new Command();

program
  .name('pillar-repo')
  .description('CLI tool for deploying Vite SSR applications to AWS')
  .version('1.0.0');

program
  .command('init')
  .description('Initialize AWS configuration')
  .action(initCommand);

program
  .command('deploy')
  .description('Deploy the Vite SSR application')
  .option('-e, --environment <env>', 'deployment environment (production/staging/development)', 'production')
  .option('-c, --config <path>', 'path to config file', './pillar-config.yml')
  .action(deployCommand);

program
  .command('status')
  .description('Check deployment status')
  .option('-c, --config <path>', 'path to config file', './pillar-config.yml')
  .action(statusCommand);

program
  .command('rollback')
  .description('Rollback to previous deployment')
  .option('-c, --config <path>', 'path to config file', './pillar-config.yml')
  .action(rollbackCommand);

program.parse(process.argv);