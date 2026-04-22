# Product Brief — App de Gastos del Hogar

## Visión del producto

PWA para que dos usuarios (pareja) registren y visualicen sus gastos del hogar. Foco en simplicidad de carga desde el celular y visibilidad clara del gasto mensual de cada uno. Contexto Argentina: sin gastos fijos automáticos, montos variables mes a mes.

---

## Usuarios

- 2 usuarios fijos, creados manualmente en la base de datos
- Cada usuario tiene dashboard personal + acceso al dashboard compartido
- Sin registro público

---

## Features — MVP

### 1. Autenticación

- Login con usuario y contraseña
- Sesión persistente (JWT en cookie httpOnly)
- Sin registro público

---

### 2. Carga de gastos

Vista dedicada (página nueva, no modal).

**Campos del formulario:**

| Campo | Tipo | Notas |
|---|---|---|
| Monto | Número | En pesos ARS |
| Categoría | Selector | Predefinidas + custom del usuario |
| Descripción | Texto libre | Opcional |
| Fecha | Date picker | Default: hoy |
| Tipo | Toggle | Compartido (default) / Personal |

---

### 3. Categorías

**Predefinidas (disponibles para ambos):**
- Expensas / Alquiler
- Servicios (luz, gas, agua)
- Internet / Telefonía
- Supermercado
- Streaming
- Transporte
- Salud
- Educación
- Restaurantes / Salidas
- Ropa
- Otros

**Personalizadas:**
- Cada usuario puede agregar categorías propias
- Disponibles solo para el usuario que las creó
- Se crean desde la pantalla de carga o desde configuración

---

### 4. Dashboard compartido

Vista accesible para ambos usuarios.

- Selector de mes/año (default: mes actual)
- **Totales del mes:**
  - Gasto total (ambos)
  - Gasto de cada usuario por separado
- **Listado de gastos:**
  - Todos los gastos del mes de ambos usuarios
  - Columna: usuario, monto, categoría, descripción, fecha, tipo (compartido/personal)
  - Orden: más reciente primero
- **Filtros:**
  - Por usuario
  - Por categoría
  - Por tipo (compartido / personal)
  - Búsqueda por texto (descripción)

---

### 5. Dashboard personal

Vista privada, solo ve el usuario logueado.

- Selector de mes/año
- **Totales del mes:**
  - Gasto total propio
  - Breakdown por categoría (lista con montos y porcentaje)
- **Widget de alertas mensuales** (ver sección 6)
- **Listado de gastos propios** con los mismos filtros que el dashboard compartido

---

### 6. Alertas mensuales

Recordatorio de gastos que ocurren todos los meses pero con montos variables.

**Configuración (por usuario):**
- Nombre del ítem (ej: "Expensas", "Psicóloga", "Facultad")
- Categoría asociada (opcional, para contexto)
- Activa / Inactiva

**Comportamiento:**
- Al inicio de cada mes, todas las alertas activas aparecen como **pendientes** en el dashboard personal
- El usuario las marca manualmente como **pagadas** una vez que carga el gasto correspondiente
- El estado (pendiente/pagada) se resetea automáticamente al cambiar de mes
- Las alertas pagadas de meses anteriores quedan como historial

---

## Flujos principales

### Cargar un gasto
1. Usuario abre la app desde el celular (PWA instalada)
2. Tap en botón "+" o "Nuevo gasto"
3. Completa el formulario (monto, categoría, descripción, fecha, tipo)
4. Confirma → vuelve al dashboard

### Marcar alerta como pagada
1. Usuario entra a su dashboard personal
2. Ve widget con alertas pendientes del mes
3. Tap en "Marcar como pagada" en el ítem correspondiente
4. El ítem pasa a estado pagado con timestamp

### Ver gastos del mes
1. Desde cualquier dashboard
2. Selector de mes/año si se quiere ver un mes anterior
3. Filtrar/buscar según necesidad

---

## Out of scope — v1

- Split automático de gastos
- Gastos recurrentes automáticos
- Notificaciones push
- Export CSV / PDF
- Login con Google
- Comparación entre meses (gráficos)
- Más de 2 usuarios
- Multi-moneda / conversión USD-ARS
