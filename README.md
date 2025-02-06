## Paralog 2.0.1

**Paralog is a web application used to evaluate high value assets**

Paralog is a tool which can be used to get a better understanding of high value
assets within regions in the UK. It allows analysts to better understand the
impact of high value assets which in turn allows them to make better decisions
quickly.

Paralog was originally developed by [Telicent][telicent], now being developed by
[Coefficient][coefficient].

## Components

Paralog comprises four main components:

1. **Frontend**: A React application found in [`frontend`](frontend).
2. **Backend**: A Python API used to provide or proxy various APIs outside the security perimeter, found in [`backend`](backend).
3. **Deploy**: Deployment configurations and scripts, located in [`deploy`](deploy).
4. **Transparent Proxy**: A proxy component for handling API requests, found in [`transparent-proxy`](transparent-proxy).

## Setup Overview

For detailed setup instructions, please refer to the [SETUP.md](SETUP.md) file. Here's a brief overview:

1. **Prerequisites**: Ensure you have Node.js, npm, Yarn, Python ^3.12.5, Poetry, Docker, and AWS CLI installed.

2. **Frontend Setup**: Navigate to the `frontend` directory, configure npm and Yarn with GitHub packages, install dependencies, and start the application.

3. **Backend Setup**: Set up AWS credentials, login to AWS ECR, and follow the instructions in `backend/paralog-python-api/README.md`.

4. **Deployment Nodes**: Follow the instructions in [deploy/README.md](deploy/README.md) for environment-specific setup and deployment procedures.

5. **Transparent Proxy Setup**: Build the Docker image and run the container with required environment variables.

For more detailed information on each component, please refer to their respective README files in their directories.

# Telicent Integration Architecture

Telicent provides an implementation of the IA, called [Telicent Core][telicent-core],
although for now there is a thin wrapper which we used for limited purposes from
the frontend. [telicent-core]: https://telicent.io/the-core-platform/

## Additional Notes

- For updating Python requirements, refer to `docs/updating_requirements.md`.
- To create a towncrier entry: `towncrier create 123.added --edit`.

## Running local code development tools

See [RUNNING_CODE_DEV_TOOLS.md](./developer_docs/RUNNING_CODE_DEV_TOOLS.md) for more information.

[telicent]: https://telicent.io/
[coefficient]: https://coefficient.ai

## Contributors
The development of these works has been made possible with thanks to our [contributors](https://github.com/National-Digital-Twin/Paralog/graphs/contributors).
