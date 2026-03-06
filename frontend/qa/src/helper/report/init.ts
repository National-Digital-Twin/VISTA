// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

const fs = require('fs-extra');
try {
    fs.ensureDir('test-results');
    fs.emptyDir('test-results');
} catch (error) {
    console.log('Folder not created! ' + error);
}
