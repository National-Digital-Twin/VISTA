// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { Page } from '@playwright/test';
import { Logger } from 'winston';

export const basePage = {
    page: undefined as Page,
    logger: undefined as Logger,
};
