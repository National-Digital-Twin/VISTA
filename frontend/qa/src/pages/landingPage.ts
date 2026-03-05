// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { expect, Page } from '@playwright/test';
import PlaywrightWrapper from '../helper/wrapper/PlaywrightWrappers';

export default class LandingPage {
    private readonly base: PlaywrightWrapper;
    constructor(private readonly page: Page) {
        this.base = new PlaywrightWrapper(page);
    }

    //Object Locators
    private readonly Elements = {
        menuParalog: 'Vista',
    };

    async verifyDemoLandingPage() {
        await expect(this.page).toHaveTitle('.:Demo Landing Page:.');
    }

    async clickMenuByName() {
        const paralogBtn = await this.page.getByRole('link', {
            name: this.Elements.menuParalog,
        });
        await this.base.waitAndClick(paralogBtn);
        await this.page.waitForTimeout(3000);
    }
}
