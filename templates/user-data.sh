#!/bin/bash
set -e

# Install Docker and AWS CLI
yum update -y
yum install -y docker unzip
service docker start
usermod -a -G docker ec2-user

# Install AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
./aws/install

# Set AWS CLI Region
aws configure set region ${AWS_REGION}

# Download artifacts from S3
mkdir -p /app/artifacts
aws s3 cp s3://${S3_BUCKET_NAME}/${IMAGE_TAG}/ /app/artifacts --recursive

# Pull and run the Docker image
docker pull ${DOCKER_IMAGE_TAG}
docker run -d -p 80:3000 -v /app/artifacts:/usr/src/app/artifacts ${DOCKER_IMAGE_TAG}
