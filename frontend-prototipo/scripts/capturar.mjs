// Evidencia CA-8: capturas a 375x667 y 1920x1080 + verificación de scroll horizontal.
// Requiere: Google Chrome, Node >= 22 (WebSocket global) y la maqueta en marcha (npm start).
// Uso: node scripts/capturar.mjs
// El script arranca su propio servidor de la maqueta (127.0.0.1:PUERTO_MAQUETA) y lo REINICIA
// para cada captura: así cada pantalla parte de los datos semilla y mock/db.json nunca cambia.
import { spawn } from 'node:child_process';
import { mkdirSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateSync } from 'node:zlib';

const PUERTO_MAQUETA = 3190;
const BASE = `http://127.0.0.1:${PUERTO_MAQUETA}`;
const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const CHROME = process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const SALIDA = join(RAIZ, 'evidencias');
const PUERTO = 9333;
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

async function iniciarServidor() {
  const proceso = spawn(process.execPath, ['server.js'], { cwd: RAIZ, env: { ...process.env, PORT: String(PUERTO_MAQUETA) }, stdio: 'ignore' });
  for (let i = 0; i < 50; i++) {
    try {
      if ((await fetch(`${BASE}/login.html`)).ok) return proceso;
    } catch { await dormir(100); }
  }
  proceso.kill();
  throw new Error('La maqueta no arrancó');
}
async function detenerServidor(proceso) {
  const salio = new Promise((ok) => proceso.once('exit', ok));
  proceso.kill();
  await salio;
}

// ---- PNG de prueba (evidencia adjunta) ----
function crearPng(ruta, ancho = 120, alto = 80) {
  const filas = [];
  for (let y = 0; y < alto; y++) {
    const fila = Buffer.alloc(1 + ancho * 3);
    for (let x = 0; x < ancho; x++) {
      fila[1 + x * 3] = 29 + Math.floor((x / ancho) * 100);
      fila[2 + x * 3] = 78;
      fila[3 + x * 3] = 216 - Math.floor((y / alto) * 80);
    }
    filas.push(fila);
  }
  const crc = (buf) => {
    let c, tabla = [];
    for (let n = 0; n < 256; n++) { c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; tabla[n] = c >>> 0; }
    let r = 0xffffffff;
    for (const b of buf) r = tabla[(r ^ b) & 0xff] ^ (r >>> 8);
    return (r ^ 0xffffffff) >>> 0;
  };
  const trozo = (tipo, datos) => {
    const cuerpo = Buffer.concat([Buffer.from(tipo), datos]);
    const len = Buffer.alloc(4); len.writeUInt32BE(datos.length);
    const sum = Buffer.alloc(4); sum.writeUInt32BE(crc(cuerpo));
    return Buffer.concat([len, cuerpo, sum]);
  };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(ancho, 0); ihdr.writeUInt32BE(alto, 4); ihdr[8] = 8; ihdr[9] = 2;
  writeFileSync(ruta, Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    trozo('IHDR', ihdr), trozo('IDAT', deflateSync(Buffer.concat(filas))), trozo('IEND', Buffer.alloc(0)),
  ]));
}

// ---- Cliente CDP mínimo ----
class Cdp {
  constructor(ws) {
    this.ws = ws; this.id = 0; this.pendientes = new Map();
    this.eventos = [];
    ws.addEventListener('message', (e) => {
      const m = JSON.parse(e.data);
      if (m.method) this.eventos.push(m);
      if (m.id && this.pendientes.has(m.id)) {
        const { ok, fallo } = this.pendientes.get(m.id);
        this.pendientes.delete(m.id);
        m.error ? fallo(new Error(m.error.message)) : ok(m.result);
      }
    });
  }
  send(method, params = {}) {
    const id = ++this.id;
    return new Promise((ok, fallo) => { this.pendientes.set(id, { ok, fallo }); this.ws.send(JSON.stringify({ id, method, params })); });
  }
  async evaluar(expresion) {
    const r = await this.send('Runtime.evaluate', { expression: expresion, awaitPromise: true, returnByValue: true });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description ?? 'error al evaluar');
    return r.result.value;
  }
}

const VISTAS = [
  { ancho: 375, alto: 667, movil: true },
  { ancho: 1920, alto: 1080, movil: false },
];
const ANCHOS_EXTRA = [360, 768, 1024, 1440];

const escribir = (sel, valor) =>
  `(()=>{const e=document.querySelector(${JSON.stringify(sel)});e.value=${JSON.stringify(valor)};e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));})()`;
const clic = (sel) => `document.querySelector(${JSON.stringify(sel)}).click()`;

const LLENAR_SOLICITUD = (titulo) => [
  escribir('#titulo', titulo),
  escribir('#idCategoria', '3'),
  escribir('#idPrioridad', '3'),
  escribir('#ubicacionCampus', 'Campus Central'),
  escribir('#ubicacionAmbiente', 'Pabellón B - Aula 402'),
  escribir('#descripcion', 'El proyector enciende pero no muestra imagen por HDMI.'),
];

// Fuerza una categoría inexistente (el <select> no la ofrece) para provocar el 400 documentado.
const CATEGORIA_FANTASMA = `(()=>{const s=document.querySelector('#idCategoria');s.append(new Option('Categoría inexistente','99'));s.value='99';s.dispatchEvent(new Event('change',{bubbles:true}));})()`;

// limpiarSesion: borra localStorage antes de abrir la pantalla pública.
const ESCENARIOS = [
  { nombre: '01-login', ruta: '/login.html', limpiarSesion: true },
  { nombre: '02-login-validacion', ruta: '/login.html', limpiarSesion: true, pasos: [escribir('#correo', 'juan'), clic('#enviar')] },
  { nombre: '03-login-credenciales-invalidas', ruta: '/login.html', limpiarSesion: true, pasos: [escribir('#correo', 'juan@universidad.edu'), escribir('#password', 'ClaveMala1'), clic('#enviar')], espera: 700 },
  { nombre: '04-registro', ruta: '/registro.html', limpiarSesion: true, pasos: [escribir('#correo', 'juan@gmail.com'), escribir('#password', 'abcdefgh'), `document.querySelector('#correo').focus();document.querySelector('#password').focus();document.querySelector('#nombre').focus()`] },
  { nombre: '05-mis-solicitudes', ruta: '/mis-solicitudes.html?demo=estudiante' },
  { nombre: '06-mis-solicitudes-filtro', ruta: '/mis-solicitudes.html?demo=estudiante', pasos: [escribir('#q', 'wi-fi')] },
  { nombre: '07-mis-solicitudes-vacio', ruta: '/mis-solicitudes.html?demo=estudiante-nuevo' },
  { nombre: '08-mis-solicitudes-error-500', ruta: '/mis-solicitudes.html?demo=estudiante&mock=500' },
  { nombre: '09-mis-solicitudes-cargando', ruta: '/mis-solicitudes.html?demo=estudiante&delay=4000', sinEstable: true, espera: 500 },
  { nombre: '10-nueva-solicitud', ruta: '/nueva-solicitud.html?demo=estudiante', pasos: [escribir('#descripcion', 'Falla el proyector')] },
  { nombre: '11-nueva-solicitud-validacion', ruta: '/nueva-solicitud.html?demo=estudiante', pasos: [clic('#enviar')] },
  { nombre: '12-nueva-solicitud-evidencia', ruta: '/nueva-solicitud.html?demo=estudiante', pasos: LLENAR_SOLICITUD('Proyector con imagen distorsionada'), archivos: true },
  { nombre: '13-nueva-solicitud-confirmacion', ruta: '/nueva-solicitud.html?demo=estudiante', pasos: [...LLENAR_SOLICITUD('Proyector con imagen distorsionada'), clic('#enviar')], espera: 800 },
  { nombre: '14-nueva-solicitud-400-categoria-invalida', ruta: '/nueva-solicitud.html?demo=estudiante', pasos: [...LLENAR_SOLICITUD('Proyector sin imagen'), CATEGORIA_FANTASMA, clic('#enviar')], espera: 800 },
  { nombre: '15-bandeja-supervisor', ruta: '/bandeja.html?demo=supervisor' },
  { nombre: '16-bandeja-tecnico', ruta: '/bandeja.html?demo=tecnico' },
  { nombre: '17-dashboard', ruta: '/dashboard.html?demo=admin' },
  { nombre: '19-nueva-solicitud-409-simulado', ruta: '/nueva-solicitud.html?demo=estudiante&mock=post:409', pasos: [...LLENAR_SOLICITUD('Proyector sin imagen'), clic('#enviar')], espera: 800 },
  { nombre: '18-dashboard-datos-abiertos', ruta: '/dashboard.html?demo=admin', pasos: [`document.querySelectorAll('.chart-data').forEach(d=>d.open=true)`] },
];

const PAGINAS_OVERFLOW = [
  '/login.html', '/registro.html', '/mis-solicitudes.html?demo=estudiante', '/nueva-solicitud.html?demo=estudiante',
  '/bandeja.html?demo=supervisor', '/dashboard.html?demo=admin',
];

async function main() {
  mkdirSync(SALIDA, { recursive: true });
  const trabajo = mkdtempSync(join(tmpdir(), 'maqueta-'));
  const png = join(trabajo, 'foto_proyector.png');
  crearPng(png);

  const chrome = spawn(CHROME, [
    '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
    `--remote-debugging-port=${PUERTO}`, `--user-data-dir=${join(trabajo, 'perfil')}`, 'about:blank',
  ], { stdio: 'ignore' });

  try {
    let destino;
    for (let i = 0; i < 50 && !destino; i++) {
      try {
        const r = await fetch(`http://127.0.0.1:${PUERTO}/json/new?about:blank`, { method: 'PUT' });
        destino = await r.json();
      } catch { await dormir(200); }
    }
    if (!destino) throw new Error('No se pudo conectar con Chrome');
    const ws = new WebSocket(destino.webSocketDebuggerUrl);
    await new Promise((ok, fallo) => { ws.addEventListener('open', ok); ws.addEventListener('error', fallo); });
    const cdp = new Cdp(ws);
    await cdp.send('Page.enable'); await cdp.send('Runtime.enable'); await cdp.send('DOM.enable'); await cdp.send('Log.enable');

    const informe = [`Verificación de scroll horizontal — ${new Date().toISOString()}`, `Criterio: documentElement.scrollWidth <= clientWidth (sin scroll horizontal de página)`, ''];
    let fallos = 0;

    async function abrir(vista, ruta, { limpiarSesion } = {}) {
      await cdp.send('Emulation.setDeviceMetricsOverride', { width: vista.ancho, height: vista.alto, deviceScaleFactor: 1, mobile: vista.movil });
      if (limpiarSesion) {
        await cdp.send('Page.navigate', { url: `${BASE}/login.html?x=${Date.now()}` });
        await dormir(400);
        await cdp.evaluar('localStorage.clear();sessionStorage.clear()');
      }
      await cdp.send('Page.navigate', { url: `${BASE}${ruta}` });
    }
    const estable = async () => {
      for (let i = 0; i < 40; i++) {
        const listo = await cdp.evaluar(`document.readyState==='complete' && !document.querySelector('[aria-busy="true"]') && !!document.querySelector('main')`).catch(() => false);
        if (listo) break;
        await dormir(150);
      }
      await dormir(350);
    };
    async function medirOverflow(etiqueta) {
      const m = await cdp.evaluar(`(()=>{const d=document.documentElement;const w=d.clientWidth;const malos=[...document.querySelectorAll('body *')].filter(e=>e.getBoundingClientRect().right>w+0.5).slice(0,3).map(e=>e.tagName.toLowerCase()+(e.id?'#'+e.id:'')+(e.className&&typeof e.className==='string'?'.'+e.className.split(' ')[0]:''));return {scroll:d.scrollWidth,client:w,malos}})()`);
      const ok = m.scroll <= m.client;
      if (!ok) fallos++;
      informe.push(`${ok ? 'OK   ' : 'FALLA'} ${etiqueta}: scrollWidth=${m.scroll} clientWidth=${m.client}${ok ? '' : ` desbordan: ${m.malos.join(', ')}`}`);
    }

    for (const esc of ESCENARIOS) {
      for (const vista of VISTAS) {
        const servidor = await iniciarServidor();
        try {
        await abrir(vista, esc.ruta, esc);
        if (!esc.sinEstable) await estable(); else await dormir(300);
        if (esc.archivos) {
          const { root } = await cdp.send('DOM.getDocument');
          const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector: '#archivos' });
          await cdp.send('DOM.setFileInputFiles', { nodeId, files: [png] });
          await dormir(400);
        }
        for (const paso of esc.pasos ?? []) await cdp.evaluar(paso);
        await dormir(esc.espera ?? 300);
        await medirOverflow(`${esc.nombre} @${vista.ancho}x${vista.alto}`);
        const { cssContentSize } = await cdp.send('Page.getLayoutMetrics');
        const alto = Math.min(Math.ceil(cssContentSize.height), 4000);
        const { data } = await cdp.send('Page.captureScreenshot', {
          format: 'png', captureBeyondViewport: true,
          clip: { x: 0, y: 0, width: vista.ancho, height: Math.max(alto, vista.alto), scale: 1 },
        });
        writeFileSync(join(SALIDA, `${esc.nombre}-${vista.ancho}x${vista.alto}.png`), Buffer.from(data, 'base64'));
        console.log(`captura ${esc.nombre} ${vista.ancho}x${vista.alto}`);
        } finally {
          await detenerServidor(servidor);
        }
      }
    }

    informe.push('', 'Anchos adicionales (sin captura):');
    const servidorExtra = await iniciarServidor();
    for (const ancho of ANCHOS_EXTRA) {
      for (const ruta of PAGINAS_OVERFLOW) {
        await abrir({ ancho, alto: 800, movil: ancho < 768 }, ruta, { limpiarSesion: ruta.startsWith('/login') || ruta.startsWith('/registro') });
        await estable();
        await medirOverflow(`${ruta.split('?')[0]} @${ancho}`);
      }
    }
    await detenerServidor(servidorExtra);

    // Errores de JavaScript o violaciones de CSP (los 4xx/5xx simulados a propósito no cuentan).
    const problemas = cdp.eventos.filter((m) =>
      m.method === 'Runtime.exceptionThrown' ||
      (m.method === 'Log.entryAdded' && ['security', 'javascript'].includes(m.params.entry.source) && m.params.entry.level === 'error'));
    informe.push('', `Excepciones JS / violaciones de CSP: ${problemas.length}`);
    for (const p of problemas.slice(0, 10)) informe.push(`  ${JSON.stringify(p.params.exceptionDetails?.text ?? p.params.entry?.text)}`);
    if (problemas.length) fallos++;
    informe.push('', fallos ? `RESULTADO: ${fallos} fallo(s) (scroll horizontal o errores de consola)` : 'RESULTADO: sin scroll horizontal ni errores de JS/CSP');
    writeFileSync(join(SALIDA, 'verificacion-scroll-horizontal.txt'), `${informe.join('\n')}\n`);
    console.log(informe.join('\n'));
    process.exitCode = fallos ? 1 : 0;
    ws.close();
  } finally {
    chrome.kill();
    await dormir(800);
    try { rmSync(trabajo, { recursive: true, force: true, maxRetries: 5 }); } catch { /* temporal del sistema */ }
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
