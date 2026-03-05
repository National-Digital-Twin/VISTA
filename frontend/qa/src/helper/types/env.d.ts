// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

export {};

declare global {
    namespace NodeJS {
        interface ProcessEnv {
            BROWSER: 'chrome' | 'firefox' | 'webkit';
            ENV: 'staging' | 'prod' | 'demo' | 'test';
            BASEURL: string;
            LISAURL: string;
            HEAD: 'true' | 'false';
            USERNAME: string;
        }
    }
}
