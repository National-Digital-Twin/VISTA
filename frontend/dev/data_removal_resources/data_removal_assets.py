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

import os
import json
from dotenv import load_dotenv

load_dotenv()

assets_file = os.environ.get("ASSETS_FILE")
asset_type_file = os.environ.get("ASSET_TYPE_DATA")


with open(assets_file, "r") as f:
    assets = f.read()
with open(asset_type_file, "r") as f:
    asset_types_string = f.read()

asset_types = asset_types_string.split("\n")
assets_for_evaluation = json.loads(assets)
assets_to_keep = []
for asset in assets_for_evaluation:
    type = asset["type"].split("#")[1]
    if type is not None and type not in asset_types:
        assets_to_keep.append(asset)

with open("output.json", "w", encoding="utf-8") as f:
    json.dump(assets_to_keep, f, indent=4)
