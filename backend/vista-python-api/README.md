# vista-python-api

Provides Data to the vista app.

## Project cheatsheet

- **pre-commit:** `pre-commit run --all-files`
- **pytest:** `pytest` or `pytest -s`
- **coverage:** `coverage run -m pytest` or `coverage html`
- **poetry sync:** `poetry install --no-root --sync`
- **updating requirements:** see [docs/updating_requirements.md](docs/updating_requirements.md)
- **create towncrier entry:** `towncrier create 123.added --edit`

## Initial project setup

See [docs/getting_started.md](docs/getting_started.md) for how to get up & running.

Or [docs/quickstart.md](docs/quickstart.md) for a quickstart guide if you've done this kind of thing before.

## Further setup

1. See [docs/using_poetry.md](docs/using_poetry.md) for how to update Python requirements using
   [Poetry](https://python-poetry.org/).
2. See [docs/detect_secrets.md](docs/detect_secrets.md) for more on creating a `.secrets.baseline`
   file using [detect-secrets](https://github.com/Yelp/detect-secrets).
3. See [docs/using_towncrier.md](docs/using_towncrier.md) for how to update the `CHANGELOG.md`
   using [towncrier](https://github.com/twisted/towncrier).

## Release Process

See [docs/release_process.md](docs/release_process.md) for the release process.

## Environment Variable

The following are a list of envrironment variables required by the API

- ENVIRONMENT
- DEBUG
- DJANGO_SECRET_KEY
- ALLOWED_HOSTS

© Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.
Licensed under the Open Government Licence v3.0.
