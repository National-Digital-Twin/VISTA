## Paralog

**Paralog is a free, open source web application used to evaluate high value
assets**

Paralog is a tool which can be used to get a better understanding of high value
assets within regions in the UK. It allows analysts to better understand the
impact of high value assets which in turn allows them to make better decisions
quickly.

### Contents

- [Setup](#setup)
- [Build](#build)
- [Usage](#usage)
- [Features](#features)
- [Related repositories](#related-repositories)

## Setup

See [SETUP.md](SETUP.md) for instructions.

## Build

Run `npm run build` to build the application.

## Usage

```sh
# Terminal 1 (Frontend)
# 1. Install dependencies
npm install
# 2. Start the application
npm start
```

## Setup services required by paralog

See [RUN_SERVICES.md](./dev/RUN_SERVICES.md) for instructions.

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

- [RDF Libraries](https://github.com/National-Digital-Twin/rdf-libraries), specifically
  the Ontology Service is used to provide the ontology iconography to Paralog.
- [Secure Agent Graph (SAG) API](https://github.com/National-Digital-Twin/secure-agent-graph)
  is used as a datastore for RDF Libraries.
