# Telicent Paralog

## What is Paralog

## How to set up Paralog for Development

### Set up backend

- clone telicent-deployments
- Cd in to Telicent-deployments/telicent-local-deploy/core
- docker-compose up
- Cd ../smart-cache/jena/config
- mv config.ttl config.ttl.bkup
- Mv config-dev.ttl config.ttl
- cd ..
- Docker-compose up
- cd ../data-adder
- Docker-compose up
- Select isle of white from localhost:8097
- Cd ../../apps/paralog
- docker-compose up

### Start up paralog frontend

- `yarn install //install node modules`
- `yarn start // start dev server`
