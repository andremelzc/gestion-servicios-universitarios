package edu.universidad.servicios.solicitud.service;

import edu.universidad.servicios.solicitud.domain.Categoria;
import edu.universidad.servicios.solicitud.domain.Prioridad;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;

import static org.junit.jupiter.api.Assertions.*;

class SlaCalculatorTest {

    private SlaCalculator slaCalculator;
    private Clock fixedClock;
    private final Instant nowInstant = Instant.parse("2026-10-10T10:00:00Z");
    private final ZoneId zoneId = ZoneId.of("UTC");

    @BeforeEach
    void setUp() {
        fixedClock = Clock.fixed(nowInstant, zoneId);
        slaCalculator = new SlaCalculator(fixedClock);
    }

    @Test
    @DisplayName("Debe elegir el menor valor cuando la categoría tiene menor SLA que la prioridad")
    void debeElegirMenorSlaDeCategoria() {
        LocalDateTime base = LocalDateTime.of(2026, 10, 10, 8, 0);

        Categoria categoria = new Categoria();
        categoria.setTiempoSlaHoras(24); // 24h

        Prioridad prioridad = new Prioridad();
        prioridad.setSlaMaxHoras(48); // 48h

        LocalDateTime limite = slaCalculator.calcularFechaLimite(base, prioridad, categoria);

        assertEquals(base.plusHours(24), limite);
    }

    @Test
    @DisplayName("Debe elegir el menor valor cuando la prioridad crítica tiene menor SLA que la categoría")
    void debeElegirMenorSlaDePrioridadCritica() {
        LocalDateTime base = LocalDateTime.of(2026, 10, 10, 8, 0);

        Categoria categoria = new Categoria();
        categoria.setTiempoSlaHoras(72); // 72h

        Prioridad prioridad = new Prioridad();
        prioridad.setSlaMaxHoras(4); // 4h crítica

        LocalDateTime limite = slaCalculator.calcularFechaLimite(base, prioridad, categoria);

        assertEquals(base.plusHours(4), limite);
    }

    @Test
    @DisplayName("Debe usar la hora del Clock cuando fechaRegistro es nula")
    void debeUsarClockSiFechaRegistroEsNula() {
        Categoria categoria = new Categoria();
        categoria.setTiempoSlaHoras(10);

        Prioridad prioridad = new Prioridad();
        prioridad.setSlaMaxHoras(10);

        LocalDateTime expectedBase = LocalDateTime.now(fixedClock);
        LocalDateTime limite = slaCalculator.calcularFechaLimite(null, prioridad, categoria);

        assertEquals(expectedBase.plusHours(10), limite);
    }

    @Test
    @DisplayName("Debe lanzar excepción si categoría o prioridad son nulas")
    void debeLanzarExcepcionSiParametrosSonNulos() {
        assertThrows(IllegalArgumentException.class, () ->
                slaCalculator.calcularFechaLimite(LocalDateTime.now(), null, new Categoria())
        );

        assertThrows(IllegalArgumentException.class, () ->
                slaCalculator.calcularFechaLimite(LocalDateTime.now(), new Prioridad(), null)
        );
    }
}
