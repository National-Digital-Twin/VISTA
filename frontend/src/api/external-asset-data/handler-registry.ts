import { LngLatBounds } from 'maplibre-gl';

import { DataSourceHandler } from './data-source-handler';
import { OsNgdDataSourceHandler } from './os-ngd-data-source-handler';
import { NaptanDataSourceHandler } from './naptan-data-source-handler';
import { CQCDataSourceHandler } from './cqc-data-source-handler';
import { OsNamesDataSourceHandler } from './os-names-data-source-handler';

const iowBounds = LngLatBounds.convert([
    [-1.585464, 50.562959],
    [-0.926285, 50.761219],
]);

export const handlerRegistry: Record<string, DataSourceHandler> = {
    cqc: new CQCDataSourceHandler('Isle of Wight'),
    naptan: new NaptanDataSourceHandler('230'),
    os_names: new OsNamesDataSourceHandler('425000,80000,470000,97000'),
    os_ngd: new OsNgdDataSourceHandler(iowBounds.toArray().toString()),
};
