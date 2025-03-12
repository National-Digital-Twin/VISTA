## Services required by Paralog

The following services are required by Paralog to run:

- Smart cache graph
- Smart cache paralog API
- Paralog python API
- Transparent proxy

## Prerequisites required to run the services

You will need to build images for the services listed above locally with specific tags to be able to run them using the docker compose.

The Smart cache paralog API can be found [here](https://github.com/National-Digital-Twin/smart-cache-paralog-api) and needs to be built with the tag `smart-cache-paralog-api`.

The Paralog python API is a Django graphQL API contained in the backend folder of this repository. This needs to be built with the tag `paralog-python-api`.

The Transparent proxy is an nginx reverse proxy contained in the transparent-proxy folder of this repository. This needs to be built using the tag `paralog-transparent-proxy`.

## Copy and populate the env file

Copy over the `.env-local` to the `.env` file and populate the following config properties:

- OS_API_KEY
- ADMIRALTY_API_KEY
- REALTIME_TRAINS_API_KEY

## Spinning up containers for the different services

To spin up the containers for the services listed above use the command while in this directory `docker compose up -d`.

## Shutting down and removing the containers for the different services

To shut down and remove the containers for the services listed above use the command while in this directory `docker compose down`.
