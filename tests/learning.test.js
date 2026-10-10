import test from 'node:test';
import assert from 'node:assert/strict';
import { LIMITS, SUBJECTS, createQuestion, newProgress, restoreProgress, recordAnswer } from '../public/learning.js';
import { newGame, move, step } from '../public/game.js';

test('all generated sums have four unique answers, one correct answer, and respect the selected range', () => {
  for (let difficulty = 0; difficulty < 3; difficulty++) {
    for (let i = 0; i < 300; i++) {
      const q = createQuestion('math', difficulty);
      const [a, b] = q.text.match(/\d+/g).map(Number);
      assert.equal(a + b, Number(q.answer));
      assert.ok(a > 0 && b > 0 && a + b <= LIMITS[difficulty]);
      assert.equal(new Set(q.choices).size, 4);
      assert.equal(q.choices.filter(c => c === q.answer).length, 1);
    }
  }
});
test('every reading and English exercise has a valid answer and a helpful hint', () => {
  for (const subject of ['reading', 'english']) for (let i = 0; i < 24; i++) {
    const q = createQuestion(subject, 0, i);
    assert.equal(new Set(q.choices).size, 3);
    assert.ok(q.choices.includes(q.answer));
    assert.ok(q.text && q.prompt && q.hint && q.explanation);
  }
});
test('three first-try sums raise difficulty; repeated mistakes lower it without removing rewards', () => {
  const p = newProgress();
  for (let i = 0; i < 3; i++) recordAnswer(p, 'math', true, 0);
  assert.equal(p.difficulty, 1); assert.equal(p.stars, 9);
  recordAnswer(p, 'math', false, 0); recordAnswer(p, 'math', false, 1);
  assert.equal(p.difficulty, 0); assert.equal(p.stars, 9);
  recordAnswer(p, 'math', true, 2);
  assert.deepEqual(p.subjects.math, { completed: 4, attempts: 6, firstTry: 3 });
});
test('saved progress survives reload and corrupt storage gets safe defaults', () => {
  const p = newProgress(); recordAnswer(p, 'reading', true, 0);
  assert.deepEqual(restoreProgress(JSON.stringify(p)), p);
  for (const bad of ['broken', null, '{}', '{"version":99}']) assert.deepEqual(restoreProgress(bad), newProgress());
  const bad = restoreProgress(JSON.stringify({ version: 1, level: -4, stars: '999', difficulty: 500, subjects: { reading: { completed: '<script>' } } }));
  assert.equal(bad.level, 1); assert.equal(bad.stars, 0); assert.equal(bad.difficulty, 2);
  for (const subject of Object.keys(SUBJECTS)) assert.equal(bad.subjects[subject].completed, 0);
});
test('movement stays on the three lanes and pause freezes the game', () => {
  const g = newGame(); for (let i = 0; i < 5; i++) move(g, -1); assert.equal(g.lane, 0);
  for (let i = 0; i < 5; i++) move(g, 1); assert.equal(g.lane, 2);
  g.status = 'paused'; const snapshot = structuredClone(g); step(g, 1); move(g, -1); assert.deepEqual(g, snapshot);
});
test('stars are collected once and losing all energy opens recovery', () => {
  const g = newGame(); g.objects = [{ lane: 1, y: .8, kind: 'star' }]; step(g, .01);
  assert.equal(g.stars, 1); step(g, .01); assert.equal(g.stars, 1);
  for (let i = 0; i < 3; i++) { g.invincible = 0; g.objects = [{ lane: 1, y: .8, kind: 'rock' }]; step(g, .01); }
  assert.equal(g.hearts, 0); assert.equal(g.status, 'recover');
});
test('a completed run requires the level mission and cannot continue ticking', () => {
  const g = newGame(); g.elapsed = 29.99; step(g, .02);
  assert.equal(g.status, 'complete'); const elapsed = g.elapsed; step(g, .05); assert.equal(g.elapsed, elapsed);
  const collected = newGame(); collected.stars = 7; collected.objects = [{ lane: 1, y: .8, kind: 'star' }]; step(collected, .01); assert.equal(collected.status, 'complete');
});
