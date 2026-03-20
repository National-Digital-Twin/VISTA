import type { Browser, BrowserContext, Page } from '@playwright/test';

export let browser: Browser;
export let context: BrowserContext;
export let page: Page;

export function setBrowser(b: Browser) {
    browser = b;
}

export function setContext(c: BrowserContext) {
    context = c;
}

export function setPage(p: Page) {
    page = p;
}
