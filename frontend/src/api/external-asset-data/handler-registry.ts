import { LngLatBounds } from "maplibre-gl";

import { DataSourceHandler } from "./data-source-handler";
import { OsNgdDataSourceHandler } from "./os-ngd-data-source-handler";
import { NaptanDataSourceHandler } from "./naptan-data-source-handler";

const iowBounds = LngLatBounds.convert([
  [-1.585464, 50.562959],
  [-0.926285, 50.761219],
]);

export const handlerRegistry: Record<string, DataSourceHandler> = {
  os_ngd: new OsNgdDataSourceHandler(iowBounds.toArray().toString()),
  naptan: new NaptanDataSourceHandler("230"),
};
