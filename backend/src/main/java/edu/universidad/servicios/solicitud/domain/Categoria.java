package edu.universidad.servicios.solicitud.domain;

import edu.universidad.servicios.usuario.domain.Area;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "categorias")
@Getter
@Setter
public class Categoria {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, length = 80, unique = true)
    private String nombre;

    @Column(length = 255)
    private String descripcion;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_area", nullable = false)
    private Area area;

    @Column(name = "tiempo_sla_horas", nullable = false)
    private Integer tiempoSlaHoras = 48;

    @Column(nullable = false)
    private Boolean activo = true;
}
