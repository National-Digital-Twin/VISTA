#!/bin/bash

/venv/bin/python3 /vista-python-api/src/manage.py migrate
/venv/bin/python3 /vista-python-api/src/manage.py loaddata api/fixtures/*.json
/venv/bin/python3 /vista-python-api/src/manage.py refresh_data
/venv/bin/python3	/vista-python-api/src/manage.py refresh_dependency_data
/venv/bin/python3	/vista-python-api/src/manage.py load_exposure_layers
/venv/bin/gunicorn --config=python:core.gunicorn
