# 🎮 MuchBits — Plan de Proyecto (4 Meses)

> **Proyecto**: MuchBits — Videojuego web con plataforma de artistas musicales  
> **Stack**: NestJS (Backend) · React / Next.js (Frontend) · Videojuego Web  
> **Equipo**: 3 personas  
> **Duración**: 4 meses (Octubre 2026 → Enero 2027)  
> **Áreas**: 🎨 Gráfica · 💻 Desarrollo Web · 🧪 QA / Testing · 🚀 DevOps · 📄 Documentación

---

## 👥 Roles del Equipo

| Rol | Responsabilidad Principal |
|-----|--------------------------|
| **Dev 1 (Backend)** | NestJS API · Base de datos · Auth · DevOps |
| **Dev 2 (Frontend/Game)** | React/Next.js · Lógica del videojuego web |
| **Dev 3 (Diseño/QA)** | UI/UX · Assets gráficos · Testing · Docs |

---

## 🗓️ FASE 1 — Octubre 2026: Fundamentos y Diseño Base

> **Objetivo**: Sentar las bases del proyecto. Diseño del sistema, arquitectura, identidad visual y scaffolding de código.

---

### 🎨 GRÁFICA — Fase 1

#### T1.G.1 · Identidad Visual y Branding
Define la personalidad visual del proyecto desde el día uno.

- [ ] Definir paleta de colores principal (primarios, secundarios, estados)
- [ ] Seleccionar tipografías (heading + body + UI game)
- [ ] Crear el logotipo y variantes (dark/light, icon-only)
- [ ] Establecer Design Tokens (spacing, border-radius, sombras, etc.)
- [ ] Exportar guía de estilos base en Figma / formato compartido

#### T1.G.2 · Wireframes y Arquitectura Visual
Define el flujo de pantallas antes de diseñar.

- [ ] Mapear todas las pantallas/secciones de la plataforma web
- [ ] Mapear las pantallas del videojuego (menú, gameplay, HUD, game over, etc.)
- [ ] Crear wireframes de baja fidelidad de la plataforma web
- [ ] Crear wireframes de baja fidelidad de las pantallas del juego
- [ ] Validar flujo de usuario con el equipo

#### T1.G.3 · Assets Base del Videojuego
Comienzo de la producción de activos gráficos del juego.

- [ ] Definir estilo visual del juego (pixel art / ilustración / 2.5D / etc.)
- [ ] Crear concept art del personaje/avatar principal
- [ ] Crear concept art de los escenarios base (1–2 entornos)
- [ ] Diseñar set de íconos de UI del juego (botones, barras, indicadores)

---

### 💻 DESARROLLO WEB — Fase 1

#### T1.D.1 · Arquitectura y Setup del Proyecto
- [ ] Inicializar monorepo o estructura de repositorios
- [ ] Configurar NestJS (backend): módulos base, Swagger, CORS
- [ ] Configurar Next.js (frontend): estructura de carpetas, ESLint, Prettier
- [ ] Configurar base de datos (PostgreSQL / MongoDB) y ORM (TypeORM / Prisma)
- [ ] Configurar variables de entorno y `.env` para cada ambiente

#### T1.D.2 · Módulo de Autenticación y Usuarios
- [ ] Implementar registro de usuarios (email + contraseña)
- [ ] Implementar login con JWT (Access Token + Refresh Token)
- [ ] Agregar roles de usuario: `fan`, `artist`, `admin`
- [ ] Crear endpoints de perfil básico (`GET /me`, `PATCH /me`)
- [ ] Integrar guards y decorators en NestJS

#### T1.D.3 · Módulo de Artistas (API)
- [ ] Endpoint `POST /artists/profile` — Crear perfil artista
- [ ] Endpoint `GET /artists/:id` — Ver perfil público
- [ ] Endpoint `PATCH /artists/:id` — Editar perfil
- [ ] DTO de creación/edición con validaciones
- [ ] Relación Artist ↔ User en base de datos

#### T1.D.4 · DevOps Inicial
- [ ] Configurar repositorio Git con ramas (`main`, `dev`, `feature/*`)
- [ ] Definir convención de commits (Conventional Commits)
- [ ] Setup básico de CI (GitHub Actions o similar) para lint + tests
- [ ] Crear entorno de desarrollo local con Docker Compose

---

### 🧪 QA / 📄 DOCS — Fase 1

- [ ] Crear documento de arquitectura técnica inicial
- [ ] Documentar convenciones de código del equipo
- [ ] Escribir casos de prueba para Auth (registro, login, refresh token)
- [ ] Ejecutar pruebas manuales de los endpoints del mes

---

## 🗓️ FASE 2 — Noviembre 2026: Núcleo del Juego y Plataforma

> **Objetivo**: Construir el núcleo funcional del videojuego web y las secciones principales de la plataforma.

---

### 🎨 GRÁFICA — Fase 2

#### T2.G.1 · UI/UX de Alta Fidelidad — Plataforma Web
- [ ] Diseñar pantallas completas en alta fidelidad: Home, Login/Register
- [ ] Diseñar pantalla de perfil de artista (público y edición)
- [ ] Diseñar pantalla de perfil de fan / dashboard
- [ ] Diseñar pantalla principal del juego (lobby / selector de modos)
- [ ] Crear componentes reutilizables en Figma (botones, cards, modals, inputs)

#### T2.G.2 · Assets del Videojuego — Producción
- [ ] Crear spritesheet del personaje principal (idle, walk, run, jump, actions)
- [ ] Diseñar y exportar escenario/nivel 1 completo (tiles, fondo, objetos)
- [ ] Diseñar escenario/nivel 2 (o variante de tema musical diferente)
- [ ] Diseñar HUD del juego: barra de vida/energía, puntaje, tiempo, íconos
- [ ] Diseñar menú principal del juego con animación de fondo

#### T2.G.3 · Animaciones y Microinteracciones
- [ ] Definir animaciones de transición entre pantallas (plataforma web)
- [ ] Animar elementos del HUD (barras, contadores, notificaciones in-game)
- [ ] Crear animación del logo / splash screen al cargar

---

### 💻 DESARROLLO WEB — Fase 2

#### T2.D.1 · Motor del Videojuego Web
- [ ] Integrar motor de juego en Next.js (Phaser.js / PixiJS / Canvas API)
- [ ] Implementar game loop principal (update, render)
- [ ] Implementar sistema de físicas básico (gravedad, colisiones)
- [ ] Cargar y renderizar el primer nivel/escenario
- [ ] Integrar spritesheet del personaje con animaciones

#### T2.D.2 · Mecánicas Core del Juego
- [ ] Implementar controles del jugador (teclado + touch/mobile)
- [ ] Implementar sistema de puntuación y combos
- [ ] Implementar sistema de vida / game over
- [ ] Implementar pausa y menú in-game
- [ ] Sistema de guardado de puntuación (vinculado al usuario)

#### T2.D.3 · Frontend — Plataforma Web (Componentes Base)
- [ ] Setup del Design System en React (tokens, tema claro/oscuro)
- [ ] Crear componentes base: Button, Input, Card, Modal, Avatar, Badge
- [ ] Implementar layout principal: Header, Sidebar/Nav, Footer
- [ ] Implementar página de Home (landing)
- [ ] Implementar flujo de Login y Registro conectado al backend

#### T2.D.4 · Backend — Módulos de Contenido
- [ ] Módulo de Canciones/Tracks: subida de metadata, relación con artista
- [ ] Módulo de Rankings/Leaderboard: almacenar y consultar puntuaciones
- [ ] Módulo de Notificaciones: estructura base (in-app)

---

### 🧪 QA / 📄 DOCS — Fase 2

- [ ] Pruebas unitarias de servicios NestJS (Auth, Artists, Tracks)
- [ ] Pruebas de integración de endpoints principales (Postman / Jest)
- [ ] Pruebas de jugabilidad básica (smoke test del juego)
- [ ] Documentar API con Swagger — endpoints completados al mes
- [ ] Actualizar documento de arquitectura con módulos nuevos

---

## 🗓️ FASE 3 — Diciembre 2026: Integración y Funcionalidades Avanzadas

> **Objetivo**: Conectar el juego con la plataforma, añadir funcionalidades avanzadas y preparar para beta testing.

---

### 🎨 GRÁFICA — Fase 3

#### T3.G.1 · Pantallas Avanzadas y Flujos Completos
- [ ] Diseñar pantalla de Leaderboard / Rankings global y de amigos
- [ ] Diseñar pantalla de Tienda / Recompensas (si aplica)
- [ ] Diseñar pantalla de Logros / Badges del jugador
- [ ] Diseñar flujo de onboarding (primer acceso del usuario nuevo)
- [ ] Diseñar pantallas de error (404, 500, sin conexión)

#### T3.G.2 · Assets Avanzados del Juego
- [ ] Diseñar nivel 3 (boss level o nivel especial)
- [ ] Crear efectos visuales (partículas, explosiones, power-ups)
- [ ] Diseñar pantalla de victoria / derrota con animación
- [ ] Diseñar colección de personajes desbloqueables o skins
- [ ] Crear assets para items coleccionables in-game

#### T3.G.3 · Motion Design y Animaciones Finales
- [ ] Animar secuencia de intro del juego
- [ ] Crear animaciones para logros y recompensas (UI celebración)
- [ ] Producir cualquier video corto o GIF para marketing/redes

---

### 💻 DESARROLLO WEB — Fase 3

#### T3.D.1 · Integración Juego ↔ Plataforma
- [ ] Vincular sesión del usuario con el estado del juego
- [ ] Guardar y recuperar progreso del jugador desde la API
- [ ] Implementar sistema de Leaderboard en tiempo real (WebSockets o polling)
- [ ] Sistema de logros: definir eventos, evaluar condiciones, otorgar badges
- [ ] Integrar notificaciones in-app al completar logros o subir en el ranking

#### T3.D.2 · Frontend — Páginas Avanzadas
- [ ] Implementar página de Leaderboard con filtros (global, semanal, amigos)
- [ ] Implementar perfil de artista público con discografía/tracks
- [ ] Implementar pantalla de Logros y Progreso del jugador
- [ ] Implementar flujo de onboarding interactivo
- [ ] Ajustes de responsividad completa (mobile, tablet, desktop)

#### T3.D.3 · Backend — Funcionalidades Avanzadas
- [ ] Sistema de relaciones sociales (seguir artista, lista de amigos básica)
- [ ] Módulo de búsqueda global (artistas, canciones, jugadores)
- [ ] Rate limiting y seguridad de endpoints
- [ ] Implementar caché (Redis) en endpoints de alto tráfico

#### T3.D.4 · DevOps — Preparación para Staging
- [ ] Configurar entorno de staging (servidor o plataforma cloud)
- [ ] Deploy automatizado a staging en cada merge a `dev`
- [ ] Configurar logging centralizado (Winston / Datadog / Sentry)
- [ ] Setup de variables de entorno por ambiente (dev, staging, prod)

---

### 🧪 QA / 📄 DOCS — Fase 3

- [ ] Plan de pruebas E2E (Cypress o Playwright) — flujos críticos
- [ ] Ejecutar pruebas E2E: registro → login → jugar → ver ranking
- [ ] Beta testing interno: sesiones de juego con el equipo
- [ ] Recolectar y priorizar bugs del beta testing
- [ ] Documentar todos los endpoints en Swagger (estado final)
- [ ] Redactar README del repositorio (setup, comandos, arquitectura)

---

## 🗓️ FASE 4 — Enero 2027: Pulido, QA Final y Lanzamiento

> **Objetivo**: Corregir bugs, optimizar rendimiento, finalizar documentación y lanzar el producto.

---

### 🎨 GRÁFICA — Fase 4

#### T4.G.1 · Pulido Visual Final
- [ ] Revisión general de consistencia visual en toda la plataforma
- [ ] Ajustar assets del juego según feedback del beta testing
- [ ] Optimizar todos los sprites/imágenes para web (WebP, compresión)
- [ ] Crear assets finales para redes sociales / lanzamiento (banners, thumbnails)
- [ ] Revisión de accesibilidad visual (contraste, tamaños de texto)

#### T4.G.2 · Documentación de Diseño
- [ ] Exportar Design System completo y documentado
- [ ] Crear guía de uso de componentes visuales para el equipo
- [ ] Archivar todos los assets fuente (Figma, PSD, etc.) de forma organizada

---

### 💻 DESARROLLO WEB — Fase 4

#### T4.D.1 · Optimización y Rendimiento
- [ ] Auditoría de rendimiento con Lighthouse (web)
- [ ] Optimizar carga de assets del juego (lazy loading, asset bundling)
- [ ] Revisión de queries lentas en base de datos (índices, N+1 queries)
- [ ] Implementar SSR / SSG en Next.js donde sea apropiado
- [ ] Revisar y optimizar bundle size del frontend

#### T4.D.2 · Corrección de Bugs
- [ ] Resolver todos los bugs críticos y de alta prioridad del backlog
- [ ] Resolver bugs de compatibilidad entre navegadores (Chrome, Firefox, Safari)
- [ ] Corregir issues de responsividad detectados en QA

#### T4.D.3 · DevOps — Producción
- [ ] Configurar entorno de producción (cloud provider definido)
- [ ] Configurar dominio, SSL y CDN
- [ ] Setup de backups automáticos de base de datos
- [ ] Deploy a producción con rollback plan
- [ ] Monitoreo de errores en producción (Sentry o similar)

#### T4.D.4 · Funcionalidades de Cierre
- [ ] Implementar política de privacidad y términos de servicio
- [ ] Pantalla de mantenimiento configurable
- [ ] Sistema básico de reportes para admin

---

### 🧪 QA FINAL / 📄 DOCS — Fase 4

- [ ] Ejecución completa de suite de pruebas E2E
- [ ] Pruebas de carga / stress testing (k6 o Artillery)
- [ ] UAT (User Acceptance Testing) con usuarios externos
- [ ] Crear documento de post-mortem y lecciones aprendidas
- [ ] Finalizar documentación técnica del proyecto
- [ ] Redactar guía de operación para mantener el sistema en producción

---

## 📊 Resumen por Fase

| Fase | Mes | 🎨 Gráfica | 💻 Desarrollo Web | 🧪 QA / DevOps |
|------|-----|-----------|-------------------|----------------|
| **Fase 1** | Octubre | Branding, Wireframes, Concept Art | Setup, Auth, Artistas API, CI/CD base | Docs iniciales, Test Auth |
| **Fase 2** | Noviembre | UI Alta Fidelidad, Sprites, HUD | Motor del juego, Mecánicas core, Frontend base | Tests unitarios, Swagger |
| **Fase 3** | Diciembre | Pantallas avanzadas, Assets juego, Motion | Integración juego↔plataforma, Leaderboard, Staging | E2E Tests, Beta testing |
| **Fase 4** | Enero | Pulido final, Optimización, Assets lanzamiento | Performance, Bug fixing, Deploy producción | QA final, UAT, Producción |

---

> 💡 **Nota**: Este plan asume sprints de 2 semanas con revisión bi-semanal del equipo.  
> Se recomienda usar **GitHub Projects** o **Notion** para trackear el progreso diario.
