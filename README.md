# Las aventuras de Santiago

Primera versión de una aplicación web para jugar y aprender: una nave recorre el bosque, recoge estrellas y evita rocas. Al quedarse sin energía o terminar un recorrido, una misión de matemáticas, lectura o inglés permite continuar. Los errores muestran pistas y no quitan estrellas.

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

Después de publicar, comprueba en el celular o tablet: abrir la aventura, mover la nave, resolver una misión, cerrar y volver a abrir para comprobar el progreso. Para poner un icono en la pantalla de inicio, usa el menú del navegador (en iPhone o iPad: Compartir → Añadir a pantalla de inicio). La primera carga necesita conexión.

La configuración del repositorio no crea una cuenta ni publica por sí sola. La conexión inicial con Netlify debe realizarla el propietario desde su cuenta. El ZIP `aventuras-de-santiago.zip` sigue disponible como alternativa para subir manualmente su carpeta `santiago`.

## Validar

```sh
npm ci --ignore-scripts
npm test
npm run test:e2e
```

Las pruebas de navegador usan Chromium en `/usr/bin/chromium`. Para otra instalación, define `CHROMIUM_PATH` con la ruta a su ejecutable. Playwright inicia el servidor si no está ya disponible. Las pruebas cubren respuestas, pistas, progresión, pausas, niveles, persistencia, modo sin conexión y pantalla de celular.

## Aprendizaje y privacidad

- Sumas con resultados hasta 10, 20 o 50. Tres respuestas consecutivas al primer intento aumentan la dificultad; dos errores en un ejercicio la reducen. El espacio de familia permite elegir la dificultad inicial.
- Doce historias breves con preguntas de comprensión y doce ejercicios de vocabulario inglés. Las misiones se pueden practicar independientemente del juego.
- Un recorrido dura hasta 30 segundos. Tres golpes consumen la energía. Resolver un reto permite recuperarla; resolver el reto de fin de recorrido abre el siguiente nivel.
- Flechas, A/D, botones grandes y deslizamiento horizontal. Pausa manual y automática al ocultar la pestaña.
- Tras 10 minutos de aventura se invita a descansar al terminar la siguiente misión.
- Progreso agregado en `localStorage`, solo en ese navegador; no hay sincronización entre dispositivos. Borrar los datos del sitio borra el progreso. El espacio de familia no tiene autenticación.
- No hay anuncios, analítica, fuentes remotas, cuentas ni API externas. La lectura en voz alta usa las voces del navegador y su disponibilidad/conectividad depende del dispositivo.
- Manifest y service worker para uso instalable cuando el navegador lo admita y funcionamiento sin conexión después de la primera carga. La instalación requiere HTTPS (o localhost para desarrollo). La publicación web es un paso independiente y todavía no se ha realizado.

## Entorno de desarrollo

Usa el checkout existente en `/workspace/Aprende`: cada tarea cloud está aislada y no hace falta crear otro worktree. Los procesos no sobreviven necesariamente a una nueva tarea; vuelve a ejecutar `npm start`. Si cambian los archivos precargados, actualiza la versión de caché en `public/sw.js`. Las voces y la instalación en dispositivos reales deben comprobarse en el dispositivo elegido.
