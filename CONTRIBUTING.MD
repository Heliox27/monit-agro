\# Contribución — Monit-Agro



\## Flujo de trabajo

\- Rama estable: \*\*main\*\*

\- Rama de desarrollo: \*\*dev\*\*

\- Features/fixes: `feature/<nombre>`, `fix/<nombre>` desde \*\*dev\*\*

\- Pull Request (PR): de \*\*dev\*\* a \*\*main\*\* (usar \*Squash \& Merge\*)



\## Nombres de ramas (ejemplos)

\- `feature/planes-ui`

\- `fix/historicos-null`

\- `chore/plantillas-github`



\## Mensajes de commit (Conventional Commits)

\- `feat: ...` nueva funcionalidad

\- `fix: ...` corrección

\- `chore: ...` tareas (build, deps, plantillas)

\- `docs: ...` documentación

\- `refactor: ...` refactor sin cambiar funcionalidad

\- `style: ...` formateo



\## Checklist para PRs

\- \[ ] Compila y corre en Expo (web/emulador)

\- \[ ] Probado con `json-server` si aplica

\- \[ ] Sin secretos ni archivos temporales

\- \[ ] Usar \*\*Squash \& Merge\*\* al integrar



\## Cómo correr local

```bash

\# Mock API

npx json-server --watch db.json --port 4000 --host 0.0.0.0



\# App

npm install

npx expo start



