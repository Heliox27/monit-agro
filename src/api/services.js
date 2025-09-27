// src/api/services.js

// 👇 Nuestro mock corre en este puerto
export const BASE_URL = 'http://192.168.0.8:4000';


/**
 * Pequeño helper para GET con manejo de errores.
 * Devuelve JSON o lanza Error con detalle si no es 2xx.
 */
async function httpGet(path) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { Accept: 'application/json' },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`GET ${path} -> ${res.status} ${text}`);
  }

  return res.json();
}

/**
 * Lista de fincas (usada en la pestaña Inicio).
 * GET /farms
 */
export function getFarms() {
  return httpGet('/farms');
}

/**
 * Históricos de reportes (telemetría).
 * Pensado para React Query: recibe { queryKey } = ['reports', { farmId }]
 * Si viene farmId, filtra como /reports?farmId=farm-a
 */
export async function getReports({ queryKey }) {
  const [, params] = queryKey || [];
  const farmId = params?.farmId;

  let path = '/reports';
  if (farmId) path += `?farmId=${encodeURIComponent(farmId)}`;

  return httpGet(path);
}

export async function createTask(task) {
  const res = await fetch(`${BASE_URL}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(task),
  });
  if (!res.ok) throw new Error('Network Error');
  return res.json();
}

// --- NUEVO: última lectura para una parcela ---
export async function getLatestReport(farmId) {
  let path = '/reports?_sort=ts&_order=desc&_limit=1';
  if (farmId) path = `/reports?farmId=${encodeURIComponent(farmId)}&_sort=ts&_order=desc&_limit=1`;

  const rows = await httpGet(path);
  return Array.isArray(rows) ? rows[0] : null;
}
