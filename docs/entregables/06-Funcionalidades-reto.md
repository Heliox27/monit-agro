
# Entregable 06 — Funcionalidades del reto

**Proyecto:** Monit-Agro  
**Fecha:** 29-Sep-2025 
**Rama:** `dev`  
**Responsable:** Jairo Flores

---

## 1) Resumen
Se desarrollaron/definieron 3 funciones clave que atienden la problemática del productor nicaragüense:

1. **Monitoreo multi-sensor por parcela**: visualización de KPIs y lecturas históricas de humedad y temperatura (suelo/ambiente), pH y luz.
2. **Alertas por umbrales (operativas/offline-friendly)**: reglas simples por sensor; en producción avisos **vía SMS** cuando no hay datos o se superan límites.
3. **Control de costos por parcela (labores)**: CRUD de labores (siembra, riego, fertilización, malezas) con costo y notas, para estimar costos por ciclo.

> Estado: (1) y (3) **implementadas** sobre mock API (`json-server`); (2) **preparada** con contrato de API y UI de estados, a integrar con gateway de SMS en la fase backend.

---

## 2) Problema → Solución

- **Falta de datos en parcela** → Monitoreo multi-sensor con históricos y KPIs.
- **Riego/cuidado reactivo** → Alertas por umbrales para actuar a tiempo (SMS cuando no hay internet).
- **Costos difusos** → Registro de labores y gastos por parcela.

---

## 3) Historias de usuario y Criterios de aceptación

### 3.1 Monitoreo multi-sensor
**HU:** Como productor quiero ver el estado de mi parcela (humedad, temperatura, pH, luz) y un historial, para decidir riego y labores.  
**Criterios**
- Ver KPIs actuales (última lectura) y tarjetas con **todas** las variables.
- Cambiar **parcela** desde la pantalla de **Inicio**.
- En **Históricos**, seleccionar qué métrica resaltar y ver el resto compacta.
- Si no hay datos o falla la red, mostrar mensaje claro y opción de reintentar.

### 3.2 Alertas por umbrales (operativas/SMS)
**HU:** Como productor quiero recibir alertas si la humedad de suelo baja de X% o si el pH se sale de rango.  
**Criterios (MVP/contrato)**
- Definir reglas (variable, operador, umbral, parcela).
- Cuando una lectura rompe la regla → crear evento de alerta.
- **Canal SMS** preparado (contrato de API y payload); en MVP se muestra estado en UI y se simula el disparo.
- Log de últimas alertas.

### 3.3 Control de costos por parcela (labores)
**HU:** Como productor quiero registrar labores con costo para conocer el costo total del ciclo.  
**Criterios**
- Crear labor con **tipo**, **costo** ≥ 0 y **notas** (≤ 300 chars).
- **Listar/editar/eliminar** labores por parcela, ordenadas por fecha.
- Validaciones visibles (costo inválido, notas largas).
- Persistencia en mock (`db.json`).

---

## 4) Cobertura técnica (MVP)

- **Front:** Expo/React Native + @tanstack/react-query  
- **Validación:** react-hook-form + Zod (labores)  
- **Mock API:** `json-server` con rewrite a `/api/v1`  
- **Campos de telemetría (mock):**  
  `soil_moisture`, `soil_temp`, `soil_ph`, `light`, `air_humidity`, `air_temp`, `pump_status`, `sprinkler_status`

**Pantallas afectadas:**  
- **Inicio** (KPIs + cambiar parcela)  
- **Históricos** (chips de métrica y tarjetas con resumen)  
- **Registrar labor** (CRUD completo)

---

## 5) Endpoints (mock con prefijo `/api/v1`)

- **Parcelas**
  - `GET /api/v1/farms`
- **Reportes**
  - `GET /api/v1/reports?farmId=farm-a`
  - `GET /api/v1/reports/latest?farmId=farm-a`
- **Labores**
  - `GET /api/v1/tasks?farmId=farm-a&_sort=ts&_order=desc`
  - `POST /api/v1/tasks`
  - `PUT /api/v1/tasks/:id`
  - `DELETE /api/v1/tasks/:id`
- **Alertas (contrato futuro)**
  - `GET /api/v1/alerts?farmId=farm-a`
  - `POST /api/v1/alerts/test` (simulación)
  - `POST /api/v1/alerts/dispatch-sms` (producción: gateway SMS)

> El prefijo `/api/v1` se mapea a `json-server` con `mock/routes.json`.

---

## 6) Cómo correr y probar

**Mock API**
```bash
npx json-server --watch mock/db.json --routes mock/routes.json --port 4000 --host 0.0.0.0
````

**App**

```bash
npx expo start
```

**Pruebas manuales**

* **Monitoreo:** Inicio → cambiar parcela; Históricos → elegir métrica y revisar tarjetas.
* **Labores:** Crear/editar/eliminar. Ver cambios en `mock/db.json`.
* **Alertas (simulación):** cortar el mock o bajar valores en `db.json` y observar estados en UI. (Cuando esté el backend real, probar disparo de SMS.)

---

## 7) Evidencias (inserte capturas)

* Inicio con KPIs y selector de parcela.
* Históricos con chips de métrica.
* Registrar labor: validación y CRUD funcionando.
* (Opcional) Simulación de alerta/estado.

---

## 8) Roadmap (post-reto)

* Conectar gateway SMS (Twilio/MessageBird/local) y colas (BullMQ/Redis).
* Agregar pantalla de **Alertas** (lista y configuración de reglas).
* Agregar gráficos por métrica y filtros por rango de fechas.
* Resumen de **costos por ciclo** y exportación CSV/PDF.

