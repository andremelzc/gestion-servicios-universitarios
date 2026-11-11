package edu.universidad.servicios.catalogo.controller;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import edu.universidad.servicios.auth.security.JwtService;
import edu.universidad.servicios.usuario.repository.UsuarioRepository;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.security.SecureRandom;
import java.time.Duration;
import java.util.Base64;
import java.util.List;
import java.util.concurrent.TimeUnit;
import javax.sql.DataSource;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.MySQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@SpringBootTest(
    webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
    properties = {
        "spring.flyway.enabled=true",
        "spring.jpa.hibernate.ddl-auto=validate",
    }
)
@ActiveProfiles("test")
@Testcontainers
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
class CatalogosHttpIT {

    @DynamicPropertySource
    static void jwtSecret(DynamicPropertyRegistry registry) {
        byte[] secret = new byte[32];
        new SecureRandom().nextBytes(secret);
        registry.add("app.jwt.secret", () ->
            Base64.getEncoder().encodeToString(secret)
        );
    }

    @Container
    @ServiceConnection
    static final MySQLContainer<?> MYSQL = new MySQLContainer<>("mysql:8.0.36")
        .withDatabaseName("catalogos_test")
        .withUsername("test_user")
        .withPassword("test_password")
        .withCommand("--log-bin-trust-function-creators=1");

    @LocalServerPort
    int port;

    @Autowired
    JwtService jwt;

    @Autowired
    UsuarioRepository usuarios;

    @Autowired
    JdbcTemplate jdbc;

    @Autowired
    DataSource dataSource;

    final HttpClient client = HttpClient.newBuilder()
        .connectTimeout(Duration.ofSeconds(10))
        .build();
    final ObjectMapper mapper = new ObjectMapper();

    @BeforeEach
    void usuariosDePrueba() {
        for (String rol : List.of(
            "ADMIN",
            "ESTUDIANTE",
            "TECNICO",
            "SUPERVISOR"
        )) {
            jdbc.update(
                "INSERT IGNORE INTO usuarios (codigo_institucional, nombre, apellido, correo, password_hash, id_rol, activo) SELECT ?, 'Test', 'Catalogos', ?, 'test-only', id, TRUE FROM roles WHERE nombre = ?",
                "CAT-" + rol,
                rol + "@catalogos.test",
                "ROLE_" + rol
            );
        }
    }

    String token(String rol) {
        return jwt.generateToken(
            usuarios.findByCorreo(rol + "@catalogos.test").orElseThrow()
        );
    }

    HttpResponse<String> request(
        String rol,
        String method,
        String path,
        String body
    ) throws Exception {
        var b = HttpRequest.newBuilder(
            URI.create("http://localhost:" + port + "/api/v1/" + path)
        ).timeout(Duration.ofSeconds(15));
        if (rol != null) b.header("Authorization", "Bearer " + token(rol));
        if (body != null) b.header("Content-Type", "application/json");
        b.method(
            method,
            body == null
                ? HttpRequest.BodyPublishers.noBody()
                : HttpRequest.BodyPublishers.ofString(body)
        );
        return client.send(b.build(), HttpResponse.BodyHandlers.ofString());
    }

    JsonNode expect(
        String rol,
        String method,
        String path,
        String body,
        int status
    ) throws Exception {
        var r = request(rol, method, path, body);
        assertThat(r.statusCode())
            .as("%s %s (%s): %s", method, path, rol, r.body())
            .isEqualTo(status);
        return r.body().isBlank()
            ? mapper.nullNode()
            : mapper.readTree(r.body());
    }

    boolean contains(JsonNode array, int id) {
        for (JsonNode item : array)
            if (item.path("id").asInt() == id) return true;
        return false;
    }

    @Test
    void conflictosDeUnicidadConcurrentesResponden409() throws Exception {
        int area = expect(
            "ADMIN",
            "POST",
            "areas",
            "{\"nombre\":\"Area concurrencia categorias\",\"correoContacto\":\"concurrencia@catalogos.test\"}",
            201
        )
            .path("id")
            .asInt();
        String[][] casos = {
            {
                "INSERT INTO areas (nombre, correo_contacto, activo) VALUES ('Area carrera unica', 'a@catalogos.test', TRUE)",
                "areas",
                "{\"nombre\":\"Area carrera unica\",\"correoContacto\":\"b@catalogos.test\"}",
            },
            {
                "INSERT INTO categorias (nombre, id_area, tiempo_sla_horas, activo) VALUES ('Categoria carrera unica', " +
                    area +
                    ", 1, TRUE)",
                "categorias",
                "{\"nombre\":\"Categoria carrera unica\",\"idArea\":" +
                    area +
                    ",\"tiempoSlaHoras\":1}",
            },
            {
                "INSERT INTO prioridades (nivel, ponderador, sla_max_horas, activo) VALUES ('Carrera unica', 1, 1, TRUE)",
                "prioridades",
                "{\"nivel\":\"Carrera unica\",\"ponderador\":1,\"slaMaxHoras\":1}",
            },
        };
        String adminToken = token("ADMIN");
        for (String[] caso : casos) {
            try (var connection = dataSource.getConnection()) {
                connection.setAutoCommit(false);
                try (var statement = connection.createStatement()) {
                    statement.executeUpdate(caso[0]);
                }
                var http = HttpRequest.newBuilder(
                    URI.create(
                        "http://localhost:" + port + "/api/v1/" + caso[1]
                    )
                )
                    .timeout(Duration.ofSeconds(15))
                    .header("Authorization", "Bearer " + adminToken)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(caso[2]))
                    .build();
                var response = client.sendAsync(
                    http,
                    HttpResponse.BodyHandlers.ofString()
                );
                // The duplicate insert waits for the competing uncommitted unique key.
                Thread.sleep(1000);
                assertThat(response.isDone())
                    .as(caso[1] + " espera la transacción competidora")
                    .isFalse();
                connection.commit();
                var result = response.get(15, TimeUnit.SECONDS);
                assertThat(result.statusCode())
                    .as(caso[1] + ": " + result.body())
                    .isEqualTo(409);
            }
        }
    }

    @Test
    void bajaEsperaInsercionDeUsuarioYDetectaUsuarioActivo() throws Exception {
        int area = expect(
            "ADMIN",
            "POST",
            "areas",
            "{\"nombre\":\"Area carrera usuario\",\"correoContacto\":\"carrera@catalogos.test\"}",
            201
        )
            .path("id")
            .asInt();
        String adminToken = token("ADMIN");
        try (var connection = dataSource.getConnection()) {
            connection.setAutoCommit(false);
            try (
                var statement = connection.prepareStatement(
                    "INSERT INTO usuarios (codigo_institucional, nombre, apellido, correo, password_hash, id_rol, id_area, activo) SELECT 'CAT-CARRERA', 'Test', 'Carrera', 'carrera@catalogos.test', 'test-only', id, ?, TRUE FROM roles WHERE nombre = 'ROLE_TECNICO'"
                )
            ) {
                statement.setInt(1, area);
                statement.executeUpdate();
            }
            var http = HttpRequest.newBuilder(
                URI.create("http://localhost:" + port + "/api/v1/areas/" + area)
            )
                .timeout(Duration.ofSeconds(15))
                .header("Authorization", "Bearer " + adminToken)
                .DELETE()
                .build();
            var response = client.sendAsync(
                http,
                HttpResponse.BodyHandlers.ofString()
            );
            Thread.sleep(1000);
            assertThat(response.isDone()).isFalse();
            connection.commit();
            assertThat(
                response.get(15, TimeUnit.SECONDS).statusCode()
            ).isEqualTo(409);
        }
        assertThat(
            jdbc.queryForObject(
                "SELECT COUNT(*) FROM usuarios u JOIN areas a ON a.id = u.id_area WHERE u.codigo_institucional = 'CAT-CARRERA' AND u.activo = TRUE AND a.activo = TRUE",
                Integer.class
            )
        ).isEqualTo(1);
    }

    @Test
    void categoriaActivaImpideBajaDeAreaYConservaVisibilidad()
        throws Exception {
        int area = expect(
            "ADMIN",
            "POST",
            "areas",
            "{\"nombre\":\"Area categoria activa\",\"correoContacto\":\"activa@catalogos.test\"}",
            201
        )
            .path("id")
            .asInt();
        int categoria = expect(
            "ADMIN",
            "POST",
            "categorias",
            "{\"nombre\":\"Categoria area inactiva\",\"idArea\":" +
                area +
                ",\"tiempoSlaHoras\":1}",
            201
        )
            .path("id")
            .asInt();
        var conflicto = request("ADMIN", "DELETE", "areas/" + area, null);
        assertThat(conflicto.statusCode()).isEqualTo(409);
        assertThat(conflicto.body()).contains(
            "Reasigne o desactive las categorías del área primero"
        );
        assertThat(
            expect("ADMIN", "GET", "areas/" + area, null, 200)
                .path("activo")
                .asBoolean()
        ).isTrue();
        assertThat(
            contains(
                expect(
                    "ESTUDIANTE",
                    "GET",
                    "categorias?idArea=" + area,
                    null,
                    200
                ),
                categoria
            )
        ).isTrue();
        expect("ESTUDIANTE", "GET", "categorias/" + categoria, null, 200);
        expect("ADMIN", "DELETE", "categorias/" + categoria, null, 204);
        expect("ADMIN", "DELETE", "areas/" + area, null, 204);
        assertThat(
            expect(
                "ADMIN",
                "GET",
                "areas/" + area + "?incluirInactivos=true",
                null,
                200
            )
                .path("activo")
                .asBoolean()
        ).isFalse();
    }

    @Test
    void bajasYMutacionesDeCategoriaSeSerializanPorArea() throws Exception {
        int origen = expect(
            "ADMIN",
            "POST",
            "areas",
            "{\"nombre\":\"Carrera origen categoria\",\"correoContacto\":\"origen-carrera@catalogos.test\"}",
            201
        )
            .path("id")
            .asInt();
        int destino = expect(
            "ADMIN",
            "POST",
            "areas",
            "{\"nombre\":\"Carrera destino categoria\",\"correoContacto\":\"destino-carrera@catalogos.test\"}",
            201
        )
            .path("id")
            .asInt();
        int categoria = expect(
            "ADMIN",
            "POST",
            "categorias",
            "{\"nombre\":\"Carrera categoria existente\",\"idArea\":" +
                origen +
                ",\"tiempoSlaHoras\":1}",
            201
        )
            .path("id")
            .asInt();
        expect("ADMIN", "DELETE", "categorias/" + categoria, null, 204);

        for (String operacion : List.of("crear", "reasignar", "reactivar")) {
            int area = operacion.equals("reactivar") ? origen : destino;
            try (var connection = dataSource.getConnection()) {
                connection.setAutoCommit(false);
                try (
                    var statement = connection.prepareStatement(
                        "UPDATE areas SET activo = FALSE WHERE id = ?"
                    )
                ) {
                    statement.setInt(1, area);
                    statement.executeUpdate();
                }
                String path = operacion.equals("crear")
                    ? "categorias"
                    : "categorias/" +
                      categoria +
                      (operacion.equals("reactivar") ? "/reactivar" : "");
                String method = operacion.equals("crear") ? "POST" : "PUT";
                String body = operacion.equals("reactivar")
                    ? null
                    : "{\"nombre\":\"Carrera " +
                      operacion +
                      "\",\"idArea\":" +
                      area +
                      ",\"tiempoSlaHoras\":1}";
                var future = java.util.concurrent.CompletableFuture.supplyAsync(
                    () -> {
                        try {
                            return request("ADMIN", method, path, body);
                        } catch (Exception e) {
                            throw new RuntimeException(e);
                        }
                    }
                );
                Thread.sleep(500);
                assertThat(future.isDone()).as(operacion).isFalse();
                connection.commit();
                var respuesta = future.get(15, TimeUnit.SECONDS);
                assertThat(respuesta.statusCode())
                    .as(operacion + ": " + respuesta.body())
                    .isEqualTo(operacion.equals("reactivar") ? 409 : 400);
            }
            expect("ADMIN", "PUT", "areas/" + area + "/reactivar", null, 200);
        }
    }

    @Test
    void actualizarAreaEsperaYConservaEstadoActivoConCategoria()
        throws Exception {
        int area = expect(
            "ADMIN",
            "POST",
            "areas",
            "{\"nombre\":\"Area carrera edicion\",\"correoContacto\":\"edicion-carrera@catalogos.test\"}",
            201
        )
            .path("id")
            .asInt();
        expect("ADMIN", "DELETE", "areas/" + area, null, 204);
        String adminToken = token("ADMIN");
        try (var connection = dataSource.getConnection()) {
            connection.setAutoCommit(false);
            try (
                var update = connection.prepareStatement(
                    "UPDATE areas SET activo = TRUE WHERE id = ?"
                )
            ) {
                update.setInt(1, area);
                update.executeUpdate();
            }
            try (
                var insert = connection.prepareStatement(
                    "INSERT INTO categorias (nombre, id_area, tiempo_sla_horas, activo) VALUES ('Categoria carrera edicion', ?, 1, TRUE)"
                )
            ) {
                insert.setInt(1, area);
                insert.executeUpdate();
            }
            var http = HttpRequest.newBuilder(
                URI.create("http://localhost:" + port + "/api/v1/areas/" + area)
            )
                .timeout(Duration.ofSeconds(15))
                .header("Authorization", "Bearer " + adminToken)
                .header("Content-Type", "application/json")
                .PUT(
                    HttpRequest.BodyPublishers.ofString(
                        "{\"nombre\":\"Area carrera editada\",\"correoContacto\":\"editada-carrera@catalogos.test\"}"
                    )
                )
                .build();
            var future = client.sendAsync(
                http,
                HttpResponse.BodyHandlers.ofString()
            );
            Thread.sleep(1000);
            assertThat(future.isDone()).isFalse();
            connection.commit();
            var response = future.get(15, TimeUnit.SECONDS);
            assertThat(response.statusCode())
                .as(response.body())
                .isEqualTo(200);
            assertThat(
                mapper.readTree(response.body()).path("activo").asBoolean()
            ).isTrue();
        }
        assertThat(
            jdbc.queryForObject(
                "SELECT COUNT(*) FROM categorias c JOIN areas a ON a.id = c.id_area WHERE c.id_area = ? AND c.activo = TRUE AND a.activo = TRUE",
                Integer.class,
                area
            )
        ).isEqualTo(1);
    }

    @Test
    void reactivarAreaEsperaYConservaDatosConfirmados() throws Exception {
        int area = expect(
            "ADMIN",
            "POST",
            "areas",
            "{\"nombre\":\"Area carrera reactivacion\",\"correoContacto\":\"reactivacion-carrera@catalogos.test\"}",
            201
        )
            .path("id")
            .asInt();
        expect("ADMIN", "DELETE", "areas/" + area, null, 204);
        String adminToken = token("ADMIN");
        try (var connection = dataSource.getConnection()) {
            connection.setAutoCommit(false);
            try (
                var update = connection.prepareStatement(
                    "UPDATE areas SET nombre = 'Area nombre confirmado' WHERE id = ?"
                )
            ) {
                update.setInt(1, area);
                update.executeUpdate();
            }
            var http = HttpRequest.newBuilder(
                URI.create(
                    "http://localhost:" +
                        port +
                        "/api/v1/areas/" +
                        area +
                        "/reactivar"
                )
            )
                .timeout(Duration.ofSeconds(15))
                .header("Authorization", "Bearer " + adminToken)
                .PUT(HttpRequest.BodyPublishers.noBody())
                .build();
            var future = client.sendAsync(
                http,
                HttpResponse.BodyHandlers.ofString()
            );
            Thread.sleep(1000);
            assertThat(future.isDone()).isFalse();
            connection.commit();
            var response = future.get(15, TimeUnit.SECONDS);
            assertThat(response.statusCode())
                .as(response.body())
                .isEqualTo(200);
            assertThat(
                mapper.readTree(response.body()).path("nombre").asText()
            ).isEqualTo("Area nombre confirmado");
            assertThat(
                mapper.readTree(response.body()).path("activo").asBoolean()
            ).isTrue();
        }
    }

    @Test
    void bajaEsperaCategoriaConfirmadaYRechaza() throws Exception {
        int area = expect(
            "ADMIN",
            "POST",
            "areas",
            "{\"nombre\":\"Carrera baja categoria\",\"correoContacto\":\"baja-carrera@catalogos.test\"}",
            201
        )
            .path("id")
            .asInt();
        try (var connection = dataSource.getConnection()) {
            connection.setAutoCommit(false);
            try (
                var lock = connection.prepareStatement(
                    "SELECT id FROM areas WHERE id = ? FOR UPDATE"
                )
            ) {
                lock.setInt(1, area);
                lock.executeQuery().close();
            }
            try (
                var insert = connection.prepareStatement(
                    "INSERT INTO categorias (nombre, id_area, tiempo_sla_horas, activo) VALUES ('Carrera confirmada', ?, 1, TRUE)"
                )
            ) {
                insert.setInt(1, area);
                insert.executeUpdate();
            }
            var future = java.util.concurrent.CompletableFuture.supplyAsync(
                () -> {
                    try {
                        return request(
                            "ADMIN",
                            "DELETE",
                            "areas/" + area,
                            null
                        );
                    } catch (Exception e) {
                        throw new RuntimeException(e);
                    }
                }
            );
            Thread.sleep(500);
            assertThat(future.isDone()).isFalse();
            connection.commit();
            assertThat(future.get(15, TimeUnit.SECONDS).statusCode()).isEqualTo(
                409
            );
        }
    }

    @Test
    void reasignacionesOpuestasNoInterbloquean() throws Exception {
        int a = expect(
            "ADMIN",
            "POST",
            "areas",
            "{\"nombre\":\"Carrera orden A\",\"correoContacto\":\"orden-a@catalogos.test\"}",
            201
        )
            .path("id")
            .asInt();
        int b = expect(
            "ADMIN",
            "POST",
            "areas",
            "{\"nombre\":\"Carrera orden B\",\"correoContacto\":\"orden-b@catalogos.test\"}",
            201
        )
            .path("id")
            .asInt();
        int c1 = expect(
            "ADMIN",
            "POST",
            "categorias",
            "{\"nombre\":\"Carrera orden uno\",\"idArea\":" +
                a +
                ",\"tiempoSlaHoras\":1}",
            201
        )
            .path("id")
            .asInt();
        int c2 = expect(
            "ADMIN",
            "POST",
            "categorias",
            "{\"nombre\":\"Carrera orden dos\",\"idArea\":" +
                b +
                ",\"tiempoSlaHoras\":1}",
            201
        )
            .path("id")
            .asInt();
        try (var connection = dataSource.getConnection()) {
            connection.setAutoCommit(false);
            try (
                var lock = connection.prepareStatement(
                    "SELECT id FROM areas WHERE id = ? FOR UPDATE"
                )
            ) {
                lock.setInt(1, a);
                lock.executeQuery().close();
            }
            var f1 = java.util.concurrent.CompletableFuture.supplyAsync(() -> {
                try {
                    return request(
                        "ADMIN",
                        "PUT",
                        "categorias/" + c1,
                        "{\"nombre\":\"Carrera orden uno\",\"idArea\":" +
                            b +
                            ",\"tiempoSlaHoras\":1}"
                    );
                } catch (Exception e) {
                    throw new RuntimeException(e);
                }
            });
            var f2 = java.util.concurrent.CompletableFuture.supplyAsync(() -> {
                try {
                    return request(
                        "ADMIN",
                        "PUT",
                        "categorias/" + c2,
                        "{\"nombre\":\"Carrera orden dos\",\"idArea\":" +
                            a +
                            ",\"tiempoSlaHoras\":1}"
                    );
                } catch (Exception e) {
                    throw new RuntimeException(e);
                }
            });
            Thread.sleep(500);
            assertThat(f1.isDone()).isFalse();
            assertThat(f2.isDone()).isFalse();
            connection.commit();
            assertThat(f1.get(15, TimeUnit.SECONDS).statusCode()).isEqualTo(
                200
            );
            assertThat(f2.get(15, TimeUnit.SECONDS).statusCode()).isEqualTo(
                200
            );
        }
    }

    @Test
    void seguridadRealProtegeTodasLasEscrituras() throws Exception {
        String[][] writes = {
            { "POST", "areas", "{}" },
            { "PUT", "areas/999999", "{}" },
            { "DELETE", "areas/999999", null },
            { "PUT", "areas/999999/reactivar", null },
            { "POST", "categorias", "{}" },
            { "PUT", "categorias/999999", "{}" },
            { "DELETE", "categorias/999999", null },
            { "PUT", "categorias/999999/reactivar", null },
            { "POST", "prioridades", "{}" },
            { "PUT", "prioridades/999999", "{}" },
            { "DELETE", "prioridades/999999", null },
            { "PUT", "prioridades/999999/reactivar", null },
            { "PUT", "estados/REGISTRADA", "{}" },
        };
        for (String[] w : writes) {
            int anonymous = request(null, w[0], w[1], w[2]).statusCode();
            assertThat(anonymous)
                .as("anonimo %s %s", w[0], w[1])
                .isIn(401, 403);
            for (String rol : List.of("ESTUDIANTE", "TECNICO", "SUPERVISOR"))
                expect(rol, w[0], w[1], w[2], 403);
            int admin = request("ADMIN", w[0], w[1], w[2]).statusCode();
            assertThat(admin)
                .as("admin alcanza controlador %s %s", w[0], w[1])
                .isIn(400, 404);
        }
        for (String path : List.of(
            "areas",
            "categorias",
            "prioridades",
            "estados"
        )) {
            assertThat(request(null, "GET", path, null).statusCode()).isIn(
                401,
                403
            );
            expect("ESTUDIANTE", "GET", path, null, 200);
        }
    }

    @Test
    void areasCrudVisibilidadYValidaciones() throws Exception {
        String body =
            "{\"nombre\":\"CAT Area HTTP\",\"correoContacto\":\"area@catalogos.test\"}";
        var created = request("ADMIN", "POST", "areas", body);
        assertThat(created.statusCode()).as(created.body()).isEqualTo(201);
        int id = mapper.readTree(created.body()).path("id").asInt();
        assertThat(created.headers().firstValue("Location")).hasValue(
            "/api/v1/areas/" + id
        );
        expect("ADMIN", "POST", "areas", body, 409);
        expect(
            "ADMIN",
            "POST",
            "areas",
            "{\"nombre\":\" \" ,\"correoContacto\":\"incorrecto\"}",
            400
        );
        expect(
            "ADMIN",
            "PUT",
            "areas/" + id,
            "{\"nombre\":\"CAT Area Editada\",\"correoContacto\":\"nueva@catalogos.test\"}",
            200
        );
        assertThat(
            expect("ESTUDIANTE", "GET", "areas/" + id, null, 200)
                .path("nombre")
                .asText()
        ).isEqualTo("CAT Area Editada");
        expect("ADMIN", "DELETE", "areas/" + id, null, 204);
        expect("ESTUDIANTE", "GET", "areas/" + id, null, 404);
        expect("ADMIN", "GET", "areas/" + id, null, 404);
        expect(
            "ESTUDIANTE",
            "GET",
            "areas/" + id + "?incluirInactivos=true",
            null,
            404
        );
        assertThat(
            expect(
                "ADMIN",
                "GET",
                "areas/" + id + "?incluirInactivos=true",
                null,
                200
            )
                .path("activo")
                .asBoolean()
        ).isFalse();
        assertThat(
            contains(expect("ADMIN", "GET", "areas", null, 200), id)
        ).isFalse();
        assertThat(
            contains(
                expect(
                    "ADMIN",
                    "GET",
                    "areas?incluirInactivos=true",
                    null,
                    200
                ),
                id
            )
        ).isTrue();
        assertThat(
            contains(
                expect(
                    "ESTUDIANTE",
                    "GET",
                    "areas?incluirInactivos=true",
                    null,
                    200
                ),
                id
            )
        ).isFalse();
        assertThat(
            expect("ADMIN", "PUT", "areas/" + id + "/reactivar", null, 200)
                .path("activo")
                .asBoolean()
        ).isTrue();
    }

    @Test
    void categoriasCrudFiltroYDependenciaArea() throws Exception {
        int area = expect(
            "ADMIN",
            "POST",
            "areas",
            "{\"nombre\":\"CAT Area Categoria\",\"correoContacto\":\"categoria@catalogos.test\"}",
            201
        )
            .path("id")
            .asInt();
        String body =
            "{\"nombre\":\"CAT Categoria HTTP\",\"descripcion\":\"prueba\",\"idArea\":" +
            area +
            ",\"tiempoSlaHoras\":24}";
        int id = expect("ADMIN", "POST", "categorias", body, 201)
            .path("id")
            .asInt();
        expect("ADMIN", "POST", "categorias", body, 409);
        expect(
            "ADMIN",
            "POST",
            "categorias",
            "{\"nombre\":\"invalida\",\"idArea\":" +
                area +
                ",\"tiempoSlaHoras\":0}",
            400
        );
        expect(
            "ADMIN",
            "POST",
            "categorias",
            "{\"nombre\":\"invalida\",\"idArea\":999999,\"tiempoSlaHoras\":1}",
            400
        );
        String edit =
            "{\"nombre\":\"CAT Categoria Editada\",\"idArea\":" +
            area +
            ",\"tiempoSlaHoras\":12}";
        assertThat(
            expect("ADMIN", "PUT", "categorias/" + id, edit, 200)
                .path("tiempoSlaHoras")
                .asInt()
        ).isEqualTo(12);
        expect("ESTUDIANTE", "GET", "categorias/" + id, null, 200);
        assertThat(
            contains(
                expect(
                    "ESTUDIANTE",
                    "GET",
                    "categorias?idArea=" + area,
                    null,
                    200
                ),
                id
            )
        ).isTrue();
        expect("ADMIN", "DELETE", "categorias/" + id, null, 204);
        expect("ESTUDIANTE", "GET", "categorias/" + id, null, 404);
        expect("ADMIN", "GET", "categorias/" + id, null, 404);
        expect(
            "ESTUDIANTE",
            "GET",
            "categorias/" + id + "?incluirInactivos=true",
            null,
            404
        );
        assertThat(
            expect(
                "ADMIN",
                "GET",
                "categorias/" + id + "?incluirInactivos=true",
                null,
                200
            )
                .path("activo")
                .asBoolean()
        ).isFalse();
        assertThat(
            contains(
                expect(
                    "ADMIN",
                    "GET",
                    "categorias?incluirInactivos=true&idArea=" + area,
                    null,
                    200
                ),
                id
            )
        ).isTrue();
        assertThat(
            contains(
                expect(
                    "ESTUDIANTE",
                    "GET",
                    "categorias?incluirInactivos=true",
                    null,
                    200
                ),
                id
            )
        ).isFalse();
        expect("ADMIN", "DELETE", "areas/" + area, null, 204);
        expect("ADMIN", "PUT", "categorias/" + id + "/reactivar", null, 409);
        expect("ADMIN", "PUT", "areas/" + area + "/reactivar", null, 200);
        assertThat(
            expect("ADMIN", "PUT", "categorias/" + id + "/reactivar", null, 200)
                .path("activo")
                .asBoolean()
        ).isTrue();
    }

    @Test
    void prioridadesCrudVisibilidadYValidacion() throws Exception {
        String body =
            "{\"nivel\":\"CAT HTTP\",\"ponderador\":90,\"slaMaxHoras\":24}";
        int id = expect("ADMIN", "POST", "prioridades", body, 201)
            .path("id")
            .asInt();
        expect("ADMIN", "POST", "prioridades", body, 409);
        expect(
            "ADMIN",
            "POST",
            "prioridades",
            "{\"nivel\":\"invalida\",\"ponderador\":1,\"slaMaxHoras\":0}",
            400
        );
        assertThat(
            expect(
                "ADMIN",
                "PUT",
                "prioridades/" + id,
                "{\"nivel\":\"CAT EDITADA\",\"ponderador\":91,\"slaMaxHoras\":12}",
                200
            )
                .path("slaMaxHoras")
                .asInt()
        ).isEqualTo(12);
        expect("ADMIN", "DELETE", "prioridades/" + id, null, 204);
        assertThat(
            contains(expect("ADMIN", "GET", "prioridades", null, 200), id)
        ).isFalse();
        assertThat(
            contains(
                expect(
                    "ADMIN",
                    "GET",
                    "prioridades?incluirInactivos=true",
                    null,
                    200
                ),
                id
            )
        ).isTrue();
        assertThat(
            contains(
                expect(
                    "ESTUDIANTE",
                    "GET",
                    "prioridades?incluirInactivos=true",
                    null,
                    200
                ),
                id
            )
        ).isFalse();
        assertThat(
            expect(
                "ADMIN",
                "PUT",
                "prioridades/" + id + "/reactivar",
                null,
                200
            )
                .path("activo")
                .asBoolean()
        ).isTrue();
    }

    @Test
    void estadosSoloModificanPresentacion() throws Exception {
        JsonNode before = null;
        for (JsonNode e : expect("ADMIN", "GET", "estados", null, 200))
            if (e.path("codigo").asText().equals("REGISTRADA")) before = e;
        assertThat(before).isNotNull();
        expect(
            "ADMIN",
            "PUT",
            "estados/REGISTRADA",
            "{\"nombreVisible\":\"X\",\"colorHex\":\"rojo\"}",
            400
        );
        JsonNode after = expect(
            "ADMIN",
            "PUT",
            "estados/REGISTRADA",
            "{\"nombreVisible\":\"Recibida HTTP\",\"descripcion\":\"Prueba\",\"colorHex\":\"#123ABC\",\"codigo\":\"CAMBIADO\",\"orden\":99,\"esFinal\":true}",
            200
        );
        assertThat(after.path("nombreVisible").asText()).isEqualTo(
            "Recibida HTTP"
        );
        for (String field : List.of("codigo", "orden", "esFinal"))
            assertThat(after.path(field)).isEqualTo(before.path(field));
        expect(
            "ADMIN",
            "PUT",
            "estados/NO_EXISTE",
            "{\"nombreVisible\":\"X\",\"colorHex\":\"#123ABC\"}",
            404
        );
    }
}
