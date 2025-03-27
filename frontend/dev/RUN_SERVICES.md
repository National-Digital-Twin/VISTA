## Services required by Paralog

The following services are required by Paralog to run:

- Secure agent graph
- Smart cache paralog API
- Paralog python API
- Transparent proxy

## Prerequisites required to run the services

You will need to build images for the services listed above locally with specific tags to be able to run them using the docker compose.

The Secure agent graph is a docker image that needs to be built with the tag `paralog/secure-agent-graph`. The docker file to build the image can be found in this directory. Before building the image you will need to generate a personal access token (classic) on GitHub and run the following command to login to the GitHub container registry `echo <my-pat-token> | docker login ghcr.io -u <my-username> --password-stdin`

The Smart cache paralog API can be found [here](https://github.com/National-Digital-Twin/smart-cache-paralog-api) and needs to be built with the tag `smart-cache-paralog-api`.

The Paralog python API is a Django graphQL API contained in the backend folder of this repository. This needs to be built with the tag `paralog-python-api`.

The Transparent proxy is an nginx reverse proxy contained in the transparent-proxy folder of this repository. This needs to be built using the tag `paralog-transparent-proxy`.

## Copy and populate the env file

Copy over the `.env-local` to the `.env` file and populate the following config properties:

- MET_OFFICE_GLOBAL_SPOT_API_KEY
- OS_API_KEY
- ADMIRALTY_API_KEY
- REALTIME_TRAINS_API_KEY
- IA_URL

## Spinning up containers for the different services

To spin up the containers for the services listed above use the command while in this directory `docker compose up -d`.

## Shutting down and removing the containers for the different services

To shut down and remove the containers for the services listed above use the command while in this directory `docker compose down`.
