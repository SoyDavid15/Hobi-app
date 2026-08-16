# Hobi - App Context & Developer Guide

Este documento sirve como contexto y registro de cambios para guiar a cualquier IA o desarrollador en futuras sesiones de trabajo en el proyecto **Hobi**.

---

## 1. Visión General de la Aplicación
- **Nombre:** Hobi
- **Framework:** Expo SDK 56 / React Native (v0.85.3) / React 19
- **Enrutamiento:** Expo Router (`src/app/`)
- **Estilos:** Tailwind / NativeWind / CSS globales (`src/global.css`)
- **Plataformas soportadas:** iOS, Android, Web

---

## 2. Directrices de Seguridad y Privacidad
Para garantizar la seguridad de la aplicación y prevenir la filtración de datos, se siguen estrictamente las siguientes políticas:
1. **Sin Secretos Hardcodeados:** Ninguna clave API, token de acceso o credencial se almacena en el código fuente. Se manejan mediante variables de entorno o almacenamiento seguro.
2. **Almacenamiento Local Seguro:** Uso de almacenamiento seguro cifrado (`expo-secure-store` u equivalentes) para datos sensibles o de sesión, evitando `AsyncStorage` en texto plano para información crítica.
3. **Control de Logs y Depuración:** No se deben registrar datos sensibles (PII, contraseñas, tokens) en los logs de la consola (`console.log`, etc.) ni en herramientas de reporte de errores de producción.
4. **Validación de Entradas:** Todas las entradas de usuario y parámetros deben ser validados y sanitizados.
5. **Comunicaciones Seguras:** Uso exclusivo de HTTPS para cualquier servicio o API externa.

---

## 3. Registro de Cambios (Changelog)

### [2026-08-16] - Reto Diario Persistente y Garantía de Máximo 2 Líneas
- **Autor:** IA (OpenCode)
- **Cambios:**
  - Nueva migración `supabase/migrations/0002_daily_challenges.sql`: tabla `daily_challenges` (`user_id`, `challenge_date`, `hobby_id`, `challenge`) con `unique (user_id, challenge_date)` y RLS de solo lectura para el propio usuario.
  - Adición de los helpers `get_daily_challenge` y `save_daily_challenge` en `Backend/hobbies.py`.
  - Actualización de `GET /message` en `Backend/main.py`: consulta el reto de hoy en la base de datos; si existe lo devuelve tal cual (mismo reto durante todo el día); si no, genera uno con Gemini a partir de un hobby aleatorio del día (semilla `user_id + fecha`) entre los hobbies guardados del usuario, lo persiste y lo devuelve. Al cambiar de fecha se genera un reto nuevo según los hobbies seleccionados. Manejo de carrera: si el insert falla por el constraint único, se re-consulta y devuelve el existente.
  - Actualización de `Backend/ai.py`: la respuesta de Gemini ahora se recorta a las primeras 2 líneas (`"\n".join(text.splitlines()[:2])`), garantizando que el reto nunca tenga más de 2 líneas, y se usa `temperature=0` en la llamada a Gemini para respuestas más consistentes.

### [2026-08-16] - Retos Cortos y Fotografiables
- **Autor:** IA (OpenCode)
- **Cambios:**
  - Actualización del prompt base en `Backend/ai.py`: los retos generados por Gemini ahora deben ser cortos, concretos y **fotografiables** (una acción visual que el usuario pueda demostrar tomándole una foto al completarla), para que puedan registrarse en la galería de retos completados del Perfil.

### [2026-08-16] - Retos Diarios Personalizados Según Hobbies del Usuario
- **Autor:** IA (OpenCode)
- **Cambios:**
  - Refactorización de `Backend/ai.py`: eliminado el hobby hardcodeado (`hobby = "Musica"`) y los condicionales `if/elif`; ahora `get_message(hobby)` recibe el hobby como parámetro y arma el prompt dinámicamente (con prompts específicos por hobby y un fallback genérico).
  - Adición de la función `get_user_hobbies(user_id)` en `Backend/hobbies.py` para centralizar la consulta de los hobbies del usuario desde la tabla `user_hobbies`, reutilizada tanto por `GET /hobbies` como por el nuevo flujo de retos.
  - Actualización del endpoint `GET /message` en `Backend/main.py`: ahora requiere autenticación (`Authorization: Bearer <token>`), obtiene el `user_id` con `get_current_user`, consulta los hobbies guardados en la base de datos y selecciona uno aleatorio de forma determinista por día (semilla `user_id + fecha`), de modo que cada usuario recibe un reto estable durante todo el día y distinto cada día.
  - Si el usuario no tiene hobbies seleccionados, el backend responde con un mensaje indicando que seleccione sus pasatiempos en Ajustes.
  - Creación del servicio `src/services/challenges.ts` en la app con `ChallengeService.getChallenge()`, que consume `GET /message` con el token de sesión (mismo patrón que `HobbyService`).
  - Actualización de la pantalla Home (`src/app/index.tsx`): el reto diario ya no está hardcodeado ("Toma una foto del atardecer"), ahora se obtiene del backend al montar la pantalla, mostrando un estado de carga ("Cargando tu reto...") y un mensaje de error si falla la petición.

### [2026-04-07] - Ocultar Navbar en Ajustes y Botón de Volver Mejorado
- **Autor:** IA (OpenCode)
- **Cambios:**
  - Configuración de `tabBarStyle: { display: 'none' }` para la pantalla `settings` en `src/components/app-tabs.tsx`, asegurando que la barra de navegación inferior se oculte completamente al acceder a los ajustes.
  - Rediseño del botón de retroceso ("Volver") en `src/app/settings.tsx` convirtiéndolo en un botón flotante/pastilla destacado con fondo, borde y icono, facilitando su identificación y pulsación.

### [2026-04-07] - Rediseño Visual Avanzado de la Pantalla de Ajustes
- **Autor:** IA (OpenCode)
- **Cambios:**
  - Rediseño completo de la interfaz de la pantalla de Ajustes (`src/app/settings.tsx`) basada en tarjetas elegantes (`cards`), iconos vectoriales (`Ionicons`) para cada opción y sección.
  - Mejora visual en los chips de "Mis Hobbies" y botones de cuenta (Cerrar sesión y Eliminar cuenta) para una experiencia de usuario (UX) moderna y pulida.

### [2026-04-07] - Actualización de Ajustes: Adición de Mis Hobbies y Limpieza de Secciones
- **Autor:** IA (OpenCode)
- **Cambios:**
  - Eliminación de las secciones de "Seguridad y Privacidad" e "Información del Sistema" en la pantalla de Ajustes (`src/app/settings.tsx`).
  - Incorporación de la sección interactiva **"Mis Hobbies"** con chips seleccionables (Música, Deporte, Videojuegos, Arte, Lectura, Cocina) para personalizar los retos.
  - Mantenimiento de las secciones de **Preferencias (Idioma)** y **Cuenta (Cerrar sesión, Eliminar cuenta)** con diseño coherente a la app.

### [2026-04-07] - Círculo Gigante Café Responsive y Textos Blancos en Pantalla Home
- **Autor:** IA (OpenCode)
- **Cambios:**
  - Adición de un círculo gigante de fondo de color café (`#6F4E37`) en la parte inferior de la pantalla Home (`src/app/index.tsx`), con un ancho horizontal del `200%` (`width * 2`), centrado responsivamente (`left: '-50%'`), una altura del `50%` (`height * 0.5`) y desplazado 10px hacia abajo (`bottom: -10`) para ajustarse perfectamente a cualquier pantalla.
  - Ajuste de los textos y elementos ubicados sobre el círculo (como el título del reto diario y etiquetas) a color blanco (`#FFFFFF`) para asegurar un contraste y legibilidad óptimos.

### [2026-04-07] - Ocultar Pantalla de Auth del NavBar
- **Autor:** IA (OpenCode)
- **Cambios:**
  - Configuración de `href: null` para la pantalla `auth` en `src/components/app-tabs.tsx`, asegurando que no aparezca en la barra de navegación inferior.

### [2026-04-07] - Persistencia de Sesión con SecureStore y Corrección Tipográfica de "Hobi"
- **Autor:** IA (OpenCode)
- **Cambios:**
  - Configuración del adaptador de almacenamiento cifrado en Supabase utilizando `expo-secure-store` para persistir la sesión del usuario entre reinicios de la aplicación.
  - Corrección del corte vertical en el título "Hobi" de la pantalla de autenticación mediante `lineHeight` y padding vertical adecuados, aplicando color café (`#6F4E37`).

### [2026-04-07] - Botón de Visualización de Contraseña y Verificación de Correo en Registro
- **Autor:** IA (OpenCode)
- **Cambios:**
  - Adición de un botón interactivo (icono de ojo) en los campos de contraseña para mostrar u ocultar el texto en la pantalla de autenticación (`src/app/auth.tsx`).
  - Implementación de la pantalla de aviso de verificación de correo electrónico tras registrarse exitosamente.

### [2026-04-07] - Pantalla de Autenticación, Guard de Sesión y Botón de Cerrar Sesión con Confirmación
- **Autor:** IA (OpenCode)
- **Cambios:**
  - Creación de la pantalla de Autenticación (`src/app/auth.tsx`) con soporte para Google OAuth e inicio de sesión/registro por correo y contraseña.
  - Implementación de un guard de sesión en `src/app/_layout.tsx` que muestra la pantalla de autenticación si no hay sesión activa.
  - Adición del botón de "Cerrar sesión" con cuadro de diálogo de confirmación en la pantalla de Ajustes (`src/app/settings.tsx`).

### [2026-04-07] - Conexión de Supabase para Autenticación de Usuarios
- **Autor:** IA (OpenCode)
- **Cambios:**
  - Configuración del cliente de Supabase en `src/lib/supabase.ts` con la URL y Key proporcionadas.
  - Implementación del servicio de autenticación en `src/services/auth.ts` (`signIn`, `signUp`, `signOut`, `getSession`) exclusivo para autenticación de usuarios.

### [2026-04-07] - Ocultar Pantalla de Ajustes del NavBar
- **Autor:** IA (OpenCode)
- **Cambios:**
  - Configuración de `href: null` en `src/components/app-tabs.tsx` para la pantalla `settings`, asegurando que no aparezca en la barra de navegación inferior y sea accesible únicamente mediante el botón hamburguesa del perfil.

### [2026-04-07] - Integración de Ionicons en Racha y NavBar
- **Autor:** IA (OpenCode)
- **Cambios:**
  - Instalación y uso de `@expo/vector-icons` (`Ionicons`) para el icono de fuego (`flame`) en la tarjeta de racha del Perfil y para los iconos de navegación (`home` / `person`) en el NavBar.

### [2026-04-07] - Creación de Pantalla de Ajustes y Navegación desde el Menú Hamburguesa
- **Autor:** IA (OpenCode)
- **Cambios:**
  - Creación de la pantalla de Ajustes (`src/app/settings.tsx`) con configuraciones de seguridad (Biometría, Enmascaramiento PII, SecureStore).
  - Conexión del botón hamburguesa en la pantalla Perfil (`src/app/profile.tsx`) para navegar hacia `/settings` mediante `expo-router`.

### [2026-04-07] - Rediseño de la Pantalla Perfil según Referencia Visual
- **Autor:** IA (OpenCode)
- **Cambios:**
  - Actualización de `src/app/profile.tsx` para incluir el botón hamburguesa superior para ajustes, la foto de perfil circular con anillo, la tarjeta de racha con icono de fuego y la galería 2x2 de fotos de retos completados.

### [2026-04-07] - Centrado Vertical del Diseño en la Pantalla Home
- **Autor:** IA (OpenCode)
- **Cambios:**
  - Ajuste de `justifyContent: 'center'` en `safeArea` y `contentContainer` de la pantalla Home (`src/app/index.tsx`) para centrar el contenido verticalmente en la mitad de la pantalla.

### [2026-04-07] - Integración de Imagen de Personaje (hobiCharacter.png)
- **Autor:** IA (OpenCode)
- **Cambios:**
  - Sustitución de la representación vectorial por la imagen oficial `hobiCharacter.png` en la pantalla Home (`src/app/index.tsx`).

### [2026-04-07] - Rediseño Minimalista y Moderno de Perfil y Home según Referencia
- **Autor:** IA (OpenCode)
- **Cambios:**
  - Actualización de la pantalla Home (`src/app/index.tsx`) con la estructura exacta de la referencia visual (encabezado "Hola, soy Hobi", ilustración vectorial del personaje oso Hobi, placa de "Reto diario", descripción del reto y botón de acción "Hecho").
  - Rediseño de la pantalla Perfil (`src/app/profile.tsx`) siguiendo el mismo estilo minimalista, moderno y sin tarjetas (fondo blanco puro, tipografía limpia, filas de información protegida y controles de seguridad).

### [2026-04-07] - Rediseño Minimalista y Moderno de Home
- **Autor:** IA (OpenCode)
- **Cambios:**
  - Título "Hola, soy Hobi" ajustado a tamaño pequeño y color negro.
  - Eliminación de tarjetas contenedoras ("Espacio del personaje" y "Retos del día"), reemplazadas por un diseño limpio y tipográfico.
  - Actualización de iconos del NavBar.
  - Fondo blanco puro y sin degradados.

### [2026-04-07] - Adición de Sección de Retos y Eliminación de Estado de Seguridad en Home
- **Autor:** IA (OpenCode)
- **Cambios:**
  - Inclusión de una sección de retos en formato de texto debajo del personaje en la pantalla Home (`src/app/index.tsx`).
  - Eliminación del bloque de "Estado de seguridad" de la pantalla Home.

### [2026-04-07] - Actualización de Home con Mensaje "Hola, soy Hobi" y Espacio para Personaje
- **Autor:** IA (OpenCode)
- **Cambios:**
  - Incorporación del mensaje superior "Hola, soy Hobi" en la pantalla Home (`src/app/index.tsx`).
  - Inclusión de un contenedor dedicado para el personaje con diseño de bordes redondeados y colores sólidos (blanco, café, azul).

### [2026-04-07] - Implementación de Paleta de Colores (Blanco, Café, Azul) y Bordes Redondeados
- **Autor:** IA (OpenCode)
- **Cambios:**
  - Definición de paleta temática en `src/constants/theme.ts` (Blanco/Crema, Café/Acento y Azul/Primario).
  - Aplicación de diseño con bordes redondeados (`BorderRadius.medium`) en tarjetas y componentes clave.
  - Corrección de errores de sintaxis y tipado en pantallas Home y Perfil.

### [2026-04-07] - Creación de Pantallas Home y Perfil con Enfoque en Seguridad
- **Autor:** IA (OpenCode)
- **Cambios:**
  - Configuración de las 2 pantallas principales: Home (`src/app/index.tsx`) y Perfil (`src/app/profile.tsx`).
  - Actualización del navegador de pestañas (`src/components/app-tabs.tsx`).
  - Implementación de enmascaramiento de PII y controles de privacidad en la pantalla de Perfil para evitar fugas de datos.
  - Eliminación de la pantalla de ejemplo Explore (`src/app/explore.tsx`).

### [2026-04-07] - Inicialización del Contexto y Políticas de Seguridad
- **Autor:** IA (OpenCode)
- **Cambios:**
  - Creación de `APP_CONTEXT.md` para persistencia de contexto entre sesiones.
  - Establecimiento formal de las directrices de seguridad de la aplicación (prevención de fugas de datos, gestión de secretos, almacenamiento seguro).
