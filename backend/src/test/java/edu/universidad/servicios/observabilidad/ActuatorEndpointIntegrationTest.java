package edu.universidad.servicios.observabilidad;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalManagementPort;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.test.context.ActiveProfiles;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * OBS-01 / OBS-07: Actuator solo en el puerto de gestión; health público y
 * prometheus inaccesible desde el puerto de la aplicación (el que expone Nginx).
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
        properties = "management.server.port=0")
@ActiveProfiles("test")
class ActuatorEndpointIntegrationTest {

    private final HttpClient http = HttpClient.newHttpClient();

    @LocalServerPort
    private int appPort;

    @LocalManagementPort
    private int managementPort;

    private HttpResponse<String> get(int port, String path) throws Exception {
        return http.send(HttpRequest.newBuilder(URI.create("http://localhost:" + port + path)).build(),
                HttpResponse.BodyHandlers.ofString());
    }

    @Test
    @DisplayName("OBS-07: /actuator/health es público (sin token) en el puerto de gestión")
    void healthPublico() throws Exception {
        HttpResponse<String> res = get(managementPort, "/actuator/health");
        assertThat(res.statusCode()).isEqualTo(200);
        assertThat(res.body()).contains("\"status\":\"UP\"");
    }

    @Test
    @DisplayName("OBS-07: /actuator/prometheus responde en el puerto de gestión (red interna)")
    void prometheusEnPuertoDeGestion() throws Exception {
        HttpResponse<String> res = get(managementPort, "/actuator/prometheus");
        assertThat(res.statusCode()).isEqualTo(200);
        assertThat(res.body()).contains("jvm_memory_used_bytes");
        // OBS-10: gauge de la alerta BDInaccesible (H2 arriba => 1)
        assertThat(res.body()).containsPattern("(?m)^health_db_up(\\{.*\\})? 1\\.0$");
    }

    @Test
    @DisplayName("OBS-07: /actuator/prometheus NO existe en el puerto público de la aplicación")
    void prometheusNoPublico() throws Exception {
        HttpResponse<String> res = get(appPort, "/actuator/prometheus");
        assertThat(res.statusCode()).isNotEqualTo(200);
        assertThat(res.body()).doesNotContain("jvm_memory_used_bytes");
    }

    @Test
    @DisplayName("OBS-07: el resto de Actuator exige autenticación aun en el puerto de gestión")
    void otrosEndpointsRequierenAuth() throws Exception {
        assertThat(get(managementPort, "/actuator/info").statusCode()).isIn(401, 403);
    }
}
