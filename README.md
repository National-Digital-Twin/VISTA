## Telicent Paralog

**Paralog is a free, open source web application used to evaluate high value
assets**

Paralog is a tool which can be used to get a better understanding of high value
assets within regions in the UK. It allows analysts to better understand the
impact of high value assets which in turn allows them to make better decisions
quickly.

### Contents

- [Build](#build)
- [Usage](#usage)
- [Features](#features)
- [Related repositories](#related-repositories)

## Build

Run `yarn build` to build the application.

## Usage

1. Run `yarn install` to install dependencies
2. Run `yarn start` to start the application

## Features

- **Attribute Based Access Control (ABAC)** - manage permissions required to
  view sensitive data
- **View assets connectivity** - navigate the network graph to better understand
  asset connectivity
- **Geographical locations** - view assets' geographical locations
- **Heatmap** - view of assets on the map for quick understanding of
  service/capability density
- **Polygon creation [BETA]** - understand location based impact rather than
  direct connection impacts
- **Flood geometry** - view flood watch areas and flood areas provided to
  analyse flood impact
- **Flood monitoring stations** - view real-time monitoring station data
- **Flood alerts** - get real-time flood alerts
- **Flood warning timeline** - view previous flood warnings

## Related repositories

- [Smart Cache Paralog (SCP)
  API](https://github.com/Telicent-io/smart-cache-paralog-api) is a REST API
  used by Telicent Paralog to get data from the IES Triplestore.
- [RDF Libraries](https://github.com/Telicent-io/rdf-libraries), specifically
  the Ontology Service is used to provide the ontology iconography to Telicent
  Paralog.
- [Smart Cache Graph (SCG) API](https://github.com/Telicent-io/smart-cache-graph-api)
  is used as a datastore for SCP and RDF Libraries.
