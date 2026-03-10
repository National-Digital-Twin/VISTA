import { When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { page } from '../support/browser';

When('I navigate to the Data room', async () => {
    await page.getByRole('button', { name: 'Data room' }).click();
    await page.waitForURL(/\/data-room/);
});

Then('I see the Data room sidebar with scenario management', async () => {
    await expect(page.getByRole('heading', { name: 'Scenario management', level: 3 })).toBeVisible();
    await expect(page.getByText('Load scenario')).toBeVisible();
    await expect(page.getByText('Manage scenario')).toBeVisible();
    await expect(page.getByText('Create new scenario')).toBeVisible();
});

Then('I see the Data room sidebar with data sources section', async () => {
    await expect(page.getByRole('heading', { name: 'Data sources and access management', level: 3 })).toBeVisible();
    await expect(page.getByText(/Data sources \(\d+\)/)).toBeVisible();
});

Then('I see the Data sources main content with search and table', async () => {
    await expect(page.getByPlaceholder('Search for a data source')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Clear filters' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Data source' })).toBeVisible();
});

Then('I see the data sources table with columns Data source, Owner, and Access level', async () => {
    await expect(page.getByRole('columnheader', { name: 'Data source' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Owner' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Access level' })).toBeVisible();
});
