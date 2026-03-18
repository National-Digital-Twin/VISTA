const path = require('path');
require('dotenv').config({ path: path.join(__dirname, `.env.${process.env.ENV || 'local'}`) });

function getParallel() {
    const raw = process.env.PARALLEL || process.env.CUCUMBER_PARALLEL || '1';
    const n = Math.max(1, Math.min(8, parseInt(raw, 10) || 1));
    return n;
}

function getPaths() {
    if (process.env.FEATURE) {
        return [process.env.FEATURE];
    }
    return ['features'];
}

module.exports = {
    default: {
        tags: process.env.npm_config_TAGS || '',
        formatOptions: {
            snippetInterface: 'async-await',
        },
        paths: getPaths(),
        publishQuiet: true,
        dryRun: false,
        require: ['support/*.ts', 'steps/*.ts'],
        requireModule: ['ts-node/register'],
        parallel: getParallel(),
    },
    rerun: {
        formatOptions: {
            snippetInterface: 'async-await',
        },
        publishQuiet: true,
        dryRun: false,
        require: ['support/*.ts', 'steps/*.ts'],
        requireModule: ['ts-node/register'],
        format: ['progress-bar', 'html:test-results/cucumber-report.html', 'json:test-results/cucumber-report.json', 'rerun:@rerun.txt'],
        paths: getPaths(),
        parallel: getParallel(),
    },
};
