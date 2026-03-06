// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { LaunchOptions, chromium, firefox, webkit } from '@playwright/test';

const options: LaunchOptions = {
    headless: false,
};
export const invokeBrowser = () => {
    const browserType = process.env.npm_config_BROWSER || 'chrome';
    switch (browserType) {
        case 'chrome':
            return chromium.launch(options);
        case 'firefox':
            return firefox.launch(options);
        case 'webkit':
            return webkit.launch(options);
        default:
            throw new Error('Please set the proper browser!');
    }
};
