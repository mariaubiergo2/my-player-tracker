# Resumen del Proyecto
**Foot-Tracker** (My Player Tracker) es una aplicación web colaborativa para el seguimiento del rendimiento deportivo de futbolistas. Permite a los jugadores registrar sus partidos, reflejar autoevaluaciones y subir videos de juego, mientras que proporciona a los entrenadores herramientas para vincularse con sus jugadores, definir objetivos personalizados, enviar cuestionarios de evaluación y entablar hilos de discusión interactivos tras cada encuentro.

---

# Stack Tecnológico
Basado estrictamente en las dependencias declaradas en [package.json](file:///c:/Users/PC/Documents/FURBO/my-player-tracker/package.json):

*   **Framework Principal:** Next.js (v16.2.6) con React 19 (v19.2.4).
*   **Base de Datos y ORM:** PostgreSQL configurado a través de Prisma ORM (v7.8.0) utilizando el controlador nativo de Pool de `@prisma/adapter-pg` y `pg` (v8.22.0).
*   **Servicio de Envío de Correos:** Resend API (v6.18.1) para despachar códigos numéricos de verificación de cuentas.
*   **Gestión y Reproducción de Videos:** Mux Video API a través de `@mux/mux-node` (v14.1.1), `@mux/mux-player-react` (v3.13.0) y `@mux/mux-uploader-react` (v1.5.0) para cargas de videos y reproducción optimizada.
*   **Autenticación y Criptografía:** `bcryptjs` (v3.0.3) para el cifrado y comparación de contraseñas de usuarios.
*   **Internacionalización (i18n):** Sistema nativo cargado mediante cookies (Catalán, Español e Inglés).
*   **Estilos y Temas visuales:** TailwindCSS (v4.3.0) con DaisyUI (v5.5.20) y `@tailwindcss/postcss`.

---

# Arquitectura y Estructura de Carpetas

*   [`actions/`](file:///c:/Users/PC/Documents/FURBO/my-player-tracker/actions): Server Actions que gestionan la lógica de negocio y las consultas a la base de datos de manera atómica (mediante transacciones Prisma).
*   [`app/`](file:///c:/Users/PC/Documents/FURBO/my-player-tracker/app): Rutas del Next.js App Router.
    *   [`app/(auth)/`](file:///c:/Users/PC/Documents/FURBO/my-player-tracker/app/(auth)): Páginas de registro, login y verificación de correo electrónico.
    *   [`app/about/`](file:///c:/Users/PC/Documents/FURBO/my-player-tracker/app/about): Vista descriptiva e informativa del proyecto.
    *   [`app/admin/`](file:///c:/Users/PC/Documents/FURBO/my-player-tracker/app/admin): Vista de gestión de usuarios administradores.
    *   [`app/api/`](file:///c:/Users/PC/Documents/FURBO/my-player-tracker/app/api): Controladores de endpoints AJAX internos y webhooks externos.
    *   [`app/dashboard/`](file:///c:/Users/PC/Documents/FURBO/my-player-tracker/app/dashboard): Panel principal del jugador, que incluye las subsecciones de nutrición y preparación física.
    *   [`app/matches/`](file:///c:/Users/PC/Documents/FURBO/my-player-tracker/app/matches): Creación, edición, listado general y detalle de partidos, incluyendo el hilo de feedback.
    *   [`app/notifications/`](file:///c:/Users/PC/Documents/FURBO/my-player-tracker/app/notifications): Bandeja de entrada de notificaciones.
    *   [`app/profile/`](file:///c:/Users/PC/Documents/FURBO/my-player-tracker/app/profile): Formulario de edición del perfil de usuario y cambio de contraseña.
    *   [`app/questionnaires/`](file:///c:/Users/PC/Documents/FURBO/my-player-tracker/app/questionnaires): Gestión de plantillas, envíos y respuestas de cuestionarios de entrenadores.
    *   [`app/trainer/`](file:///c:/Users/PC/Documents/FURBO/my-player-tracker/app/trainer): Vistas específicas de los entrenadores (perfiles de jugadores, asignaciones de futbolistas).
*   [`components/`](file:///c:/Users/PC/Documents/FURBO/my-player-tracker/components): Componentes React modulares.
    *   [`components/matches/`](file:///c:/Users/PC/Documents/FURBO/my-player-tracker/components/matches): Calendarios de partidos, tarjetas dinámicas, hilos de chat y componentes de video.
    *   [`components/ui/`](file:///c:/Users/PC/Documents/FURBO/my-player-tracker/components/ui): Elementos del diseño del sistema (cabecera, pie, campana de notificaciones).
*   [`hooks/`](file:///c:/Users/PC/Documents/FURBO/my-player-tracker/hooks): Custom hooks reutilizables (`useAuth` para estado de sesión del cliente).
*   [`lib/`](file:///c:/Users/PC/Documents/FURBO/my-player-tracker/lib): Inicializadores (Prisma), utilidades globales de fecha/formulario y archivos de control de permisos o de internacionalización.
*   [`messages/`](file:///c:/Users/PC/Documents/FURBO/my-player-tracker/messages): Diccionarios de traducción local en JSON (`ca.json`, `es.json`, `en.json`).
*   [`prisma/`](file:///c:/Users/PC/Documents/FURBO/my-player-tracker/prisma): Esquema de modelado de base de datos, configuraciones, migraciones y script de seed.
*   [`types/`](file:///c:/Users/PC/Documents/FURBO/my-player-tracker/types): Modelado e interfaces TypeScript de partidos y videos.

---

# Modelos de Datos
Las siguientes entidades están definidas en [schema.prisma](file:///c:/Users/PC/Documents/FURBO/my-player-tracker/prisma/schema.prisma):

```mermaid
erDiagram
    User ||--o{ EmailVerificationCode : "verificationCodes"
    User ||--o{ Match : "playerMatches (Player)"
    User ||--o{ Match : "trainerMatches (Trainer)"
    User ||--o{ MatchFeedbackMessage : "feedbackMessages"
    User ||--o{ Notification : "notifications"
    User ||--o{ Questionnaire : "trainerQuestionnaires"
    User ||--o{ QuestionnaireAssignment : "playerAssignments"
    User ||--o{ PlayerObjectives : "playerObjectivesReceived (Player)"
    User ||--o{ PlayerObjectives : "playerObjectivesDefined (Trainer)"
    User }o--o{ User : "TrainerPlayers (Self-relation)"

    Match ||--o| Video : "has video"
    Match ||--o{ MatchFeedbackMessage : "has messages"
    Match ||--o{ Notification : "match notifications"

    Questionnaire ||--o{ Question : "questions"
    Questionnaire ||--o{ QuestionnaireAssignment : "assignments"

    QuestionnaireAssignment ||--o{ Answer : "answers"
    QuestionnaireAssignment ||--o{ Notification : "assignment notifications"

    Question ||--o{ Answer : "answers"
```

### 1. `User` (Tabla `users`)
Representa a cualquier usuario en el sistema.
*   `id` (String, PK, CUID)
*   `name` (String)
*   `surname` (String)
*   `email` (String, Único)
*   `password` (String)
*   `role` (Enum `UserRole`: `PLAYER` (default), `GOAL_KEEPER`, `TRAINER`, `ADMIN`)
*   `phone` (String, Opcional)
*   `avatarUrl` (String, Opcional)
*   `birthDate` (DateTime, Opcional)
*   `emailVerified` (Boolean, default: `false`)
*   `createdAt` (DateTime, default: `now`)
*   `updatedAt` (DateTime, auto-updated)

### 2. `EmailVerificationCode` (Tabla `email_verification_codes`)
Códigos de 6 dígitos temporales creados al registrarse o solicitar reenvío.
*   `id` (String, PK, CUID)
*   `userId` (String, FK -> `User.id` con eliminación en cascada)
*   `codeHash` (String)
*   `attempts` (Int, default: 0)
*   `expiresAt` (DateTime)
*   `consumedAt` (DateTime, Opcional)
*   `invalidatedAt` (DateTime, Opcional)
*   `createdAt` (DateTime, default: `now`)

### 3. `Match` (Tabla `matches`)
Información técnica, de competición y de evaluación post-partido.
*   `id` (String, PK, CUID)
*   `name` (String)
*   `description` (String, Opcional)
*   `location` (String, Opcional)
*   `isHome` (Boolean, Opcional)
*   `matchUrl` (String, Opcional)
*   `kitColor` (String, Opcional)
*   `shirtNumber` (String, Opcional)
*   `position` (String, Opcional)
*   `minutesPlayed` (String, Opcional)
*   `date` (DateTime)
*   `startTime` (String, Opcional)
*   `endTime` (String, Opcional)
*   `opponent` (String, Opcional)
*   `category` (String, Opcional)
*   `leaguePosition` (String, Opcional)
*   `matchType` (Enum `MatchType`: `FRIENDLY`, `LEAGUE`, `CUP`, `TRAINING`, Opcional)
*   `competitionType` (String, Opcional)
*   `playerId` (String, FK -> `User.id` en relación `PlayerMatches` con eliminación en cascada)
*   `trainerId` (String, FK -> `User.id` en relación `TrainerMatches` con eliminación en cascada, Opcional)
*   `teamId` (String, Opcional)
*   `comment` (String, Opcional)
*   `trainerFeedback` (String, Opcional)
*   `playerReflection` (String, Opcional)
*   `mark` (Int, Opcional)
*   `intensity` (Int, Opcional)
*   `attitude` (Int, Opcional)
*   `performance` (Int, Opcional)
*   `goals` (Int, default: 0, Opcional)
*   `assists` (Int, default: 0, Opcional)
*   `strengths` (String[], Array)
*   `weaknesses` (String[], Array)
*   `improvementAreas` (String[], Array)
*   `offensiveActionsOwnHalf` (String, Opcional)
*   `offensiveActionsOpponentHalf` (String, Opcional)
*   `defensiveActionsOwnHalf` (String, Opcional)
*   `defensiveActionsOpponentHalf` (String, Opcional)
*   `isReviewed` (Boolean, default: `false`)
*   `reviewedAt` (DateTime, Opcional)
*   `createdAt` (DateTime, default: `now`)
*   `updatedAt` (DateTime, auto-updated)

### 4. `Video` (Tabla `videos`)
Enlace a recursos de video para los partidos (Mux u offline).
*   `id` (String, PK, CUID)
*   `matchId` (String, Único, FK -> `Match.id` con eliminación en cascada)
*   `muxAssetId` (String, Opcional)
*   `muxPlaybackId` (String, Opcional)
*   `muxUploadId` (String, Opcional)
*   `status` (String, default: `"uploading"`)
*   `duration` (Float, Opcional)
*   `title` (String, Opcional)
*   `createdAt` (DateTime, default: `now`)
*   `updatedAt` (DateTime, auto-updated)

### 5. `MatchFeedbackMessage` (Tabla `match_feedback_messages`)
Comentarios individuales en el hilo de chat del partido.
*   `id` (String, PK, CUID)
*   `matchId` (String, FK -> `Match.id` con eliminación en cascada)
*   `authorId` (String, FK -> `User.id` con eliminación en cascada)
*   `authorRole` (String)
*   `content` (String)
*   `createdAt` (DateTime, default: `now`)

### 6. `Questionnaire` (Tabla `questionnaires`)
Plantilla de evaluación deportiva.
*   `id` (String, PK, CUID)
*   `title` (String)
*   `description` (String, Opcional)
*   `status` (Enum `QuestionnaireStatus`: `DRAFT` (default), `DEFINED`, `SEND`)
*   `trainerId` (String, FK -> `User.id` con eliminación en cascada)
*   `createdAt` (DateTime, default: `now`)
*   `updatedAt` (DateTime, auto-updated)

### 7. `Question` (Tabla `questions`)
Preguntas dentro de un cuestionario.
*   `id` (String, PK, CUID)
*   `questionnaireId` (String, FK -> `Questionnaire.id` con eliminación en cascada)
*   `text` (String)
*   `type` (Enum `QuestionType`: `MULTIPLE_CHOICE`, `OPEN`)
*   `options` (String[], Array)
*   `order` (Int)

### 8. `QuestionnaireAssignment` (Tabla `questionnaire_assignments`)
Envío y vinculación de un cuestionario a un jugador.
*   `id` (String, PK, CUID)
*   `questionnaireId` (String, FK -> `Questionnaire.id` con eliminación en cascada)
*   `playerId` (String, FK -> `User.id` con eliminación en cascada)
*   `status` (Enum `AssignmentStatus`: `SENT` (default), `RECLAIMED`, `COMPLETED`)
*   `sentAt` (DateTime, default: `now`)
*   `reclaimedAt` (DateTime, Opcional)
*   `respondedAt` (DateTime, Opcional)

### 9. `Answer` (Tabla `answers`)
Respuesta individual dada por el jugador.
*   `id` (String, PK, CUID)
*   `assignmentId` (String, FK -> `QuestionnaireAssignment.id` con eliminación en cascada)
*   `questionId` (String, FK -> `Question.id` con eliminación en cascada)
*   `value` (String)
*   *Restricción única:* Un jugador solo puede responder una única vez a una pregunta específica de su asignación (`@@unique([assignmentId, questionId])`).

### 10. `Notification` (Tabla `notifications`)
Notificaciones del sistema internas.
*   `id` (String, PK, CUID)
*   `recipientId` (String, FK -> `User.id` con eliminación en cascada)
*   `type` (Enum `NotificationType`: `MATCH_CREATED`, `MATCH_UPDATED`, `MATCH_UPDATED_BY_TRAINER`, `FEEDBACK_MESSAGE_FROM_PLAYER`, `FEEDBACK_MESSAGE_FROM_TRAINER`, `QUESTIONNAIRE_SENT`, `QUESTIONNAIRE_RESPONDED`, `QUESTIONNAIRE_RECLAIMED`)
*   `matchId` (String, FK -> `Match.id` con eliminación en cascada, Opcional)
*   `assignmentId` (String, FK -> `QuestionnaireAssignment.id` con eliminación en cascada, Opcional)
*   `isRead` (Boolean, default: `false`)
*   `createdAt` (DateTime, default: `now`)

### 11. `PlayerObjectives` (Tabla `player_objectives`)
Objetivos deportivos activos o históricos definidos por un entrenador.
*   `id` (String, PK, CUID)
*   `playerId` (String, FK -> `User.id` en relación `PlayerObjectives` con eliminación en cascada)
*   `trainerId` (String, FK -> `User.id` en relación `TrainerDefinedObjectives` con eliminación en cascada)
*   `summary` (String, descripción)
*   `items` (String[], Array de metas)
*   `effectiveFrom` (DateTime, default: `now`)
*   `effectiveTo` (DateTime, Opcional; `null` indica que el objetivo está activo hoy)
*   `createdAt` (DateTime, default: `now`)

---

# Funcionalidades Implementadas
Lista completa de características operacionales en el código fuente:

### 1. Sistema de Autenticación, Sesión e i18n
*   **Registro de Usuarios:** Crea cuentas con rol por defecto `PLAYER` ([app/api/auth/register/route.ts](file:///c:/Users/PC/Documents/FURBO/my-player-tracker/app/api/auth/register/route.ts)) y despacha un código aleatorio de 6 dígitos transaccional.
*   **Flujo de Verificación:** Página de introducción de código ([app/(auth)/verify-email/page.tsx](file:///c:/Users/PC/Documents/FURBO/my-player-tracker/app/(auth)/verify-email/page.tsx)) y lógica de validación ([actions/email-verification.ts](file:///c:/Users/PC/Documents/FURBO/my-player-tracker/actions/email-verification.ts)). Soporta límites de intentos de código erróneos (máximo 5 fallos antes de invalidar el código) y límites de reenvío (máximo 1 envío por minuto, máximo 5 envíos por hora).
*   **Inicio y Cierre de Sesión:** Rutas `/api/auth/login` y `/api/auth/logout`. Genera y destruye la cookie cifrada en Base64 `auth_token` con expiración parametrizable.
*   **Internacionalización Dinámica:** Carga de locale basado en la cookie `locale` (por defecto `"ca"`). Función `t()` cliente y servidor para mapear claves multidioma ([lib/i18n.ts](file:///c:/Users/PC/Documents/FURBO/my-player-tracker/lib/i18n.ts)).

### 2. Gestión de Partidos y Permisos por Roles
*   **Creación y Actualización de Partidos:** Los jugadores agregan sus fichas técnicas e indicaciones (kit de ropa, posición, dorsal, URL del partido, reflexión y minutos). Los entrenadores rellenan datos de rendimiento cualitativo y cuantitativo (goles, asistencias, notas de actitud/rendimiento, fortalezas y áreas de mejora).
*   **Lógica de Edición Estricta:** El validador `canEditMatchField` en [lib/permissions.ts](file:///c:/Users/PC/Documents/FURBO/my-player-tracker/lib/permissions.ts) impide que los jugadores alteren las notas del entrenador o viceversa, y bloquea campos del sistema.
*   **Bandeja de Partidos y Calendario:** Visualización interactiva en modo lista ordenada o calendario mensual ([components/matches/MatchCalendar.tsx](file:///c:/Users/PC/Documents/FURBO/my-player-tracker/components/matches/MatchCalendar.tsx)).

### 3. Carga y Sincronización de Videos (Mux y Local Storage)
*   **Soporte Mux Direct Upload:** Inicializa el SDK y genera URLs de subida firmadas (`PUT`).
*   **Local Video Storage Fallback:** Si las claves de Mux en variables de entorno no están configuradas, el servidor guarda el archivo de video en la carpeta física de la aplicación ([public/uploads](file:///c:/Users/PC/Documents/FURBO/my-player-tracker/public/uploads)) y actualiza el registro de video con `status: "ready"` and `muxPlaybackId` apuntando a `/uploads/match_${id}_video.mp4`.
*   **Autocuración de Estado (Self-Healing Proactive Sync):** Al solicitar un video mediante GET ([app/api/matches/[id]/video/route.ts](file:///c:/Users/PC/Documents/FURBO/my-player-tracker/app/api/matches/[id]/video/route.ts)), si el estado del video de Mux es `"uploading"` o `"processing"`, el servidor consulta directamente la API de Mux para validar si el video está listo y actualiza automáticamente la base de datos local (evitando problemas de recepción de Webhooks en localhost).

### 4. Hilo de Feedback y Privacidad de Emails
*   **Feedback Post-Partido:** Un canal de comunicación tipo chat bidireccional entre el jugador del partido y el entrenador asignado ([components/matches/MatchFeedbackThread.tsx](file:///c:/Users/PC/Documents/FURBO/my-player-tracker/components/matches/MatchFeedbackThread.tsx)).
*   **Restricción de Privacidad:** En [actions/feedback.ts](file:///c:/Users/PC/Documents/FURBO/my-player-tracker/actions/feedback.ts), al retornar la lista de mensajes de feedback al entrenador, el backend blanquea explícitamente el email del jugador (`(match.player as any).email = ""`) para evitar que el entrenador tenga acceso directo a la cuenta de correo de los jugadores.

### 5. Cuestionarios y Evaluaciones
*   **Plantillas (Templates):** Los entrenadores pueden crear plantillas de cuestionarios con preguntas tipo opción múltiple o de respuesta abierta ([actions/questionnaires.ts](file:///c:/Users/PC/Documents/FURBO/my-player-tracker/actions/questionnaires.ts)).
*   **Flujo de Estado:** Borrador (`DRAFT`) -> Definido (`DEFINED`) -> Enviado (`SEND`). Al pasar a `SEND`, el cuestionario se bloquea para impedir modificaciones de estructura.
*   **Asignaciones y Respuestas:** Los jugadores reciben notificaciones del cuestionario asignado, pueden responder las preguntas, o usar la acción **Reclamar** (`RECLAIMED`) para marcar que tienen observaciones. Una vez respondido por completo, cambia a estado `COMPLETED`.

### 6. Sistema de Gestión de Objetivos Deportivos
*   **Estrategia de Historial por Entrenadores:** Al definir nuevos objetivos para un jugador ([actions/objectives.ts](file:///c:/Users/PC/Documents/FURBO/my-player-tracker/actions/objectives.ts)), el servidor finaliza la vigencia del objetivo anterior de forma atómica (`effectiveTo = now`) e inserta el nuevo registro activo (`effectiveTo = null`).
*   **Filtro Histórico en Partido:** Permite recuperar el objetivo que estaba activo en la fecha exacta en que ocurrió un partido específico (`getEffectiveObjectivesAt`).

### 7. Panel de Administración Avanzado (Admin Users)
*   **Tabla Dinámica:** Renderizada en [app/admin/users/page.tsx](file:///c:/Users/PC/Documents/FURBO/my-player-tracker/app/admin/users/page.tsx) con soporte para:
    *   Reordenamiento de columnas dinámico mediante arrastrar y soltar (Drag and Drop HTML5).
    *   Redimensionamiento del ancho de columnas interactivo por medio de eventos de ratón (`Mousedown`/`Mousemove`).
    *   Creación, edición, filtrado y eliminación completa de perfiles de usuario.

### 8. Utilidades Clientes Locales (Local Storage)
*   **Hydration Tracker:** Herramienta visual de consumo diario de agua (en ml). Guarda los registros persistidos localmente en `localStorage` y los reinicia automáticamente al cambiar el día.
*   **Workout Log & Physical Metrics:** Logger de entrenamientos (RPE, fatiga, dolores, duración) y almacenamiento de variables físicas (VO2max, sueño, pulsaciones en reposo). Almacenados en cliente de forma independiente y aislada del servidor.

---

# Endpoints e Integración de la API

### Autenticación e Identidad
*   `POST` [`/api/auth/login`](file:///c:/Users/PC/Documents/FURBO/my-player-tracker/app/api/auth/login/route.ts): Autentica credenciales en base de datos PostgreSQL, genera una cookie de sesión cifrada en Base64 y la responde. Devuelve un estado `403` si la cuenta no ha verificado su email.
*   `POST` [`/api/auth/logout`](file:///c:/Users/PC/Documents/FURBO/my-player-tracker/app/api/auth/logout/route.ts): Invalida la sesión actual del cliente eliminando la cookie de autenticación.
*   `GET` [`/api/auth/me`](file:///c:/Users/PC/Documents/FURBO/my-player-tracker/app/api/auth/me/route.ts): Obtiene y valida el payload decodificado de la cookie de sesión del cliente.
*   `POST` [`/api/auth/register`](file:///c:/Users/PC/Documents/FURBO/my-player-tracker/app/api/auth/register/route.ts): Registra usuarios y genera un código de verificación de 6 dígitos numéricos.

### Partidos y Multimedia (Videos)
*   `GET` [`/api/matches`](file:///c:/Users/PC/Documents/FURBO/my-player-tracker/app/api/matches/route.ts): Obtiene todos los partidos asociados al jugador o entrenador autenticado.
*   `GET` [`/api/matches/[id]`](file:///c:/Users/PC/Documents/FURBO/my-player-tracker/app/api/matches/[id]/route.ts): Retorna la información técnica e identificador de video asociado de un partido por ID.
*   `GET` [`/api/matches/[id]/video`](file:///c:/Users/PC/Documents/FURBO/my-player-tracker/app/api/matches/[id]/video/route.ts): Obtiene el estado actual del video de un partido. Ejecuta la autocuración sincronizada consultando a MUX directamente.
*   `POST` [`/api/matches/[id]/video`](file:///c:/Users/PC/Documents/FURBO/my-player-tracker/app/api/matches/[id]/video/route.ts): Crea una URL de subida de video firmada directa en Mux, o devuelve la URL de subida simulada si Mux no está activo.
*   `DELETE` [`/api/matches/[id]/video`](file:///c:/Users/PC/Documents/FURBO/my-player-tracker/app/api/matches/[id]/video/route.ts): Elimina los recursos multimedia asociados en Mux (o ficheros en disco local `/uploads`) y borra el registro en base de datos.
*   `PUT` [`/api/matches/[id]/video/mock-upload`](file:///c:/Users/PC/Documents/FURBO/my-player-tracker/app/api/matches/[id]/video/mock-upload/route.ts): Endpoint de simulación para recibir los bytes del video y guardarlos en el disco local (`public/uploads`) cuando no hay tokens Mux en el entorno.

### Webhooks Externos
*   `POST` [`/api/webhooks/mux`](file:///c:/Users/PC/Documents/FURBO/my-player-tracker/app/api/webhooks/mux/route.ts): Recibe eventos de Mux. Valida la firma del webhook si se configura `MUX_WEBHOOK_SECRET`. Procesa los eventos `video.upload.asset_created`, `video.asset.ready` y `video.asset.errored` para actualizar los estados del video del partido en PostgreSQL.

---

# Variables de Entorno y Configuración

| Variable de Entorno | Tipo / Ejemplo | Propósito / Uso |
| :--- | :--- | :--- |
| `DATABASE_URL` | `postgres://...` | Cadena de conexión PostgreSQL para Prisma Client. |
| `SEED_ADMIN_EMAIL` | `admin@tracker.com` | Correo inicial de la cuenta administradora al ejecutar `seed`. |
| `SEED_ADMIN_PASSWORD` | `123456` | Contraseña inicial de la cuenta administradora al ejecutar `seed`. |
| `SEED_TRAINER_EMAIL` | `trainer@tracker.com` | Correo de la cuenta de entrenador al ejecutar `seed`. |
| `SEED_TRAINER_PASSWORD` | `123456` | Contraseña de la cuenta de entrenador al ejecutar `seed`. |
| `SEED_PLAYER_EMAIL` | `player@tracker.com` | Correo de la cuenta de jugador al ejecutar `seed`. |
| `SEED_PLAYER_PASSWORD` | `123456` | Contraseña de la cuenta de jugador al ejecutar `seed`. |
| `SEED_GOAL_KEEPER_EMAIL` | `porter@tracker.com` | Correo de la cuenta de portero al ejecutar `seed`. |
| `SEED_GOAL_KEEPER_PASSWORD` | `123456` | Contraseña de la cuenta de portero al ejecutar `seed`. |
| `AUTH_TOKEN_EXPIRY_HOURS` | `24` | Expiración de la cookie de sesión del usuario (en horas). |
| `RESEND_API_KEY` | `re_...` | API Key para enviar correos electrónicos mediante la plataforma Resend. |
| `RESEND_SENDER_EMAIL` | `no-reply@...` | Email remitente registrado en Resend para el despacho de correos. |
| `NEXT_PUBLIC_BASE_URL` | `http://localhost:3000` | URL base pública de la app, usada en la generación de enlaces de carga de video simulada. |
| `MUX_TOKEN_ID` | `f2f57613-...` | Identificador de API Token de Mux para administrar la transcodificación de videos. |
| `MUX_TOKEN_SECRET` | `Qi1jo...` | Clave secreta del API Token de Mux. |
| `MUX_WEBHOOK_SECRET` | `your_mux_webhook_secret` | Secreto de verificación de firma de eventos entrantes de Mux. |
| `JWT_SECRET` / `AUTH_SECRET` | `super_secret_key...` | **[OBLIGATORIO]** Secreto de firma criptográfica para tokens de sesión JWT (mínimo 32 caracteres). No existe fallback por seguridad; si falta o es inferior a 32 caracteres, la app aborta inmediatamente con un error descriptivo. |

---

# Dependencias y Servicios Externos
1.  **PostgreSQL (Base de datos principal):** Hospeda el esquema de persistencia física de la plataforma. Configurable mediante un contenedor Docker local (según [docker-compose.yml](file:///c:/Users/PC/Documents/FURBO/my-player-tracker/docker-compose.yml)).
2.  **Resend API (Notificaciones de Email y Códigos):** Encargado de enviar los correos transaccionales para validar las cuentas registradas.
3.  **Mux Video Infrastructure (Transmisión HLS/MP4):** Plataforma para subir, optimizar y reproducir los videos de juego subidos de los partidos de los jugadores.

---

# Observaciones y Puntos Abiertos

> [!NOTE]
> **1. Archivos de Datos Mock Unused (Código Muerto)**
> Existen dos archivos que contienen lógica en memoria (`MATCHES`) que ya no son consumidos por el resto de componentes activos de la aplicación (los cuales leen directamente mediante Prisma y SQL):
> *   [lib/db/MATCHES.ts](file:///c:/Users/PC/Documents/FURBO/my-player-tracker/lib/db/MATCHES.ts)
> *   [app/matches/[identifier]/MATCHES.ts](file:///c:/Users/PC/Documents/FURBO/my-player-tracker/app/matches/[identifier]/MATCHES.ts)

> [!NOTE]
> **2. Endpoint de Autenticación de Desarrollo Abierto (Solucionado/Eliminado)**
> El endpoint de login alternativo `/api/login` y su archivo correspondiente `app/api/login/route.ts` han sido completamente eliminados para evitar cualquier riesgo de puerta trasera en producción. El único endpoint de login oficial e intacto es `/api/auth/login`.

> [!IMPORTANT]
> **3. Limitación de Persistencia en Nutrición y Físico**
> Las páginas de seguimiento nutricional ([app/dashboard/nutrition/page.tsx](file:///c:/Users/PC/Documents/FURBO/my-player-tracker/app/dashboard/nutrition/page.tsx)) y de acondicionamiento físico ([app/dashboard/physical/page.tsx](file:///c:/Users/PC/Documents/FURBO/my-player-tracker/app/dashboard/physical/page.tsx)) guardan sus datos en el almacenamiento local del navegador (`localStorage`) del jugador. Si el deportista cambia de dispositivo, sus registros históricos de hidratación, suplementación y entrenamientos diarios no se sincronizarán en la base de datos de PostgreSQL.

> [!NOTE]
> **4. Autenticación con Token Firmado (Solucionado)**
> La lógica de tokens se ha actualizado para usar firmas criptográficas fuertes con HS256 utilizando la librería `jose`. Las sesiones ahora están protegidas contra falsificaciones y manipulación externa mediante validación criptográfica obligatoria basada en la clave configurada en `JWT_SECRET` o `AUTH_SECRET` (mínimo 32 caracteres). Si falta esta clave o es insegura (menos de 32 caracteres), el sistema aborta de inmediato impidiendo el funcionamiento de la app.

> [!NOTE]
> **5. Validación de Payloads en Server Actions con Zod (Solucionado)**
> Se ha eliminado por completo el uso de `: any` para tipar payloads de entrada y variables internas en las Server Actions del proyecto. Las entradas de datos del cliente ahora son validadas y tipadas estrictamente mediante schemas de Zod ubicados en `lib/validations/`. Las Server Actions en `email-verification.ts`, `notifications.ts`, `users.ts`, `feedback.ts` y `matches.ts` se validan al inicio mediante `.safeParse()`, garantizando la integridad de los datos antes de operar en la base de datos y manteniendo los contratos de respuesta esperados por el frontend.

> [!IMPORTANT]
> **6. Corrección de Vulnerabilidad de Autorización en deleteMatch (Solucionado)**
> Se detectó que la server action `deleteMatch` confiaba en un parámetro `userId` enviado por el cliente para realizar las comprobaciones de permisos de borrado, lo cual permitía spoofing de identidad. Se ha eliminado este parámetro de la firma de la función, y ahora la server action deriva la identidad del usuario directamente del token de sesión (`getCurrentUser()`) del lado del servidor. Las llamadas a `deleteMatch` en el frontend ([app/dashboard/page.tsx](file:///c:/Users/PC/Documents/FURBO/my-player-tracker/app/dashboard/page.tsx)) han sido actualizadas para omitir el parámetro `userId`.

> [!NOTE]
> **7. Vínculo Entrenador-Jugador al Crear Partidos (Riesgo Conocido / Pendiente de Definición)**
> En la server action `createMatch`, cuando un entrenador (`TRAINER`) o administrador (`ADMIN`) crea un partido, se le permite suministrar cualquier `playerId` desde el formulario sin validar si el entrenador está vinculado activamente con ese jugador. Este comportamiento ha sido documentado como un riesgo conocido. Queda pendiente de una definición de producto posterior sobre si se debe restringir o no la creación de partidos a jugadores que no pertenezcan a la plantilla del entrenador correspondiente.

