export function newGame(level = 1) { return { lane: 1, hearts: 3, stars: 0, elapsed: 0, spawnIn: .5, objects: [], status: 'playing', level, invincible: 0 }; }
export function move(game, direction) { if (game.status === 'playing') game.lane = Math.max(0, Math.min(2, game.lane + direction)); }
export function step(game, seconds, rng = Math.random) {
  if (game.status !== 'playing') return;
  const dt = Math.min(.06, Math.max(0, seconds));
  game.elapsed += dt;
  game.invincible = Math.max(0, game.invincible - dt);
  game.spawnIn -= dt;
  if (game.spawnIn <= 0) {
    game.objects.push({ lane: Math.floor(rng() * 3), y: -.08, kind: rng() < .65 ? 'star' : 'rock' });
    game.spawnIn = 1.15;
  }
  for (const object of game.objects) {
    object.y += dt * (.25 + Math.min(game.level - 1, 5) * .012);
    if (object.lane === game.lane && Math.abs(object.y - .8) < .065 && !object.hit) {
      object.hit = true;
      if (object.kind === 'star') game.stars++;
      else if (game.invincible === 0) { game.hearts--; game.invincible = 1; }
    }
  }
  game.objects = game.objects.filter(o => !o.hit && o.y < 1.1);
  if (game.hearts <= 0) game.status = 'recover';
  else if (game.elapsed >= 30 || game.stars >= 8) game.status = 'complete';
}
export function drawGame(canvas, game) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#dce7cf'; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#cadbb8'; ctx.beginPath(); ctx.ellipse(w / 2, h / 2, w * .40, h, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#afc59b'; ctx.lineWidth = 2; ctx.setLineDash([8, 14]);
  for (let i = 1; i < 3; i++) { const x = w * (.18 + .64 * i / 3); ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); } ctx.setLineDash([]);
  for (let i = 0; i < 10; i++) {
    const x = i % 2 ? w * .92 : w * .08, y = ((i * 99 + game.elapsed * 35) % (h + 90)) - 45;
    ctx.fillStyle = '#859f70'; ctx.fillRect(x - 3, y + 9, 6, 25);
    ctx.fillStyle = i % 3 ? '#9bb67f' : '#aabd8b'; ctx.beginPath(); ctx.arc(x, y, 23 + i % 3 * 5, 0, Math.PI * 2); ctx.fill();
  }
  const laneX = lane => w * (.18 + .64 * (lane + .5) / 3);
  for (const object of game.objects) {
    const x = laneX(object.lane), y = object.y * h;
    if (object.kind === 'star') {
      ctx.fillStyle = '#f2c05b'; ctx.strokeStyle = '#fff2c5'; ctx.lineWidth = 3; ctx.beginPath();
      for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5 - Math.PI / 2, r = i % 2 ? 10 : 22; const px = x + Math.cos(a) * r, py = y + Math.sin(a) * r; if (!i) ctx.moveTo(px, py); else ctx.lineTo(px, py); }
      ctx.closePath(); ctx.fill(); ctx.stroke();
    } else {
      ctx.fillStyle = '#85928c'; ctx.beginPath(); ctx.moveTo(x - 21, y + 12); ctx.lineTo(x - 18, y - 9); ctx.lineTo(x - 4, y - 22); ctx.lineTo(x + 16, y - 17); ctx.lineTo(x + 24, y + 9); ctx.lineTo(x + 6, y + 19); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#aeb8aa'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x - 10, y - 7); ctx.lineTo(x, y - 14); ctx.lineTo(x + 9, y - 8); ctx.stroke();
    }
  }
  const x = laneX(game.lane), y = h * .8;
  ctx.save(); ctx.translate(x, y); if (game.invincible > 0) ctx.globalAlpha = .65;
  ctx.fillStyle = '#e9be66'; ctx.beginPath(); ctx.moveTo(-9, 22); ctx.lineTo(0, 42 + Math.sin(game.elapsed * 20) * 6); ctx.lineTo(9, 22); ctx.fill();
  ctx.fillStyle = '#b57252'; ctx.beginPath(); ctx.moveTo(-11, -8); ctx.lineTo(-28, 22); ctx.lineTo(28, 22); ctx.lineTo(11, -8); ctx.fill();
  ctx.fillStyle = '#e79f69'; ctx.beginPath(); ctx.moveTo(0, -34); ctx.bezierCurveTo(-29, -13, -18, 25, -13, 26); ctx.lineTo(13, 26); ctx.bezierCurveTo(18, 25, 29, -13, 0, -34); ctx.fill();
  ctx.fillStyle = '#fff0cb'; ctx.beginPath(); ctx.arc(0, -4, 11, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#527e77'; ctx.beginPath(); ctx.arc(0, -4, 7, 0, Math.PI * 2); ctx.fill(); ctx.restore();
}
