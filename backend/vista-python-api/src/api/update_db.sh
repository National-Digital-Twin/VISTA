#!/bin/bash
# SPDX-License-Identifier: Apache-2.0
# © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme
# and is legally attributed to the Department for Business and Trade (UK) as the governing entity.


/venv/bin/python3 /vista-python-api/src/manage.py refresh_data
/venv/bin/python3 /vista-python-api/src/manage.py refresh_dependency_data
/venv/bin/python3 /vista-python-api/src/manage.py refresh_road_network
