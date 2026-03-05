# Quickstart

This document contains instructions _only_ to get a fully working development environment for
running this repo.

For pre-requisites (e.g. `pyenv` install instructions) plus details on what's
being installed and why, please see [docs/getting_started.md](docs/getting_started.md).

We assume the following are installed and configured:

- [pyenv](https://github.com/pyenv/pyenv)
- [pyenv-virtualenvwrapper](https://github.com/pyenv/pyenv-virtualenvwrapper)
- [Poetry](https://python-poetry.org/docs/)
- [zsh-autoswitch-virtualenv](https://github.com/MichaelAquilina/zsh-autoswitch-virtualenv)
- [direnv](https://direnv.net/)
- [poetry up](https://github.com/MousaZeidBaker/poetry-plugin-up)

## Part 1: Generic Python setup

```sh
# Get the repo
git clone ${REPO_GIT_URL}

# Install Python
pyenv install $(cat .python-version)
pyenv shell $(cat .python-version)
python -m pip install --upgrade pip
python -m pip install virtualenvwrapper
pyenv virtualenvwrapper

# Setup the virtualenv
mkvirtualenv -p python$(cat .python-version) $(cat .venv)
python -V
python -m pip install --upgrade pip

# Install dependencies with Poetry
poetry self update
poetry install --no-root --sync

# Create templated .env for storing secrets
# Careful not to overwrite the js environment variables here.
# Sync with .env.default
cp .env.template .env
direnv allow

# Create and audit secrets baseline
# N.B. Adjust the exclusions here depending on your needs (check .pre-commit-config.yaml)
detect-secrets --verbose scan \
    --exclude-files 'poetry\.lock' \
    --exclude-files '\.secrets\.baseline' \
    --exclude-files '\.env\.template' \
    --exclude-secrets 'password|ENTER_PASSWORD_HERE|INSERT_API_KEY_HERE' \
    --exclude-lines 'integrity=*sha' \
    > .secrets.baseline

detect-secrets audit .secrets.baseline
```

## Part 2: Getting started

Please check [docs/getting_started.md](getting_started.md) for further instructions.

© Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.
Licensed under the Open Government Licence v3.0.
