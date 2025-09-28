// src/api/services.js

export const BASE_URL = 'http://192.168.0.8:4000'; // <-- tu IP/LAN actual

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

// -------- FARMS --------
export function getFarms() {
  return httpGet('/farms');
}

// -------- REPORTS --------
export async function getReports({ queryKey }) {
  const [, params] = queryKey || [];
  const farmId = params?.farmId;
  let path = '/reports';
  if (farmId) path += `?farmId=${encodeURIComponent(farmId)}`;
  return httpGet(path);
}

export async function getLatestReport(farmId) {
  let path = '/reports?_sort=ts&_order=desc&_limit=1';
  if (farmId) path = `/reports?farmId=${encodeURIComponent(farmId)}&_sort=ts&_order=desc&_limit=1`;
  const rows = await httpGet(path);
  return Array.isArray(rows) ? rows[0] : null;
}

// -------- TASKS (Labores) --------
export async function createTask(task) {
  const res = await fetch(`${BASE_URL}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(task),
  });
  if (!res.ok) throw new Error('Network Error');
  return res.json();
}

// Lista de labores por parcela
export async function getTasks({ queryKey }) {
  const [, params] = queryKey || [];
  const farmId = params?.farmId;
  let path = '/tasks?_sort=ts&_order=desc';
  if (farmId) path = `/tasks?farmId=${encodeURIComponent(farmId)}&_sort=ts&_order=desc`;
  return httpGet(path);
}

// Actualizar labor
export async function updateTask({ id, data }) {
  const res = await fetch(`${BASE_URL}/tasks/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Network Error');
  return res.json();
}

// Eliminar labor
export async function deleteTask(id) {
  const res = await fetch(`${BASE_URL}/tasks/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Network Error');
  return true;
}
