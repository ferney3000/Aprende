import { test, expect } from '@playwright/test';

async function solveSum(page) {
  const text = await page.locator('#question-text').innerText();
  const [a, b] = text.match(/\d+/g).map(Number);
  await page.getByRole('button', { name: String(a + b), exact: true }).click();
}

test('reading offers hints, awards once, and saves progress on reload', async ({ page }) => {
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await page.locator('[data-subject="reading"]').click();
  await page.getByRole('button', { name: 'Con su hermana', exact: true }).click();
  await expect(page.locator('#hint')).toBeVisible();
  await expect(page.locator('#continue')).toBeHidden();
  await page.getByRole('button', { name: 'Con su abuelo', exact: true }).click();
  await expect(page.locator('#continue')).toBeVisible();
  await expect(page.locator('#total-stars')).toHaveText('3');
  await page.getByRole('button', { name: 'Cerrar aventura', exact: true }).click();
  await page.reload();
  await expect(page.locator('#total-stars')).toHaveText('3');
  await page.locator('#family-open').click();
  await expect(page.locator('#family-stats')).toContainText('1 resueltas · 0 al primer intento');
  expect(errors).toEqual([]);
});
test('math adapts after success and family can choose a starting level', async ({ page }) => {
  await page.goto('/'); await page.locator('[data-subject="math"]').click();
  for (let i = 0; i < 3; i++) { await solveSum(page); if (i < 2) await page.locator('#continue').click(); }
  await page.locator('#close-adventure').click(); await page.locator('#family-open').click();
  await expect(page.locator('#difficulty')).toHaveValue('1');
  await page.locator('#difficulty').selectOption('2'); await page.locator('#close-family').click();
  await page.reload(); await page.locator('#family-open').click();
  await expect(page.locator('#difficulty')).toHaveValue('2');
});
test('game pauses, recovers energy through a mission, and returns to play', async ({ page }) => {
  await page.goto('/'); await page.locator('#play').click(); await page.locator('#start-game').click();
  await page.locator('#pause').click(); await expect(page.locator('#pause-overlay')).toBeVisible();
  const time = await page.locator('#time-left').innerText();
  await page.waitForTimeout(1100); await expect(page.locator('#time-left')).toHaveText(time);
  await page.locator('#resume').click(); await page.locator('#energy').click();
  await expect(page.locator('#game-canvas')).toHaveCount(0);
  await solveSum(page); await page.locator('#continue').click();
  await expect(page.locator('#game-canvas')).toBeVisible();
  await expect(page.locator('#hearts')).toHaveAttribute('aria-label', '3 de 3 puntos de energía');
});
test('finishing a run locks the next level until the educational mission is solved', async ({ page }) => {
  await page.clock.install();
  await page.addInitScript(() => { Math.random = () => .2; });
  await page.goto('/'); await page.locator('#play').click(); await page.locator('#start-game').click();
  await page.clock.runFor(31000);
  await expect(page.locator('#dialog-title')).toHaveText('¡Recorrido completado!');
  await expect(page.locator('#continue')).toBeHidden();
  await expect(page.locator('#level')).toHaveText('1');
  await solveSum(page); await expect(page.locator('#level')).toHaveText('2');
  await page.locator('#continue').click(); await expect(page.locator('#game-canvas')).toBeVisible();
});
test('mobile layout and touch controls work without horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 }); await page.goto('/');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: '/tmp/santiago-mobile.png', fullPage: true });
  await page.locator('#play').click(); await page.locator('#start-game').click();
  await page.locator('#left').click(); await page.locator('#right').click();
  await expect(page.locator('#game-canvas')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
test('installed assets work offline and English practice remains available', async ({ page, context }) => {
  await page.goto('/');
  await page.evaluate(async () => { await navigator.serviceWorker.ready; if (!navigator.serviceWorker.controller) await new Promise(resolve => navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true })); });
  await context.setOffline(true); await page.reload();
  await page.locator('[data-subject="english"]').click();
  await expect(page.locator('#question-text')).toHaveText('cat');
  await page.getByRole('button', { name: 'gato', exact: true }).click();
  await expect(page.locator('#feedback')).toContainText('Una nueva palabra');
});
test('storage restrictions do not prevent playing and desktop view has no runtime errors', async ({ page }) => {
  await page.addInitScript(() => { Storage.prototype.getItem = () => { throw new Error('blocked'); }; Storage.prototype.setItem = () => { throw new Error('blocked'); }; });
  await page.setViewportSize({ width: 1440, height: 1000 }); await page.goto('/');
  await expect(page.locator('#storage-notice')).toBeVisible();
  await page.screenshot({ path: '/tmp/santiago-desktop.png', fullPage: true });
  await page.locator('[data-subject="math"]').click(); await solveSum(page);
  await expect(page.locator('#total-stars')).toHaveText('3');
});
