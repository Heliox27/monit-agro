# Monit-Agro (Prototype)

App móvil (Expo/React Native) para monitoreo de parcelas: humedad del suelo, temperatura del suelo, pH, luz, humedad del aire y temperatura del aire.
Incluye UI base con tabs, branding, un “hero” en Inicio con KPIs, pantalla de Históricos y una API mock con json-server.

⚠️ Nota: Este repo es un prototipo educativo. La API es simulada; no hay backend real.

────────────────────────────────────────────────────────────────────────

PANTALLAS INCLUIDAS
- Inicio (Dashboard): Hero con nombre/ID de la parcela y 3 KPIs (Humedad suelo, Temp. suelo, Humedad aire) + botón “Cambiar parcela” (mock).
- Históricos: Lista de lecturas con chips para cambiar la métrica destacada (suelo/aire; pH; luz).
- Registrar labor (stub) y Registrar cosecha (stub).
- Planes: Tarjetas de planes (Mensual/Anual), selector de facturación y CTA.

────────────────────────────────────────────────────────────────────────

STACK
- Expo (React Native)
- expo-router
- @tanstack/react-query
- json-server (mock API)
- GitHub (flujo main/dev, PRs con plantillas, CODEOWNERS)

────────────────────────────────────────────────────────────────────────

ESTRUCTURA RÁPIDA
app/
  (tabs)/
    dashboard.jsx
    historicos.jsx
    labor.jsx
    cosecha.jsx
    planes.jsx
  (tabs)/_layout.jsx     ← Tabs con íconos, colores y fuentes
  _layout.jsx            ← Root (QueryClientProvider + SelectionProvider)
assets/                  ← Logos, íconos
src/
  api/services.js        ← llamadas a la API mock
  state/selection.js     ← contexto: parcela seleccionada
  theme.js               ← paleta de colores y helpers de gradiente
db.json                  ← datos del mock (farms, reports, tasks, harvests)

────────────────────────────────────────────────────────────────────────

API MOCK (json-server)
Servidor REST en: http://<TU-IP-LOCAL>:4000

Endpoints:
- GET /farms
- GET /reports
  - GET /reports?farmId=farm-a   (filtrado por parcela)
- GET /tasks  ·  POST /tasks
- GET /harvests  ·  POST /harvests

Ejemplos:
# Todas las parcelas
curl http://192.168.0.6:4000/farms

# Reportes de una parcela
curl "http://192.168.0.6:4000/reports?farmId=farm-a"

# Crear tarea (labor)
curl -X POST http://192.168.0.6:4000/tasks ^
  -H "Content-Type: application/json" ^
  -d "{""farmId"":""farm-a"",""type"":""siembra"",""cost"":1000,""notes"":""Temporada 1"",""ts"":""2025-09-20T05:06:03.909Z""}"

Esquema de db.json (extracto):
{
  "farms": [
    { "id": "farm-a", "name": "Finca A" },
    { "id": "farm-b", "name": "Finca B" }
  ],
  "reports": [
    {
      "id": 1,
      "farmId": "farm-a",
      "ts": "2025-09-01T08:00:00Z",
      "soil_moisture": 31.2,
      "soil_temp": 26.1,
      "soil_ph": 6.4,
      "light": 13500,
      "air_humidity": 62,
      "air_temp": 28.2,
      "pump_status": false,
      "sprinkler_status": false
    }
  ],
  "tasks": [],
  "harvests": []
}

────────────────────────────────────────────────────────────────────────

CONFIGURACIÓN LOCAL (paso a paso)

1) Instalar dependencias
   npm install

2) Ajustar la URL base de la API
   Edita src/api/services.js y coloca tu IP local (la misma red del teléfono/emulador):
   export const BASE_URL = 'http://192.168.0.6:4000';

   Para ver tu IP:
   - Windows:  ipconfig  → Dirección IPv4
   - macOS/Linux:  ifconfig / ip addr

3) Iniciar la API mock
   npx json-server --watch db.json --port 4000 --host 0.0.0.0

4) Iniciar la app (Expo)
   npx expo start
   Abre en Expo Go (QR) o en un emulador.

Tips si no carga en el móvil:
- Verifica que el teléfono y la PC están en la misma red
- Revisa firewall/antivirus para puerto 4000

────────────────────────────────────────────────────────────────────────

FLUJO DE RAMAS
- main → estable / presentable
- dev → integración de desarrollo
- features/fixes:  feature/<nombre>,  fix/<nombre>
  PR de feature → dev. Para releases: PR de dev → main (Squash & Merge).

CONVENCIONES DE COMMIT
- feat: …       nueva funcionalidad
- fix: …        corrección
- docs: …       documentación
- chore: …      tareas (build, deps, plantillas)
- refactor: …   cambios internos sin nuevas features
- style: …      formateo/estilo

CHECKLIST DE PR
- [ ] Compila y corre en Expo (físico o emulador)
- [ ] Mock API probada (si aplica)
- [ ] Sin secretos/keys en el repo
- [ ] Descripción clara del cambio
- [ ] Screenshots si hay cambios de UI

────────────────────────────────────────────────────────────────────────

ROADMAP (siguiente iteración)
- Validaciones de formularios (labor/cosecha)
- CRUD completo (tasks/harvests con editar/borrar)
- Modelado final de base de datos
- Gráficas (sparklines y vistas detalladas por métrica)
- Selector real de “Cambiar parcela”
- Modo offline + caché (React Query)
- Tema oscuro (opcional)

CONTRIBUIR
Revisa CONTRIBUTING.md. Los PRs usan plantilla y pasan por revisión (CODEOWNERS).

TROUBLESHOOTING
- La barra de Android tapa el tab bar
  Ajusta tabBarStyle/safe-area. En este proyecto ya hay padding; si persiste, reinicia Metro y limpia caché.
- El mock no responde en el teléfono
  Usa http://<TU-IP-LOCAL>:4000 (no localhost) y revisa firewall.

LICENCIA
MIT (o la que el equipo defina). © Monit-Agro — prototipo educativo.
