# Vista Setup Guide

This guide provides instructions for setting up the Vista project, which consists of frontend, backend, Kubernetes manifests, and transparent-proxy components.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Frontend Setup](#frontend-setup)
3. [Backend Setup](#backend-setup)
4. [Infrastructure Setup](#infrastructure-setup)
5. [Transparent Proxy Setup](#transparent-proxy-setup)

## Prerequisites

Ensure you have the following installed:

- Node.js and npm
- Yarn
- Python ^3.12.5
- Poetry
- Docker
- AWS CLI

## Frontend Setup

Full instructions can be found [here](./frontend/README.md)

1. Navigate to the `frontend` directory.

2. Create an `.npmrc` file in the project's root directory or your home directory with the following content:

   ```ini
   @coefficientsystems:registry=https://npm.pkg.github.com
   //npm.pkg.github.com/:_authToken=YOUR_GITHUB_TOKEN
   ```

   Replace `YOUR_GITHUB_TOKEN` with a GitHub token that has `read:packages` and `write:packages` scopes.

3. Verify your `package.json` configuration. Add the `publishConfig` section if it doesn't already exist:

   ```json
   "publishConfig": {
     "registry": "https://npm.pkg.github.com/"
   }
   ```

4. Login to the npm registry to configure it to use your GitHub token:

   ```sh
   npm login --registry=https://npm.pkg.github.com
   ```

5. Configure Yarn to use the token:

   ```sh
   yarn config set npmScopes.coefficientsystems.npmAuthToken YOUR_GITHUB_TOKEN
   ```

6. Install dependencies:

   ```sh
   yarn install
   ```

7. Start the application:
   ```sh
   yarn start
   ```

## Backend Setup

Full instructions can be found [here](./backend/vista-python-api/README.md)

1. Navigate to the `backend` directory.

2. Set up AWS credentials in `~/.aws/credentials`:

   ```
   [vista]
   aws_access_key_id=SECRET_KEY
   aws_secret_access_key=SECRET_ACCESS_KEY
   ```

3. Login to AWS ECR:

   ```sh
   aws ecr --profile=vista get-login-password --region eu-west-2 | docker login --username AWS --password-stdin 098669589541.dkr.ecr.eu-west-2.amazonaws.com
   ```

4. Follow the instructions in the `backend/vista-python-api/README.md` file for setting up the Python API.

## Infrastructure Setup

Repository configuration instructions can be found [here](./repository-configuration/README.md)

1. Kubernetes deployment manifests are located in the `k8s` directory, organised by service and environment overlays.

2. Repository branch protection and workflow policy configuration is managed in `repository-configuration`.

## Transparent Proxy Setup

Full instructions can be found [here](./transparent-proxy/README.md)

1. Navigate to the `transparent-proxy` directory.

2. Build the Docker image:

   ```sh
   docker build --tag vista-transparent-proxy:latest .
   ```

3. Run the container with required environment variables:
   ```sh
   docker run -ti -p 5013:80 --env ADMIRALTY_API_KEY=... --env REALTIME_TRAINS_API_KEY=... vista-transparent-proxy:latest
   ```

## Additional Notes

- For updating Python requirements, refer to `backend/vista-python-api/docs/updating_requirements.md`.
- To create a towncrier entry: `towncrier create 123.added --edit`.
- For more detailed setup information, refer to their respective README files in their directories.

---

**Maintained by the National Digital Twin Programme (NDTP).**

© Crown Copyright 2026. This work has been developed by the National Digital Twin Programme
and is legally attributed to the Department for Business and Trade (UK) as the governing entity.
Licensed under the Open Government Licence v3.0.
For full licensing terms, see [OGL_LICENSE.md](OGL_LICENSE.md).
