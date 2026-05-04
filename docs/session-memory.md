# 🧠 Skill Memory: homehub

## 1. Project Overview
PWA de seguimiento de gastos del hogar para dos usuarios (pareja). Permite registrar, visualizar y categorizar gastos mensuales con dashboards compartido y personal. Construida con React + Express + MongoDB Atlas. Deployada en Vercel (front) + Railway (back), y también accesible desde iPhone vía red local en dev.

---

## 2. Tech Stack

**Frontend**
- React 19 (JS, sin TypeScript) + Vite 8
- Sass (CSS Modules con `*.module.scss`)
- React Router v7
- Axios
- vite-plugin-pwa (PWA instalable en iPhone)

**Backend**
- Node.js + Express + TypeScript
- Mongoose (ODM)
- bcryptjs + jsonwebtoken (auth)
- cookie-parser, cors, dotenv

**Servicios**
- MongoDB Atlas (free tier M0) — DB `casa-gastos`
- Deploy: Vercel (front) + Railway (back)
- Repo: github.com/agustinmformoso/homehub

---

## 3. Architecture & Key Concepts

**Dev (local):**
```
[iPhone PWA]
    ↓ http://192.168.1.2:5173
[Vite dev server] — proxy /api → localhost:3001
    ↓
[Express API :3001]
    ↓ Mongoose
[MongoDB Atlas]
```

**Producción:**
```
[Browser / iPhone PWA]
    ↓ https://homehub-nine.vercel.app
[Vercel — React SPA]
    ↓ VITE_API_URL (axios baseURL)
[Railway — Express API]
    ↓ Mongoose
[MongoDB Atlas]
```

- **Auth**: JWT en cookie `httpOnly`. En producción: `SameSite=none; Secure=true` (necesario para cookies cross-origin Vercel→Railway). En dev: `SameSite=strict`.
- **Proxy Vite**: `baseURL: ''` en axios + proxy en `vite.config.js` hacia `:3001`. Solo activo en dev. En producción, `VITE_API_URL` apunta al dominio de Railway.
- **CORS Express**: en dev acepta cualquier origen (`origin: true`), en prod usa `CLIENT_URL` (env var en Railway).
- **Colores de usuario**: `agustin` → celeste (`#0ea5e9`), `clara` → rosa (`#ec4899`). Hardcodeado en `ExpenseCard.jsx` y dashboards.
- **Alertas mensuales**: tienen `scope: 'personal' | 'compartido'`. Personal → widget en DashboardPersonal. Compartido → widget en DashboardShared. Estado mensual en colección `AlertStatus` (se crea on-demand al cargar el dashboard).
- **isOwner check en ExpenseCard**: doble verificación por `username` Y por `_id` (fallback) para cubrir casos donde `user_id` no está populado.

---

## 4. Current State

**Construido y funcionando:**
- Login con usuario/contraseña + "ver contraseña"
- Layout con header, nav bottom fija, FAB central para nuevo gasto
- Dashboard compartido: totales por usuario + total combinado + lista de gastos + widget de alertas compartidas
- Dashboard personal: total del mes + breakdown por categoría (barra de progreso) + widget de alertas personales + lista de gastos
- Formulario nuevo gasto (modo crear y editar): monto, categoría (predefinida/custom), descripción, fecha, tipo compartido/personal
- ExpenseCard con menú `···` (solo para el dueño) → editar navega a `/nuevo-gasto` con state, eliminar pide confirmación
- Configuración: CRUD de alertas mensuales (con scope y categoría), CRUD de categorías custom, cerrar sesión
- Seed script: crea 11 categorías predefinidas + 2 usuarios
- Deploy live: Vercel + Railway

**Parcialmente implementado:**
- Editar/eliminar actualiza el estado local (sin refetch), pero los porcentajes del breakdown por categoría no se recalculan tras eliminar

**No implementado (out of scope v1):**
- Filtros en dashboard (por categoría, tipo, búsqueda por texto) — estaba en el product brief pero no se construyó
- Export CSV/PDF
- Google Auth
- Notificaciones push

---

## 5. Files & Components

```
homehub/
├── .gitignore
├── docs/
│   ├── product-brief.md         → decisiones de producto
│   ├── technical-spec.md        → arquitectura y modelo de datos
│   └── session-memory.md        → este archivo
│
├── client/
│   ├── vite.config.js           → PWA config + proxy /api → :3001 (dev)
│   ├── .npmrc                   → legacy-peer-deps=true (compatibilidad Vite 8 + vite-plugin-pwa)
│   ├── .env                     → VITE_API_URL (vacío en dev = usa proxy)
│   └── src/
│       ├── App.jsx              → router, rutas protegidas
│       ├── main.jsx             → entry point, importa global.scss
│       ├── hooks/
│       │   └── useAuth.jsx      → AuthContext, login/logout, GET /api/auth/me
│       ├── lib/
│       │   └── api.js           → axios instance, baseURL: VITE_API_URL || '', withCredentials: true
│       ├── components/
│       │   ├── Layout.jsx       → header + outlet + nav bottom con FAB
│       │   ├── Layout.module.scss
│       │   ├── ProtectedRoute.jsx
│       │   ├── ExpenseCard.jsx  → card con border-left de color, menú ···, editar/eliminar
│       │   └── ExpenseCard.module.scss
│       ├── pages/
│       │   ├── Login.jsx / .module.scss
│       │   ├── DashboardShared.jsx / .module.scss
│       │   ├── DashboardPersonal.jsx / .module.scss
│       │   ├── NewExpense.jsx / .module.scss  → modo crear y editar
│       │   └── Settings.jsx / .module.scss
│       └── styles/
│           ├── _variables.scss  → tokens de diseño
│           └── global.scss
│
└── server/
    ├── tsconfig.json
    ├── .env                     → MONGO_URI, JWT_SECRET, PORT, CLIENT_URL, NODE_ENV
    └── src/
        ├── index.ts             → Express app, CORS, rutas, conexión Mongo
        ├── middleware/
        │   └── auth.ts          → verifyToken, AuthRequest interface
        ├── models/
        │   ├── User.ts
        │   ├── Category.ts      → type: predefined | custom, created_by
        │   ├── Expense.ts       → user_id, amount, category_id, date, type: compartido|personal
        │   ├── MonthlyAlert.ts  → user_id, name, category_id, is_active, scope: personal|compartido
        │   └── AlertStatus.ts   → alert_id, user_id, month, year, paid_at (índice único)
        ├── routes/
        │   ├── auth.ts          → POST /login, POST /logout, GET /me
        │   ├── expenses.ts      → CRUD, populate user_id + category_id
        │   ├── categories.ts    → GET (predefined + propias), POST custom, DELETE custom
        │   ├── dashboard.ts     → GET /shared, GET /personal (ambos populan user_id)
        │   └── alerts.ts        → CRUD alertas + GET/POST /status (pay/unpay), filtro por scope
        └── scripts/
            └── seed.ts          → categorías predefinidas + usuarios (correr una vez por entorno)
```

---

## 6. Decisions Made

- **JS en frontend, TS en backend**: el usuario lo eligió explícitamente.
- **Sass + CSS Modules**: en lugar de Tailwind, preferencia del usuario.
- **MongoDB Atlas M0**: cloud-hosted evita backup local. Free tier suficiente para 2 usuarios.
- **Vite proxy en dev**: resuelve CORS en red local sin exponer el backend directamente al celular.
- **Sin split automático de gastos**: cada gasto pertenece al usuario que lo cargó. El dashboard compartido agrega ambos lados.
- **AlertStatus separado**: permite historial de pagos por mes/año sin modificar la alerta.
- **`SameSite: none` en prod**: necesario para cookies cross-origin (Vercel → Railway). En dev se usa `strict`.
- **Colores hardcodeados por username**: simple para 2 usuarios fijos, no escala a más usuarios.
- **Nombre app**: renombrada de `casa-gastos` a **HomeHub** (título, PWA manifest). La carpeta del repo es `homehub`.

---

## 7. Known Issues / TODOs

- **Filtros en dashboard**: el product brief los incluye (por categoría, tipo, búsqueda por texto) pero no están implementados.
- **Recálculo de porcentajes**: al eliminar un gasto desde el dashboard personal, el breakdown por categoría actualiza totales pero no recalcula los porcentajes.
- **PWA icons**: los íconos (`/icons/icon-192.png`, `/icons/icon-512.png`) no existen aún. La PWA funciona pero no tiene íconos custom.
- **Sin paginación**: la lista de gastos carga todos los del mes de una vez.
- **Categorías custom no visibles entre usuarios**: cada uno solo ve las propias.
- **Seed en producción**: hay que correr `npm run seed` en Railway al hacer deploy inicial para poblar las categorías predefinidas.

---

## 8. Next Steps (Prioritized)

1. **Correr seed en producción** (`npm run seed` en shell de Railway) — categorías predefinidas no existen aún en prod
2. **Agregar íconos PWA** (192x192 y 512x512 en `client/public/icons/`)
3. **Implementar filtros** en DashboardShared: por usuario, tipo, categoría, búsqueda por texto
4. **Recalcular porcentajes** tras eliminar gasto en dashboard personal
5. **Comparación entre meses** en dashboards

---

## 9. How to Resume Work

**Prerequisitos:**
- MongoDB Atlas URI disponible en `server/.env`
- Node.js instalado

**Levantar en local:**
```bash
# Terminal 1 — backend
cd server && npm run dev

# Terminal 2 — frontend
cd client && npm run dev
```

**Acceso:**
- PC: `http://localhost:5173`
- Celular (mismo WiFi): `http://192.168.1.2:5173`

**Producción:**
- Frontend: https://homehub-nine.vercel.app
- Backend: https://homehub-production-25d6.up.railway.app

**Usuarios:**
- `agustin` / `agus@123`
- `clara` / `claris@123`

**Si la DB está vacía** (nuevo entorno o primera vez en prod):
```bash
cd server && npm run seed
```

**Para continuar con filtros** (próximo feature): editar `DashboardShared.jsx` agregando estado de filtros y pasándolos como query params a `GET /api/dashboard/shared`. El backend en `dashboard.ts` ya recibe `user_id`, `category_id`, `type` y `search` en `GET /api/expenses` pero no en `/dashboard/shared` — habría que unificar o agregar los filtros a la ruta del dashboard.
