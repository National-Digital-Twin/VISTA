import * as path from 'path';
import { Before, After, BeforeAll, AfterAll } from '@cucumber/cucumber';
import { chromium } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as browserSupport from './browser';

BeforeAll(async () => {
    const env = process.env.ENV || 'local';
    dotenv.config({ path: path.join(process.cwd(), 'config', `.env.${env}`) });
    const headless = process.env.CI === 'true' || process.env.HEADLESS === 'true' || process.env.HEADLESS === '1';
    const b = await chromium.launch({ headless });
    browserSupport.setBrowser(b);
});

Before(async () => {
    const c = await browserSupport.browser.newContext({
        viewport: { width: 1920, height: 1080 },
    });
    browserSupport.setContext(c);
    const p = await c.newPage();
    browserSupport.setPage(p);
});

After(async () => {
    await browserSupport.context?.close();
});

AfterAll(async () => {
    await browserSupport.browser?.close();
});
