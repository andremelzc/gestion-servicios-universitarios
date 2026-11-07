// Prueba de carga y estrés (QA-15 / #176). Ver docs/03-calidad-y-operacion/estrategia-pruebas.md §8.
// Uso: k6 run -e DEMO_USER_PASSWORD=... [-e PERFIL=nominal|estres] [-e BASE_URL=http://localhost] tests/performance/carga.js
import http from 'k6/http';
import { check, fail, sleep } from 'k6';

const BASE_URL = (__ENV.BASE_URL || 'http://localhost').replace(/\/$/, '');
const API = `${BASE_URL}/api/v1`;
const PASSWORD = __ENV.DEMO_USER_PASSWORD;
const ESTUDIANTES = (__ENV.ESTUDIANTES ||
  'estudiante1.demo@universidad.edu,estudiante2.demo@universidad.edu,estudiante3.demo@universidad.edu').split(',');
const SUPERVISOR = __ENV.SUPERVISOR || 'supervisor.demo@universidad.edu';
// nginx limita /auth/login a 10 r/min por IP sin ráfaga: espaciar los logins de setup().
const PAUSA_LOGIN_S = Number(__ENV.PAUSA_LOGIN_S || 6.5);

const PERFILES = {
  // RNF-02: P95 ≤ 300 ms (login ≤ 800 ms) y error < 1 % con 50 VU durante 10 min.
  nominal: {
    stages: [
      { duration: '1m', target: 50 },
      { duration: '10m', target: 50 },
      { duration: '30s', target: 0 },
    ],
    thresholds: {
      http_req_failed: ['rate<0.01'],
      'http_req_duration{endpoint:solicitudes}': ['p(95)<300'],
      'http_req_duration{endpoint:catalogos}': ['p(95)<300'],
      'http_req_duration{endpoint:dashboard}': ['p(95)<300'],
      'http_req_duration{endpoint:login}': ['p(95)<800'], // BCrypt 12: excepción justificada
    },
  },
  // RNF-07: rampa de 10 min hasta 500 VU y bajada para observar la recuperación.
  // Los umbrales marcan el punto de quiebre (P95 > 1 s o error > 5 %); no abortan la prueba.
  estres: {
    stages: [
      { duration: '2m', target: 100 },
      { duration: '3m', target: 300 },
      { duration: '5m', target: 500 },
      { duration: '2m', target: 50 },
      { duration: '3m', target: 50 },
      { duration: '30s', target: 0 },
    ],
    thresholds: {
      http_req_failed: ['rate<0.05'],
      http_req_duration: ['p(95)<1000'],
    },
  },
};

const PERFIL = __ENV.PERFIL || 'nominal';
if (!PERFILES[PERFIL]) throw new Error(`PERFIL inválido: ${PERFIL} (nominal | estres)`);

export const options = {
  ...PERFILES[PERFIL],
  setupTimeout: '2m',
  summaryTrendStats: ['avg', 'p(50)', 'p(95)', 'p(99)', 'max'],
};

// Evidencia de ~1 MB que supera la validación por contenido (cabecera %PDF).
const PDF_1MB = `%PDF-1.4\n${'0'.repeat(1024 * 1024)}\n%%EOF\n`;

function auth(token, endpoint, name) {
  return { headers: { Authorization: `Bearer ${token}` }, tags: { endpoint, name } };
}

function login(correo) {
  const res = http.post(`${API}/auth/login`, JSON.stringify({ correo, password: PASSWORD }), {
    headers: { 'Content-Type': 'application/json' },
    tags: { endpoint: 'login', name: 'POST /auth/login' },
  });
  if (res.status !== 200) fail(`login de ${correo} falló: HTTP ${res.status}`);
  return res.json('token');
}

export function setup() {
  if (!PASSWORD) fail('Definir DEMO_USER_PASSWORD (contraseña de los usuarios del perfil demo)');
  const correos = [...ESTUDIANTES, SUPERVISOR];
  const tokens = correos.map((correo, i) => {
    if (i > 0) sleep(PAUSA_LOGIN_S);
    return login(correo);
  });
  const supervisor = tokens.pop();
  const categorias = http.get(`${API}/categorias`, auth(tokens[0], 'catalogos', 'GET /categorias')).json();
  const prioridades = http.get(`${API}/prioridades`, auth(tokens[0], 'catalogos', 'GET /prioridades')).json();
  if (!categorias.length || !prioridades.length) fail('Catálogos vacíos: ¿perfil demo activo?');
  return {
    estudiantes: tokens,
    supervisor,
    idCategorias: categorias.map((c) => c.id),
    idPrioridades: prioridades.map((p) => p.id),
  };
}

const azar = (lista) => lista[Math.floor(Math.random() * lista.length)];

function lectura(token) {
  const lista = http.get(
    `${API}/solicitudes/mis-solicitudes?page=0&size=10`,
    auth(token, 'solicitudes', 'GET /solicitudes/mis-solicitudes'),
  );
  check(lista, { 'mis-solicitudes 200': (r) => r.status === 200 });
  const items = lista.status === 200 ? lista.json('content') || [] : [];
  if (items.length) {
    const id = azar(items).id;
    const det = http.get(`${API}/solicitudes/${id}`, auth(token, 'solicitudes', 'GET /solicitudes/{id}'));
    check(det, { 'detalle 200': (r) => r.status === 200 });
  }
  const cat = http.get(`${API}/categorias`, auth(token, 'catalogos', 'GET /categorias'));
  check(cat, { 'categorias 200': (r) => r.status === 200 });
}

function creacion(token, data) {
  const solicitud = {
    titulo: `Carga k6 VU ${__VU} it ${__ITER}`,
    descripcion: 'Solicitud generada por la prueba de rendimiento k6.',
    ubicacionCampus: 'Campus principal',
    ubicacionAmbiente: 'Aula 101',
    idCategoria: azar(data.idCategorias),
    idPrioridad: azar(data.idPrioridades),
  };
  const body = { solicitud: http.file(JSON.stringify(solicitud), 'solicitud.json', 'application/json') };
  const conEvidencia = Math.random() < 0.5;
  if (conEvidencia) body.archivos = http.file(PDF_1MB, 'evidencia.pdf', 'application/pdf');
  const res = http.post(
    `${API}/solicitudes`,
    body,
    auth(token, 'solicitudes', conEvidencia ? 'POST /solicitudes (evidencia)' : 'POST /solicitudes'),
  );
  check(res, { 'creación 201': (r) => r.status === 201 });
}

function gestion(token) {
  const bandeja = http.get(`${API}/solicitudes?page=0&size=20`, auth(token, 'solicitudes', 'GET /solicitudes'));
  check(bandeja, { 'bandeja 200': (r) => r.status === 200 });
  const kpis = http.get(`${API}/dashboard/kpis`, auth(token, 'dashboard', 'GET /dashboard/kpis'));
  check(kpis, { 'kpis 200': (r) => r.status === 200 });
  const porEstado = http.get(`${API}/dashboard/por-estado`, auth(token, 'dashboard', 'GET /dashboard/por-estado'));
  check(porEstado, { 'por-estado 200': (r) => r.status === 200 });
}

function transicion(token) {
  const pendientes = http.get(
    `${API}/solicitudes?estado=REGISTRADA&page=0&size=20`,
    auth(token, 'solicitudes', 'GET /solicitudes?estado=REGISTRADA'),
  );
  const items = pendientes.status === 200 ? pendientes.json('content') || [] : [];
  if (!items.length) return;
  // 409 = otro VU ya evaluó la misma solicitud: carrera esperada, no es un fallo del sistema.
  const params = auth(token, 'solicitudes', 'PUT /solicitudes/{id}/evaluar');
  params.headers['Content-Type'] = 'application/json';
  params.responseCallback = http.expectedStatuses(200, 409);
  const res = http.put(`${API}/solicitudes/${azar(items).id}/evaluar`, '{}', params);
  check(res, { 'evaluar 200/409': (r) => r.status === 200 || r.status === 409 });
}

// Mezcla de §8.1: 60 % lectura · 25 % creación (mitad con evidencia) · 10 % bandeja/dashboard · 5 % transiciones.
export default function (data) {
  const estudiante = data.estudiantes[__VU % data.estudiantes.length];
  const r = Math.random();
  if (r < 0.6) lectura(estudiante);
  else if (r < 0.85) creacion(estudiante, data);
  else if (r < 0.95) gestion(data.supervisor);
  else transicion(data.supervisor);
  sleep(1 + Math.random() * 2);
}
