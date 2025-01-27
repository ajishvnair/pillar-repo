import AWS from 'aws-sdk';
import { logger } from '../utils/logger.js';

async function createSecurityGroup(ec2, vpcId) {
    try {
        const securityGroup = await ec2.createSecurityGroup({
            GroupName: `vite-ssr-sg-${Date.now()}`,
            Description: 'Security group for Vite SSR application',
            VpcId: vpcId
        }).promise();

        await ec2.authorizeSecurityGroupIngress({
            GroupId: securityGroup.GroupId,
            IpPermissions: [
                {
                    IpProtocol: 'tcp',
                    FromPort: 80,
                    ToPort: 80,
                    IpRanges: [{ CidrIp: '0.0.0.0/0' }]
                },
                {
                    IpProtocol: 'tcp',
                    FromPort: 22,
                    ToPort: 22,
                    IpRanges: [{ CidrIp: '0.0.0.0/0' }]
                }
            ]
        }).promise();

        return securityGroup.GroupId;
    } catch (error) {
        logger.error('Failed to create security group:', error);
        throw error;
    }
}

export async function deployToEC2({ imageTag, environment }) {
    const ec2 = new AWS.EC2({
        region: process.env.AWS_REGION,
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
        }
    });

    try {
        // Get default VPC
        const vpc = await ec2.describeVpcs({ Filters: [{ Name: 'isDefault', Values: ['true'] }] }).promise();
        if (!vpc.Vpcs.length) throw new Error('No default VPC found');
        const vpcId = vpc.Vpcs[0].VpcId;

        // Get default Subnet
        const subnet = await ec2.describeSubnets({ Filters: [{ Name: 'vpc-id', Values: [vpcId] }] }).promise();
        if (!subnet.Subnets.length) throw new Error('No subnet found');
        const subnetId = subnet.Subnets[0].SubnetId;

        // Create Security Group
        logger.info('Creating security group...');
        const securityGroupId = await createSecurityGroup(ec2, vpcId);

        // Fetch latest Amazon Linux 2 AMI
        logger.info('Fetching latest Amazon Linux 2 AMI...');
        const amiData = await ec2.describeImages({
            Filters: [
                { Name: 'name', Values: ['amzn2-ami-hvm-*-x86_64-gp2'] },
                { Name: 'state', Values: ['available'] }
            ],
            Owners: ['amazon']
        }).promise();

        if (!amiData.Images.length) throw new Error('No AMI found');
        const latestAmi = amiData.Images.sort((a, b) => new Date(b.CreationDate) - new Date(a.CreationDate))[0];

        // Prepare User Data
        const userData = Buffer.from(`
                #!/bin/bash
                set -e

                # Install Docker and AWS CLI
                yum update -y
                yum install -y docker nginx unzip
                service docker start
                usermod -a -G docker ec2-user

                # Install AWS CLI
                curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
                unzip awscliv2.zip
                ./aws/install

                # Set AWS CLI Region
                aws configure set region ${process.env.AWS_REGION}

                # Dynamically retrieve the AWS account ID
                AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

                # Authenticate with AWS ECR
                aws ecr get-login-password --region ${process.env.AWS_REGION} | docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${process.env.AWS_REGION}.amazonaws.com

                # Pull and run the Docker image from ECR
                docker pull ${process.env.AWS_ACCOUNT_ID}.dkr.ecr.${process.env.AWS_REGION}.amazonaws.com/${imageTag}
                docker run -d --name app-container -p 3000:3000 ${AWS_ACCOUNT_ID}.dkr.ecr.${process.env.AWS_REGION}.amazonaws.com/${imageTag}

                # Configure NGINX as a reverse proxy
                cat > /etc/nginx/conf.d/default.conf <<EOL
                server {
                    listen 80;

                    location / {
                        proxy_pass http://127.0.0.1:3000;
                        proxy_set_header Host \$host;
                        proxy_set_header X-Real-IP \$remote_addr;
                        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
                        proxy_set_header X-Forwarded-Proto \$scheme;
                    }

                    error_page 500 502 503 504 /50x.html;
                    location = /50x.html {
                        root /usr/share/nginx/html;
                    }
                }
                EOL

                # Start NGINX
                systemctl enable nginx
                systemctl start nginx
            `).toString('base64');

        // Launch EC2 Instance
        logger.info('Launching EC2 instance...');
        const instance = await ec2.runInstances({
            ImageId: latestAmi.ImageId,
            InstanceType: 't3.micro', // Ensure this is supported in your region
            MinCount: 1,
            MaxCount: 1,
            SecurityGroupIds: [securityGroupId],
            SubnetId: subnetId,
            UserData: userData,
            TagSpecifications: [
                {
                    ResourceType: 'instance',
                    Tags: [{ Key: 'Name', Value: `vite-ssr-${environment}` }]
                }
            ]
        }).promise();

        const instanceId = instance.Instances[0].InstanceId;
        logger.info(`Instance ${instanceId} launched successfully. Waiting for it to be running...`);

        // Wait for the instance to run
        await ec2.waitFor('instanceRunning', { InstanceIds: [instanceId] }).promise();

        // Get public IP
        const instanceDetails = await ec2.describeInstances({ InstanceIds: [instanceId] }).promise();
        const publicIp = instanceDetails.Reservations[0].Instances[0].PublicIpAddress;
        logger.info(`Instance is running at http://${publicIp}`);

        return { instanceId, publicIp };
    } catch (error) {
        logger.error('Failed to deploy to EC2:', error);
        if (error.code === 'Unsupported') {
            logger.error('Check your instance type, AMI, or region settings.');
        }
        throw error;
    }
}

export async function getDeploymentStatus(ec2Config) {
    const ec2 = new AWS.EC2({
        region: process.env.AWS_REGION,
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
        }
    });

    try {
        const params = {
            Filters: [
                {
                    Name: 'tag:Project',
                    Values: [ec2Config.projectName]
                }
            ]
        };

        const result = await ec2.describeInstances(params).promise();
        return result.Reservations.map(r => r.Instances[0]);
    } catch (error) {
        logger.error('Failed to get deployment status:', error);
        throw error;
    }
}

export async function rollbackDeployment(ec2Config) {
    // Implementation for rollback logic
}
