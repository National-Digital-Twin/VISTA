// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

module.exports = {
    default: {
        tags: process.env.npm_config_TAGS || '',
        formatOptions: {
            snippetInterface: 'async-await',
        },
        paths: ['src/test/features'],
        publishQuiet: true,
        dryRun: false,
        require: ['src/test/steps/*.ts', 'src/hooks/hooks.ts'],
        requireModule: ['ts-node/register'],
        parallel: 1,
    },
    rerun: {
        formatOptions: {
            snippetInterface: 'async-await',
        },
        publishQuiet: true,
        dryRun: false,
        require: ['src/test/steps/*.ts', 'src/hooks/hooks.ts'],
        requireModule: ['ts-node/register'],
        format: ['progress-bar', 'html:test-results/cucumber-report.html', 'json:test-results/cucumber-report.json', 'rerun:@rerun.txt'],
        parallel: 2,
    },
};
