import { getLevel, goalMet } from './levels.js';
export function newGame(level = 1) { return { lane: 1, hearts: 3, stars: 0, fireflies: 0, elapsed: 0, spawnIn: .5, spawned: 0, objects: [], status: 'playing', level: getLevel(level).id, invincible: 0 }; }
export function move(game, direction) { if (game.status === 'playing') game.lane = Math.max(0, Math.min(2, game.lane + direction)); }
export function step(game, seconds, rng = Math.random) {
  if (game.status !== 'playing') return;
  const dt = Math.min(.06, Math.max(0, seconds));
  game.elapsed += dt;
  game.invincible = Math.max(0, game.invincible - dt);
  game.spawnIn -= dt;
  if (game.spawnIn <= 0) {
    const goal = getLevel(game.level).goal;
    const pattern = goal.type === 'fireflies' ? ['firefly', 'star', 'firefly', 'rock'] : goal.type === 'both' ? ['star', 'firefly', 'star', 'rock'] : ['star', 'star', 'rock', 'star'];
    let kind = pattern[game.spawned % pattern.length];
    if (game.level >= 5 && game.spawned % 9 === 8) kind = 'heart';
    game.objects.push({ lane: Math.floor(rng() * 3), y: -.08, kind });
    game.spawned++;
    game.spawnIn = 1.25 - (game.level - 1) * .03;
  }
  for (const object of game.objects) {
    object.y += dt * (.22 + (game.level - 1) * .009);
    if (object.lane === game.lane && Math.abs(object.y - .8) < .065 && !object.hit) {
      object.hit = true;
      if (object.kind === 'star') game.stars++;
      else if (object.kind === 'firefly') game.fireflies++;
      else if (object.kind === 'heart') game.hearts = Math.min(3, game.hearts + 1);
      else if (game.invincible === 0) { game.hearts--; game.invincible = 1; }
    }
  }
  game.objects = game.objects.filter(o => !o.hit && o.y < 1.1);
  if (game.hearts <= 0) game.status = 'recover';
  else if (goalMet(game)) game.status = 'complete';
  else if (game.elapsed >= getLevel(game.level).duration) game.status = 'retry';
}
export function drawGame(canvas, game) {
  // Match the drawing surface to its displayed size so the car keeps its
  // proportions on both narrow phones and wide desktop screens.
  const bounds = canvas.getBoundingClientRect();
  const pixelRatio = window.devicePixelRatio || 1;
  const w = bounds.width, h = bounds.height;
  const width = Math.round(w * pixelRatio), height = Math.round(h * pixelRatio);
  if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
  const ctx = canvas.getContext('2d');
  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  const { scene, colors } = getLevel(game.level);
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = colors[0]; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = colors[1]; ctx.fillRect(w * .13, 0, w * .74, h);
  ctx.fillStyle = ['night', 'cave'].includes(scene) ? '#414858' : '#59645e'; ctx.fillRect(w * .17, 0, w * .66, h);
  ctx.strokeStyle = '#f5ecd6'; ctx.lineWidth = 3;
  for (const edge of [.175, .825]) { ctx.beginPath(); ctx.moveTo(w * edge, 0); ctx.lineTo(w * edge, h); ctx.stroke(); }
  ctx.strokeStyle = '#f5ecd680'; ctx.lineWidth = 2; ctx.setLineDash([20, 22]); ctx.lineDashOffset = -game.elapsed * 80;
  for (let i = 1; i < 3; i++) { const x = w * (.18 + .64 * i / 3); ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); } ctx.setLineDash([]); ctx.lineDashOffset = 0;
  for (let i = 0; i < 10; i++) {
    const x = i % 2 ? w * .92 : w * .08, y = ((i * 99 + game.elapsed * 35) % (h + 90)) - 45;
    ctx.fillStyle = colors[2];
    if (['river', 'waterfall'].includes(scene)) {
      ctx.strokeStyle = '#ffffff99'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x - 22, y); ctx.quadraticCurveTo(x, y + 15, x + 22, y); ctx.stroke();
      if (scene === 'waterfall') { ctx.fillStyle = '#efffffa0'; ctx.fillRect(x - 8, y - 25, 4, 20); }
    } else if (scene === 'clouds') {
      ctx.fillStyle = '#ffffffb0'; ctx.beginPath(); ctx.ellipse(x, y, 36, 15, 0, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(x - 8, y - 9, 17, 0, Math.PI * 2); ctx.fill();
    } else if (['cave', 'mountain'].includes(scene)) {
      ctx.beginPath(); ctx.moveTo(x - 30, y + 30); ctx.lineTo(x, y - 30); ctx.lineTo(x + 30, y + 30); ctx.fill();
      ctx.fillStyle = scene === 'cave' ? '#b8b0dd' : '#fffaf0'; ctx.beginPath(); ctx.moveTo(x - 10, y - 10); ctx.lineTo(x, y - 30); ctx.lineTo(x + 10, y - 10); ctx.fill();
    } else if (scene === 'bridge') {
      ctx.fillRect(x - 20, y - 5, 40, 10); ctx.fillStyle = '#957753'; ctx.fillRect(x - 3, y - 30, 6, 60);
    } else if (scene === 'garden') {
      for (let p = 0; p < 5; p++) { ctx.fillStyle = '#d59ab3'; ctx.beginPath(); ctx.arc(x + Math.cos(p * 1.256) * 12, y + Math.sin(p * 1.256) * 12, 10, 0, Math.PI * 2); ctx.fill(); }
      ctx.fillStyle = '#f8dc84'; ctx.beginPath(); ctx.arc(x, y, 8, 0, Math.PI * 2); ctx.fill();
    } else {
      ctx.fillRect(x - 3, y + 9, 6, 25); ctx.beginPath(); ctx.arc(x, y, 23 + i % 3 * 5, 0, Math.PI * 2); ctx.fill();
      if (scene === 'night' || scene === 'tree') { ctx.fillStyle = '#ffeb9a'; ctx.beginPath(); ctx.arc(x - 10, y - 5, 3, 0, Math.PI * 2); ctx.fill(); }
    }
  }
  const laneX = lane => w * (.18 + .64 * (lane + .5) / 3);
  for (const object of game.objects) {
    const x = laneX(object.lane), y = object.y * h;
    if (object.kind === 'star') {
      ctx.fillStyle = '#f2c05b'; ctx.strokeStyle = '#fff2c5'; ctx.lineWidth = 3; ctx.beginPath();
      for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5 - Math.PI / 2, r = i % 2 ? 10 : 22; const px = x + Math.cos(a) * r, py = y + Math.sin(a) * r; if (!i) ctx.moveTo(px, py); else ctx.lineTo(px, py); }
      ctx.closePath(); ctx.fill(); ctx.stroke();
    } else if (object.kind === 'firefly') {
      ctx.fillStyle = '#fff0a344'; ctx.beginPath(); ctx.arc(x, y, 26, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fffbd7'; ctx.beginPath(); ctx.ellipse(x - 8, y - 4, 11, 6, -.6, 0, Math.PI * 2); ctx.ellipse(x + 8, y - 4, 11, 6, .6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#f1c55b'; ctx.beginPath(); ctx.ellipse(x, y + 3, 6, 12, 0, 0, Math.PI * 2); ctx.fill();
    } else if (object.kind === 'heart') {
      ctx.fillStyle = '#cc7290'; ctx.beginPath(); ctx.moveTo(x, y + 18); ctx.bezierCurveTo(x - 38, y - 4, x - 12, y - 26, x, y - 10); ctx.bezierCurveTo(x + 12, y - 26, x + 38, y - 4, x, y + 18); ctx.fill();
    } else {
      ctx.fillStyle = '#85928c'; ctx.beginPath(); ctx.moveTo(x - 21, y + 12); ctx.lineTo(x - 18, y - 9); ctx.lineTo(x - 4, y - 22); ctx.lineTo(x + 16, y - 17); ctx.lineTo(x + 24, y + 9); ctx.lineTo(x + 6, y + 19); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#aeb8aa'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x - 10, y - 7); ctx.lineTo(x, y - 14); ctx.lineTo(x + 9, y - 8); ctx.stroke();
    }
  }
  const x = laneX(game.lane), y = h * .8;
  ctx.save(); ctx.translate(x, y); if (game.invincible > 0) ctx.globalAlpha = .65;
  const rounded = (left, top, width, height, radius, color) => { ctx.fillStyle = color; ctx.beginPath(); ctx.roundRect(left, top, width, height, radius); ctx.fill(); };
  rounded(-24, -32, 52, 74, 15, '#00000026');
  for (const left of [-26, 19]) for (const top of [-23, 15]) rounded(left, top, 7, 16, 3, '#26322e');
  rounded(-21, -36, 42, 74, 12, '#af302f');
  rounded(-20, -36, 40, 69, 11, '#e34d46');
  rounded(-14, -31, 28, 20, 5, '#ef6457');
  rounded(-3, -34, 6, 22, 1, '#fff0ce');
  ctx.fillStyle = '#c8e9e5'; ctx.beginPath(); ctx.moveTo(-14, -10); ctx.lineTo(14, -10); ctx.lineTo(11, 2); ctx.lineTo(-11, 2); ctx.closePath(); ctx.fill();
  rounded(-12, 3, 24, 19, 5, '#cf3c37');
  ctx.fillStyle = '#fff0ce'; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('S', 0, 17);
  rounded(-12, 23, 24, 7, 2, '#8bb9b3');
  for (const left of [-17, 9]) rounded(left, -33, 8, 5, 2, '#fff4ba');
  for (const left of [-17, 10]) rounded(left, 30, 7, 4, 1, '#ffce85');
  rounded(-15, 35, 30, 3, 1, '#efe1cc');
  ctx.restore();
}
