package edu.universidad.servicios.dashboard.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import java.time.OffsetDateTime;

public record KpisResponse(
	@JsonFormat(shape = JsonFormat.Shape.STRING) OffsetDateTime desde,
	@JsonFormat(shape = JsonFormat.Shape.STRING) OffsetDateTime hasta,
	long registradas,
	long pendientes,
	long atendidas,
	double porcentajeResueltas,
	Double mttrHoras,
	long vencidas
) {}
