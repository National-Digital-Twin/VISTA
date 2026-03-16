# SPDX-License-Identifier: Apache-2.0
# © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme
# and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

# and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

#
#  Licensed under the Apache License, Version 2.0 (the "License");
#  you may not use this file except in compliance with the License.
#  You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
#  Unless required by applicable law or agreed to in writing, software
#  distributed under the License is distributed on an "AS IS" BASIS,
#  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#  See the License for the specific language governing permissions and
#  limitations under the License.

import os
import json
import requests
from dotenv import load_dotenv

load_dotenv()

fuseki_url = os.environ.get("FUSEKI_URL")
traversal_delete_query_file = os.environ.get("TRAVERSAL_DELETE_QUERY")
asset_selection_query_file = os.environ.get("ASSET_SELECTION_QUERY")
asset_type_file = os.environ.get("ASSET_TYPE_DATA")


with open(traversal_delete_query_file, "r") as f:
    traversal_delete_query_template = f.read()
with open(asset_selection_query_file, "r") as f:
    asset_selection_query = f.read()
with open(asset_type_file, "r") as f:
    asset_types_string = f.read()

asset_types = asset_types_string.split("\n")

for type in asset_types:
    asset_result = requests.post(
        f"{fuseki_url}/query",
        headers={"Content-Type": "application/sparql-query"},
        data=asset_selection_query.format(type=type).encode("utf-8"),
    )
    data = json.loads(asset_result.text)
    assets = [binding["s"]["value"] for binding in data["results"]["bindings"]]

    for asset in assets:
        query = traversal_delete_query_template.format(asset=asset)

        response = requests.post(
            f"{fuseki_url}/update",
            headers={"Content-Type": "application/sparql-update"},
            data=query.encode("utf-8"),
        )
