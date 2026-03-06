# README

**Repository:** `vista`\
**Description:** `Vista is a web application used to evaluate high value assets`\
**SPDX-License-Identifier:** `Apache-2.0 AND OGL-UK-3.0`\

---

## Overview

VISTA is a digital mapping tool designed to assess, visualise, and simulate cascading asset failures during emergencies. It enables real-time monitoring of infrastructure dependencies, illustrating how disruptions to key assets—such as roads, energy grids, and healthcare facilities—affect interconnected services and communities.

In addition to assessing failures, VISTA provides predictive capabilities, allowing users to simulate a range of emergency scenarios. By integrating real-world and simulated data, VISTA enables proactive planning, helping emergency responders, infrastructure managers and policy officials anticipate how disruptions propagate and optimise response efforts before incidents occur.

## Components

Vista comprises four main components:

1. **Frontend**: A React application found in [`frontend`](frontend).
2. **Backend**: A Python API used to provide or proxy various APIs outside the security perimeter, found in [`backend`](backend).
3. **Kubernetes Manifests**: Deployment and runtime manifests for services, located in [`k8s`](k8s).
4. **Transparent Proxy**: A proxy component for handling API requests, found in [`transparent-proxy`](transparent-proxy).

## Setup Overview

For detailed setup instructions, please refer to the [SETUP.md](SETUP.md) file. Here's a brief overview:

1. **Prerequisites**: Ensure you have Node.js, npm, Yarn, Python ^3.12.5, Poetry, Docker, and AWS CLI installed.

2. **Frontend Setup**: Navigate to the `frontend` directory, configure npm and Yarn with GitHub packages, install dependencies, and start the application.

3. **Backend Setup**: Set up AWS credentials, login to AWS ECR, and follow the instructions in `backend/vista-python-api/README.md`.

4. **Transparent Proxy Setup**: Build the Docker image (located in `transparent-proxy/Dockerfile`) and run the container with required environment variables.

For more detailed information on each component, please refer to their respective README files in their directories.

## Additional Notes

- For updating Python requirements, refer to `backend/vista-python-api/docs/updating_requirements.md`.
- To create a towncrier entry: `towncrier create 123.added --edit`.

## Running local code development tools

See [RUNNING_CODE_DEV_TOOLS.md](./developer_docs/RUNNING_CODE_DEV_TOOLS.md) for more information.
## Contributors
The development of these works has been made possible with thanks to our [contributors](https://github.com/National-Digital-Twin/vista/graphs/contributors).
## Public Funding Acknowledgment
This repository has been developed with public funding as part of the National Digital Twin Programme (NDTP), a UK Government initiative. NDTP, alongside its partners, has invested in this work to advance open, secure, and reusable digital twin technologies for any organisation, whether from the public or private sector, irrespective of size.

## License
This repository contains **both source code and documentation**, covered by different licenses:
- **Code**: Apache License 2.0 ([LICENSE.md](LICENSE.md))
- **Documentation**: Open Government Licence v3.0 ([OGL_LICENSE.md](OGL_LICENSE.md))

## Security and Responsible Disclosure
We take security seriously. If you believe you have found a security vulnerability in this repository, please follow our responsible disclosure process outlined in `SECURITY.md`.

## Software Bill of Materials (SBOM)

This project provides a Software Bill of Materials (SBOM) to help users and integrators understand its dependencies.

### Current SBOM
Download the [latest SBOM for this codebase](https://github.com/National-Digital-Twin/vista/dependency-graph/sbom) to view the current list of components used in this repository.

## Contributing
We welcome contributions that align with the Programme’s objectives. Please read our `CONTRIBUTING.md` guidelines before submitting pull requests.

## Acknowledgements
This repository has benefited from collaboration with various organisations. For a list of acknowledgments, see `ACKNOWLEDGEMENTS.md`.

## Support and Contact
For questions or support, check our Issues or contact the NDTP team by emailing ndtp@businessandtrade.gov.uk.

**Maintained by the National Digital Twin Programme (NDTP).**

© Crown Copyright 2026. This work has been developed by the National Digital Twin Programme
and is legally attributed to the Department for Business and Trade (UK) as the governing entity.
Licensed under the Open Government Licence v3.0.
