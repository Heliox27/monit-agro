# Entregable 04 — Validación de datos y CRUD de Labores

**Proyecto:** Monit-Agro  
**Módulo:** Registrar Labor (pestaña “Registrar Labor”)  
**Fecha:** YYYY-MM-DD  
**Rama:** `dev`  
**Responsable:** Nombre Apellidos

---

## 1. Resumen

Se implementó la **validación de datos en el formulario “Registrar labor”** y el **CRUD completo** (crear, listar, actualizar y eliminar) sobre el recurso `tasks` (labores), persistiendo en el mock API (`json-server`).

- **Validación** con **Zod + React Hook Form**.
- **Datos persistentes** en `mock/db.json`.
- **Listar** labores por parcela (`farmId`), ordenadas por fecha.
- **Editar** y **eliminar** desde la lista.
- Manejo de **errores de red** y **estados de carga**.

---

## 2. Alcance

### Incluye
- Formulario con validaciones de:
  - `type`: uno de `siembra | riego | fertilizacion | maleza`
  - `cost`: numérico ≥ 0 (string → number)
  - `notes`: texto opcional, máx. 300 caracteres
- Crear/actualizar con timestamp `ts` (ISO).
- Listado de labores por `farmId` (descendente).
- Edición in-place (carga de la tarjeta en el form).
- Eliminación con confirmación.
- Integración con React Query (queries/mutations + caché).

### No incluye (pendiente)
- Filtros por fecha/usuario.
- Exportar CSV.
- Cálculo de costos acumulados.
- Backend real (ahora es mock con json-server).

---

## 3. Arquitectura breve

- **Front:** Expo + React Native.
- **Estado remoto:** @tanstack/react-query.
- **Form/validación:** react-hook-form + zod.
- **Mock API:** `json-server` en LAN.

Carpetas relevantes:
- app/app/(tabs)/labor.jsx ← UI + validación + React Query
- src/api/services.js ← Endpoints (GET/POST/PUT/DELETE)
- mock/db.json ← Persistencia mock


---

## 4. Endpoints (mock)

Base: `http://{IP_LAN}:4000`

- Listar labores (por parcela):
  - `GET /tasks?farmId={farmId}&_sort=ts&_order=desc`
- Crear labor:
  - `POST /tasks`
  - body: `{ farmId, type, cost, notes, ts }`
- Actualizar labor:
  - `PUT /tasks/{id}`
- Eliminar labor:
  - `DELETE /tasks/{id}`

### cURL de prueba
```bash
# Crear
curl -X POST http://{IP_LAN}:4000/tasks \
  -H "Content-Type: application/json" \
  -d '{"farmId":"farm-a","type":"riego","cost":120,"notes":"riego prueba","ts":"2025-09-21T12:00:00.000Z"}'

# Listar
curl "http://{IP_LAN}:4000/tasks?farmId=farm-a&_sort=ts&_order=desc"

# Actualizar
curl -X PUT http://{IP_LAN}:4000/tasks/1 \
  -H "Content-Type: application/json" \
  -d '{"farmId":"farm-a","type":"riego","cost":150,"notes":"ajuste costo","ts":"2025-09-21T12:10:00.000Z"}'

# Eliminar
curl -X DELETE http://{IP_LAN}:4000/tasks/1


5. Validaciones aplicadas (ZOD)
type: z.enum(["siembra", "riego", "fertilizacion", "maleza"]),
cost: z.string()
       .transform(v => (v === "" ? "0" : v))
       .refine(v => !Number.isNaN(Number(v)) && Number(v) >= 0, "Costo inválido")
       .transform(v => Number(v)),
notes: z.string().max(300).optional().default(""),

Mensajes de error visibles en UI:

- “Seleccione un tipo”
- “Costo inválido”
- “Máx. 300 caracteres”

6. Flujo de UI

Crear:
- Seleccionar tipo → escribir costo → notas (opcional) → Guardar.
- La lista se refresca automáticamente.
Editar:
- Botón Editar en la tarjeta → carga valores en el formulario → Actualizar o Cancelar.
Eliminar:
- Botón Eliminar → confirmación → refresh de la lista.
Estados:
- Loader (“Cargando…”) al listar.
- Mensajes de error en rojo cuando hay fallas de red.

