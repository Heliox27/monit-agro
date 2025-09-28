## Contenido para `docs/entregables/05-integracion-backend.md`

````markdown
# Entregable 05 — Integración con APIs del Backend (MVP)

**Proyecto:** Monit-Agro  
**Front:** Expo/React Native + React Query  
**Mock API:** json-server con rewrite a `/api/v1`  
**Fecha:** 28-Sep-2025  
**Rama:** `dev`  
**Responsable:** Jairo Flores

---

## 1. Resumen

Se definió el **contrato REST** del backend (prefijo `/api/v1`) y se integró el front para que funcione tanto con el **mock** (`json-server`) como con un **backend real** (ej.: NestJS/Fastify).  
Claves:
- `services.js` centraliza **BASE_URL**, **prefijo**, **timeout**, **auth opcional** (Bearer).  
- En **mock** se usa `routes.json` para **reenrutar** `/api/v1/* → /*`.  
- El front **no cambia** al migrar: solo se ajusta la base y se habilita el token.

---

## 2. Objetivo

Garantizar que la app:
1) Consuma endpoints con prefijo `/api/v1`.  
2) Soporte **auth** con `Authorization: Bearer <token>` cuando exista backend real.  
3) Evite “cuelgues” con **timeouts** y reporte errores legibles.  
4) Pueda **alternar** entre mock y backend real sin tocar pantallas.

---

## 3. Arquitectura y estrategia

- **Capa de API (front):** `src/api/services.js`
  - Helpers `http.get/post/put/del` con timeout (10s).
  - Headers unificados y token opcional.
  - Prefijo `/api/v1` aplicado a todas las rutas.
- **Mock (dev LAN):** `json-server` + rewrite:
  - `mock/routes.json` mapea `/api/v1/*` → `/*`.
  - Permite que el front ya “piense” en `/api/v1`.

---

## 4. Contrato del API (MVP)

**Prefijo:** `/api/v1`

### 4.1 Autenticación (opcional para mock)
- `POST /auth/login` → `{ accessToken, user }`
- `GET /auth/me` (Bearer) → `{ id, name, role }`

### 4.2 Parcelas (farms)
- `GET /farms` → `[{ id, name }]`
- `GET /farms/:id` → `{ id, name }`

### 4.3 Reportes (telemetría)
- `GET /reports?farmId=farm-a&limit=100&offset=0&from=ISO&to=ISO`  
  Respuesta: `{ items: [...], total: N }` (en mock se devuelve `[]`)
- `GET /reports/latest?farmId=farm-a` → `{ ...último registro... }`

### 4.4 Labores (tasks)
- `GET /tasks?farmId=farm-a&_sort=ts&_order=desc`
- `POST /tasks` → crea
- `PUT /tasks/:id` → actualiza
- `DELETE /tasks/:id` → elimina

### 4.5 Cosechas (harvests) (mismo patrón CRUD)
- `GET /harvests?farmId=farm-a`
- `POST /harvests`
- `PUT /harvests/:id`
- `DELETE /harvests/:id`

**Formato de error sugerido (backend real):**
```json
{ "error": { "code": "VALIDATION_ERROR", "message": "Campo cost inválido", "details": {"cost": ">= 0"} } }
````

---

## 5. Implementación en el front (`services.js`)

* **BASE_ORIGIN**: web → `http://localhost:4000`; dispositivo → `http://<IP_LAN>:4000`
* **API_PREFIX**: `/api/v1`
* **Auth opcional**: `setAccessToken(token)` agrega `Authorization: Bearer <token)`

> Archivo: `src/api/services.js` (resumen)

```js
import { Platform } from "react-native";

const LAN = "http://192.168.0.8:4000"; // ajustar a tu IP
const WEB = "http://localhost:4000";
const BASE_ORIGIN = Platform.select({ web: WEB, default: LAN });
const API_PREFIX = "/api/v1";

let accessToken = null;
export function setAccessToken(token) { accessToken = token; }

const TIMEOUT_MS = 10000;
async function request(path, { method = "GET", body } = {}) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), TIMEOUT_MS);

  const headers = { Accept: "application/json" };
  if (body) headers["Content-Type"] = "application/json";
  if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;

  const url = `${BASE_ORIGIN}${API_PREFIX}${path}`;
  try {
    const res = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined, signal: controller.signal });
    if (res.status === 204) return true;
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error?.message || data?.message || `${res.status}`);
    return data;
  } finally {
    clearTimeout(id);
  }
}

const http = {
  get: (p) => request(p),
  post: (p, b) => request(p, { method: "POST", body: b }),
  put: (p, b) => request(p, { method: "PUT", body: b }),
  del: (p) => request(p, { method: "DELETE" }),
};

// Ejemplos:
export const getFarms = () => http.get("/farms");
export const getReports = ({ queryKey }) => {
  const [, params] = queryKey || [];
  const q = new URLSearchParams();
  if (params?.farmId) q.append("farmId", params.farmId);
  const qs = q.toString() ? `?${q.toString()}` : "";
  return http.get(`/reports${qs}`);
};
export const createTask  = (data)          => http.post("/tasks", data);
export const updateTask  = ({ id, data })  => http.put(`/tasks/${id}`, data);
export const deleteTask  = (id)            => http.del(`/tasks/${id}`);
```

---

## 6. Mock con rewrite a `/api/v1`

**Archivo:** `mock/routes.json`

```json
{
  "/api/v1/*": "/$1"
}
```

**Levantar el mock:**

```bash
npx json-server --watch mock/db.json --routes mock/routes.json --port 4000 --host 0.0.0.0
```

* Prueba en navegador:

  * Web: `http://localhost:4000/api/v1/farms`
  * Teléfono (misma red): `http://<IP_LAN>:4000/api/v1/farms`

---

## 7. Plan de pruebas

### A) App (Expo)

1. Arrancar mock (arriba).
2. `npx expo start -c`
3. Flujos:

   * **Históricos**: listar por parcela.
   * **Labores**: crear, editar, eliminar (refresca lista).
   * (Luego) **Cosechas**: CRUD similar.

### B) cURL

```bash
# Farms
curl "http://192.168.0.8:4000/api/v1/farms"

# Reports por parcela
curl "http://192.168.0.8:4000/api/v1/reports?farmId=farm-a"

# Crear labor
curl -X POST "http://192.168.0.8:4000/api/v1/tasks" \
  -H "Content-Type: application/json" \
  -d '{"farmId":"farm-a","type":"riego","cost":120,"notes":"prueba","ts":"2025-09-22T10:00:00Z"}'
```

### C) Thunder Client / Postman

* Colección: **Monit-Agro API**
* Variables:

  * `base = http://192.168.0.8:4000/api/v1`
  * `token = <jwt>` (cuando uses backend real)
* Requests: GET farms, GET reports, CRUD tasks…

---

## 8. Migración a backend real (switch de mock → prod)

1. Cambiar origen en `services.js`:

```js
// const BASE_ORIGIN = Platform.select({ web: WEB, default: LAN });
const BASE_ORIGIN = "https://api.monit-agro.com";
```

2. Mantener `API_PREFIX = "/api/v1"`.
3. Después de login real:

```js
const res = await login(email, password);
setAccessToken(res.accessToken); // añade Authorization a todas las requests
```

4. Quitar el rewrite del mock (ya no se usa).

---

## 9. Evidencias sugeridas

* Capturas:

  * `/api/v1/farms` desde navegador y Postman
  * App consumiendo `/api/v1/tasks` (lista actualizada)
  * Error controlado (ej.: cortar mock y ver timeout/mensaje)

---

## 10. Checklist

* [x] `services.js` con prefijo `/api/v1`, timeout y auth opcional
* [x] Mock con `routes.json` para rewrite
* [x] Endpoints del MVP definidos
* [x] Pruebas con cURL/Postman/Thunder
* [x] Guía de migración a backend real

````

---

