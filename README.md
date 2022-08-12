# Telicent Paralog

## What is Paralog

Paralog can be used to help identify high value installations or utilities in the event of a disaster.
Data is ingested via csv and then the criticality of the infrastructure is calculated and compiled in to easy to understand visualisations helping the teams on the ground make quick decisions.

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
