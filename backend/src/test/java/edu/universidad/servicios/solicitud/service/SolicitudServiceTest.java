package edu.universidad.servicios.solicitud.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import edu.universidad.servicios.solicitud.domain.*;
import edu.universidad.servicios.solicitud.dto.SolicitudCrearRequest;
import edu.universidad.servicios.solicitud.repository.*;
import edu.universidad.servicios.usuario.domain.Usuario;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

@ExtendWith(MockitoExtension.class)
class SolicitudServiceTest {

	@Mock
	CategoriaRepository categoriaRepository;

	@Mock
	PrioridadRepository prioridadRepository;

	@Mock
	EstadoSolicitudRepository estadoRepository;

	@Mock
	SolicitudRepository solicitudRepository;

	@Mock
	EvidenciaArchivoRepository evidenciaRepository;

	@Mock
	HistorialSolicitudRepository historialRepository;

	@Mock
	CodigoSolicitudService codigoService;

	@Mock
	FileStorageService fileStorageService;

	private SolicitudService service;
	private final Clock clock = Clock.fixed(
		Instant.parse("2026-10-10T10:00:00Z"),
		ZoneOffset.UTC
	);

	@BeforeEach
	void setUp() {
		service = new SolicitudService(
			categoriaRepository,
			prioridadRepository,
			estadoRepository,
			solicitudRepository,
			evidenciaRepository,
			historialRepository,
			codigoService,
			new SlaCalculator(clock),
			new FileTypeValidator(),
			fileStorageService,
			clock
		);
		TransactionSynchronizationManager.initSynchronization();
		TransactionSynchronizationManager.setActualTransactionActive(true);
	}

	@AfterEach
	void tearDown() {
		if (TransactionSynchronizationManager.isSynchronizationActive()) {
			TransactionSynchronizationManager.clearSynchronization();
		}
		TransactionSynchronizationManager.setActualTransactionActive(false);
	}

	@Test
	void creaSolicitudConEvidenciaEHistorialEnLaMismaTransaccion() {
		SolicitudCrearRequest request = new SolicitudCrearRequest(
			"Fuga de agua",
			"Hay una fuga en el laboratorio",
			"Campus central",
			"Laboratorio 2",
			4,
			2
		);
		Categoria categoria = new Categoria();
		categoria.setTiempoSlaHoras(24);
		Prioridad prioridad = new Prioridad();
		prioridad.setSlaMaxHoras(48);
		EstadoSolicitud registrada = new EstadoSolicitud();
		registrada.setCodigo("REGISTRADA");
		Usuario solicitante = new Usuario();
		solicitante.setId(17L);
		var upload = new MockMultipartFile(
			"archivos",
			"foto.jpg",
			"image/jpeg",
			new byte[] { (byte) 0xFF, (byte) 0xD8, (byte) 0xFF }
		);

		when(categoriaRepository.findActivaConArea(4)).thenReturn(
			Optional.of(categoria)
		);
		when(prioridadRepository.findByIdAndActivoTrue(2)).thenReturn(
			Optional.of(prioridad)
		);
		when(estadoRepository.findById("REGISTRADA")).thenReturn(
			Optional.of(registrada)
		);
		when(codigoService.generarCodigo()).thenReturn("SOL-2026-0001");
		when(solicitudRepository.save(any(Solicitud.class))).thenAnswer(
			invocation -> {
				Solicitud solicitud = invocation.getArgument(0);
				solicitud.setId(1L);
				return solicitud;
			}
		);
		when(fileStorageService.store(any())).thenReturn(
			new FileStorageService.StoredFile(
				"123e4567-e89b-12d3-a456-426614174000.jpg",
				"123e4567-e89b-12d3-a456-426614174000.jpg"
			)
		);

		var response = service.crear(request, List.of(upload), solicitante);

		assertThat(response.codigo()).isEqualTo("SOL-2026-0001");
		assertThat(response.fechaRegistro()).isEqualTo(
			java.time.LocalDateTime.of(2026, 10, 10, 10, 0)
		);
		verify(evidenciaRepository).save(any(EvidenciaArchivo.class));
		verify(historialRepository).save(
			argThat(
				historial ->
					historial.getEstadoAnterior() == null &&
					historial.getEstadoNuevo() == registrada
			)
		);
		TransactionSynchronizationManager.getSynchronizations().forEach(sync ->
			sync.afterCompletion(TransactionSynchronization.STATUS_COMMITTED)
		);
		verify(fileStorageService, never()).delete(any());
	}

	@Test
	void eliminaArchivosSiLaTransaccionSeRevierte() {
		when(categoriaRepository.findActivaConArea(4)).thenReturn(
			Optional.of(new Categoria())
		);
		when(prioridadRepository.findByIdAndActivoTrue(2)).thenReturn(
			Optional.of(new Prioridad())
		);
		EstadoSolicitud registrada = new EstadoSolicitud();
		registrada.setCodigo("REGISTRADA");
		when(estadoRepository.findById("REGISTRADA")).thenReturn(
			Optional.of(registrada)
		);
		when(codigoService.generarCodigo()).thenReturn("SOL-2026-0001");
		when(solicitudRepository.save(any(Solicitud.class))).thenAnswer(
			invocation -> {
				Solicitud solicitud = invocation.getArgument(0);
				solicitud.setId(1L);
				return solicitud;
			}
		);
		when(fileStorageService.store(any())).thenReturn(
			new FileStorageService.StoredFile(
				"123e4567-e89b-12d3-a456-426614174000.jpg",
				"123e4567-e89b-12d3-a456-426614174000.jpg"
			)
		);
		when(evidenciaRepository.save(any(EvidenciaArchivo.class))).thenThrow(
			new RuntimeException("fallo BD")
		);
		Usuario solicitante = new Usuario();
		var request = new SolicitudCrearRequest(
			"Fuga de agua",
			"Hay una fuga en el laboratorio",
			"Campus central",
			"Laboratorio 2",
			4,
			2
		);
		var upload = new MockMultipartFile(
			"archivos",
			"foto.jpg",
			"image/jpeg",
			new byte[] { (byte) 0xFF, (byte) 0xD8, (byte) 0xFF }
		);

		org.junit.jupiter.api.Assertions.assertThrows(
			RuntimeException.class,
			() -> service.crear(request, List.of(upload), solicitante)
		);
		List<TransactionSynchronization> synchronizations =
			TransactionSynchronizationManager.getSynchronizations();
		synchronizations.forEach(sync ->
			sync.afterCompletion(TransactionSynchronization.STATUS_ROLLED_BACK)
		);

		verify(fileStorageService).delete(
			"123e4567-e89b-12d3-a456-426614174000.jpg"
		);
	}

	@Test
	void rechazaMasDeTresArchivosAntesDeConsultarLaBase() {
		var archivo = new MockMultipartFile(
			"archivos",
			"foto.jpg",
			"image/jpeg",
			new byte[] { (byte) 0xFF, (byte) 0xD8, (byte) 0xFF }
		);

		org.junit.jupiter.api.Assertions.assertThrows(
			IllegalArgumentException.class,
			() ->
				service.crear(
					request(),
					List.of(archivo, archivo, archivo, archivo),
					new Usuario()
				)
		);

		verifyNoInteractions(
			categoriaRepository,
			prioridadRepository,
			estadoRepository,
			solicitudRepository
		);
	}

	@Test
	void rechazaArchivoInvalidoAntesDeConsultarLaBase() {
		var executable = new MockMultipartFile(
			"archivos",
			"payload.exe",
			"application/octet-stream",
			"MZ executable".getBytes()
		);

		org.junit.jupiter.api.Assertions.assertThrows(
			org.springframework.web.server.ResponseStatusException.class,
			() -> service.crear(request(), List.of(executable), new Usuario())
		);

		verifyNoInteractions(
			categoriaRepository,
			prioridadRepository,
			estadoRepository,
			solicitudRepository
		);
	}

	@Test
	void rechazaCategoriaInexistente() {
		when(categoriaRepository.findActivaConArea(4)).thenReturn(
			Optional.empty()
		);

		org.junit.jupiter.api.Assertions.assertThrows(
			IllegalArgumentException.class,
			() -> service.crear(request(), null, new Usuario())
		);

		verifyNoInteractions(
			prioridadRepository,
			estadoRepository,
			solicitudRepository
		);
	}

	@Test
	void rechazaPrioridadInexistente() {
		when(categoriaRepository.findActivaConArea(4)).thenReturn(
			Optional.of(new Categoria())
		);
		when(prioridadRepository.findByIdAndActivoTrue(2)).thenReturn(
			Optional.empty()
		);

		org.junit.jupiter.api.Assertions.assertThrows(
			IllegalArgumentException.class,
			() -> service.crear(request(), null, new Usuario())
		);

		verifyNoInteractions(estadoRepository, solicitudRepository);
	}

	@Test
	void fallaSiNoExisteElEstadoRegistrada() {
		when(categoriaRepository.findActivaConArea(4)).thenReturn(
			Optional.of(new Categoria())
		);
		when(prioridadRepository.findByIdAndActivoTrue(2)).thenReturn(
			Optional.of(new Prioridad())
		);
		when(estadoRepository.findById("REGISTRADA")).thenReturn(
			Optional.empty()
		);

		org.junit.jupiter.api.Assertions.assertThrows(
			IllegalStateException.class,
			() -> service.crear(request(), null, new Usuario())
		);

		verifyNoInteractions(solicitudRepository);
	}

	@Test
	void requiereSincronizacionTransaccionalParaRegistrarCompensacion() {
		when(categoriaRepository.findActivaConArea(4)).thenReturn(
			Optional.of(new Categoria())
		);
		when(prioridadRepository.findByIdAndActivoTrue(2)).thenReturn(
			Optional.of(new Prioridad())
		);
		EstadoSolicitud registrada = new EstadoSolicitud();
		registrada.setCodigo("REGISTRADA");
		when(estadoRepository.findById("REGISTRADA")).thenReturn(
			Optional.of(registrada)
		);
		when(codigoService.generarCodigo()).thenReturn("SOL-2026-0001");
		when(solicitudRepository.save(any(Solicitud.class))).thenAnswer(
			invocation -> invocation.getArgument(0)
		);
		TransactionSynchronizationManager.clearSynchronization();

		org.junit.jupiter.api.Assertions.assertThrows(
			IllegalStateException.class,
			() -> service.crear(request(), null, new Usuario())
		);
	}

	private SolicitudCrearRequest request() {
		return new SolicitudCrearRequest(
			"Fuga de agua",
			"Hay una fuga en el laboratorio",
			"Campus central",
			"Laboratorio 2",
			4,
			2
		);
	}
}
