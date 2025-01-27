# Project Initialization and Deployment

This project provides a streamlined process for initializing a configuration and deploying a project to AWS EC2 with Docker support. The deployment includes AWS integration, Docker image creation, and build artifact management.

---

## Features

- **Configuration Initialization**:
  - Configure project name, AWS region, repository URL, S3 bucket, EC2 instance type, security groups, Docker settings, and build options.
- **AWS Integration**:
  - Support for S3 bucket configuration and EC2 instance provisioning.
- **Docker Support**:
  - Build Docker images with custom build options.
- **Build Management**:
  - Run custom build commands and handle artifacts.

---

## Prerequisites

- **Node.js**: Version 16 or later.
- **AWS CLI**: Installed and configured with appropriate permissions.
- **Docker**: Installed and running.
- **Yarn**: Installed globally for dependency management.

---

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/ajishvnair/pillar-repo.git
   cd pillar-repo/
   ```
2. Install Dependencies
    ```
    npm i
    ```
3. Add env files in config/
    ```
    create env file
    .env.development
    .env.staging
    .env.production
    ```
4. Run init command
    ```
    pillar-repo init
    ```
5. Run deploy command
    ```
    pillar-repo deploy -e <enviornment>
    ```
