import { test, expect } from '@playwright/test';
import { LEVELS } from '../../public/levels.js';
import { createLevelQuestion, newProgress } from '../../public/learning.js';

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
  await page.locator('#continue').click(); await page.locator('#next-level').click();
  await expect(page.locator('#dialog-title')).toHaveText('El río brillante');
  await page.locator('#start-game').click(); await expect(page.locator('#game-canvas')).toBeVisible();
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

test('all ten levels can be played, require their checkpoints, and finish with a saved trophy', async ({ page }) => {
  test.setTimeout(120000);
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.clock.install(); await page.addInitScript(() => { Math.random = () => .2; });
  await page.goto('/');
  await expect(page.locator('.level-card')).toHaveCount(10);
  await expect(page.locator('[data-level="2"]')).toBeDisabled();
  await page.locator('#play').click();
  for (const level of LEVELS) {
    await expect(page.locator('#dialog-title')).toHaveText(level.name);
    await page.locator('#start-game').click();
    if (level.id > 1) await page.locator('#left').click();
    for (let t = 0; t < 45 && await page.locator('#game-canvas').count(); t++) await page.clock.runFor(1000);
    await expect(page.locator('#dialog-title')).toHaveText('¡Recorrido completado!');
    for (let stage = 0; stage < level.challenges.length; stage++) {
      const q = createLevelQuestion(level.id, stage, () => .2);
      await expect(page.locator('#question-text')).toHaveText(q.text);
      await expect(page.locator('#completed-levels')).toHaveText(`${level.id - 1} de 10 niveles completados`);
      if (level.id === 10 && stage === 1) {
        await page.getByRole('button', { name: q.choices.find(c => c !== q.answer), exact: true }).click();
        await expect(page.locator('#continue')).toBeHidden();
        await expect(page.locator('#hint')).toBeVisible();
      }
      await page.getByRole('button', { name: q.answer, exact: true }).click();
      await page.locator('#continue').click();
    }
    await expect(page.locator('#completed-levels')).toHaveText(`${level.id} de 10 niveles completados`);
    if (level.id < 10) await page.locator('#next-level').click();
  }
  await expect(page.locator('#dialog-title')).toHaveText('¡El bosque vuelve a brillar!');
  await expect(page.locator('#next-level')).toHaveCount(0);
  await page.locator('#back-map').click(); await page.reload();
  await expect(page.locator('.level-card.completed')).toHaveCount(10);
  await expect(page.locator('#level')).toHaveText('10');
  await page.locator('#progress-open').click();
  await expect(page.locator('.badge').filter({ hasText: 'Guardián del gran árbol' })).not.toHaveClass(/locked/);
  await page.locator('#close-progress').click();
  await page.locator('[data-level="1"]').click(); await page.locator('#start-game').click();
  await page.clock.runFor(21000); await solveSum(page); await page.locator('#continue').click();
  await expect(page.locator('#completed-levels')).toHaveText('10 de 10 niveles completados');
  expect(errors).toEqual([]);
});

test('missing a collection goal offers a retry and does not unlock a level', async ({ page }) => {
  const progress = newProgress(); progress.completedLevels = 1; progress.level = 2;
  await page.addInitScript(value => { localStorage.setItem('santiago-adventure-v1', JSON.stringify(value)); Math.random = () => .2; }, progress);
  await page.clock.install(); await page.goto('/'); await page.locator('#play').click(); await page.locator('#start-game').click();
  await page.clock.runFor(31000);
  await expect(page.locator('#dialog-title')).toHaveText('¡Vamos a intentarlo otra vez!');
  await page.getByRole('button', { name: 'En una cesta azul', exact: true }).click();
  await page.locator('#continue').click();
  await expect(page.locator('#game-objective')).toHaveText('★ 0 / 4 estrellas');
  await expect(page.locator('[data-level="3"]')).toBeDisabled();
});

test('old saved progress opens the right level and the map remains available offline', async ({ page, context }) => {
  const old = { ...newProgress(), version: 1, level: 4, stars: 50 }; delete old.completedLevels;
  await page.addInitScript(value => { if (!localStorage.getItem('santiago-adventure-v1')) localStorage.setItem('santiago-adventure-v1', JSON.stringify(value)); }, old);
  await page.goto('/');
  await expect(page.locator('#total-stars')).toHaveText('50');
  await expect(page.locator('.level-card.completed')).toHaveCount(3);
  await expect(page.locator('[data-level="4"]')).toBeEnabled();
  await expect(page.locator('[data-level="5"]')).toBeDisabled();
  await page.evaluate(async () => { await navigator.serviceWorker.ready; if (!navigator.serviceWorker.controller) await new Promise(resolve => navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true })); });
  await context.setOffline(true); await page.reload(); await page.locator('[data-level="4"]').click();
  await expect(page.locator('#dialog-title')).toHaveText('El puente de madera');
  await page.locator('#start-game').click(); await expect(page.locator('#game-canvas')).toBeVisible();
});

test('colliding with rocks opens a recovery mission without unlocking the next level', async ({ page }) => {
  await page.clock.install(); await page.addInitScript(() => { Math.random = () => .2; });
  await page.goto('/'); await page.locator('#play').click(); await page.locator('#start-game').click();
  await page.locator('#left').click(); await page.clock.runFor(20000);
  await expect(page.locator('#dialog-title')).toHaveText('Recuperemos tu energía');
  await expect(page.locator('#level')).toHaveText('1');
  await solveSum(page); await page.locator('#continue').click();
  await expect(page.locator('#hearts')).toHaveAttribute('aria-label', '3 de 3 puntos de energía');
  await expect(page.locator('[data-level="2"]')).toBeDisabled();
});

test('finishing a level after a long session offers a rest instead of starting another flight', async ({ page }) => {
  await page.clock.install(); await page.addInitScript(() => { Math.random = () => .2; });
  await page.goto('/'); await page.locator('#play').click(); await page.locator('#start-game').click();
  await page.locator('#pause').click(); await page.clock.fastForward(601000);
  await page.locator('#resume').click(); await page.clock.runFor(21000);
  await solveSum(page); await page.locator('#continue').click();
  await expect(page.locator('#adventure-content')).toContainText('Descansa los ojos');
  await expect(page.locator('#next-level')).toHaveCount(0);
  await page.locator('#back-map').click();
  await expect(page.locator('[data-level="2"]')).toBeEnabled();
});
