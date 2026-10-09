package edu.universidad.servicios.solicitud.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "prioridades")
@Getter
@Setter
public class Prioridad {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, length = 20, unique = true)
    private String nivel;

    @Column(nullable = false)
    private Integer ponderador;

    @Column(name = "sla_max_horas", nullable = false)
    private Integer slaMaxHoras;

    @Column(nullable = false)
    private Boolean activo = true;
}
