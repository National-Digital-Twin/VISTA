FROM python:3.12 AS base

# Create a non-root user and group
RUN groupadd -r appuser && useradd -r -g appuser appuser

# build and load all requirements
FROM base AS builder
WORKDIR /vista-python-api/core

# upgrade pip to the latest version
RUN apt-get update && apt-get upgrade -y \
    && apt-get install -y build-essential \
    gdal-bin \
    libgdal-dev \
    libstdc++6 \
    && rm -rf /var/lib/apt/lists/*

# Set environment variables for GDAL
ENV GDAL_CONFIG=/usr/bin/gdal-config

# Install poetry globally
RUN pip3 install poetry poetry-plugin-export

# Create a virtualenv from Poetry
RUN python3 -m venv /venv
COPY pyproject.toml poetry.lock ./
RUN poetry export -f requirements.txt > /requirements.txt
RUN /venv/bin/pip install -r /requirements.txt

# build a clean environment
FROM base
WORKDIR /vista-python-api/core

# virtual environment is copied
COPY --from=builder /venv /venv

# bash is installed for more convenient debugging.
RUN apt-get update && \
    apt-get upgrade -y --allow-downgrades \
    && apt-get install -y --allow-downgrades bash \
    linux-libc-dev=6.1.129-1 \
    && rm -rf /var/lib/apt/lists/*

# copy payload code only
COPY /vista-python-api/core .

COPY ./entrypoint.sh .

# Change ownership of necessary files and directories to the non-root user
RUN chown -R appuser:appuser /vista-python-api/core /venv ./entrypoint.sh

# Switch to the non-root user
USER appuser

EXPOSE 8000
ENTRYPOINT ["/venv/bin/gunicorn", "--config=python:core.gunicorn"]
