import { SUBJECTS, LIMITS, createQuestion, newProgress, restoreProgress, recordAnswer } from './learning.js';
import { newGame, move, step, drawGame } from './game.js';

const $ = selector => document.querySelector(selector);
const KEY = 'santiago-adventure-v1';
let progress;
try { progress = restoreProgress(localStorage.getItem(KEY)); } catch { progress = newProgress(); $('#storage-notice').hidden = false; }
const dialog = $('#adventure-dialog'), content = $('#adventure-content');
let game = null, frame = 0, previous = 0, quiz = null, credited = 0, lastSubject = -1;
let sessionStarted = 0;
const totals = () => Object.values(progress.subjects).reduce((n, s) => n + s.completed, 0);
function save() { try { localStorage.setItem(KEY, JSON.stringify(progress)); } catch { $('#storage-notice').hidden = false; } updateHome(); }
function updateHome() {
  $('#total-stars').textContent = progress.stars;
  $('#level').textContent = progress.level;
  const done = totals(), goal = done < 3 ? 3 : done < 10 ? 10 : Math.floor(done / 10 + 1) * 10;
  $('#mission-count').textContent = `${done} de ${goal} misiones`;
  $('#mission-progress').max = goal; $('#mission-progress').value = done;
  $('#journey-text').textContent = done < 3 ? 'Completa 3 misiones y gana tu primera insignia.' : `¡Ya completaste ${done} misiones! Tu próximo descubrimiento está cerca.`;
}
function stopAnimation() { cancelAnimationFrame(frame); frame = 0; }
function stopSpeech() { if ('speechSynthesis' in window) speechSynthesis.cancel(); }
function creditStars() { if (!game) return; const earned = game.stars - credited; if (earned > 0) { progress.stars += earned; credited = game.stars; save(); } }
function cleanAdventure() { stopAnimation(); stopSpeech(); creditStars(); game = null; quiz = null; }
dialog.addEventListener('close', cleanAdventure);
$('#close-adventure').onclick = () => dialog.close();
$('#play').onclick = () => {
  content.innerHTML = `<div class="intro"><span class="intro-icon" aria-hidden="true">🚀</span><h2 id="dialog-title">¡El bosque te espera!</h2><p>Recoge estrellas con tu nave. Cada recorrido dura 30 segundos.<br>Después, una pequeña misión te abrirá el camino.</p><div class="instructions"><span><b>★</b>Recoge estrellas</span><span><b>◈</b>Esquiva las rocas</span><span><b>← →</b>Usa las flechas o los botones</span></div><p class="small">Si se acaba la energía, un reto te ayudará a recuperarla.<br>Puedes pausar cuando quieras.</p><button class="primary" id="start-game">Empezar aventura →</button></div>`;
  $('#dialog-label').textContent = 'EL BOSQUE DE LAS ESTRELLAS'; dialog.showModal();
  $('#start-game').onclick = () => { game = newGame(progress.level); credited = 0; sessionStarted = Date.now(); showGame(); };
};
function showGame() {
  quiz = null;
  content.innerHTML = `<h2 id="dialog-title">Un paseo entre estrellas</h2><div class="game-top"><span id="hearts" aria-label="Energía"></span><span id="round-stars"></span><span id="time-left"></span></div><div class="game-wrap"><canvas id="game-canvas" width="600" height="400" role="img" aria-label="Nave en un camino de tres carriles. Usa izquierda y derecha para recoger estrellas y evitar rocas."></canvas><div class="game-overlay" id="pause-overlay" hidden>Una pequeña pausa<button class="primary" id="resume">Seguir jugando</button></div></div><div class="game-controls"><div><button class="control" id="left" aria-label="Mover a la izquierda">←</button><button class="control" id="right" aria-label="Mover a la derecha">→</button></div><button class="secondary" id="pause">Pausar</button><button class="secondary" id="energy">Misión de energía</button></div><p class="small">Flechas ← →, teclas A y D o desliza sobre el bosque.</p>`;
  $('#left').onclick = () => move(game, -1); $('#right').onclick = () => move(game, 1);
  $('#pause').onclick = togglePause; $('#resume').onclick = togglePause;
  $('#energy').onclick = () => { game.status = 'recover'; beginGameMission('practice'); };
  let touchX = null;
  $('#game-canvas').addEventListener('pointerdown', e => { touchX = e.clientX; e.currentTarget.setPointerCapture(e.pointerId); });
  $('#game-canvas').addEventListener('pointerup', e => { if (touchX !== null && Math.abs(e.clientX - touchX) > 15) move(game, e.clientX > touchX ? 1 : -1); touchX = null; });
  $('#game-canvas').addEventListener('pointercancel', () => { touchX = null; });
  previous = performance.now(); renderGame(); frame = requestAnimationFrame(tick);
}
function renderGame() {
  if (!game || !$('#game-canvas')) return;
  drawGame($('#game-canvas'), game);
  $('#hearts').textContent = '♥'.repeat(Math.max(0, game.hearts)) + '♡'.repeat(3 - Math.max(0, game.hearts));
  $('#hearts').setAttribute('aria-label', `${game.hearts} de 3 puntos de energía`);
  $('#round-stars').textContent = `★ ${game.stars} estrellas`;
  $('#time-left').textContent = `${Math.max(0, Math.ceil(30 - game.elapsed))} s`;
}
function tick(now) {
  if (!game || quiz || !dialog.open) return;
  step(game, (now - previous) / 1000); previous = now; renderGame();
  if (game.status === 'recover' || game.status === 'complete') { beginGameMission(game.status); return; }
  if (game.status === 'playing') frame = requestAnimationFrame(tick);
}
function togglePause() {
  if (!game || quiz || !['playing', 'paused'].includes(game.status)) return;
  if (game.status === 'playing') { game.status = 'paused'; stopAnimation(); }
  else { game.status = 'playing'; previous = performance.now(); frame = requestAnimationFrame(tick); }
  $('#pause-overlay').hidden = game.status !== 'paused';
  $('#pause').textContent = game.status === 'paused' ? 'Continuar' : 'Pausar';
}
document.addEventListener('keydown', e => {
  if (!dialog.open || quiz || !game || !['ArrowLeft', 'ArrowRight', 'a', 'd', 'A', 'D'].includes(e.key)) return;
  e.preventDefault(); move(game, ['ArrowLeft', 'a', 'A'].includes(e.key) ? -1 : 1);
});
document.addEventListener('visibilitychange', () => { if (document.hidden && game?.status === 'playing' && !quiz) togglePause(); });
function beginGameMission(reason) {
  stopAnimation(); creditStars();
  lastSubject = (lastSubject + 1) % 3;
  showQuestion(Object.keys(SUBJECTS)[lastSubject], reason);
}
function showQuestion(subject, reason = 'standalone') {
  stopSpeech();
  const question = createQuestion(subject, progress.difficulty, progress.subjects[subject].completed);
  quiz = { ...question, reason, mistakes: 0, solved: false };
  const title = reason === 'complete' ? '¡Recorrido completado!' : reason === 'recover' ? 'Recuperemos tu energía' : 'Una misión para tu imaginación';
  $('#dialog-label').textContent = SUBJECTS[subject].toUpperCase();
  content.innerHTML = `<span class="quiz-kicker">✦ ${SUBJECTS[subject]} · +3 estrellas</span><h2 id="dialog-title">${title}</h2><p id="question-prompt"></p><div class="question-text ${subject === 'math' ? 'math-question' : ''}" id="question-text"></div><div class="question-tools"><button class="secondary" id="listen">♪ Escuchar</button><button class="secondary" id="hint-button">✧ Dame una pista</button></div><p class="hint" id="hint" hidden></p><div class="answers" id="answers"></div><div class="feedback" id="feedback" role="status" aria-live="polite">Tómate tu tiempo. ¡Tú puedes!</div><div class="quiz-bottom"><span class="small">Equivocarse también es aprender.<br>Tus estrellas están a salvo.</span><button class="primary" id="continue" hidden>${reason === 'standalone' ? 'Otra misión →' : reason === 'complete' ? 'Siguiente nivel →' : 'Volver a jugar →'}</button></div>`;
  $('#question-prompt').textContent = question.prompt; $('#question-text').textContent = question.text;
  $('#hint').textContent = question.hint;
  $('#hint-button').onclick = () => { $('#hint').hidden = false; };
  $('#listen').onclick = () => {
    if (!('speechSynthesis' in window)) { $('#feedback').textContent = 'Este navegador no tiene voz disponible. Puedes leer el reto o pedir ayuda a un adulto.'; return; }
    stopSpeech();
    const speech = new SpeechSynthesisUtterance(subject === 'english' ? question.text : `${question.text.replace('+', 'más').replace('= ?', '')}. ${question.prompt}`);
    speech.lang = subject === 'english' ? 'en-US' : 'es-CO'; speech.rate = .82;
    speech.onerror = e => { if (!['canceled', 'interrupted'].includes(e.error) && $('#feedback')) $('#feedback').textContent = 'La voz no está disponible ahora. Puedes leer el reto o pedir ayuda.'; };
    speechSynthesis.speak(speech);
  };
  for (const choice of question.choices) {
    const button = document.createElement('button'); button.className = 'answer'; button.textContent = choice;
    button.onclick = () => answer(choice, button); $('#answers').append(button);
  }
  $('#continue').onclick = () => {
    if (!quiz?.solved) return;
    stopSpeech();
    if (reason === 'standalone') { showQuestion(subject); return; }
    if (Date.now() - sessionStarted >= 10 * 60 * 1000) {
      content.innerHTML = '<div class="intro"><span class="intro-icon">🌿</span><h2 id="dialog-title">¡Qué buena aventura!</h2><p>Llevas 10 minutos explorando. Es un buen momento para descansar los ojos, estirarte y tomar agua.</p><button class="primary" id="rest">Guardar y descansar</button></div>';
      $('#rest').onclick = () => dialog.close(); return;
    }
    if (reason === 'complete') { game = newGame(progress.level); credited = 0; }
    else { game.hearts = 3; game.objects = []; game.status = 'playing'; game.invincible = 1; }
    showGame();
  };
  if (!dialog.open) dialog.showModal();
}
function answer(choice, button) {
  if (!quiz || quiz.solved || button.disabled) return;
  const correct = choice === quiz.answer;
  recordAnswer(progress, quiz.subject, correct, quiz.mistakes);
  if (correct) {
    quiz.solved = true; button.classList.add('correct');
    document.querySelectorAll('.answer').forEach(b => { b.disabled = true; });
    $('#feedback').textContent = '✦ ' + quiz.explanation;
    $('#continue').hidden = false;
    if (quiz.reason === 'complete') progress.level++;
    $('#continue').focus();
  } else {
    quiz.mistakes++; button.classList.add('incorrect'); button.disabled = true;
    $('#feedback').textContent = 'Vamos paso a paso. Mira la pista y prueba otra respuesta.';
    $('#hint').hidden = false;
  }
  save();
}
document.querySelectorAll('[data-subject]').forEach(button => { button.onclick = () => showQuestion(button.dataset.subject); });
$('#family-open').onclick = () => {
  const done = totals();
  $('#family-stats').innerHTML = `<div class="stat-grid"><div class="stat"><strong>${done}</strong>misiones resueltas</div><div class="stat"><strong>${progress.stars}</strong>estrellas recogidas</div><div class="stat"><strong>${progress.level}</strong>nivel de aventura</div></div>${Object.entries(SUBJECTS).map(([key, name]) => `<div class="subject-stat"><strong>${name}</strong><span>${progress.subjects[key].completed} resueltas · ${progress.subjects[key].firstTry} al primer intento</span></div>`).join('')}<p class="small">Sumas actuales: resultados hasta ${LIMITS[progress.difficulty]}. Estos datos describen la práctica; no son una evaluación escolar.</p>`;
  $('#difficulty').value = progress.difficulty; $('#family-dialog').showModal();
};
$('#difficulty').onchange = e => { progress.difficulty = Number(e.target.value); progress.streak = 0; save(); $('#family-stats .small').textContent = `Sumas actuales: resultados hasta ${LIMITS[progress.difficulty]}. Estos datos describen la práctica; no son una evaluación escolar.`; };
$('#close-family').onclick = () => $('#family-dialog').close();
$('#install-help').onclick = () => { $('#install-instructions').hidden = !$('#install-instructions').hidden; };
$('#progress-open').onclick = () => {
  const badges = [['🌱', 'Primer descubrimiento', 'Completa 3 misiones.', totals() >= 3], ['📚', 'Detective de historias', 'Resuelve 5 misiones de lectura.', progress.subjects.reading.completed >= 5], ['🌟', 'Explorador de estrellas', 'Reúne 30 estrellas.', progress.stars >= 30], ['🚀', 'Un nuevo horizonte', 'Llega al nivel 3 del bosque.', progress.level >= 3]];
  $('#badges').innerHTML = badges.map(([icon, name, description, earned]) => `<div class="badge ${earned ? '' : 'locked'}"><span class="badge-icon">${icon}</span><div><strong>${name}${earned ? ' ✓' : ''}</strong><p>${earned ? '¡Insignia conseguida!' : description}</p></div></div>`).join('');
  $('#progress-dialog').showModal();
};
$('#close-progress').onclick = () => $('#progress-dialog').close();
window.addEventListener('pagehide', creditStars);
updateHome();
if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
