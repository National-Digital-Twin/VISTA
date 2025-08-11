# SPDX-License-Identifier: Apache-2.0
# © Crown Copyright 2025. This work has been developed by the National Digital Twin Programme
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

import fileinput, json, os
from dotenv import load_dotenv

load_dotenv()

assets_file = os.environ.get("ASSETS_FILE")
input_geojson_file = os.environ.get("INPUT_FILE")

def build_replacements():
    geojson_data = open(input_geojson_file)
    data = json.load(geojson_data)
    features = data["features"]
    replacements = {}
    for feature in features:
        props = feature["properties"]
        if "#" in props["uri"]:
            old_id = props["uri"].split("#")[1]
            replacements[old_id] = props["id"]
            replacements[f"https://www.iow.gov.uk/DigitalTwin#{old_id}"] = f"http://ndtp.co.uk/Building#{props["id"]}"
            replacements[f"https://www.iow.gov.uk/DigitalTwin#{props["id"]}"] = f"http://ndtp.co.uk/Building#{props["id"]}"
            print(f"{props["description"]} - {props["id"]} - {props["uri"]} - {props["type"]} - {props["dependent.criticalitySum"]}")
    return replacements

replacements = build_replacements()

with fileinput.FileInput(assets_file, inplace=True, backup='.bak') as file:
    for line in file:
        for old, new in replacements.items():
            line = line.replace(old, new)
        print(line, end="")
