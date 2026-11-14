// Guion de reproducción de UAT-09 y UAT-10 (QA-20, issue #181).
// Ejecuta los pasos por la UI real con Playwright contra el stack local de Docker Compose
// (perfil `demo`). No es dependencia del proyecto: se corre desde un directorio aparte.
//
//   mkdir /tmp/pw && cd /tmp/pw && npm init -y && npm i playwright && npx playwright install chromium
//   BASE_URL=http://localhost:8088 DEMO_USER_PASSWORD=... OUT_DIR=<ruta/evidencias/uat> \
//     node <ruta>/uat-09-10.spec.mjs
//
// Deja un resumen de los valores observados en `resultados.json` dentro de OUT_DIR.
import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

const BASE = process.env.BASE_URL ?? 'http://localhost:8088';
const PASS = process.env.DEMO_USER_PASSWORD;
const OUT = process.env.OUT_DIR ?? '.';
const CATEGORIA = 'Pizarras Interactivas';
const TITULO = `UAT-09 Pizarra interactiva sin respuesta ${Date.now() % 100000}`;
if (!PASS) throw new Error('Falta DEMO_USER_PASSWORD');

const res = {};
const foto = (page, nombre) =>
  page.screenshot({ path: join(OUT, `${nombre}.png`), fullPage: true });

// HISTÓRICO (ver evidencia-uat-09-10.md §2, BUG-01, resuelto en #396): el backend responde a POST /auth/login con un
// cuerpo plano `{token, tipo, correo, rol: "ROLE_X", idArea}` y el frontend exige el contrato de
// api-rest §3.1 `{token, usuario: {id, nombre, apellido, correo, rol: "X", idArea}}`. Sin él la
// sesión no se establece y la UI vuelve a /login. Para poder ejecutar los UAT por la UI, el
// guion adapta ÚNICAMENTE esa respuesta (la autenticación, el JWT y todos los demás endpoints
// son los reales). Desde #396 la adaptación ya no hace falta y está desactivada por defecto; con ADAPTAR_LOGIN=1
// se reactiva (solo útil contra versiones anteriores a #396).
const ADAPTAR = process.env.ADAPTAR_LOGIN === '1';
async function adaptarLogin(ctx) {
  if (!ADAPTAR) return;
  await ctx.route('**/api/v1/auth/login', async (route) => {
    const resp = await route.fetch();
    if (resp.status() !== 200) {
      console.log('login HTTP', resp.status(), (await resp.text()).slice(0, 120));
      return route.fulfill({ response: resp });
    }
    const cuerpo = await resp.json();
    if (!cuerpo.token) return route.fulfill({ response: resp });
    const [nombre, apellido] = cuerpo.correo.split('@')[0].split('.');
    const usuario = {
      id: 0,
      nombre: nombre,
      apellido: apellido,
      correo: cuerpo.correo,
      rol: String(cuerpo.rol).replace(/^ROLE_/, ''),
      idArea: cuerpo.idArea,
    };
    return route.fulfill({ response: resp, json: { token: cuerpo.token, usuario } });
  });
}

async function login(browser, correo) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  await adaptarLogin(ctx);
  const page = await ctx.newPage();
  await page.goto(`${BASE}/login`);
  // Nginx limita /auth/login a 10 peticiones/min sin ráfaga (CA-9): se espacian los logins.
  await page.waitForTimeout(7000);
  await page.getByLabel('Correo institucional').fill(correo);
  await page.getByLabel('Contraseña', { exact: true }).fill(PASS);
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await page.waitForTimeout(2500);
  if (page.url().includes('/login')) {
    await foto(page, '00-bug01-login-sin-sesion');
    throw new Error('Login sin sesión: la UI no estableció sesión (¿CORS/ALLOWED_ORIGINS, 429 o contrato de api-rest §3.1?).');
  }
  return { ctx, page };
}

const opcionesCategoria = (page) =>
  page.locator('#idCategoria option').allTextContents();

const browser = await chromium.launch();

// ---------- UAT-09 ----------
const admin = await login(browser, 'admin.demo@universidad.edu');
const est = await login(browser, 'estudiante1.demo@universidad.edu');

await admin.page.goto(`${BASE}/admin/categorias`);
await admin.page.getByRole('heading', { name: 'Administración de categorías' }).waitFor();
await foto(admin.page, '09-01-admin-listado-categorias');

await admin.page.getByRole('button', { name: 'Nueva categoría' }).click();
await admin.page.getByLabel('Nombre').fill(CATEGORIA);
await admin.page.getByLabel('Descripción').fill('Pizarras digitales de aulas y salas de reuniones');
const sel = admin.page.getByLabel('Área responsable');
const areaOpt = await sel.locator('option').allTextContents();
res.areasAdmin = areaOpt;
await sel.selectOption({ label: 'Tecnologías de la Información' });
await admin.page.getByLabel('SLA estándar (horas)').fill('24');
await foto(admin.page, '09-02-admin-formulario-nueva-categoria');
await admin.page.getByRole('dialog').getByRole('button', { name: /guardar|crear/i }).click();
await admin.page.getByRole('status').filter({ hasText: 'creada' }).waitFor();
await foto(admin.page, '09-03-admin-categoria-creada');

await est.page.goto(`${BASE}/solicitudes/nueva`);
await est.page.waitForFunction(() => document.querySelectorAll('#idCategoria option').length > 1);
res.opcionesTrasCrear = await opcionesCategoria(est.page);
// Se despliega el selector como lista (size) para que la captura muestre todas las opciones.
await est.page.locator('#idCategoria').evaluate((e) => (e.size = e.options.length));
await foto(est.page, '09-04-estudiante-formulario-con-categoria');

// Solicitud con la categoría nueva (para comprobar el histórico tras la baja).
await est.page.getByLabel('Título').fill(TITULO);
await est.page.locator('#idCategoria').selectOption({ label: CATEGORIA });
await est.page.locator('#idPrioridad').selectOption({ index: 1 });
await est.page.getByLabel('Campus').fill('Campus Central');
await est.page.getByLabel('Ubicación (aula/laboratorio)').fill('Pabellón B - Aula 402');
await est.page
  .getByLabel('Descripción')
  .fill('La pizarra interactiva del aula no responde al tacto desde la mañana.');
await est.page.getByRole('button', { name: 'Enviar' }).click();
await est.page.getByRole('heading', { name: 'Solicitud registrada' }).waitFor();
await foto(est.page, '09-05-estudiante-solicitud-registrada');

// Baja lógica
await admin.page.reload();
await admin.page.getByRole('heading', { name: 'Administración de categorías' }).waitFor();
await admin.page.getByRole('button', { name: `Desactivar ${CATEGORIA}` }).click();
await foto(admin.page, '09-06-admin-confirmar-desactivacion');
await admin.page.getByRole('alertdialog').getByRole('button', { name: 'Desactivar' }).click();
await admin.page.getByRole('status').filter({ hasText: 'desactivada' }).waitFor();
await foto(admin.page, '09-07-admin-categoria-desactivada');

await est.page.goto(`${BASE}/solicitudes/nueva`);
await est.page.waitForFunction(() => document.querySelectorAll('#idCategoria option').length > 1);
res.opcionesTrasDesactivar = await opcionesCategoria(est.page);
await est.page.locator('#idCategoria').evaluate((e) => (e.size = e.options.length));
await foto(est.page, '09-08-estudiante-formulario-sin-categoria');

await est.page.goto(`${BASE}/mis-solicitudes`);
await est.page.getByText(TITULO).first().waitFor();
await est.page.getByRole('row', { name: new RegExp(TITULO) }).getByRole('link').click();
await est.page.waitForURL(/\/solicitudes\/\d+/);
await est.page.waitForTimeout(2000);
res.detalleTexto = (await est.page.locator('main').innerText()).replace(/\s+/g, ' ');
res.detalleMuestraCategoria = res.detalleTexto.includes(CATEGORIA);
await foto(est.page, '09-09-estudiante-detalle-conserva-categoria');
res.tituloSolicitudUat09 = TITULO;
await admin.ctx.close();
await est.ctx.close();

// ---------- UAT-10 ----------
const sup = await login(browser, 'supervisor.demo@universidad.edu');
await sup.page.goto(`${BASE}/dashboard`);
await sup.page.getByRole('heading', { name: 'Dashboard' }).waitFor();
await sup.page.getByText('Indicadores clave').first().waitFor();
await sup.page.waitForTimeout(1500);
await foto(sup.page, '10-01-supervisor-dashboard-sin-filtro');

const kpis = async (page) => {
  const out = {};
  for (const t of ['Registradas', 'Pendientes', 'Atendidas', '% Resueltas', 'MTTR', 'Vencidas']) {
    const card = page.locator('.kpi-card', { hasText: t }).first();
    out[t] = ((await card.count()) ? await card.innerText() : '').replace(/\s+/g, ' ');
  }
  return out;
};
res.kpiSinFiltro = await kpis(sup.page);
res.rangoSinFiltro = await sup.page.locator('.dashboard-page__rango').innerText();

const hoy = new Date().toISOString().slice(0, 10);
await sup.page.getByLabel('Desde').fill(process.env.DESDE ?? '2026-01-01');
await sup.page.getByLabel('Hasta').fill(process.env.HASTA ?? hoy);
await sup.page.getByRole('button', { name: 'Aplicar' }).click();
await sup.page.waitForTimeout(2000);
res.rangoAplicado = await sup.page.locator('.dashboard-page__rango').innerText();
res.kpiConFiltro = await kpis(sup.page);
await foto(sup.page, '10-02-supervisor-dashboard-filtrado-por-fechas');

const registros = async (page) =>
  (await page.locator('main').innerText()).match(/(\d+) registros?/)?.[1] ?? 'sin filas';

await sup.page.goto(`${BASE}/bandeja`);
await sup.page.getByRole('heading', { name: 'Bandeja de solicitudes' }).waitFor();
for (const [id, nom] of [
  ['todas', /Todas/],
  ['porAsignar', /Por asignar/],
  ['enCurso', /En curso/],
  ['resueltas', /Resueltas/],
]) {
  await sup.page.getByRole('tab', { name: nom }).click();
  await sup.page.waitForTimeout(1500);
  res[`bandeja_${id}`] = await registros(sup.page);
  await foto(sup.page, `10-03-supervisor-bandeja-${id}`);
}
await sup.page.getByRole('tab', { name: /Todas/ }).click();
await sup.page.getByLabel('Solo vencidas').check();
await sup.page.waitForTimeout(1500);
res.bandeja_todas_soloVencidas = await registros(sup.page);
await foto(sup.page, '10-04-supervisor-bandeja-solo-vencidas');
res.categoriasFiltroBandeja = await sup.page
  .locator('label', { hasText: 'Categoría' })
  .locator('option')
  .allTextContents();
await sup.ctx.close();

// Contraste de alcance (RN-16): el mismo rango visto por el ADMIN, sin y con filtro de área.
const adm = await login(browser, 'admin.demo@universidad.edu');
await adm.page.goto(`${BASE}/dashboard`);
await adm.page.getByRole('heading', { name: 'Dashboard' }).waitFor();
await adm.page.getByLabel('Desde').fill(process.env.DESDE ?? '2026-01-01');
await adm.page.getByLabel('Hasta').fill(process.env.HASTA ?? hoy);
await adm.page.getByRole('button', { name: 'Aplicar' }).click();
await adm.page.waitForTimeout(2000);
res.kpiAdminTodasAreas = await kpis(adm.page);
await foto(adm.page, '10-05-admin-dashboard-todas-las-areas');
await adm.page.getByLabel('Área').selectOption({ label: 'Tecnologías de la Información' });
await adm.page.getByRole('button', { name: 'Aplicar' }).click();
await adm.page.waitForTimeout(2000);
res.kpiAdminAreaTI = await kpis(adm.page);
await foto(adm.page, '10-06-admin-dashboard-area-ti');
await adm.ctx.close();
await browser.close();
writeFileSync(join(process.env.RESULTADOS_DIR ?? OUT, 'resultados.json'), JSON.stringify(res, null, 2));
console.log(JSON.stringify(res, null, 2));
