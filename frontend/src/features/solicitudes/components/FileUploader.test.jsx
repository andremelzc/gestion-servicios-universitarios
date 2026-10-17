import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  MSG_ARCHIVO_GRANDE,
  MSG_MAXIMO_ARCHIVOS,
  MSG_TIPO_NO_PERMITIDO,
  TAMANO_MAXIMO_BYTES,
  formatearTamano,
  validarArchivo,
  validarArchivos,
} from '../evidencias.js';
import FileUploader from './FileUploader.jsx';

const crearArchivo = (nombre, { tipo = 'image/jpeg', tamano = 1024 } = {}) =>
  new File([new Uint8Array(tamano)], nombre, { type: tipo });

const entradaDeArchivos = () => screen.getByLabelText('Evidencias (opcional)');

// Arnes controlado: reproduce a REG-15 dueño de la lista.
function Controlado({ iniciales = [], ...props }) {
  const [archivos, setArchivos] = useState(iniciales);
  return <FileUploader archivos={archivos} onChange={setArchivos} {...props} />;
}

// jsdom no implementa `URL.createObjectURL`: se simula la miniatura para las pruebas.
beforeAll(() => {
  Object.defineProperty(URL, 'createObjectURL', {
    value: vi.fn(() => 'blob:miniatura'),
    configurable: true,
    writable: true,
  });
  Object.defineProperty(URL, 'revokeObjectURL', {
    value: vi.fn(),
    configurable: true,
    writable: true,
  });
});
afterAll(() => {
  delete URL.createObjectURL;
  delete URL.revokeObjectURL;
});
beforeEach(() => vi.clearAllMocks());

describe('FileUploader (REG-16 · US-06)', () => {
  it('[REG-16] muestra la zona de subida con los límites y el selector correcto', () => {
    render(<FileUploader archivos={[]} onChange={() => {}} />);

    expect(screen.getByText('Evidencias (opcional)')).toBeInTheDocument();
    expect(screen.getByText('Arrastra o toca para subir')).toBeInTheDocument();
    expect(screen.getByText('JPG · PNG · PDF · máx. 3 archivos · 5 MB c/u')).toBeInTheDocument();

    const entrada = entradaDeArchivos();
    expect(entrada).toHaveAttribute('type', 'file');
    expect(entrada).toHaveAttribute('multiple');
    expect(entrada).toHaveAttribute('accept', '.jpg,.jpeg,.png,.pdf');
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('[REG-16] seleccionar un archivo lo lista con nombre, tamaño y miniatura', async () => {
    const user = userEvent.setup();
    render(<Controlado />);
    const foto = crearArchivo('foto1.jpg', { tamano: 1.5 * 1024 * 1024 });

    await user.upload(entradaDeArchivos(), foto);

    const fila = screen.getByRole('listitem');
    expect(within(fila).getByText('foto1.jpg')).toBeInTheDocument();
    expect(within(fila).getByText('1.5 MB')).toBeInTheDocument();
    expect(within(fila).getByRole('button', { name: 'Quitar foto1.jpg' })).toBeInTheDocument();
    expect(fila.querySelector('img')).toHaveAttribute('src', 'blob:miniatura');
    expect(URL.createObjectURL).toHaveBeenCalledWith(foto);
  });

  it('[REG-16] el componente es controlado: onChange recibe la lista completa', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const previa = crearArchivo('antes.pdf', { tipo: 'application/pdf' });
    const nueva = crearArchivo('nueva.png', { tipo: 'image/png' });
    render(<FileUploader archivos={[previa]} onChange={onChange} />);

    await user.upload(entradaDeArchivos(), nueva);

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith([previa, nueva]);
  });

  it('[REG-16] aplica el límite de 3 archivos con aviso y sin recortar lo ya adjunto', async () => {
    const user = userEvent.setup();
    const tres = ['a.pdf', 'b.pdf', 'c.pdf'].map((nombre) =>
      crearArchivo(nombre, { tipo: 'application/pdf' }),
    );
    render(<Controlado iniciales={tres} />);

    await user.upload(entradaDeArchivos(), crearArchivo('d.pdf', { tipo: 'application/pdf' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(MSG_MAXIMO_ARCHIVOS);
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
  });

  it('[REG-16] CA-4: un archivo mayor a 5 MB se marca y bloquea el envío (contrato)', async () => {
    const user = userEvent.setup();
    render(<Controlado />);
    const grande = crearArchivo('captura.png', {
      tipo: 'image/png',
      tamano: TAMANO_MAXIMO_BYTES + 1,
    });

    await user.upload(entradaDeArchivos(), grande);

    const fila = screen.getByRole('listitem');
    expect(fila).toHaveAttribute('data-error', 'true');
    expect(within(fila).getByText(MSG_ARCHIVO_GRANDE)).toBeInTheDocument();
    // Contrato que REG-15 usa para deshabilitar el envío:
    expect(validarArchivos([grande])).toEqual([MSG_ARCHIVO_GRANDE]);
  });

  it('[REG-16] CA-5: un tipo no permitido o falsificado se marca por archivo', async () => {
    const user = userEvent.setup({ applyAccept: false });
    render(<Controlado />);

    await user.upload(
      entradaDeArchivos(),
      crearArchivo('virus.exe', { tipo: 'application/x-msdownload' }),
    );
    expect(
      within(screen.getByRole('listitem')).getByText(MSG_TIPO_NO_PERMITIDO),
    ).toBeInTheDocument();

    await user.upload(
      entradaDeArchivos(),
      crearArchivo('foto.jpg', { tipo: 'application/x-msdownload' }),
    );
    expect(screen.getAllByText(MSG_TIPO_NO_PERMITIDO)).toHaveLength(2);
  });

  it('[REG-16] admite arrastrar y soltar y refleja el estado de arrastre', () => {
    render(<Controlado />);
    const zona = entradaDeArchivos().closest('label');
    const foto = crearArchivo('foto2.jpg', { tamano: 2 * 1024 * 1024 });

    fireEvent.dragOver(zona);
    expect(zona).toHaveAttribute('data-arrastrando', 'true');

    fireEvent.dragLeave(zona, { relatedTarget: null });
    expect(zona).toHaveAttribute('data-arrastrando', 'false');

    fireEvent.dragOver(zona);
    fireEvent.drop(zona, { dataTransfer: { files: [foto] } });

    expect(zona).toHaveAttribute('data-arrastrando', 'false');
    expect(screen.getByText('foto2.jpg')).toBeInTheDocument();
    expect(screen.getByText('2 MB')).toBeInTheDocument();
  });

  it('[REG-16] quitar un archivo lo elimina de la lista y libera su miniatura', async () => {
    const user = userEvent.setup();
    const foto = crearArchivo('foto1.jpg');
    render(<Controlado iniciales={[foto]} />);

    await user.click(screen.getByRole('button', { name: 'Quitar foto1.jpg' }));

    expect(screen.queryByRole('listitem')).not.toBeInTheDocument();
    await waitFor(() => expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:miniatura'));
  });

  it('[REG-16] al desmontar libera todas las miniaturas', () => {
    const foto = crearArchivo('foto1.jpg');
    const { unmount } = render(<FileUploader archivos={[foto]} onChange={() => {}} />);

    unmount();

    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:miniatura');
  });

  it('[REG-16] el selector es accesible por teclado con nombre y descripción', async () => {
    const user = userEvent.setup();
    render(<FileUploader archivos={[]} onChange={() => {}} />);

    await user.tab();

    const entrada = entradaDeArchivos();
    expect(entrada).toHaveFocus();
    expect(entrada).toHaveAccessibleName('Evidencias (opcional)');
    expect(entrada).toHaveAccessibleDescription('JPG · PNG · PDF · máx. 3 archivos · 5 MB c/u');
  });
});

describe('reglas de evidencias (evidencias.js)', () => {
  it('[REG-16] validarArchivo acepta JPG/PNG/PDF ≤ 5 MB y rechaza excesos y tipos', () => {
    expect(validarArchivo(crearArchivo('a.jpg'))).toBeNull();
    expect(validarArchivo(crearArchivo('b.PNG', { tipo: 'image/png' }))).toBeNull();
    expect(validarArchivo(crearArchivo('c.pdf', { tipo: 'application/pdf' }))).toBeNull();
    expect(
      validarArchivo(
        crearArchivo('justo.pdf', { tipo: 'application/pdf', tamano: TAMANO_MAXIMO_BYTES }),
      ),
    ).toBeNull();
    expect(
      validarArchivo(
        crearArchivo('grande.pdf', { tipo: 'application/pdf', tamano: TAMANO_MAXIMO_BYTES + 1 }),
      ),
    ).toBe(MSG_ARCHIVO_GRANDE);
    expect(validarArchivo(crearArchivo('virus.exe', { tipo: 'application/x-msdownload' }))).toBe(
      MSG_TIPO_NO_PERMITIDO,
    );
    expect(validarArchivo(crearArchivo('falso.jpg', { tipo: 'application/x-msdownload' }))).toBe(
      MSG_TIPO_NO_PERMITIDO,
    );
    expect(validarArchivo(crearArchivo('raro.jpg', { tipo: 'text/plain' }))).toBe(
      MSG_TIPO_NO_PERMITIDO,
    );
  });

  it('[REG-16] formatearTamano usa MB con un decimal y KB para los pequeños', () => {
    expect(formatearTamano(1.5 * 1024 * 1024)).toBe('1.5 MB');
    expect(formatearTamano(5 * 1024 * 1024)).toBe('5 MB');
    expect(formatearTamano(320 * 1024)).toBe('320 KB');
    expect(formatearTamano(0)).toBe('1 KB');
  });
});
