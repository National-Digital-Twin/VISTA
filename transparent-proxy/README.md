# Transparent Proxy

The transparent proxy forwards requests to various third parties for whom:

1. We don't want to leak API keys, or
2. For whom cross-origin requests aren't an option, or
3. Both.

It's nginx, in a Docker container. The config is brought in from files in this directory and substituted with environment variables.

Building it, as an example:

```bash
docker build --tag paralog-transparent-proxy:latest .
```

When run, various access keys need to be passed in as environment variables. Currently this is:

- `ADMIRALTY_API_KEY`, and
- `REALTIME_TRAINS_API_KEY`.

It can be run for example as:

```bash
docker run -ti -p 5013:80 --env ADMIRALTY_API_KEY=... --env REALTIME_TRAINS_API_KEY=... paralog-transparent-proxy:latest
```

Note that for this application specifically, [maptiler](https://api.maptiler.com/) cannot be passed via the transparent proxy, as the host header must match api.maptiler.com else a 403 error will be returned by CloudFlare. To secure API keys used by maptiler, you must follow the guidance available at [maptiler](https://docs.maptiler.com/cloud/api/authentication-key/) to scope its use to specific domains.
