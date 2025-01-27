import AWS from 'aws-sdk';
import { logger } from '../utils/logger.js';

export async function createIAMRole(roleName) {
  const iam = new AWS.IAM({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
  });

  const rolePolicy = {
    Version: '2012-10-17',
    Statement: [
      {
        Effect: 'Allow',
        Principal: {
          Service: 'ec2.amazonaws.com'
        },
        Action: 'sts:AssumeRole'
      }
    ]
  };

  try {
    const role = await iam.createRole({
      RoleName: roleName,
      AssumeRolePolicyDocument: JSON.stringify(rolePolicy)
    }).promise();

    await iam.attachRolePolicy({
      RoleName: roleName,
      PolicyArn: 'arn:aws:iam::aws:policy/service-role/AmazonEC2ContainerServiceforEC2Role'
    }).promise();

    logger.info(`IAM role ${roleName} created successfully`);
    return role;
  } catch (error) {
    logger.error('Failed to create IAM role:', error);
    throw error;
  }
}