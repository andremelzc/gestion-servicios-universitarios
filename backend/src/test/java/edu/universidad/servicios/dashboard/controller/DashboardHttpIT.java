package edu.universidad.servicios.dashboard.controller;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import edu.universidad.servicios.auth.security.JwtService;
import edu.universidad.servicios.usuario.repository.UsuarioRepository;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.jdbc.Sql;
import org.testcontainers.containers.MySQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

/** TC-024/025: socket HTTP, filtro JWT, servicio y SQL MySQL sin mocks. */
@SpringBootTest(
    webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
    properties = {
        "spring.flyway.enabled=true",
        "spring.jpa.hibernate.ddl-auto=validate",
        "app.jwt.secret=qa06-synthetic-test-key-not-a-secret-123456789",
    }
)
@ActiveProfiles("test")
@Testcontainers
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
@Sql({
    "/datasets/dashboard-http-cleanup.sql",
    "/datasets/dashboard-150.sql",
    "/datasets/dashboard-http.sql",
    "/datasets/dashboard-mttr-4.sql",
})
@Sql(
    scripts = "/datasets/dashboard-http-cleanup.sql",
    executionPhase = Sql.ExecutionPhase.AFTER_TEST_METHOD
)
class DashboardHttpIT {

    @Container
    @ServiceConnection
    static final MySQLContainer<?> MYSQL = new MySQLContainer<>("mysql:8.0.36")
        .withDatabaseName("dashboard_qa06")
        .withUsername("test_user")
        .withPassword("test_password")
        .withCommand("--log-bin-trust-function-creators=1");

    private static final String RANGO = "desde=2026-07-12&hasta=2026-10-09";
    private static final List<String> RUTAS = List.of(
        "kpis",
        "por-categoria",
        "por-prioridad",
        "por-estado",
        "por-responsable",
        "vencidas"
    );
    private final HttpClient client = HttpClient.newBuilder()
        .connectTimeout(Duration.ofSeconds(10))
        .build();
    private final ObjectMapper mapper = new ObjectMapper();

    @LocalServerPort
    private int port;

    @Autowired
    private JwtService jwt;

    @Autowired
    private UsuarioRepository usuarios;

    @Autowired
    private JdbcTemplate jdbc;

    @Test
    void tc025AdministradorObtieneKpisYDistribucionesExactasDelDataset()
        throws Exception {
        String admin = token("QA06-ADMIN");
        kpis(get(admin, "kpis", RANGO), 150, 50, 100, 66.7, 9.4, 50);
        assertThat(
            series(get(admin, "por-categoria", RANGO))
        ).containsExactlyInAnyOrderEntriesOf(
            Map.of(
                "Soporte de Software",
                25L,
                "Redes y Wi-Fi",
                25L,
                "Equipos de Cómputo",
                25L,
                "Electricidad",
                38L,
                "Mobiliario",
                37L
            )
        );
        JsonNode prioridades = get(admin, "por-prioridad", RANGO);
        assertThat(nombres(prioridades)).containsExactly(
            "BAJA",
            "MEDIA",
            "ALTA",
            "CRITICA"
        );
        assertThat(valores(prioridades)).containsExactly(38L, 38L, 37L, 37L);
        JsonNode estados = get(admin, "por-estado", RANGO);
        assertThat(nombres(estados)).containsExactly(
            "REGISTRADA",
            "EN_EVALUACION",
            "ASIGNADA",
            "EN_ATENCION",
            "RESUELTA",
            "CERRADA"
        );
        assertThat(valores(estados)).containsExactly(
            14L,
            22L,
            9L,
            5L,
            30L,
            70L
        );
        assertThat(textos(estados, "colorHex")).containsExactly(
            "#6B7280",
            "#D97706",
            "#2563EB",
            "#7C3AED",
            "#059669",
            "#047857"
        );
        assertThat(
            series(get(admin, "por-responsable", RANGO))
        ).containsExactly(
            Map.entry("Carlos Ruiz", 18L),
            Map.entry("Lucía Vega", 11L),
            Map.entry("Tecnico QA", 8L)
        );
    }

    @Test
    void tc024SupervisorIgnoraAreaAjenaEnLosSeisEndpointsYAdminPuedeFiltrarla()
        throws Exception {
        String admin = token("QA06-ADMIN");
        for (String[] scope : List.of(
            new String[] {
                "QA06-SUP-TI",
                "Tecnologías de la Información",
                "Mantenimiento e Infraestructura",
            },
            new String[] {
                "QA06-SUP-MANT",
                "Mantenimiento e Infraestructura",
                "Tecnologías de la Información",
            }
        )) {
            String supervisor = token(scope[0]);
            String propia = "&idArea=" + area(scope[1]);
            String ajena = "&idArea=" + area(scope[2]);
            for (String ruta : RUTAS) {
                JsonNode esperado = get(admin, ruta, RANGO + propia);
                assertThat(get(supervisor, ruta, RANGO))
                    .as("%s sin filtro: %s", scope[0], ruta)
                    .isEqualTo(esperado);
                assertThat(get(supervisor, ruta, RANGO + ajena))
                    .as("%s intenta otra área: %s", scope[0], ruta)
                    .isEqualTo(esperado);
            }
            kpis(
                get(supervisor, "kpis", RANGO + ajena),
                75,
                25,
                50,
                66.7,
                9.4,
                25
            );
        }
        assertThat(
            series(get(token("QA06-SUP-TI"), "por-categoria", RANGO)).keySet()
        ).containsExactlyInAnyOrder(
            "Soporte de Software",
            "Redes y Wi-Fi",
            "Equipos de Cómputo"
        );
        assertThat(
            series(get(token("QA06-SUP-TI"), "por-responsable", RANGO)).keySet()
        ).containsExactlyInAnyOrder("Carlos Ruiz", "Tecnico QA");
    }

    @Test
    void tc024TecnicoSoloVeSusOchoAsignadasInclusoSiPideOtraArea()
        throws Exception {
        String tecnico = token("QA06-TEC");
        String filtro =
            RANGO + "&idArea=" + area("Mantenimiento e Infraestructura");
        kpis(get(tecnico, "kpis", filtro), 8, 7, 1, 12.5, 8.0, 7);
        for (String ruta : List.of(
            "por-categoria",
            "por-prioridad",
            "por-estado"
        )) {
            assertThat(
                valores(get(tecnico, ruta, filtro))
                    .stream()
                    .mapToLong(Long::longValue)
                    .sum()
            ).isEqualTo(8);
            assertThat(get(tecnico, ruta, filtro)).isEqualTo(
                get(tecnico, ruta, RANGO)
            );
        }
        assertThat(
            series(get(tecnico, "por-responsable", filtro))
        ).containsExactly(Map.entry("Tecnico QA", 8L));
        JsonNode vencidas = get(tecnico, "vencidas", filtro);
        assertThat(vencidas.path("totalElements").asInt()).isEqualTo(7);
        assertThat(
            textos(vencidas.path("content"), "tecnicoNombreCompleto")
        ).containsOnly("Tecnico QA");
    }

    @Test
    void tc024EstudianteRecibe403EnTodosLosEndpoints() throws Exception {
        String estudiante = jwt.generateToken(
            usuarios
                .findByCorreo("dash01.estudiante1@universidad.test")
                .orElseThrow()
        );
        for (String ruta : RUTAS) {
            assertThat(request(estudiante, ruta, RANGO).statusCode())
                .as(ruta)
                .isEqualTo(403);
        }
    }

    @Test
    void tc025MttrExcluyeAbiertaYReabiertaHastaQueVuelvaAResolverse()
        throws Exception {
        String admin = token("QA06-ADMIN");
        String rango = "desde=2025-01-01&hasta=2025-01-01";
        kpis(get(admin, "kpis", rango), 4, 1, 3, 75, 4.0, 1);
        assertThat(
            textos(get(admin, "vencidas", rango).path("content"), "codigo")
        ).containsExactly("DASH-02-MTTR-OPEN");
        jdbc.update(
            "UPDATE solicitudes SET estado='EN_ATENCION', fecha_resolucion=NULL WHERE codigo='DASH-02-MTTR-6H'"
        );
        kpis(get(admin, "kpis", rango), 4, 2, 2, 50, 3.0, 2);
        jdbc.update(
            "UPDATE solicitudes SET estado='RESUELTA', fecha_resolucion=DATE_ADD(fecha_registro, INTERVAL 6 HOUR) WHERE codigo='DASH-02-MTTR-6H'"
        );
        kpis(get(admin, "kpis", rango), 4, 1, 3, 75, 4.0, 1);
    }

    @Test
    void tc025VencidasPaginadasSinDuplicadosPorMayorRetrasoExcluyenAtendidasYSlaFuturo()
        throws Exception {
        String admin = token("QA06-ADMIN");
        jdbc.update(
            "UPDATE solicitudes SET fecha_limite_sla=DATE_ADD(UTC_TIMESTAMP(), INTERVAL 1 DAY) WHERE codigo='DASH-01-0001'"
        );
        assertThat(
            get(admin, "kpis", RANGO).path("vencidas").asInt()
        ).isEqualTo(49);
        List<Long> ids = new ArrayList<>();
        List<String> fechas = new ArrayList<>();
        for (int page = 0; page < 5; page++) {
            JsonNode resultado = get(
                admin,
                "vencidas",
                RANGO + "&size=10&page=" + page
            );
            assertThat(resultado.path("totalElements").asInt()).isEqualTo(49);
            assertThat(resultado.path("totalPages").asInt()).isEqualTo(5);
            assertThat(resultado.path("content").size()).isEqualTo(
                page == 4 ? 9 : 10
            );
            for (JsonNode item : resultado.path("content")) {
                ids.add(item.path("id").asLong());
                fechas.add(item.path("fechaLimiteSla").asText());
                assertThat(item.path("estadoCodigo").asText()).isIn(
                    "REGISTRADA",
                    "EN_EVALUACION",
                    "ASIGNADA",
                    "EN_ATENCION"
                );
                assertThat(item.path("codigo").asText()).isNotEqualTo(
                    "DASH-01-0001"
                );
            }
        }
        assertThat(ids).hasSize(49).doesNotHaveDuplicates();
        assertThat(fechas).isSorted();
        assertThat(
            get(admin, "vencidas", RANGO + "&size=10&page=5")
                .path("content")
                .isEmpty()
        ).isTrue();
    }

    @Test
    void tc025FechasInclusivasCerosYErroresEnTodosLosEndpoints()
        throws Exception {
        String admin = token("QA06-ADMIN");
        // Dos registros en ambos extremos del mismo día, y vecinos fuera del intervalo.
        jdbc.update(
            "UPDATE solicitudes SET fecha_registro='2024-01-02 00:00:00', fecha_resolucion=NULL WHERE codigo='DASH-01-0001'"
        );
        jdbc.update(
            "UPDATE solicitudes SET fecha_registro='2024-01-02 23:59:59', fecha_resolucion=NULL WHERE codigo='DASH-01-0002'"
        );
        jdbc.update(
            "UPDATE solicitudes SET fecha_registro='2024-01-01 23:59:59' WHERE codigo='DASH-01-0003'"
        );
        jdbc.update(
            "UPDATE solicitudes SET fecha_registro='2024-01-03 00:00:00' WHERE codigo='DASH-01-0004'"
        );
        String dia = "desde=2024-01-02&hasta=2024-01-02";
        kpis(get(admin, "kpis", dia), 2, 2, 0, 0, null, 2);
        for (String ruta : List.of(
            "por-categoria",
            "por-prioridad",
            "por-estado",
            "por-responsable"
        )) {
            assertThat(
                valores(get(admin, ruta, dia))
                    .stream()
                    .mapToLong(Long::longValue)
                    .sum()
            )
                .as(ruta)
                .isEqualTo(2);
        }
        assertThat(valores(get(admin, "por-prioridad", dia))).containsExactly(
            1L,
            1L,
            0L,
            0L
        );
        assertThat(valores(get(admin, "por-estado", dia))).containsExactly(
            2L,
            0L,
            0L,
            0L,
            0L,
            0L
        );
        assertThat(
            textos(get(admin, "vencidas", dia).path("content"), "codigo")
        ).containsExactlyInAnyOrder("DASH-01-0001", "DASH-01-0002");
        String vacio = "desde=2020-01-01&hasta=2020-01-01";
        kpis(get(admin, "kpis", vacio), 0, 0, 0, 0, null, 0);
        for (String ruta : List.of("por-categoria", "por-responsable")) {
            assertThat(get(admin, ruta, vacio).isEmpty()).isTrue();
        }
        assertThat(valores(get(admin, "por-prioridad", vacio))).containsExactly(
            0L,
            0L,
            0L,
            0L
        );
        assertThat(valores(get(admin, "por-estado", vacio))).containsExactly(
            0L,
            0L,
            0L,
            0L,
            0L,
            0L
        );
        assertThat(
            get(admin, "vencidas", vacio).path("totalElements").asInt()
        ).isZero();
        for (String ruta : RUTAS) {
            assertThat(
                request(
                    admin,
                    ruta,
                    "desde=2026-10-02&hasta=2026-10-01"
                ).statusCode()
            )
                .as(ruta)
                .isEqualTo(400);
            assertThat(
                request(admin, ruta, "desde=fecha-invalida").statusCode()
            )
                .as(ruta)
                .isEqualTo(400);
        }
    }

    @Test
    void tc025RangoOmitidoUsaUltimosTreintaDiasEnTodosLosEndpoints()
        throws Exception {
        String admin = token("QA06-ADMIN");
        java.time.LocalDate hasta = java.time.LocalDate.now(clock);
        String explicito = "desde=" + hasta.minusDays(29) + "&hasta=" + hasta;
        for (String ruta : RUTAS) {
            assertThat(get(admin, ruta, ""))
                .as("rango por defecto: %s", ruta)
                .isEqualTo(get(admin, ruta, explicito));
        }
    }

    @Autowired
    private java.time.Clock clock;

    private String token(String codigo) {
        return jwt.generateToken(
            usuarios.findByCorreo(codigo + "@universidad.test").orElseThrow()
        );
    }

    private int area(String nombre) {
        return jdbc.queryForObject(
            "SELECT id FROM areas WHERE nombre=?",
            Integer.class,
            nombre
        );
    }

    private HttpResponse<String> request(
        String token,
        String ruta,
        String query
    ) throws Exception {
        HttpRequest.Builder builder = HttpRequest.newBuilder(
            URI.create(
                "http://localhost:" +
                    port +
                    "/api/v1/dashboard/" +
                    ruta +
                    "?" +
                    query
            )
        )
            .timeout(Duration.ofSeconds(15))
            .GET();
        if (token != null) builder.header("Authorization", "Bearer " + token);
        return client.send(
            builder.build(),
            HttpResponse.BodyHandlers.ofString()
        );
    }

    private JsonNode get(String token, String ruta, String query)
        throws Exception {
        HttpResponse<String> response = request(token, ruta, query);
        assertThat(response.statusCode())
            .as("GET %s?%s: %s", ruta, query, response.body())
            .isEqualTo(200);
        return mapper.readTree(response.body());
    }

    private void kpis(
        JsonNode actual,
        long registradas,
        long pendientes,
        long atendidas,
        double porcentaje,
        Double mttr,
        long vencidas
    ) {
        assertThat(actual.path("registradas").asLong()).isEqualTo(registradas);
        assertThat(actual.path("pendientes").asLong()).isEqualTo(pendientes);
        assertThat(actual.path("atendidas").asLong()).isEqualTo(atendidas);
        assertThat(actual.path("porcentajeResueltas").asDouble()).isEqualTo(
            porcentaje
        );
        if (mttr == null) assertThat(
            actual.path("mttrHoras").isNull()
        ).isTrue();
        else assertThat(actual.path("mttrHoras").asDouble()).isEqualTo(mttr);
        assertThat(actual.path("vencidas").asLong()).isEqualTo(vencidas);
    }

    private Map<String, Long> series(JsonNode items) {
        Map<String, Long> result = new java.util.LinkedHashMap<>();
        items.forEach(item ->
            result.put(
                item.path("nombre").asText(),
                item.path("valor").asLong()
            )
        );
        assertThat(result).hasSize(items.size());
        return result;
    }

    private List<String> nombres(JsonNode items) {
        return textos(items, "nombre");
    }

    private List<String> textos(JsonNode items, String campo) {
        List<String> result = new ArrayList<>();
        items.forEach(item -> result.add(item.path(campo).asText()));
        return result;
    }

    private List<Long> valores(JsonNode items) {
        List<Long> result = new ArrayList<>();
        items.forEach(item -> result.add(item.path("valor").asLong()));
        return result;
    }
}
