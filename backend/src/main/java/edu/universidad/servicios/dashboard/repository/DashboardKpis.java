package edu.universidad.servicios.dashboard.repository;

import java.math.BigDecimal;

public record DashboardKpis(
    long registradas,
    long pendientes,
    long atendidas,
    BigDecimal mttrHoras,
    long vencidas
) {}
