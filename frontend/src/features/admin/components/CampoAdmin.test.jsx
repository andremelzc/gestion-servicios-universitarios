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

  it('con ayudaEnVivo la región de estado existe aunque no haya ayuda y no describe al control vacía', () => {
    const { rerender } = render(
      <CampoAdmin id="x" etiqueta="Color" ayudaEnVivo>
        <input />
      </CampoAdmin>,
    );
    const region = screen.getByRole('status');
    expect(region).toBeEmptyDOMElement();
    expect(screen.getByLabelText('Color')).not.toHaveAttribute('aria-describedby');

    rerender(
      <CampoAdmin id="x" etiqueta="Color" ayuda="Poco contraste" ayudaEnVivo>
        <input />
      </CampoAdmin>,
    );

    expect(screen.getByRole('status')).toBe(region);
    expect(screen.getByLabelText('Color')).toHaveAccessibleDescription('Poco contraste');
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
