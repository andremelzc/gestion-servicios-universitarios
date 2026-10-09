package edu.universidad.servicios.demo;

import edu.universidad.servicios.solicitud.domain.Categoria;
import edu.universidad.servicios.solicitud.domain.EstadoSolicitud;
import edu.universidad.servicios.solicitud.domain.Prioridad;
import edu.universidad.servicios.solicitud.domain.Solicitud;
import edu.universidad.servicios.solicitud.repository.CategoriaRepository;
import edu.universidad.servicios.solicitud.repository.EstadoSolicitudRepository;
import edu.universidad.servicios.solicitud.repository.PrioridadRepository;
import edu.universidad.servicios.solicitud.repository.SolicitudRepository;
import edu.universidad.servicios.usuario.domain.Rol;
import edu.universidad.servicios.usuario.domain.Usuario;
import edu.universidad.servicios.usuario.repository.AreaRepository;
import edu.universidad.servicios.usuario.repository.RolRepository;
import edu.universidad.servicios.usuario.repository.UsuarioRepository;
import java.time.LocalDateTime;
import java.time.Year;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@Profile("demo")
public class DemoDataSeeder implements CommandLineRunner {

	private static final List<DemoUser> DEMO_USERS = List.of(
		new DemoUser(
			"DEMO-ADM-001",
			"Admin",
			"Demo",
			"admin.demo@universidad.edu",
			"ROLE_ADMIN",
			null
		),
		new DemoUser(
			"DEMO-SUP-001",
			"Sofía",
			"Supervisora",
			"supervisor.demo@universidad.edu",
			"ROLE_SUPERVISOR",
			"Tecnologías de la Información"
		),
		new DemoUser(
			"DEMO-TEC-001",
			"Tomás",
			"Técnico TI",
			"tecnico.ti.demo@universidad.edu",
			"ROLE_TECNICO",
			"Tecnologías de la Información"
		),
		new DemoUser(
			"DEMO-TEC-002",
			"María",
			"Técnica Infraestructura",
			"tecnico.infra.demo@universidad.edu",
			"ROLE_TECNICO",
			"Mantenimiento e Infraestructura"
		),
		new DemoUser(
			"DEMO-TEC-003",
			"Luis",
			"Técnico Servicios",
			"tecnico.servicios.demo@universidad.edu",
			"ROLE_TECNICO",
			"Servicios Generales"
		),
		new DemoUser(
			"DEMO-EST-001",
			"Ana",
			"Estudiante",
			"estudiante1.demo@universidad.edu",
			"ROLE_ESTUDIANTE",
			null
		),
		new DemoUser(
			"DEMO-EST-002",
			"Diego",
			"Estudiante",
			"estudiante2.demo@universidad.edu",
			"ROLE_ESTUDIANTE",
			null
		),
		new DemoUser(
			"DEMO-EST-003",
			"Camila",
			"Estudiante",
			"estudiante3.demo@universidad.edu",
			"ROLE_ESTUDIANTE",
			null
		)
	);

	private static final List<String> ESTADOS_EJEMPLO = List.of(
		"REGISTRADA",
		"EN_EVALUACION",
		"ASIGNADA",
		"EN_ATENCION",
		"RESUELTA",
		"CERRADA"
	);

	private final UsuarioRepository usuarioRepository;
	private final RolRepository rolRepository;
	private final AreaRepository areaRepository;
	private final CategoriaRepository categoriaRepository;
	private final PrioridadRepository prioridadRepository;
	private final EstadoSolicitudRepository estadoRepository;
	private final SolicitudRepository solicitudRepository;
	private final PasswordEncoder passwordEncoder;
	private final String password;
	private final int cantidadSolicitudes;

	public DemoDataSeeder(
		UsuarioRepository usuarioRepository,
		RolRepository rolRepository,
		AreaRepository areaRepository,
		CategoriaRepository categoriaRepository,
		PrioridadRepository prioridadRepository,
		EstadoSolicitudRepository estadoRepository,
		SolicitudRepository solicitudRepository,
		PasswordEncoder passwordEncoder,
		@Value("${app.demo.user-password}") String password,
		@Value("${app.demo.solicitudes.cantidad:200}") int cantidadSolicitudes
	) {
		this.usuarioRepository = usuarioRepository;
		this.rolRepository = rolRepository;
		this.areaRepository = areaRepository;
		this.categoriaRepository = categoriaRepository;
		this.prioridadRepository = prioridadRepository;
		this.estadoRepository = estadoRepository;
		this.solicitudRepository = solicitudRepository;
		this.passwordEncoder = passwordEncoder;
		this.password = password;
		this.cantidadSolicitudes = cantidadSolicitudes;
	}

	@Override
	@Transactional
	public void run(String... args) {
		validarConfiguracion();
		verificarCatalogos();
		List<Usuario> usuarios = crearUsuarios();
		crearSolicitudes(usuarios);
	}

	private void validarConfiguracion() {
		if (password == null || password.isBlank()) {
			throw new IllegalStateException(
				"DEMO_USER_PASSWORD debe configurarse para activar el perfil demo"
			);
		}
		if (cantidadSolicitudes < ESTADOS_EJEMPLO.size()) {
			throw new IllegalStateException(
				"app.demo.solicitudes.cantidad debe ser al menos 6"
			);
		}
	}

	private void verificarCatalogos() {
		if (
			rolRepository.count() < 4 ||
			areaRepository.count() == 0 ||
			categoriaRepository.count() == 0 ||
			prioridadRepository.count() == 0 ||
			estadoRepository.count() < ESTADOS_EJEMPLO.size()
		) {
			throw new IllegalStateException(
				"Faltan catálogos requeridos por el seed demo; verifica las migraciones V1/V2"
			);
		}
	}

	private List<Usuario> crearUsuarios() {
		return DEMO_USERS.stream()
			.map(definition -> {
				Usuario usuario = usuarioRepository
					.findByCorreo(definition.correo())
					.orElseGet(() -> {
						Rol rol = rolRepository
							.findByNombre(definition.rol())
							.orElseThrow(() ->
								new IllegalStateException(
									"No existe el rol " + definition.rol()
								)
							);
						Usuario nuevo = new Usuario();
						nuevo.setCodigoInstitucional(definition.codigo());
						nuevo.setNombre(definition.nombre());
						nuevo.setApellido(definition.apellido());
						nuevo.setCorreo(definition.correo());
						nuevo.setPasswordHash(passwordEncoder.encode(password));
						nuevo.setRol(rol);
						nuevo.setActivo(true);
						if (definition.area() != null) {
							nuevo.setArea(
								areaRepository
									.findByNombre(definition.area())
									.orElseThrow(() ->
										new IllegalStateException(
											"No existe el área " +
												definition.area()
										)
									)
							);
						}
						return usuarioRepository.save(nuevo);
					});
				return usuario;
			})
			.toList();
	}

	private void crearSolicitudes(List<Usuario> usuarios) {
		List<Usuario> estudiantes = usuarios
			.stream()
			.filter(usuario ->
				"ROLE_ESTUDIANTE".equals(usuario.getRol().getNombre())
			)
			.toList();
		List<Usuario> tecnicos = usuarios
			.stream()
			.filter(usuario ->
				"ROLE_TECNICO".equals(usuario.getRol().getNombre())
			)
			.toList();
		Usuario supervisor = usuarios
			.stream()
			.filter(usuario ->
				"ROLE_SUPERVISOR".equals(usuario.getRol().getNombre())
			)
			.findFirst()
			.orElseThrow();
		List<Categoria> categorias = categoriaRepository.findAll();
		List<Prioridad> prioridades =
			prioridadRepository.findByActivoTrueOrderByPonderadorAsc();
		List<EstadoSolicitud> estados = ESTADOS_EJEMPLO.stream()
			.map(codigo ->
				estadoRepository
					.findById(codigo)
					.orElseThrow(() ->
						new IllegalStateException(
							"No existe el estado " + codigo
						)
					)
			)
			.toList();
		int anio = Year.now().getValue();
		LocalDateTime ahora = LocalDateTime.now();

		for (int i = 1; i <= cantidadSolicitudes; i++) {
			String codigo = "SOL-%d-%04d".formatted(anio, i);
			if (solicitudRepository.existsByCodigo(codigo)) {
				continue;
			}
			EstadoSolicitud estado = estados.get((i - 1) % estados.size());
			Categoria categoria = categorias.get((i - 1) % categorias.size());
			Prioridad prioridad = prioridades.get((i - 1) % prioridades.size());
			Usuario tecnico = tecnicos
				.stream()
				.filter(
					candidato ->
						candidato.getArea() != null &&
						candidato
							.getArea()
							.getId()
							.equals(categoria.getArea().getId())
				)
				.findFirst()
				.orElse(null);
			LocalDateTime registro = ahora.minusDays(i % 90).minusHours(i % 24);

			Solicitud solicitud = new Solicitud();
			solicitud.setCodigo(codigo);
			solicitud.setSolicitante(
				estudiantes.get((i - 1) % estudiantes.size())
			);
			solicitud.setCategoria(categoria);
			solicitud.setPrioridad(prioridad);
			solicitud.setTecnicoAsignado(
				estado.getOrden() >= 3 ? tecnico : null
			);
			solicitud.setSupervisorAsignador(
				estado.getOrden() >= 3 ? supervisor : null
			);
			solicitud.setTitulo("Solicitud de demostración " + i);
			solicitud.setDescripcion(
				"Datos ficticios generados automáticamente para el ambiente de demostración."
			);
			solicitud.setUbicacionCampus("Campus principal");
			solicitud.setUbicacionAmbiente(
				"Bloque " +
					(char) ('A' + (i % 8)) +
					", ambiente " +
					(100 + (i % 50))
			);
			solicitud.setEstado(estado);
			solicitud.setFechaRegistro(registro);
			solicitud.setFechaLimiteSla(
				registro.plusHours(prioridad.getSlaMaxHoras())
			);
			solicitudRepository.save(solicitud);
		}
	}

	private record DemoUser(
		String codigo,
		String nombre,
		String apellido,
		String correo,
		String rol,
		String area
	) {}
}
