// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { Locator, Page } from '@playwright/test';

export default class PlaywrightWrapper {
    constructor(private readonly page: Page) {}

    async goto(url: string) {
        await this.page.goto(url, {
            waitUntil: 'domcontentloaded',
        });
    }

    // Custom sleep function
    async customSleep(ms: number): Promise<void> {
        return new Promise((resolve) => {
            setTimeout(resolve, ms);
        });
    }

    async waitAndClick(locator: Locator) {
        await locator.waitFor({
            state: 'visible',
        });
        await locator.click();
    }

    async navigateTo(link: string) {
        await Promise.all([this.page.waitForNavigation(), this.page.click(link)]);
    }

    async moveAndClick(x: number, y: number) {
        await this.page.mouse.move(x, y);
        await this.page.mouse.click(x, y);
    }
}
