package edu.universidad.servicios.dashboard.dto;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import edu.universidad.servicios.common.config.JacksonConfig;
import org.junit.jupiter.api.Test;

import java.time.OffsetDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class DashboardDtoTest {

    private final ObjectMapper mapper = new JacksonConfig().objectMapper();

    @Test
    void kpisRespetaElContratoConMttrNulo() throws Exception {
        KpisResponse kpis = new KpisResponse(
                OffsetDateTime.parse("2026-09-03T00:00:00Z"),
                OffsetDateTime.parse("2026-10-03T23:59:59Z"),
                150, 45, 98, 70.5, null, 7
        );

        JsonNode json = mapper.readTree(mapper.writeValueAsString(kpis));

        assertEquals("2026-09-03T00:00:00Z", json.get("desde").asText());
        assertEquals("2026-10-03T23:59:59Z", json.get("hasta").asText());
        assertEquals(150, json.get("registradas").asLong());
        assertEquals(45, json.get("pendientes").asLong());
        assertEquals(98, json.get("atendidas").asLong());
        assertEquals(70.5, json.get("porcentajeResueltas").asDouble());
        assertTrue(json.get("mttrHoras").isNull());
        assertEquals(7, json.get("vencidas").asLong());
        assertEquals(8, json.size());
    }

    @Test
    void seriesRespetanElContrato() throws Exception {
        JsonNode serie = mapper.readTree(mapper.writeValueAsString(new SerieItem("ALTA", 12)));
        JsonNode estado = mapper.readTree(mapper.writeValueAsString(new SerieEstadoItem("EN_ATENCION", 9, "#7C3AED")));

        assertEquals("ALTA", serie.get("nombre").asText());
        assertEquals(12, serie.get("valor").asLong());
        assertEquals(2, serie.size());
        assertEquals("EN_ATENCION", estado.get("nombre").asText());
        assertEquals(9, estado.get("valor").asLong());
        assertEquals("#7C3AED", estado.get("colorHex").asText());
        assertEquals(3, estado.size());
    }
}
