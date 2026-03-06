// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { transports, format } from 'winston';

export function options(scenarioName: string) {
    return {
        transports: [
            new transports.File({
                filename: `test-results/logs/${scenarioName}/log.log`,
                level: 'info',
                format: format.combine(
                    format.timestamp({ format: 'MMM-DD-YYYY HH:mm:ss' }),
                    format.align(),
                    format.printf((info) => `${info.level}: ${[info.timestamp]}: ${info.message}`),
                ),
            }),
        ],
    };
}
