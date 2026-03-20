import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { page } from '../support/browser';

Given('I open the project', async () => {
    const baseUrl = process.env.BASEURL || 'http://localhost:3001';
    await page.goto(baseUrl);
});

Then('I can see the VISTA logo in the navigation bar', async () => {
    await expect(page.getByAltText('VISTA Logo')).toBeVisible();
});

Then('the Focus area panel is active', async () => {
    await expect(page.getByRole('heading', { name: 'Focus area' })).toBeVisible();
    await expect(page.getByText('Map-wide')).toBeVisible();
});

Then('the map is loaded', async () => {
    await expect(page.getByRole('button', { name: 'Zoom In' })).toBeVisible({ timeout: 10000 });
});

When(/^I open the (.+) panel$/, async (panelName: string) => {
    const name = panelName.trim();
    const heading = page.getByRole('heading', { name });
    const alreadyOpen = await heading.waitFor({ state: 'visible', timeout: 5000 }).then(() => true).catch(() => false);
    if (!alreadyOpen) {
        await page.getByText(name, { exact: true }).first().click({ force: true });
        await heading.waitFor({ state: 'visible', timeout: 5000 });
    }
});

Then('I see the Focus area panel with its initial content', async () => {
    await expect(page.getByRole('heading', { name: 'Focus area' })).toBeVisible();
    await expect(page.getByText('Map-wide')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Draw new focus area' })).toBeVisible();
});

Then('I see the Assets panel with its initial content', async () => {
    await expect(page.getByRole('heading', { name: 'Assets' })).toBeVisible();
    await expect(page.getByLabel(/Select focus area|Focus area/).first()).toBeVisible();
});

Then('I see the Exposure panel with its initial content', async () => {
    await expect(page.getByRole('heading', { name: 'Exposure' })).toBeVisible();
    await expect(page.getByLabel('Focus area')).toBeVisible();
});

Then('I see the Inspector panel with its initial content', async () => {
    await expect(page.getByRole('heading', { name: 'Inspector' })).toBeVisible();
    await expect(page.getByText('Select an asset on the map to inspect its details.')).toBeVisible();
});

Then('I see the Utilities panel with its initial content', async () => {
    await expect(page.getByRole('heading', { name: 'Utilities' })).toBeVisible();
});

Then('I see the Resources panel with its initial content', async () => {
    await expect(page.getByRole('heading', { name: 'Resources' })).toBeVisible();
});

Then('I see the Constraints panel with its initial content', async () => {
    await expect(page.getByRole('heading', { name: 'Constraints' })).toBeVisible();
});

When('I open the user menu', async () => {
    await page.getByRole('banner').locator('button[aria-haspopup="true"]').click();
    await expect(page.getByRole('menuitem', { name: /My Profile/i })).toBeVisible({ timeout: 3000 });
});

Then('I can see My Profile in the menu', async () => {
    await expect(page.getByRole('menuitem', { name: /My Profile/i })).toBeVisible();
});

Then('I can see Privacy notice in the menu', async () => {
    await expect(page.getByRole('menuitem', { name: /Privacy notice/i })).toBeVisible();
});

Then('I can see Sign Out in the menu', async () => {
    await expect(page.getByRole('menuitem', { name: /Sign Out/i })).toBeVisible();
});
