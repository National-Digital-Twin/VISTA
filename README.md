# Telicent Paralog

**Paralog is a free, open source web application used to evalute high value assets**

Paralog is a tool which can be used to get a better understanding of high value assets within regions in the UK. It allows analysits to better understand the impact of high value assets which in turn allows them to make better decisions quickly.

## Features

- **Attribute based access control** - manage permissions required to view sensitive data
- **View assets connectivity** - navigate the network graph to better understand asset connectivity
- **Geographical locations** - view assets geographical locations
- **Heatmap** - view of assets on the map for quick understanding of service/capability density
- **Polygon creation** - understand location based impact rather than direct connection impacts
- **Flood geometry** - view flood watch areas and flood areas provided to analyse flood impact
- **Flood monitoring stations** - view real-time monitoring station data
- **Flood alerts** - get real-time flood alerts
- **Flood warning timeline** - view previous flood warnings

## Getting started

Paralog is currently requires the Isle of Wight data (iow) but is not limited to it. The following docker images and minimum versions are required.

- Kafka - Can be run without kafka, can run using kraft or with zookeeper (It's encouraged to use Kafka with Kraft).
  Can be run locally on your machine or as a docker container.
- Paralog API - 098669589541.dkr.ecr.eu-west-2.amazonaws.com/telicent-smart-cache-paralog-api:1.1.4-rc5
- Graph smart cache
  - 098669589541.dkr.ecr.eu-west-2.amazonaws.com/smart-cache-graph:0.12.0
  - with volumes - ./config:/fuseki/config
- Paralog UI - 098669589541.dkr.ecr.eu-west-2.amazonaws.com/telicent-paralog:2.0.0-rc13

### Configuration

Enviroment variables configuration

```
API_URL=
BETA=
MAP_TILER_TOKEN=
OFFLINE_STYLES=
OFFLINE_STYLES_BASE_URL=
OFFLINE_STYLES_PATH=
ONTOLOGY_SERVICE_URL=
```
