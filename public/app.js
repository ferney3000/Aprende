import { SUBJECTS, LIMITS, createQuestion, createLevelQuestion, completeLevel, newProgress, restoreProgress, recordAnswer } from './learning.js';
import { newGame, move, step, drawGame } from './game.js';
import { LEVELS, getLevel, goalLabel } from './levels.js';

const $ = selector => document.querySelector(selector);
const KEY = 'santiago-adventure-v1';
let progress;
try { progress = restoreProgress(localStorage.getItem(KEY)); } catch { progress = newProgress(); $('#storage-notice').hidden = false; }
const dialog = $('#adventure-dialog'), content = $('#adventure-content');
let game = null, frame = 0, previous = 0, quiz = null, credited = 0, missionStage = 0;
let sessionStarted = 0;
const totals = () => Object.values(progress.subjects).reduce((n, s) => n + s.completed, 0);
function save() { try { localStorage.setItem(KEY, JSON.stringify(progress)); } catch { $('#storage-notice').hidden = false; } updateHome(); }
function updateHome() {
  $('#total-stars').textContent = progress.stars;
  $('#level').textContent = progress.level;
  $('#completed-levels').textContent = `${progress.completedLevels} de 10 niveles completados`;
  $('#play').innerHTML = progress.completedLevels === 10 ? 'Volver a explorar <span>→</span>' : '¡Vamos a jugar! <span>→</span>';
  renderMap();
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
function renderMap() {
  const map = $('#level-map'); map.replaceChildren();
  for (const level of LEVELS) {
    const completed = level.id <= progress.completedLevels, unlocked = level.id <= progress.level;
    const button = document.createElement('button');
    button.className = `level-card ${completed ? 'completed' : unlocked ? 'current' : 'locked'}`;
    button.disabled = !unlocked; button.dataset.level = level.id;
    button.setAttribute('aria-label', `Nivel ${level.id}: ${level.name}. ${completed ? 'Completado. Volver a jugar' : unlocked ? 'Disponible' : 'Bloqueado'}`);
    button.innerHTML = `<span class="level-number">${String(level.id).padStart(2, '0')}</span><span class="level-icon" aria-hidden="true">${level.icon}</span><strong>${level.name}</strong><span class="level-skill">${level.skill}</span><span class="level-state">${completed ? '✓ Completado · Repetir' : unlocked ? '¡Tu próxima aventura! →' : `Después del nivel ${level.id - 1}`}</span>`;
    button.onclick = () => startLevelIntro(level.id); map.append(button);
  }
}
$('#play').onclick = () => startLevelIntro(progress.completedLevels === 10 ? 1 : progress.level);
function startLevelIntro(levelId, keepSession = false) {
  if (levelId < 1 || levelId > progress.level || levelId > LEVELS.length) return;
  stopAnimation(); stopSpeech(); creditStars(); game = null; quiz = null;
  if (!keepSession) sessionStarted = Date.now();
  const level = getLevel(levelId);
  content.innerHTML = `<div class="intro"><span class="intro-icon" aria-hidden="true">${level.icon}</span><h2 id="dialog-title">${level.name}</h2><p class="level-objective">${level.objective}</p><span class="driver-badge">🚗 Santiago al volante de su carro rojo</span><div class="instructions"><span><b>★</b>Estrellas</span><span><b>✦</b>Luciérnagas luminosas</span><span><b>← →</b>Flechas o botones</span></div><p>Después del recorrido: <strong>${level.skill.toLowerCase()}</strong>.</p><p class="small">${level.duration} segundos · Esquiva las rocas${level.id >= 5 ? ' y recoge corazones para recuperar energía' : ''}.<br>Si necesitas otro intento, un reto te ayudará. Tus estrellas se guardan.</p><button class="primary" id="start-game">Empezar aventura →</button></div>`;
  $('#dialog-label').textContent = `EL BOSQUE · NIVEL ${level.id} DE 10`;
  if (!dialog.open) dialog.showModal();
  $('#start-game').onclick = () => { game = newGame(level.id); credited = 0; missionStage = 0; showGame(); };
}
function showLevelComplete() {
  const level = getLevel(game.level), final = level.id === LEVELS.length;
  const restDue = Date.now() - sessionStarted >= 10 * 60 * 1000;
  content.innerHTML = `<div class="intro celebration"><span class="intro-icon" aria-hidden="true">${final ? '🏆' : level.icon}</span><span class="quiz-kicker">${final ? 'LOS 10 NIVELES COMPLETADOS' : `NIVEL ${level.id} COMPLETADO`}</span><h2 id="dialog-title">${final ? '¡El bosque vuelve a brillar!' : '¡Un nuevo descubrimiento!'}</h2><p>${final ? 'Santiago, ayudaste a encender el gran árbol. Contaste, leíste, aprendiste palabras y seguiste intentando. ¡Esta aventura es tuya!' : `Completaste ${level.name.toLowerCase()} y practicaste: ${level.skill.toLowerCase()}.`}</p><p class="small">${progress.completedLevels} de 10 niveles completados. ${$('#storage-notice').hidden ? 'Tu progreso está guardado en este navegador.' : 'Tu progreso solo se conserva durante esta sesión.'}</p>${restDue ? '<p>Ya llevas 10 minutos explorando. Descansa los ojos, estírate y toma un poco de agua.</p>' : ''}<div class="celebration-actions">${restDue ? '' : final ? '<button class="primary" id="replay-level">Explorar otra vez →</button>' : '<button class="primary" id="next-level">Conocer el siguiente nivel →</button>'}<button class="secondary" id="back-map">Volver al mapa</button></div></div>`;
  if (!restDue && final) $('#replay-level').onclick = () => startLevelIntro(1);
  else if (!restDue) $('#next-level').onclick = () => startLevelIntro(level.id + 1, true);
  $('#back-map').onclick = () => { dialog.close(); $('#mapa').scrollIntoView({ block: 'start' }); };
}
function showGame() {
  quiz = null;
  $('#dialog-label').textContent = `EL BOSQUE · NIVEL ${game.level} DE 10`;
  content.innerHTML = `<h2 id="dialog-title">${getLevel(game.level).name}</h2><div class="game-top"><span id="hearts" aria-label="Energía"></span><span id="round-stars"></span><span id="time-left"></span></div><p class="game-objective" id="game-objective"></p><div class="game-wrap"><canvas id="game-canvas" width="600" height="400" role="img" aria-label="Carro rojo de Santiago en una pista de tres carriles. Usa izquierda y derecha para recoger estrellas y luciérnagas y evitar rocas."></canvas><div class="game-overlay" id="pause-overlay" hidden>Una pequeña pausa<button class="primary" id="resume">Seguir jugando</button></div></div><div class="game-controls"><div><button class="control" id="left" aria-label="Mover a la izquierda">←</button><button class="control" id="right" aria-label="Mover a la derecha">→</button></div><button class="secondary" id="pause">Pausar</button><button class="secondary" id="energy">Misión de energía</button></div><p class="small">Flechas ← →, teclas A y D o desliza sobre el bosque.</p>`;
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
  $('#time-left').textContent = `${Math.max(0, Math.ceil(getLevel(game.level).duration - game.elapsed))} s`;
  $('#game-objective').textContent = goalLabel(game);
}
function tick(now) {
  if (!game || quiz || !dialog.open) return;
  step(game, (now - previous) / 1000); previous = now; renderGame();
  if (['recover', 'complete', 'retry'].includes(game.status)) { beginGameMission(game.status); return; }
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
  missionStage = 0;
  showQuestion(getLevel(game.level).challenges[0].subject, reason);
}
function showQuestion(subject, reason = 'standalone') {
  stopSpeech();
  const question = reason === 'standalone' ? createQuestion(subject, progress.difficulty, progress.subjects[subject].completed) : createLevelQuestion(game.level, reason === 'complete' ? missionStage : 0);
  subject = question.subject;
  quiz = { ...question, reason, mistakes: 0, solved: false };
  const stageCount = game ? getLevel(game.level).challenges.length : 1;
  const title = reason === 'complete' ? '¡Recorrido completado!' : reason === 'retry' ? '¡Vamos a intentarlo otra vez!' : reason === 'recover' ? 'Recuperemos tu energía' : 'Una misión para tu imaginación';
  $('#dialog-label').textContent = SUBJECTS[subject].toUpperCase();
  content.innerHTML = `<span class="quiz-kicker">✦ ${SUBJECTS[subject]} · +3 estrellas${reason === 'complete' ? ` · Reto ${missionStage + 1} de ${stageCount}` : ''}</span><h2 id="dialog-title">${title}</h2>${reason === 'retry' ? '<p>Faltaron algunos compañeros de viaje. Resuelve el reto para volver a buscar. Las estrellas que recogiste siguen contigo.</p>' : ''}<p id="question-prompt"></p><div class="question-text ${subject === 'math' && question.format !== 'story' ? 'math-question' : ''}" id="question-text"></div><div class="question-tools"><button class="secondary" id="listen">♪ Escuchar</button><button class="secondary" id="hint-button">✧ Dame una pista</button></div><p class="hint" id="hint" hidden></p><div class="answers" id="answers"></div><div class="feedback" id="feedback" role="status" aria-live="polite">Tómate tu tiempo. ¡Tú puedes!</div><div class="quiz-bottom"><span class="small">Equivocarse también es aprender.<br>Tus estrellas están a salvo.</span><button class="primary" id="continue" hidden>${reason === 'standalone' ? 'Otra misión →' : reason === 'complete' ? missionStage + 1 < stageCount ? 'Siguiente reto →' : 'Celebrar mi logro →' : 'Volver a jugar →'}</button></div>`;
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
    if (reason === 'complete') {
      if (missionStage + 1 < stageCount) { missionStage++; showQuestion(getLevel(game.level).challenges[missionStage].subject, reason); }
      else showLevelComplete();
      return;
    }
    if (Date.now() - sessionStarted >= 10 * 60 * 1000) {
      content.innerHTML = '<div class="intro"><span class="intro-icon">🌿</span><h2 id="dialog-title">¡Qué buena aventura!</h2><p>Llevas 10 minutos explorando. Es un buen momento para descansar los ojos, estirarte y tomar agua.</p><button class="primary" id="rest">Guardar y descansar</button></div>';
      $('#rest').onclick = () => dialog.close(); return;
    }
    if (reason === 'retry') { game = newGame(game.level); credited = 0; }
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
    if (quiz.reason === 'complete' && missionStage + 1 === getLevel(game.level).challenges.length) completeLevel(progress, game.level);
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
  $('#family-stats').innerHTML = `<div class="stat-grid"><div class="stat"><strong>${done}</strong>misiones resueltas</div><div class="stat"><strong>${progress.stars}</strong>estrellas recogidas</div><div class="stat"><strong>${progress.completedLevels} / 10</strong>niveles completados</div></div>${Object.entries(SUBJECTS).map(([key, name]) => `<div class="subject-stat"><strong>${name}</strong><span>${progress.subjects[key].completed} resueltas · ${progress.subjects[key].firstTry} al primer intento</span></div>`).join('')}<p class="small">Sumas de práctica: resultados hasta ${LIMITS[progress.difficulty]}. Estos datos describen la práctica; no son una evaluación escolar.</p>`;
  $('#difficulty').value = progress.difficulty; $('#family-dialog').showModal();
};
$('#difficulty').onchange = e => { progress.difficulty = Number(e.target.value); progress.streak = 0; save(); $('#family-stats .small').textContent = `Sumas de práctica: resultados hasta ${LIMITS[progress.difficulty]}. Estos datos describen la práctica; no son una evaluación escolar.`; };
$('#close-family').onclick = () => $('#family-dialog').close();
$('#install-help').onclick = () => { $('#install-instructions').hidden = !$('#install-instructions').hidden; };
$('#progress-open').onclick = () => {
  const badges = [['🌱', 'Primer descubrimiento', 'Completa 3 misiones.', totals() >= 3], ['📚', 'Detective de historias', 'Resuelve 5 misiones de lectura.', progress.subjects.reading.completed >= 5], ['🌟', 'Explorador de estrellas', 'Reúne 30 estrellas.', progress.stars >= 30], ['🚗', 'Un nuevo horizonte', 'Llega al nivel 3 del bosque.', progress.level >= 3], ['🏆', 'Guardián del gran árbol', 'Completa los 10 niveles del bosque.', progress.completedLevels === 10]];
  $('#badges').innerHTML = badges.map(([icon, name, description, earned]) => `<div class="badge ${earned ? '' : 'locked'}"><span class="badge-icon">${icon}</span><div><strong>${name}${earned ? ' ✓' : ''}</strong><p>${earned ? '¡Insignia conseguida!' : description}</p></div></div>`).join('');
  $('#progress-dialog').showModal();
};
$('#close-progress').onclick = () => $('#progress-dialog').close();
window.addEventListener('pagehide', creditStars);
updateHome();
if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
