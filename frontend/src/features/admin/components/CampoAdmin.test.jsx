import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import CampoAdmin from './CampoAdmin.jsx';

describe('CampoAdmin', () => {
  it('asocia la etiqueta con el control', () => {
    render(
      <CampoAdmin id="x" etiqueta="Nivel">
        <input />
      </CampoAdmin>,
    );

    expect(screen.getByLabelText('Nivel')).toHaveAttribute('id', 'x');
  });

  it('con error marca aria-invalid y lo describe con el mensaje', () => {
    render(
      <CampoAdmin id="x" etiqueta="Nivel" error="Ingresa el nivel.">
        <input />
      </CampoAdmin>,
    );

    const control = screen.getByLabelText('Nivel');
    expect(control).toHaveAttribute('aria-invalid', 'true');
    expect(control).toHaveAccessibleDescription('Ingresa el nivel.');
  });

  it('la ayuda también describe el control, junto al error', () => {
    render(
      <CampoAdmin id="x" etiqueta="SLA" ayuda="Horas" error="Inválido">
        <input />
      </CampoAdmin>,
    );

    expect(screen.getByLabelText('SLA')).toHaveAccessibleDescription('Inválido Horas');
  });
});
