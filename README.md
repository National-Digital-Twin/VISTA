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
  - [With Telicent CLI](#with-telicent-cli)
  - [Environment Configuration](#environment-configuration)
- [Features](#features)
- [Related repositories](#related-repositories)

## Build

Run `yarn build` to build the application.

## Usage

Paralog currently uses the Isle of Wight (iow) data but is not limited to
it.

### With Telicent CLI

> Note: Ensure you are using version 0.5.0 or higher.

1. **Install telicent cli.** (If you don't have it installed already)

   Follow the steps documented in the
   [telicent-cli](https://github.com/Telicent-io/telicent-cli#install-the-cli)
   repo for more in depth instructions

   ```
   pip install telicent-cli==<version>
   ```

   or if using Python 3

   ```
   pip3 install telicent-cli==<version>
   ```

2. **Start kafka.**

   ```
   telicent-cli kafka start
   ```

3. **Start core with kafka**

   ```
   telicent-cli core start -k
   ```

4. **Start paralog application**

   ```
   telicent-cli paralog start
   ```

5. **Load ontology dataset**

   ```
   telicent-cli kafka load-onto-data -o 0.0.5
   ```

6. **Load Isle of Wight (IOW) dataset.**

```
telicent-cli core load iow
```

7. **Start the application**

```
yarn install
yarn start
```

To ensure you have the correct/updated docker versions, you can use the toml
template below. The stack below will bring up core with kafka and paralog. It
will also load in the Isle of Wight (iow) data.

```
# Paralog stack
[paralog]
stacks = ["core-with-kafka", "paralog"]
load_datasets=["iow"]
expose_ports=true
auth="disabled"
security_label=""
env_override="path/to/cli-envs-paralog"
```

The versions specified below are minimum versions required. Feel free to bump up
the versions.

```
# cli-envs-paralog
SMART_CACHE_GRAPH=098669589541.dkr.ecr.eu-west-2.amazonaws.com/smart-cache-graph:0.11.0
API_IMAGE=098669589541.dkr.ecr.eu-west-2.amazonaws.com/telicent-smart-cache-paralog-api:1.1.7
UI_IMAGE=098669589541.dkr.ecr.eu-west-2.amazonaws.com/telicent-paralog:1.6.0
```

To teardown the entire setup run

```
telicent-cli nuke
```

### Environment configuration

Refer to the `.env.default` file as a guide to all the environment variables
required.

> Only three environment variables are required PARALOG_API_URL, MAP_TILER_TOKEN
> and ONTOLOGY_SERVICE_URL

> Note: From version 1.6.0 Telicent Paralog no longer requires ONTOLOGY_API_URL

- **PARALOG_API_URL** (string) - Smart Cache Paralog API endpoint.

- **MAP_TILER_TOKEN** (string) - Token for getting map tiles.

- **ONTOLOGY_SERVICE_URL** (string) - Smart cache graph api endpoint.

- **BETA** (Boolean) - Is the application at the beta stage
  <br/>Defaults to false
  <br />Optional

- **OFFLINE_STYLES** (string[]) - A comma seperated list of styles. Used in
  offline mode.
  <br />Optional

- **OFFLINE_STYLES_BASE_URL** (string) - Base endpoint url for offline styles.
  Used in offline mode.
  <br />Optional

- **OFFLINE_STYLES_PATH** (String) - Styles path. Used in offline mode.
  <br />Optional

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
