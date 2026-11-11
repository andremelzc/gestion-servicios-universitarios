package edu.universidad.servicios.usuario.integration;

import static org.assertj.core.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import edu.universidad.servicios.auth.security.JwtService;
import edu.universidad.servicios.catalogo.service.AreaService;
import edu.universidad.servicios.config.AbstractIntegrationTest;
import edu.universidad.servicios.usuario.domain.*;
import edu.universidad.servicios.usuario.dto.*;
import edu.universidad.servicios.usuario.repository.*;
import edu.universidad.servicios.usuario.service.AdminUsuarioService;
import java.util.*;
import java.util.concurrent.*;
import org.junit.jupiter.api.*;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.server.ResponseStatusException;

@TestPropertySource(properties = "spring.flyway.enabled=true")
class AdminUsuariosIT extends AbstractIntegrationTest {

    @Autowired
    AdminUsuarioService servicio;

    @Autowired
    AreaService areaService;

    @Autowired
    AreaRepository areas;

    @Autowired
    UsuarioRepository usuarios;

    @Autowired
    RolRepository roles;

    @Autowired
    PlatformTransactionManager tm;

    @Autowired
    JdbcTemplate jdbc;

    @Autowired
    MockMvc mvc;

    @Autowired
    JwtService jwt;

    @Autowired
    PasswordEncoder encoder;

    List<Long> ids = new ArrayList<>();
    List<Integer> areaIds = new ArrayList<>();

    @AfterEach
    void limpiar() {
        ids.forEach(id -> jdbc.update("delete from usuarios where id = ?", id));
        areaIds.forEach(id ->
            jdbc.update("delete from areas where id = ?", id)
        );
    }

    UsuarioCrearRequest alta(String rol, Integer area) {
        var d = new UsuarioCrearRequest();
        String codigo = UUID.randomUUID()
            .toString()
            .replace("-", "")
            .substring(0, 12);
        d.setCodigoInstitucional(codigo);
        d.setCorreo(codigo + "@universidad.edu");
        d.setPassword("Aa1" + UUID.randomUUID().toString().replace("-", ""));
        d.setNombre("Lucia");
        d.setApellido("Torres");
        d.setRol(rol);
        d.setIdArea(area);
        return d;
    }

    long crear(String rol, Integer area) {
        long id = servicio.crear(alta(rol, area), 999L).id();
        ids.add(id);
        return id;
    }

    int area() {
        Area a = new Area();
        a.setNombre(UUID.randomUUID().toString());
        a.setCorreoContacto("ti@universidad.edu");
        int id = areas.saveAndFlush(a).getId();
        areaIds.add(id);
        return id;
    }

    @Test
    void crudHttpValidacionFiltrosYRevocacion() throws Exception {
        long admin = crear("ADMIN", null);
        String token = jwt.generateToken(
            usuarios.findById(admin).orElseThrow()
        );
        var d = alta("TECNICO", area());
        String json = """
        {"codigoInstitucional":"%s","correo":"%s","password":"%s","nombre":"Lucia","apellido":"Torres","rol":"TECNICO","idArea":%d}
        """.formatted(
            d.getCodigoInstitucional(),
            d.getCorreo(),
            d.getPassword(),
            d.getIdArea()
        );
        String body = mvc
            .perform(
                post("/api/v1/admin/usuarios")
                    .header("Authorization", "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(json)
            )
            .andExpect(status().isCreated())
            .andExpect(header().exists("Location"))
            .andExpect(jsonPath("$.password").doesNotExist())
            .andExpect(jsonPath("$.passwordHash").doesNotExist())
            .andReturn()
            .getResponse()
            .getContentAsString();
        long id = usuarios.findByCorreo(d.getCorreo()).orElseThrow().getId();
        ids.add(id);
        assertThat(body).contains("TECNICO");
        assertThat(
            encoder.matches(
                d.getPassword(),
                usuarios.findById(id).orElseThrow().getPasswordHash()
            )
        ).isTrue();
        mvc.perform(
            get("/api/v1/admin/usuarios")
                .header("Authorization", "Bearer " + token)
                .param("rol", "TECNICO")
                .param("idArea", d.getIdArea().toString())
                .param("activo", "true")
                .param("q", d.getCodigoInstitucional())
                .param("size", "1")
        )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.totalElements").value(1))
            .andExpect(jsonPath("$.page").value(0))
            .andExpect(jsonPath("$.size").value(1));
        mvc.perform(
            get("/api/v1/admin/usuarios/" + id).header(
                "Authorization",
                "Bearer " + token
            )
        )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(id));
        mvc.perform(
            put("/api/v1/admin/usuarios/" + id)
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    "{\"nombre\":\"Lucia\",\"apellido\":\"Torres\",\"rol\":\"SUPERVISOR\"}"
                )
        )
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.errores.idArea").exists());
        mvc.perform(
            put("/api/v1/admin/usuarios/" + id)
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    "{\"nombre\":\"Lucia\",\"apellido\":\"Nueva\",\"rol\":\"ESTUDIANTE\"}"
                )
        )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.idArea").isEmpty());
        Usuario u = usuarios.findById(id).orElseThrow();
        String tokenUsuario = jwt.generateToken(u);
        mvc.perform(
            delete("/api/v1/admin/usuarios/" + id).header(
                "Authorization",
                "Bearer " + token
            )
        ).andExpect(status().isNoContent());
        mvc.perform(
            get("/api/v1/areas").header(
                "Authorization",
                "Bearer " + tokenUsuario
            )
        ).andExpect(status().isUnauthorized());
        mvc.perform(
            put("/api/v1/admin/usuarios/" + id + "/reactivar").header(
                "Authorization",
                "Bearer " + token
            )
        )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.activo").value(true));
        mvc.perform(
            get("/api/v1/roles").header("Authorization", "Bearer " + token)
        )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].nombre").exists());
        for (String rol : List.of("ESTUDIANTE", "TECNICO", "SUPERVISOR")) {
            long otro = crear(
                rol,
                rol.equals("ESTUDIANTE") ? null : d.getIdArea()
            );
            String otroToken = jwt.generateToken(
                usuarios.findById(otro).orElseThrow()
            );
            for (String ruta : List.of(
                "/api/v1/roles",
                "/api/v1/admin/usuarios"
            ))
                mvc.perform(
                    get(ruta).header("Authorization", "Bearer " + otroToken)
                ).andExpect(status().isForbidden());
        }
        mvc.perform(
            delete("/api/v1/admin/usuarios/" + admin).header(
                "Authorization",
                "Bearer " + token
            )
        ).andExpect(status().isConflict());
        mvc.perform(get("/api/v1/roles")).andExpect(status().isForbidden());
        mvc.perform(
            get("/api/v1/admin/usuarios")
                .header("Authorization", "Bearer " + token)
                .param("page", "-1")
        ).andExpect(status().isBadRequest());
        mvc.perform(
            post("/api/v1/admin/usuarios")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json)
        ).andExpect(status().isConflict());
    }

    @ParameterizedTest(name = "{0}, areaPrimero={1}")
    @CsvSource({
        "alta,true",
        "alta,false",
        "asignacion,true",
        "asignacion,false",
        "reactivacion,true",
        "reactivacion,false",
        "reasignacion,true",
        "reasignacion,false",
        "rol,true",
        "rol,false",
    })
    void areaYUsuarioNuncaQuedanIncoherentes(
        String operacion,
        boolean areaPrimero
    ) throws Exception {
        int destino = area();
        long id = operacion.equals("alta")
            ? 0
            : crear(
                  operacion.equals("asignacion") ? "ESTUDIANTE" : "TECNICO",
                  operacion.equals("asignacion")
                      ? null
                      : operacion.equals("reasignacion") ||
                          operacion.equals("rol")
                        ? area()
                        : destino
              );
        if (operacion.equals("reactivacion")) servicio.desactivar(id, 999L);
        Runnable usuario = () -> {
            if (operacion.equals("alta")) {
                crear("TECNICO", destino);
            } else if (operacion.equals("reactivacion")) servicio.reactivar(
                id,
                999L
            );
            else {
                var d = alta("SUPERVISOR", destino);
                servicio.actualizar(id, d, 999L);
            }
        };
        Runnable baja = () -> areaService.desactivar(destino);
        carrera(areaPrimero ? baja : usuario, areaPrimero ? usuario : baja);
        assertThat(
            jdbc.queryForObject(
                "select count(*) from usuarios u join areas a on a.id=u.id_area where u.activo=true and a.activo=false and a.id=?",
                Integer.class,
                destino
            )
        ).isZero();
    }

    @ParameterizedTest
    @CsvSource({ "baja,baja", "rol,rol", "baja,rol", "rol,baja" })
    void ultimoAdminConcurrente(String primera, String segunda)
        throws Exception {
        assertThat(
            jdbc.queryForObject(
                "select count(*) from usuarios u join roles r on r.id=u.id_rol where u.activo=true and r.nombre='ROLE_ADMIN'",
                Integer.class
            )
        ).isZero();
        long a = crear("ADMIN", null),
            b = crear("ADMIN", null);
        carrera(
            () -> quitarAdmin(a, primera),
            () ->
                new TransactionTemplate(tm).executeWithoutResult(status -> {
                    // Establish an old REPEATABLE READ snapshot before waiting for the stable role lock.
                    jdbc.queryForObject(
                        "select count(*) from usuarios where activo=true",
                        Integer.class
                    );
                    quitarAdmin(b, segunda);
                })
        );
        assertThat(
            jdbc.queryForObject(
                "select count(*) from usuarios u join roles r on r.id=u.id_rol where u.activo=true and r.nombre='ROLE_ADMIN'",
                Integer.class
            )
        ).isEqualTo(1);
    }

    void quitarAdmin(long id, String accion) {
        if (accion.equals("baja")) servicio.desactivar(id, 999L);
        else servicio.actualizar(id, alta("ESTUDIANTE", null), 999L);
    }

    void carrera(Runnable primera, Runnable segunda) throws Exception {
        var adquirida = new CountDownLatch(1);
        var liberar = new CountDownLatch(1);
        var iniciada = new CountDownLatch(1);
        try (var executor = Executors.newFixedThreadPool(2)) {
            Future<?> a = executor.submit(() ->
                new TransactionTemplate(tm).executeWithoutResult(s -> {
                    primera.run();
                    adquirida.countDown();
                    try {
                        if (
                            !liberar.await(10, TimeUnit.SECONDS)
                        ) throw new AssertionError("Timeout de coordinación");
                    } catch (InterruptedException ex) {
                        throw new RuntimeException(ex);
                    }
                })
            );
            try {
                assertThat(adquirida.await(10, TimeUnit.SECONDS)).isTrue();
                Future<?> b = executor.submit(() -> {
                    iniciada.countDown();
                    segunda.run();
                });
                assertThat(iniciada.await(5, TimeUnit.SECONDS)).isTrue();
                assertThatThrownBy(() ->
                    b.get(250, TimeUnit.MILLISECONDS)
                ).isInstanceOf(TimeoutException.class);
                liberar.countDown();
                a.get(10, TimeUnit.SECONDS);
                assertThatThrownBy(() -> b.get(10, TimeUnit.SECONDS))
                    .isInstanceOf(ExecutionException.class)
                    .satisfies(ex ->
                        assertThat(ex.getCause())
                            .isInstanceOf(ResponseStatusException.class)
                            .satisfies(cause ->
                                assertThat(
                                    ((ResponseStatusException) cause)
                                        .getStatusCode()
                                        .value()
                                ).isEqualTo(409)
                            )
                    );
            } finally {
                liberar.countDown();
            }
        }
    }
}
