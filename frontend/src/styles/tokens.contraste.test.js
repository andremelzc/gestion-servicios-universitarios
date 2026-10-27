/**
 * Verificación de contraste WCAG 2.1 de los tokens (UX-06 · UX §8).
 * Recalcula la tabla del anexo §8 sobre `tokens.css`: texto ≥ 4.5:1 y
 * elementos no textuales (iconos de estado, anillo de foco) ≥ 3:1.
 * Corre con el resto de la suite (`npm test`) y en CI.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

// `import.meta.dirname` (Node ≥ 20.11): ruta del propio test, sin depender del cwd.
const CSS = readFileSync(path.join(import.meta.dirname, 'tokens.css'), 'utf8');

function token(nombre) {
  const hallado = CSS.match(new RegExp(`--${nombre}:\\s*([^;]+);`));
  if (!hallado) throw new Error(`Falta --${nombre} en tokens.css`);
  return hallado[1].trim();
}

function canal(valor) {
  const c = valor / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function luminancia(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return 0.2126 * canal(r) + 0.7152 * canal(g) + 0.0722 * canal(b);
}

function contraste(unColor, otroColor) {
  const [alto, bajo] = [luminancia(unColor), luminancia(otroColor)].sort((x, y) => y - x);
  return (alto + 0.05) / (bajo + 0.05);
}

// Composición del tinte (insignias y alertas de §2.1) sobre un fondo opaco.
function conTinte(color, alfa, fondo) {
  const partes = [1, 3, 5].map((i) =>
    Math.round(
      parseInt(color.slice(i, i + 2), 16) * alfa + parseInt(fondo.slice(i, i + 2), 16) * (1 - alfa),
    ),
  );
  return `#${partes.map((p) => p.toString(16).padStart(2, '0')).join('')}`;
}

const texto = token('color-text');
const secundario = token('color-text-muted');
const primario = token('color-primary');
const primarioHover = token('color-primary-hover');
const superficie = token('color-surface');
const fondo = token('color-bg');
const exito = token('color-success');
const advertencia = token('color-warning');
const peligro = token('color-danger');
const foco = token('color-focus');
const blanco = '#ffffff';

const ESTADOS = {
  Registrada: token('color-estado-registrada'),
  'En evaluación': token('color-estado-evaluacion'),
  Asignada: token('color-estado-asignada'),
  'En atención': token('color-estado-atencion'),
  Resuelta: token('color-estado-resuelta'),
  Cerrada: token('color-estado-cerrada'),
};

// Peor caso de la insignia de estado: texto oscuro sobre el tinte al 12 % del color.
let peorInsignia = { nombre: '', tinte: blanco };
let peorRatio = Infinity;
for (const [nombre, color] of Object.entries(ESTADOS)) {
  for (const base of [superficie, fondo]) {
    const tinte = conTinte(color, 0.12, base);
    const ratio = contraste(texto, tinte);
    if (ratio < peorRatio) {
      peorRatio = ratio;
      peorInsignia = { nombre, tinte };
    }
  }
}

const PARES_TEXTO = [
  ['Texto principal sobre superficie', texto, superficie],
  ['Texto principal sobre fondo', texto, fondo],
  ['Texto secundario sobre superficie', secundario, superficie],
  ['Texto secundario sobre fondo', secundario, fondo],
  ['Enlace (primario) sobre superficie', primario, superficie],
  ['Primario sobre fondo', primario, fondo],
  ['Etiqueta blanca sobre botón primario', blanco, primario],
  ['Etiqueta blanca sobre primario (hover)', blanco, primarioHover],
  ['Éxito como texto sobre superficie', exito, superficie],
  ['Advertencia como texto sobre superficie', advertencia, superficie],
  ['Peligro como texto sobre superficie', peligro, superficie],
  ['Peligro sobre alerta (tinte al 8 %)', peligro, conTinte(peligro, 0.08, fondo)],
  [`Texto de insignia al 12 % (peor: ${peorInsignia.nombre})`, texto, peorInsignia.tinte],
];

const PARES_NO_TEXTO = [
  ['Anillo de foco sobre superficie', foco, superficie],
  ['Anillo de foco sobre fondo', foco, fondo],
  ...Object.entries(ESTADOS).map(([nombre, color]) => [
    `Punto de estado «${nombre}» sobre superficie`,
    color,
    superficie,
  ]),
];

describe('contraste de tokens: texto ≥ 4.5:1 (UX §8)', () => {
  it.each(PARES_TEXTO)('%s', (titulo, unColor, otroColor) => {
    expect(contraste(unColor, otroColor), titulo).toBeGreaterThanOrEqual(4.5);
  });
});

describe('contraste de tokens: iconos y foco ≥ 3:1 (UX §8)', () => {
  it.each(PARES_NO_TEXTO)('%s', (titulo, unColor, otroColor) => {
    expect(contraste(unColor, otroColor), titulo).toBeGreaterThanOrEqual(3);
  });

  // Exento en WCAG por ser control deshabilitado; se vigila el mínimo no textual.
  it('Deshabilitado (exento en WCAG) ≥ 3:1', () => {
    expect(
      contraste(token('color-disabled-text'), token('color-disabled-bg')),
      'Deshabilitado',
    ).toBeGreaterThanOrEqual(3);
  });
});

describe('objetivo táctil (UX §2.2)', () => {
  it('el token --touch-target es 44px', () => {
    expect(token('touch-target')).toBe('44px');
  });
});
