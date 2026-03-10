import { When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { page } from '../support/browser';

const MAP_READY_AFTER_ZOOM_MS = 1000;
const DRAW_MODE_ACTIVATE_MS = 1500;
const BETWEEN_POLYGON_CLICKS_MS = 300;
const AFTER_POLYGON_COMPLETE_MS = 2000;

const deleteButton = () => page.getByRole('button', { name: 'Delete focus area' });

When('the Focus area panel is ready for drawing', async () => {
    await expect(page.getByRole('button', { name: 'Draw new focus area' })).toBeEnabled({ timeout: 15000 });
});

When('I draw a new polygon on the map', async function () {
    await page.getByRole('button', { name: 'Zoom In' }).click();
    await page.waitForTimeout(MAP_READY_AFTER_ZOOM_MS);
    (this as { focusAreaCountBeforeDraw?: number }).focusAreaCountBeforeDraw = await deleteButton().count();
    await page.getByRole('button', { name: 'Draw new focus area' }).click();
    await page.getByRole('menuitem', { name: 'Draw polygon' }).click();
    await page.waitForTimeout(DRAW_MODE_ACTIVATE_MS);
    const map = page.locator('.maplibregl-map').first();
    await map.waitFor({ state: 'attached', timeout: 5000 });
    const box = await map.boundingBox();
    const cx = box ? box.x + box.width / 2 : 960;
    const cy = box ? box.y + box.height / 2 : 540;
    await page.mouse.click(cx - 80, cy - 60);
    await page.waitForTimeout(BETWEEN_POLYGON_CLICKS_MS);
    await page.mouse.click(cx + 80, cy - 60);
    await page.waitForTimeout(BETWEEN_POLYGON_CLICKS_MS);
    await page.mouse.click(cx, cy + 60);
    await page.waitForTimeout(BETWEEN_POLYGON_CLICKS_MS);
    await page.mouse.dblclick(cx, cy + 60);
    await page.waitForTimeout(AFTER_POLYGON_COMPLETE_MS);
});

Then('a new focus area appears in the list', async function () {
    const countBefore = (this as { focusAreaCountBeforeDraw?: number }).focusAreaCountBeforeDraw ?? 0;
    await expect(deleteButton()).toHaveCount(countBefore + 1, { timeout: 15000 });
});

When('I delete the most recently added focus area', async () => {
    await deleteButton().last().click();
    await page.getByRole('button', { name: 'DELETE' }).click();
});

Then('that focus area is no longer in the list', async function () {
    const countBefore = (this as { focusAreaCountBeforeDraw?: number }).focusAreaCountBeforeDraw ?? 0;
    await expect(deleteButton()).toHaveCount(countBefore, { timeout: 10000 });
});
