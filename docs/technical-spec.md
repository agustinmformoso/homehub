# Technical Spec — App de Gastos del Hogar

## Stack

| Capa | Tecnología | Notas |
|---|---|---|
| Frontend | React 18 + TypeScript + Vite | SPA |
| Estilos | Tailwind CSS | |
| PWA | vite-plugin-pwa + Workbox | Instalable en iPhone |
| Backend | Node.js + Express + TypeScript | API REST |
| ODM | Mongoose | |
| Base de datos | MongoDB Atlas (free tier M0) | Cloud, sin setup local |
| Auth | JWT (httpOnly cookie) + bcrypt | |
| Deploy v0 | Local PC (siempre ON) | Acceso desde red local |
| Deploy v1 | Vercel (front) + Railway (back) | |

---

## Arquitectura

```
[iPhone — PWA instalada en homescreen]
          ↓  HTTP (local) / HTTPS (prod)
[React SPA — Vite]  :5173 (dev) / :4173 (preview)
          ↓  REST API calls
[Express API — Node.js]  :3001
          ↓  Mongoose
[MongoDB Atlas — M0 free tier]
```

**En red local:** el celular y la PC deben estar en el mismo WiFi. El frontend y backend corren en la PC, accesibles vía `http://<IP-local-PC>:5173` y `:3001`.

---

## Modelo de datos

### User
```ts
{
  _id: ObjectId,
  username: string,          // único, lowercase
  password_hash: string,
  display_name: string,      // nombre visible en la UI
  created_at: Date
}
```

### Category
```ts
{
  _id: ObjectId,
  name: string,
  type: "predefined" | "custom",
  created_by: ObjectId | null,  // null = predefinida (seed)
  created_at: Date
}
```

### Expense
```ts
{
  _id: ObjectId,
  user_id: ObjectId,
  amount: number,              // pesos ARS, sin centavos o con 2 decimales
  category_id: ObjectId,
  description: string,
  date: Date,                  // fecha del gasto (no de creación)
  type: "compartido" | "personal",  // default: compartido
  created_at: Date
}
```

### MonthlyAlert
```ts
{
  _id: ObjectId,
  user_id: ObjectId,
  name: string,                // ej: "Expensas", "Psicóloga"
  category_id: ObjectId | null,
  is_active: boolean,
  created_at: Date
}
```

### AlertStatus
```ts
{
  _id: ObjectId,
  alert_id: ObjectId,
  user_id: ObjectId,
  month: number,               // 1-12
  year: number,
  paid_at: Date | null,        // null = pendiente
  created_at: Date
}
```
> `AlertStatus` se crea automáticamente al inicio de cada mes para las alertas activas, o on-demand al cargar el dashboard si no existe aún para el mes actual.

---

## API Endpoints

### Auth
```
POST   /api/auth/login          body: { username, password }
POST   /api/auth/logout
GET    /api/auth/me             → usuario actual
```

### Expenses
```
GET    /api/expenses            query: month, year, user_id, category_id, type, search
POST   /api/expenses            body: { amount, category_id, description, date, type }
PUT    /api/expenses/:id
DELETE /api/expenses/:id
```

### Categories
```
GET    /api/categories          → predefinidas + custom del usuario logueado
POST   /api/categories          body: { name }  → crea custom para el usuario
DELETE /api/categories/:id      → solo custom, solo el owner
```

### Dashboard
```
GET    /api/dashboard/shared?month=&year=
       → { totals: { combined, byUser: [{user, total}] }, expenses: [...] }

GET    /api/dashboard/personal?month=&year=
       → { total, byCategory: [{category, total, percentage}], expenses: [...] }
```

### Alerts
```
GET    /api/alerts              → configuración de alertas del usuario
POST   /api/alerts              body: { name, category_id? }
PUT    /api/alerts/:id          body: { name?, category_id?, is_active? }
DELETE /api/alerts/:id

GET    /api/alerts/status?month=&year=   → estado del mes actual
POST   /api/alerts/status/:alert_id/pay  → marcar como pagada
POST   /api/alerts/status/:alert_id/unpay → desmarcar
```

---

## Auth flow

1. `POST /api/auth/login` → verifica usuario + bcrypt → emite JWT en cookie `httpOnly; SameSite=Strict`
2. Cada request protegido pasa por middleware `verifyToken` que lee la cookie
3. JWT expira en 7 días
4. Logout: borra la cookie del lado servidor
5. Sin refresh tokens en v1

---

## PWA — configuración

**vite-plugin-pwa:**
```ts
// vite.config.ts
VitePWA({
  registerType: 'autoUpdate',
  manifest: {
    name: 'Gastos del Hogar',
    short_name: 'Gastos',
    theme_color: '#ffffff',
    display: 'standalone',
    start_url: '/',
    icons: [ /* 192x192, 512x512 */ ]
  },
  workbox: {
    globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
    runtimeCaching: [] // sin cache de API, requiere conexión
  }
})
```

**Instalación en iPhone:**
Safari → botón compartir → "Añadir a pantalla de inicio"

---

## Estructura de carpetas

```
casa-gastos/
├── client/                  # React app
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   │   ├── Login.tsx
│   │   │   ├── DashboardShared.tsx
│   │   │   ├── DashboardPersonal.tsx
│   │   │   ├── NewExpense.tsx
│   │   │   └── Settings.tsx
│   │   ├── hooks/
│   │   ├── lib/             # API client, utils
│   │   └── types/
│   └── vite.config.ts
│
├── server/                  # Express API
│   ├── src/
│   │   ├── routes/
│   │   ├── models/          # Mongoose schemas
│   │   ├── middleware/
│   │   ├── scripts/
│   │   │   └── seed.ts      # crea categorías predefinidas + usuarios
│   │   └── index.ts
│   └── tsconfig.json
│
└── docs/
    ├── product-brief.md
    └── technical-spec.md
```

---

## Deployment v0 — Local

1. Clonar repo en la PC
2. Crear cuenta en MongoDB Atlas, crear cluster M0, obtener URI de conexión
3. `cp .env.example .env` → completar `MONGO_URI`, `JWT_SECRET`
4. `cd server && npm run dev`  (ts-node-dev, puerto 3001)
5. `cd client && npm run dev -- --host`  (exponer en red local, puerto 5173)
6. Desde el celular: `http://<IP-PC>:5173`
7. Correr seed: `npm run seed` → crea categorías predefinidas y usuarios iniciales

---

## Deployment v1 — Vercel + Railway

| Servicio | Qué hostea | Plan |
|---|---|---|
| Vercel | React SPA (client/) | Free |
| Railway | Express API (server/) | Free tier ($5 crédito/mes) |
| MongoDB Atlas | DB | Free M0 |

**Pasos de migración:**
1. Subir repo a GitHub
2. Conectar `client/` a Vercel, configurar `VITE_API_URL=https://api.railway.app`
3. Conectar `server/` a Railway, configurar variables de entorno
4. En Atlas: agregar IPs de Railway al whitelist (o `0.0.0.0/0` para simplicidad)
5. Ajustar CORS en Express para aceptar dominio de Vercel

---

## MongoDB Atlas — nota sobre backup

El tier M0 (free) no incluye snapshots programables. Al ser cloud-hosted, la redundancia es interna (replica set de 3 nodos). Para una app de 2 usuarios, esto es más que suficiente. Si en el futuro se necesita backup formal con punto de restauración, el upgrade a M2/M5 lo incluye.

Para un backup manual ocasional: `mongoexport` o desde el panel de Atlas → Collections → Export.

---

## Variables de entorno

```env
# server/.env
MONGO_URI=mongodb+srv://...
JWT_SECRET=una_clave_larga_y_random
PORT=3001
CLIENT_URL=http://localhost:5173   # en prod: URL de Vercel

# client/.env
VITE_API_URL=http://localhost:3001
```
