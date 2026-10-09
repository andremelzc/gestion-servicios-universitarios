package edu.universidad.servicios.solicitud.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "estados_solicitud")
@Getter
@Setter
public class EstadoSolicitud {

	@Id
	@Column(nullable = false, length = 20)
	private String codigo;

	@Column(name = "nombre_visible", nullable = false, length = 40)
	private String nombreVisible;

	@Column(length = 255)
	private String descripcion;

	@Column(name = "color_hex", nullable = false, length = 7)
	private String colorHex;

	@Column(nullable = false)
	private Byte orden;

	@Column(name = "es_final", nullable = false)
	private Boolean esFinal = false;
}
