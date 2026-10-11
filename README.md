# Las aventuras de Santiago

Aplicación web para jugar y aprender con una aventura completa de 10 niveles: el carro rojo de Santiago recorre el bosque por una pista de tres carriles, recoge estrellas, acompaña luciérnagas y evita rocas. Cada nivel tiene su propio escenario, objetivo y reto educativo. Los errores muestran pistas y no quitan estrellas.

## Los 10 niveles

| Nivel | Lugar | Objetivo del recorrido | Reto educativo |
| --- | --- | --- | --- |
| 1 | El claro de bienvenida | Explorar durante 20 segundos | Sumas hasta 10 |
| 2 | El río brillante | Recoger 4 estrellas | Localizar información en una historia |
| 3 | La senda de las luciérnagas | Acompañar 3 luciérnagas | Colores en inglés |
| 4 | El puente de madera | Recoger 5 estrellas | Problema de suma hasta 20 |
| 5 | El jardín de las flores | Acompañar 4 luciérnagas | Orden de los hechos de una historia |
| 6 | Las nubes viajeras | Recoger 6 estrellas | Números y animales en inglés |
| 7 | La cueva de los cristales | Acompañar 5 luciérnagas | Encontrar un sumando, total hasta 20 |
| 8 | La cascada escondida | Recoger 7 estrellas | Comprender la causa de una acción |
| 9 | La montaña del eco | Acompañar 6 luciérnagas | Comprender una frase en inglés |
| 10 | El gran árbol de la luz | Recoger 6 estrellas y acompañar 3 luciérnagas | Problema hasta 30, comprensión de lectura e inglés |

Se desbloquea el siguiente nivel al cumplir el objetivo y resolver todos sus retos. Si se acaba el tiempo sin cumplir el objetivo, un ejercicio permite repetir el recorrido. Si se pierde la energía, un ejercicio permite recuperarla. Desde el nivel 5 aparecen corazones que recargan energía. Los niveles completados se pueden repetir; la aventura termina en el 10 con una insignia, sin crear niveles adicionales.

Las estrellas, las prácticas y los niveles de la versión anterior se conservan. El avance anterior se adapta a un máximo de 9 niveles completados para que el gran árbol siempre tenga que completarse en esta versión. La migración se guarda con la siguiente respuesta o actualización del progreso.

## Ejecutar

Requiere Node.js 20 o posterior. La aplicación no necesita dependencias de producción, servicios externos, cuentas ni claves.

```sh
cd /workspace/Aprende
npm start
```

El servidor usa el puerto 3000, configurable con `PORT`. Sirve exclusivamente la carpeta `public`. Se puede desplegar esa carpeta directamente en cualquier alojamiento web estático con HTTPS. No hay paso de compilación.

## Publicar en Netlify desde GitHub

Esta opción permite publicar las mejoras al actualizar la rama `principal`, sin descargar y subir un ZIP cada vez.

1. Entra a https://app.netlify.com/ con tu cuenta.
2. Elige importar un proyecto existente desde GitHub y autoriza el acceso al repositorio `ferney3000/Aprende`.
3. Selecciona el repositorio y la rama `principal`.
4. Netlify leerá `netlify.toml`: la carpeta a publicar es `public` y no hace falta un comando de compilación.
5. Publica el proyecto y abre la dirección HTTPS que Netlify le asigne.

Si ya creaste un sitio arrastrando la carpeta, puedes vincular ese mismo sitio al repositorio desde su configuración de despliegue continuo. Mantener la misma dirección también conserva el progreso de ese navegador; una dirección nueva tiene su propio almacenamiento.

Después de publicar, comprueba en el celular o tablet: abrir la aventura, mover el carro, resolver una misión, cerrar y volver a abrir para comprobar el progreso. Para poner un icono en la pantalla de inicio, usa el menú del navegador (en iPhone o iPad: Compartir → Añadir a pantalla de inicio). La primera carga necesita conexión.

La configuración del repositorio no crea una cuenta ni publica por sí sola. La conexión inicial con Netlify debe realizarla el propietario desde su cuenta. El ZIP `aventuras-de-santiago.zip` sigue disponible como alternativa para subir manualmente su carpeta `santiago`.

## Validar

```sh
npm ci --ignore-scripts
npm test
npm run test:e2e
```

Las pruebas de navegador usan Chromium en `/usr/bin/chromium`. Para otra instalación, define `CHROMIUM_PATH` con la ruta a su ejecutable. Playwright inicia el servidor si no está ya disponible. Las pruebas cubren respuestas, pistas, progresión, pausas, persistencia, migración, modo sin conexión y pantalla de celular. Una prueba recorre los diez niveles con sus controles y ejercicios hasta obtener la insignia final, sin saltarse el desbloqueo.

## Aprendizaje y privacidad

- La práctica libre genera sumas con resultados hasta 10, 20 o 50. Tres respuestas consecutivas al primer intento aumentan la dificultad; dos errores en un ejercicio la reducen. El espacio de familia permite elegir la dificultad inicial. Los niveles usan la ruta educativa de la tabla anterior, con pistas siempre disponibles.
- Doce historias breves con preguntas de comprensión y doce ejercicios de vocabulario inglés. Las misiones se pueden practicar independientemente del juego.
- Un recorrido dura entre 20 y 42 segundos según el nivel y puede terminar antes al cumplir el objetivo. Tres golpes consumen la energía. Resolver un reto permite recuperarla; resolver todos los retos del nivel permite continuar.
- Flechas, A/D, botones grandes y deslizamiento horizontal. Pausa manual y automática al ocultar la pestaña.
- Tras 10 minutos de aventura se invita a descansar al terminar la siguiente misión.
- Progreso agregado en `localStorage`, solo en ese navegador; no hay sincronización entre dispositivos. Borrar los datos del sitio borra el progreso. El espacio de familia no tiene autenticación.
- No hay anuncios, analítica, fuentes remotas, cuentas ni API externas. La lectura en voz alta usa las voces del navegador y su disponibilidad/conectividad depende del dispositivo.
- Manifest y service worker para uso instalable cuando el navegador lo admita y funcionamiento sin conexión después de la primera carga. La instalación requiere HTTPS (o localhost para desarrollo). El usuario publicó una versión inicial en https://santyaprende.netlify.app/; la versión servida debe comprobarse después de cada actualización.

Si Netlify está conectado a GitHub, los cambios en `principal` activan un despliegue. Si el sitio se publicó arrastrando una carpeta, hay que actualizarlo desde **Deploys** en ese mismo sitio usando la carpeta `santiago` del ZIP actualizado. La web actualizada muestra “Tu mapa de aventuras” con diez paradas. Cierra las pestañas de la versión anterior y vuelve a abrir la web con conexión para renovar también la caché sin conexión. Mantén la misma dirección para conservar el progreso.

## Entorno de desarrollo

Usa el checkout existente en `/workspace/Aprende`: cada tarea cloud está aislada y no hace falta crear otro worktree. Los procesos no sobreviven necesariamente a una nueva tarea; vuelve a ejecutar `npm start`. Si cambian los archivos precargados, actualiza la versión de caché en `public/sw.js`. Las voces y la instalación en dispositivos reales deben comprobarse en el dispositivo elegido.
