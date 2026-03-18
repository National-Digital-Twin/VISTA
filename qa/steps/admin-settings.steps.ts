import { When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { page } from '../support/browser';

When('I open Admin settings from the menu', async () => {
    await page.getByRole('menuitem', { name: 'Admin Settings' }).click();
    await page.waitForURL(/\/admin/);
});

Then('I see the Admin settings page heading', async () => {
    await expect(page.getByRole('heading', { name: 'Admin settings', level: 1 })).toBeVisible();
});

Then('I see the admin settings tabs', async () => {
    await expect(page.getByRole('tablist', { name: 'admin settings tabs' })).toBeVisible();
});

Then('I see the tab Users', async () => {
    await expect(page.getByRole('tab', { name: 'Users' })).toBeVisible();
});

Then('I see the tab Invites', async () => {
    await expect(page.getByRole('tab', { name: 'Invites' })).toBeVisible();
});

Then('I see the tab Groups', async () => {
    await expect(page.getByRole('tab', { name: 'Groups' })).toBeVisible();
});

Then('I see the tab Access requests', async () => {
    await expect(page.getByRole('tab', { name: 'Access requests' })).toBeVisible();
});

Then('the Users tab is selected', async () => {
    await expect(page.getByRole('tab', { name: 'Users', selected: true })).toBeVisible();
});

Then('I see the Users tab content with search and table', async () => {
    await expect(page.getByRole('tabpanel', { name: 'Users' })).toBeVisible();
    await expect(page.getByPlaceholder('Search for user')).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'User', exact: true })).toBeVisible();
});
