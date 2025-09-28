# Entregable 07 — Modelado de la Base de Datos

**Proyecto:** Monit-Agro  
**BD objetivo:** PostgreSQL 15+  
**Fecha:** 29-Sep-2025 
**Rama:** `dev`  
**Responsable:** Jairo Flores

---

## 1. Objetivo y alcance

Diseñar el modelo de datos que soporta el MVP y el crecimiento a SaaS multi-inquilino (multi-productor). El modelo cubre:

- **Tenancy (SaaS):** organizaciones, usuarios y membresías.
- **Agronomía:** parcelas (farms), dispositivos, sensores y telemetría (reports).
- **Operación:** labores (tasks) y cosechas (harvests).
- **Alertas:** reglas y eventos (alerts).
- **Comercial:** planes y suscripciones.

Se priorizan integridad referencial, consultas por **parcela + tiempo**, y extensibilidad para nuevos sensores.

---

## 2. Diagrama lógico (texto)

```

[organization] 1--* [farm] 1--* [device] 1--* [sensor]
|  \                             
|   _** [user_org] *--1 [user]   _** [report]
|
__* [subscription] *--1 [plan]

[farm] 1--* [task]
[farm] 1--* [harvest]

[farm] 1--* [alert_rule] 1--* [alert] --(ref)--> [report]

Leyenda: 1--* (uno a muchos), *--1 (muchos a uno)

````

---

## 3. Tablas y campos (resumen)

### 3.1 Tenancy (SaaS)
- **organization**(id PK, name, country, created_at)
- **user**(id PK, name, email **UNQ**, phone, created_at)
- **user_org**(org_id FK, user_id FK, role **ENUM**(`owner`,`admin`,`viewer`), UNIQUE(org_id,user_id))
- **plan**(id PK, name, monthly_price_cents, limits JSONB, created_at)
- **subscription**(id PK, org_id FK, plan_id FK, status **ENUM**(`active`,`past_due`,`canceled`), period_start, period_end, created_at)

### 3.2 Agronomía
- **farm**(id PK, org_id FK, name, location TEXT, area_ha NUMERIC(8,2), created_at)
- **device**(id PK, farm_id FK, name, device_type **ENUM**(`arduino`), status **ENUM**(`online`,`offline`), created_at)
- **sensor**(id PK, device_id FK, kind **ENUM**(`soil_moisture`,`soil_temp`,`soil_ph`,`light`,`air_humidity`,`air_temp`,`npk`), unit, created_at)
- **report**(id PK, farm_id FK, device_id FK, ts TIMESTAMPTZ,  
  soil_moisture NUMERIC(5,2), soil_temp NUMERIC(4,1), soil_ph NUMERIC(3,2),  
  light INT, air_humidity NUMERIC(5,2), air_temp NUMERIC(4,1),  
  pump_status BOOLEAN, sprinkler_status BOOLEAN, raw JSONB)

> Nota: **reports** guarda métricas “en columnas” para performance y un **raw JSONB** para extensiones (p.ej. NPK).

### 3.3 Operación
- **task**(id PK, farm_id FK, type **ENUM**(`siembra`,`riego`,`fertilizacion`,`maleza`), cost NUMERIC(12,2) CHECK ≥0, notes, ts TIMESTAMPTZ, created_by FK user)
- **harvest**(id PK, farm_id FK, crop TEXT, quantity_kg NUMERIC(12,2), price_per_kg NUMERIC(12,2), ts TIMESTAMPTZ, notes)

### 3.4 Alertas
- **alert_rule**(id PK, farm_id FK, metric **ENUM**(`soil_moisture`,`soil_temp`,`soil_ph`,`light`,`air_humidity`,`air_temp`), comparator **ENUM**(`lt`,`lte`,`gt`,`gte`), threshold NUMERIC(10,3), window_minutes INT, channels TEXT[] DEFAULT '{sms}', active BOOLEAN, created_at)
- **alert**(id PK, rule_id FK, report_id FK NULL, triggered_at TIMESTAMPTZ, metric_value NUMERIC(10,3), status **ENUM**(`open`,`sent`,`ack`), channel TEXT, payload JSONB)

---

## 4. Índices y rendimiento

- `report(farm_id, ts DESC)` — consultas por parcela y rango temporal.
- `report(ts)` — filtros por tiempo.
- `report USING GIN (raw)` — búsquedas flexibles en JSONB (opcional).
- `task(farm_id, ts DESC)`, `harvest(farm_id, ts DESC)`.
- `alert(rule_id, triggered_at DESC)`, `alert_rule(farm_id, active)`.

**Estrategia tiempo-serie (escala):**
- Particionar **report** por **RANGE (ts)** mensual o por **LIST (farm_id)** + sub-rango temporal.
- Retención: p.ej., 12–18 meses online y archivo frío en S3/Parquet.

---

## 5. Reglas de negocio (checks)

- `task.cost >= 0`
- `harvest.quantity_kg >= 0`, `harvest.price_per_kg >= 0`
- `alert_rule.threshold` dentro de rango lógico según `metric` (validable con trigger).
- `farm.org_id` debe existir (multi-tenant real).

---

## 6. DDL (PostgreSQL)

> Ejecutar en este orden. Tipos ENUM primero.

```sql
-- =========================
-- Tipos ENUM
-- =========================
CREATE TYPE role_t AS ENUM ('owner','admin','viewer');
CREATE TYPE plan_status_t AS ENUM ('active','past_due','canceled');
CREATE TYPE device_type_t AS ENUM ('arduino');
CREATE TYPE device_status_t AS ENUM ('online','offline');
CREATE TYPE sensor_kind_t AS ENUM ('soil_moisture','soil_temp','soil_ph','light','air_humidity','air_temp','npk');
CREATE TYPE task_type_t AS ENUM ('siembra','riego','fertilizacion','maleza');
CREATE TYPE comparator_t AS ENUM ('lt','lte','gt','gte');
CREATE TYPE alert_status_t AS ENUM ('open','sent','ack');

-- =========================
-- Tenancy
-- =========================
CREATE TABLE organization (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  country      TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE "user" (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  email        CITEXT UNIQUE NOT NULL,
  phone        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE user_org (
  org_id       UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  role         role_t NOT NULL DEFAULT 'viewer',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (org_id, user_id)
);

CREATE TABLE plan (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name               TEXT NOT NULL,
  monthly_price_cents INTEGER NOT NULL CHECK (monthly_price_cents >= 0),
  limits             JSONB,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE subscription (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  plan_id      UUID NOT NULL REFERENCES plan(id),
  status       plan_status_t NOT NULL DEFAULT 'active',
  period_start TIMESTAMPTZ NOT NULL,
  period_end   TIMESTAMPTZ NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =========================
-- Agronomía
-- =========================
CREATE TABLE farm (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id     UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  location   TEXT,
  area_ha    NUMERIC(8,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE device (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id      UUID NOT NULL REFERENCES farm(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  device_type  device_type_t NOT NULL,
  status       device_status_t NOT NULL DEFAULT 'offline',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE sensor (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id   UUID NOT NULL REFERENCES device(id) ON DELETE CASCADE,
  kind        sensor_kind_t NOT NULL,
  unit        TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE report (
  id               BIGSERIAL PRIMARY KEY,
  farm_id          UUID NOT NULL REFERENCES farm(id) ON DELETE CASCADE,
  device_id        UUID REFERENCES device(id) ON DELETE SET NULL,
  ts               TIMESTAMPTZ NOT NULL,

  soil_moisture    NUMERIC(5,2),
  soil_temp        NUMERIC(4,1),
  soil_ph          NUMERIC(3,2),
  light            INTEGER,
  air_humidity     NUMERIC(5,2),
  air_temp         NUMERIC(4,1),

  pump_status      BOOLEAN,
  sprinkler_status BOOLEAN,

  raw              JSONB,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_report_farm_ts ON report(farm_id, ts DESC);
CREATE INDEX idx_report_ts ON report(ts);
CREATE INDEX idx_report_raw_gin ON report USING GIN (raw);

-- =========================
-- Operación
-- =========================
CREATE TABLE task (
  id          BIGSERIAL PRIMARY KEY,
  farm_id     UUID NOT NULL REFERENCES farm(id) ON DELETE CASCADE,
  type        task_type_t NOT NULL,
  cost        NUMERIC(12,2) NOT NULL CHECK (cost >= 0),
  notes       TEXT,
  ts          TIMESTAMPTZ NOT NULL,
  created_by  UUID REFERENCES "user"(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_task_farm_ts ON task(farm_id, ts DESC);

CREATE TABLE harvest (
  id             BIGSERIAL PRIMARY KEY,
  farm_id        UUID NOT NULL REFERENCES farm(id) ON DELETE CASCADE,
  crop           TEXT NOT NULL,
  quantity_kg    NUMERIC(12,2) NOT NULL CHECK (quantity_kg >= 0),
  price_per_kg   NUMERIC(12,2) CHECK (price_per_kg >= 0),
  ts             TIMESTAMPTZ NOT NULL,
  notes          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_harvest_farm_ts ON harvest(farm_id, ts DESC);

-- =========================
-- Alertas
-- =========================
CREATE TABLE alert_rule (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id        UUID NOT NULL REFERENCES farm(id) ON DELETE CASCADE,
  metric         sensor_kind_t NOT NULL,
  comparator     comparator_t NOT NULL,
  threshold      NUMERIC(10,3) NOT NULL,
  window_minutes INTEGER NOT NULL DEFAULT 0,
  channels       TEXT[] NOT NULL DEFAULT ARRAY['sms'],
  active         BOOLEAN NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_alert_rule_farm_active ON alert_rule(farm_id, active);

CREATE TABLE alert (
  id            BIGSERIAL PRIMARY KEY,
  rule_id       UUID NOT NULL REFERENCES alert_rule(id) ON DELETE CASCADE,
  report_id     BIGINT REFERENCES report(id) ON DELETE SET NULL,
  triggered_at  TIMESTAMPTZ NOT NULL,
  metric_value  NUMERIC(10,3),
  status        alert_status_t NOT NULL DEFAULT 'open',
  channel       TEXT,
  payload       JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_alert_rule_time ON alert(rule_id, triggered_at DESC);
````

---

## 7. Semillas mínimas (opcional, dev)

```sql
INSERT INTO organization (id, name, country) VALUES
  ('00000000-0000-0000-0000-000000000001','Coop Frijol Norte','NI');

INSERT INTO "user" (id, name, email) VALUES
  ('00000000-0000-0000-0000-0000000000AA','Justine','justine@example.com');

INSERT INTO user_org (org_id, user_id, role) VALUES
  ('00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-0000000000AA','owner');

INSERT INTO farm (id, org_id, name, location, area_ha) VALUES
  ('00000000-0000-0000-0000-0000000000F1','00000000-0000-0000-0000-000000000001','Parcela A','Estelí',2.50);
```

---

## 8. Consultas de referencia

* Últimos 50 reportes de una parcela:

```sql
SELECT ts, soil_moisture, soil_temp, soil_ph, air_temp, air_humidity, light
FROM report
WHERE farm_id = '00000000-0000-0000-0000-0000000000F1'
ORDER BY ts DESC
LIMIT 50;
```

* Costo total de labores por mes y parcela:

```sql
SELECT date_trunc('month', ts) AS mes, SUM(cost) AS costo_total
FROM task
WHERE farm_id = '00000000-0000-0000-0000-0000000000F1'
GROUP BY 1
ORDER BY 1 DESC;
```

* Reglas activas de alerta por parcela:

```sql
SELECT metric, comparator, threshold, channels
FROM alert_rule
WHERE farm_id = '00000000-0000-0000-0000-0000000000F1' AND active = true;
```

---

## 9. Escalabilidad y mantenimiento

* **Particiones** en `report` por mes (o por `farm_id` + mes).
* **Retención**: políticas por plan (básico 6 meses, premium 18 meses).
* **Backups** diarios + restauración probada.
* **Migraciones** con herramienta (Prisma/Migrate, Flyway, Liquibase).

---

## 10. Decisiones clave

* **Modelo híbrido**: métricas frecuentes como columnas + `raw` JSONB para extensibilidad.
* **Tenancy por FK** (org → farm → device/report), suficiente para Fase 1; se puede endurecer con RLS (Row-Level Security) en fase auth.
* **ENUMs** para tipos controlados (validación a nivel BD).

````

---

