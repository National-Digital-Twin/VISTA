#!/bin/bash

/venv/bin/python3 /vista-python-api/src/manage.py refresh_data
/venv/bin/python3 /vista-python-api/src/manage.py refresh_dependency_data
/venv/bin/python3 /vista-python-api/src/manage.py refresh_road_network
