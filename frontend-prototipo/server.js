// Servidor de la maqueta: sirve las páginas estáticas y simula la API REST
// (/api/v1) con json-server + middlewares. Ver README.md.
import { readFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import jsonServer from 'json-server';
import {
  problema,
  login,
  registro,
  usuarioDeAutorizacion,
  parseMultipart,
  crearSolicitud,
  esMultipart,
} from './mock/handlers.js';
import { resolver } from './mock/routes.js';

const RAIZ = dirname(fileURLToPath(import.meta.url));
const PUERTO = Number(process.env.PORT) || 3000;
// Solo loopback: la maqueta incluye un endpoint de sesión de demostración.
const HOST = '127.0.0.1';
const API = '/api/v1';

// Base en memoria: reiniciar el servidor restaura los datos semilla.
const db = JSON.parse(readFileSync(join(RAIZ, 'mock/db.json'), 'utf8'));
// Las fechas semilla se desplazan para que "hace 2 h" sea cierto al arrancar.
const desfase = Date.now() - new Date('2026-10-03T17:04:05Z').getTime();
const mover = (iso) => new Date(new Date(iso).getTime() + desfase).toISOString();
for (const s of db.solicitudes) {
  s.fechaRegistro = mover(s.fechaRegistro);
  s.fechaLimiteSla = mover(s.fechaLimiteSla);
}
const ctx = {
  solicitudes: db.solicitudes,
  siguienteNumero: 151,
  ahora: new Date(),
  categorias: db.categorias,
  prioridades: db.prioridades,
  campus: db.campus,
};

const servidor = jsonServer.create();

// --- Archivos estáticos (lista blanca: nunca se expone db.json ni server.js) ---
const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml',
};
const PERMITIDO = /^\/(?:[\w-]+\.html|css\/[\w.-]+\.css|js\/(?:[\w-]+\/)*[\w-]+\.js|evidencias\/[\w.-]+)$/;

servidor.use(async (req, res, next) => {
  if (req.method !== 'GET' || req.path.startsWith(API)) return next();
  const ruta = req.path === '/' ? '/index.html' : req.path;
  if (!PERMITIDO.test(ruta) || normalize(ruta).includes('..')) return next();
  try {
    res.type(MIME[extname(ruta)] ?? 'application/octet-stream').send(await readFile(join(RAIZ, ruta)));
  } catch {
    next();
  }
});

// --- Controles de simulación (cabeceras X-Mock-*) ---
const ERRORES_FORZADOS = {
  400: ['validacion', 'Solicitud inválida', 'Hay campos inválidos.'],
  401: ['no-autenticado', 'No autenticado', 'Token inválido o expirado.'],
  403: ['acceso-denegado', 'Acceso denegado', 'No tienes permiso para realizar esta acción.'],
  404: ['no-encontrado', 'No encontrado', 'Recurso no encontrado.'],
  409: ['transicion-invalida', 'Transición de estado no permitida', 'La solicitud debe estar EN_ATENCION para ser resuelta (estado actual: REGISTRADA).'],
  429: ['demasiadas-peticiones', 'Demasiadas peticiones', 'Límite de peticiones excedido.'],
  500: ['error-interno', 'Error interno', 'Ocurrió un error inesperado.'],
};

servidor.use(API, async (req, res, next) => {
  const retardo = Math.min(Number(req.get('X-Mock-Delay')) || 0, 5000);
  if (retardo) await new Promise((r) => setTimeout(r, retardo));
  const forzado = ERRORES_FORZADOS[req.get('X-Mock-Status')];
  if (forzado) {
    const status = Number(req.get('X-Mock-Status'));
    const [tipo, titulo, detalle] = forzado;
    res.set('X-Trace-Id', 'mock');
    return res.status(status).type('application/problem+json').json(problema(status, tipo, titulo, detalle, req.originalUrl));
  }
  next();
});

const enviar = (res, { status, body, location }) => {
  if (location) res.set('Location', location);
  res.status(status);
  if (status >= 400) res.type('application/problem+json');
  res.json(body);
};

// --- Rutas públicas (el bodyParser se aplica solo donde se espera JSON) ---
servidor.post(`${API}/auth/login`, jsonServer.bodyParser, (req, res) => enviar(res, login(db.usuarios, req.body, req.originalUrl)));
servidor.post(`${API}/auth/registro`, jsonServer.bodyParser, (req, res) => enviar(res, registro(db.usuarios, req.body, req.originalUrl)));

// Solo maqueta: abre una sesión por alias de rol (alimenta `?demo=<alias>`).
servidor.get(`${API}/mock/sesion/:alias`, (req, res) => {
  const u = db.usuarios.find((x) => x.alias === req.params.alias);
  if (!u) return enviar(res, { status: 404, body: problema(404, 'no-encontrado', 'No encontrado', 'Alias de demostración desconocido.', req.originalUrl) });
  return enviar(res, login(db.usuarios, { correo: u.correo, password: u.password }, req.originalUrl));
});

// --- A partir de aquí se exige sesión (Bearer mock.<id>) ---
servidor.use(API, (req, res, next) => {
  req.usuario = usuarioDeAutorizacion(db.usuarios, req.get('Authorization'));
  if (req.usuario) return next();
  return enviar(res, { status: 401, body: problema(401, 'no-autenticado', 'No autenticado', 'Token inválido o expirado.', req.originalUrl) });
});

servidor.post(`${API}/solicitudes`, (req, res) => {
  if (!esMultipart(req.get('Content-Type'))) {
    req.resume(); // descarta el cuerpo sin esperar a que termine
    return enviar(res, { status: 415, body: problema(415, 'tipo-no-soportado', 'Tipo de contenido no soportado', 'POST /solicitudes requiere multipart/form-data.', req.originalUrl) });
  }
  const trozos = [];
  req.on('data', (t) => trozos.push(t));
  return req.on('end', () => {
    const partes = parseMultipart(Buffer.concat(trozos), req.get('Content-Type'));
    const parteJson = partes.find((p) => p.name === 'solicitud');
    let datos;
    try {
      datos = JSON.parse(parteJson?.data.toString() ?? '');
    } catch {
      return enviar(res, { status: 400, body: problema(400, 'json-invalido', 'Solicitud inválida', 'La parte "solicitud" no es un JSON válido.', req.originalUrl) });
    }
    const numArchivos = partes.filter((p) => p.name === 'archivos' && p.filename).length;
    ctx.ahora = new Date();
    const r = crearSolicitud(ctx, req.usuario, datos, numArchivos, req.originalUrl);
    if (r.status === 201) {
      const c = db.categorias.find((x) => x.id === datos.idCategoria);
      const p = db.prioridades.find((x) => x.id === datos.idPrioridad);
      db.solicitudes.push({
        id: r.body.id, codigo: r.body.codigo, titulo: datos.titulo.trim(),
        categoria: c.nombre, area: c.area, prioridad: p.nivel,
        estado: 'REGISTRADA', solicitante: `${req.usuario.nombre} ${req.usuario.apellido}`, tecnico: null,
        fechaRegistro: r.body.fechaRegistro, fechaLimiteSla: r.body.fechaLimiteSla, vencida: false,
        solicitanteId: req.usuario.id,
      });
      ctx.siguienteNumero += 1;
    }
    return enviar(res, r);
  });
});

// Todo lo demás: rutas explícitas con RBAC en mock/routes.js; el resto es 404 problem+json.
servidor.use(API, (req, res) => {
  enviar(res, resolver({
    db,
    usuario: req.usuario,
    metodo: req.method,
    ruta: req.path,
    query: req.query,
    vacio: Boolean(req.get('X-Mock-Empty')),
    instance: req.originalUrl,
  }));
});

servidor.use((req, res) => res.status(404).type('text/plain').send('No encontrado'));

servidor.listen(PUERTO, HOST, () => {
  console.log(`Maqueta en http://localhost:${PUERTO}  (API simulada en ${API}, solo ${HOST})`);
});
