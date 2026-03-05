// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import * as dotenv from 'dotenv';

export const getEnv = () => {
    if (process.env.ENV) {
        dotenv.config({
            path: `src/helper/env/.env.${process.env.ENV}`,
        });
    } else {
        console.error('NO ENV PASSED!');
    }
};
