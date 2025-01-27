import { logger } from '../utils/logger.js';
import { generateConfig } from '../utils/config.js';
import inquirer from 'inquirer';

export async function initCommand() {
  try {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'projectName',
        message: 'Project name:',
      },
      {
        type: 'input',
        name: 'awsRegion',
        message: 'AWS region:',
        default: 'us-west-2',
      },
      {
        type: 'input',
        name: 'repository',
        message: 'Repository URL:',
      },
      {
        type: 'input',
        name: 's3Bucket',
        message: 'S3 Bucket Name:',
        default: 'template-parser',
      },
      {
        type: 'input',
        name: 'instanceType',
        message: 'EC2 Instance Type:',
        default: 't3.micro',
      },
      {
        type: 'input',
        name: 'securityGroup',
        message: 'Security Group Name:',
        default: 'vite-ssr-sg',
      },
      {
        type: 'input',
        name: 'dockerRegistry',
        message: 'Docker Registry URL (leave blank for local):',
        default: 'local',
      },
      {
        type: 'input',
        name: 'dockerfile',
        message: 'Path to Dockerfile:',
        default: 'Dockerfile',
      },
      {
        type: 'input',
        name: 'buildCommand',
        message: 'Build Command:',
        default: 'yarn build',
      },
      {
        type: 'input',
        name: 'artifacts',
        message: 'Build Artifacts Directory:',
        default: 'dist/',
      }
    ]);

    const config = {
      projectName: answers.projectName,
      awsRegion: answers.awsRegion,
      repository: answers.repository,
      aws: {
        region: answers.awsRegion,
        s3: {
          bucket: answers.s3Bucket,
        },
        ec2: {
          instance_type: answers.instanceType,
          security_groups: [answers.securityGroup],
        },
      },
      docker: {
        registry: answers.dockerRegistry,
        buildOptions: {
          dockerfile: answers.dockerfile,
          buildArgs: {
            NODE_ENV: 'production',
          },
        },
      },
      build: {
        command: answers.buildCommand,
        artifacts: [answers.artifacts],
      },
    };

    await generateConfig(config);
    logger.info('Configuration initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize configuration:', error);
    process.exit(1);
  }
}
