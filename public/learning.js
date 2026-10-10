export const SUBJECTS = { math: 'Matemáticas', reading: 'Lectura', english: 'Inglés' };
export const LIMITS = [10, 20, 50];
const stories = [
  ['Luna tiene una cometa roja. Sale al parque con su abuelo. El viento levanta la cometa muy alto.', '¿Con quién va Luna al parque?', ['Con su abuelo', 'Con su hermana', 'Con su perro'], 'Busca quién acompaña a Luna en la segunda frase.'],
  ['Tomás planta una semilla. Cada mañana le pone un poco de agua. Después de varios días, aparece una hoja.', '¿Qué hace Tomás cada mañana?', ['Riega la semilla', 'Recoge una manzana', 'Pinta una hoja'], 'Busca qué le pone a la semilla cada mañana.'],
  ['Sofía prepara su mochila. Guarda un libro y una manzana. Luego camina hacia la escuela.', '¿Qué fruta lleva Sofía?', ['Una manzana', 'Una pera', 'Un banano'], 'Vuelve a leer qué guarda Sofía en la mochila.'],
  ['El gato de Pablo duerme en una caja. Cuando oye su plato, sale corriendo a la cocina.', '¿Dónde duerme el gato?', ['En una caja', 'En un árbol', 'En la cocina'], 'La primera frase cuenta dónde está durmiendo.'],
  ['La lluvia moja el patio. Sara se pone las botas y abre su paraguas antes de salir.', '¿Por qué Sara lleva paraguas?', ['Porque está lloviendo', 'Porque va a dormir', 'Porque hace mucho sol'], 'Piensa qué está mojando el patio y para qué sirve un paraguas.'],
  ['Nico tiene dos peces. Les da comida por la mañana. Uno es naranja y el otro es azul.', '¿Cuántos peces tiene Nico?', ['Dos', 'Tres', 'Cinco'], 'La primera frase te cuenta cuántos peces hay.'],
  ['Ana y Leo hacen una torre. Ponen el bloque grande abajo y los pequeños arriba. ¡La torre queda firme!', '¿Dónde ponen el bloque grande?', ['Abajo', 'Arriba', 'En una bolsa'], 'Busca la frase que habla del bloque grande.'],
  ['El sol se esconde. Mateo se lava los dientes, se pone la pijama y escucha un cuento en su cama.', '¿Qué va a hacer Mateo después?', ['Dormir', 'Ir a la escuela', 'Jugar en el parque'], 'Piensa para qué nos ponemos la pijama y nos acostamos.'],
  ['Una mariposa amarilla visita el jardín. Se posa en una flor violeta y luego vuela hacia el árbol.', '¿De qué color es la flor?', ['Violeta', 'Amarilla', 'Verde'], 'La mariposa y la flor tienen colores diferentes. Busca el de la flor.'],
  ['Santiago encuentra un libro de animales. Mira un dibujo de un elefante y lee que tiene una trompa larga.', '¿Qué animal aparece en el dibujo?', ['Un elefante', 'Un conejo', 'Un león'], 'Busca el animal que tiene una trompa larga.'],
  ['Julia quiere dibujar, pero su lápiz no tiene punta. Busca el sacapuntas y prepara el lápiz.', '¿Para qué busca Julia el sacapuntas?', ['Para sacar punta al lápiz', 'Para borrar el dibujo', 'Para cortar papel'], 'Piensa qué le falta al lápiz para poder dibujar.'],
  ['En el picnic hay pan, queso y jugo. Antes de comer, todos se lavan las manos.', '¿Qué hacen antes de comer?', ['Se lavan las manos', 'Se van a dormir', 'Guardan el jugo'], 'Busca lo que hacen todos antes de empezar el picnic.']
];
const words = [
  ['cat', 'gato', ['perro', 'pato'], 'Hace miau.'], ['dog', 'perro', ['gato', 'pez'], 'Hace guau.'],
  ['red', 'rojo', ['azul', 'verde'], 'Es el color de muchas fresas.'], ['blue', 'azul', ['rojo', 'amarillo'], 'Es el color del cielo en un día despejado.'],
  ['green', 'verde', ['azul', 'rojo'], 'Es el color de muchas hojas.'], ['one', 'uno', ['dos', 'tres'], 'Es el primer número al contar.'],
  ['three', 'tres', ['uno', 'cinco'], 'Viene después del dos.'], ['hello', 'hola', ['adiós', 'gracias'], 'Lo dices al saludar a alguien.'],
  ['thank you', 'gracias', ['hola', 'adiós'], 'Lo dices cuando alguien te ayuda.'], ['sun', 'sol', ['luna', 'nube'], 'Nos da luz durante el día.'],
  ['moon', 'luna', ['sol', 'flor'], 'La puedes ver en el cielo por la noche.'], ['five', 'cinco', ['dos', 'cuatro'], 'Es la cantidad de dedos de una mano.']
];
export function shuffle(items, rng = Math.random) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [result[i], result[j]] = [result[j], result[i]]; }
  return result;
}
export function createQuestion(subject, difficulty = 0, index = 0, rng = Math.random) {
  if (subject === 'math') {
    const limit = LIMITS[Math.max(0, Math.min(2, difficulty))];
    const a = 1 + Math.floor(rng() * (limit - 1));
    const b = 1 + Math.floor(rng() * (limit - a));
    const answer = a + b;
    const choices = new Set([answer]);
    for (const delta of [1, -1, 2, -2, 3, -3]) { const n = answer + delta; if (n >= 0 && n <= limit) choices.add(n); if (choices.size === 4) break; }
    return { subject, prompt: '¿Cuántas estrellas hay en total?', text: `${a} + ${b} = ?`, answer: String(answer), choices: shuffle([...choices].map(String), rng), hint: `Empieza en ${a} y cuenta ${b} pasos más.${b <= 10 ? ' ' + '★ '.repeat(b) : ' Puedes separar los pasos en grupos de diez.'}`, explanation: `${a} más ${b} son ${answer}. ¡Encontraste el total!` };
  }
  if (subject === 'reading') {
    const [text, prompt, choices, hint] = stories[index % stories.length];
    return { subject, text, prompt, answer: choices[0], choices: shuffle(choices, rng), hint, explanation: `¡Eso es! ${choices[0]}. La historia nos dio la pista.` };
  }
  const [word, answer, distractors, hint] = words[index % words.length];
  return { subject: 'english', text: word, prompt: `¿Qué significa “${word}” en español?`, answer, choices: shuffle([answer, ...distractors], rng), hint, explanation: `“${word}” significa “${answer}”. ¡Una nueva palabra para tu aventura!` };
}
export function newProgress() {
  return { version: 1, stars: 0, level: 1, difficulty: 0, streak: 0, subjects: Object.fromEntries(Object.keys(SUBJECTS).map(key => [key, { completed: 0, attempts: 0, firstTry: 0 }])) };
}
const count = (value, fallback = 0) => Number.isSafeInteger(value) && value >= 0 && value <= 1e7 ? value : fallback;
export function restoreProgress(raw) {
  try {
    const source = JSON.parse(raw);
    if (source?.version !== 1) return newProgress();
    const clean = newProgress();
    clean.stars = count(source.stars);
    clean.level = Math.max(1, count(source.level, 1));
    clean.difficulty = Math.min(2, count(source.difficulty));
    clean.streak = Math.min(2, count(source.streak));
    for (const key of Object.keys(SUBJECTS)) {
      const s = source.subjects?.[key];
      clean.subjects[key] = { completed: count(s?.completed), attempts: count(s?.attempts), firstTry: count(s?.firstTry) };
    }
    return clean;
  } catch { return newProgress(); }
}
export function recordAnswer(progress, subject, correct, mistakes) {
  const stat = progress.subjects[subject];
  stat.attempts++;
  if (!correct) {
    if (subject === 'math' && mistakes === 1) { progress.difficulty = Math.max(0, progress.difficulty - 1); progress.streak = 0; }
    return;
  }
  stat.completed++;
  if (mistakes === 0) stat.firstTry++;
  progress.stars += 3;
  if (subject === 'math') {
    progress.streak = mistakes === 0 ? progress.streak + 1 : 0;
    if (progress.streak >= 3) { progress.difficulty = Math.min(2, progress.difficulty + 1); progress.streak = 0; }
  }
}
