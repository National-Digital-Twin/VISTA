# README

**Repository:** `vista`  
**Description:** `Vista is a web application used to evaluate high value assets`  
**Repository Status:** `Private – NDTP InnerSource`  

---

**Vista is a web application used to evaluate high value assets**

Vista is a tool which can be used to get a better understanding of high value
assets within regions in the UK. It allows analysts to better understand the
impact of high value assets which in turn allows them to make better decisions
quickly.

## Components

Vista comprises four main components:

1. **Frontend**: A React application found in [`frontend`](frontend).
2. **Backend**: A Python API used to provide or proxy various APIs outside the security perimeter, found in [`backend`](backend).
3. **Deploy**: Deployment configurations and scripts, located in [`deploy`](deploy).
4. **Transparent Proxy**: A proxy component for handling API requests, found in [`transparent-proxy`](transparent-proxy).

## Setup Overview

For detailed setup instructions, please refer to the [SETUP.md](SETUP.md) file. Here's a brief overview:

1. **Prerequisites**: Ensure you have Node.js, npm, Yarn, Python ^3.12.5, Poetry, Docker, and AWS CLI installed.

2. **Frontend Setup**: Navigate to the `frontend` directory, configure npm and Yarn with GitHub packages, install dependencies, and start the application.

3. **Backend Setup**: Set up AWS credentials, login to AWS ECR, and follow the instructions in `backend/vista-python-api/README.md`.

4. **Deployment Nodes**: Follow the instructions in [deploy/README.md](deploy/README.md) for environment-specific setup and deployment procedures.

5. **Transparent Proxy Setup**: Build the Docker image and run the container with required environment variables.

For more detailed information on each component, please refer to their respective README files in their directories.

## Additional Notes

- For updating Python requirements, refer to `docs/updating_requirements.md`.
- To create a towncrier entry: `towncrier create 123.added --edit`.

## Running local code development tools

See [RUNNING_CODE_DEV_TOOLS.md](./developer_docs/RUNNING_CODE_DEV_TOOLS.md) for more information.
## Contributors
The development of these works has been made possible with thanks to our [contributors](https://github.com/National-Digital-Twin/vista/graphs/contributors).
## Public Funding Acknowledgment  
This repository has been developed with public funding as part of the National Digital Twin Programme (NDTP), a UK Government initiative. NDTP, alongside its partners, has invested in this work to advance open, secure, and reusable digital twin technologies for any organisation, whether from the public or private sector, irrespective of size.  

## Licensing

This repository, including all source code, documentation, configuration files, and related materials, is licensed under the:

**NDTP InnerSource Licence – Version 1.0**  
See [LICENSE.md](LICENSE.md) for the full licence text.

> ⚠️ This repository is **not open source**.  
> Redistribution, disclosure, or publication of any part of this repository is prohibited without the **explicit, written approval** of the NDTP Management Team.

All intellectual property rights are held by the **Department for Business and Trade (UK)** as the governing entity for the National Digital Twin Programme (NDTP).

## Security and Responsible Disclosure  
We take security seriously. If you believe you have found a security vulnerability in this repository, please follow our responsible disclosure process outlined in `SECURITY.md`.  

## Software Bill of Materials (SBOM)

This project provides a Software Bill of Materials (SBOM) to help users and integrators understand its dependencies.

### Current SBOM
Download the [latest SBOM for this codebase](../../dependency-graph/sbom) to view the current list of components used in this repository.

## Contributing  
We welcome contributions that align with the Programme’s objectives. Please read our `CONTRIBUTING.md` guidelines before submitting pull requests.  

## Acknowledgements  
This repository has benefited from collaboration with various organisations. For a list of acknowledgments, see `ACKNOWLEDGEMENTS.md`.  

## Support and Contact  
For questions or support, check our Issues or contact the NDTP team on ndtp@businessandtrade.gov.uk.

**Maintained by the National Digital Twin Programme (NDTP).**  

© Crown Copyright 2025. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.