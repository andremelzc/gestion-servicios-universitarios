package edu.universidad.servicios.usuario.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "areas")
@Getter
@Setter
public class Area {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, length = 100, unique = true)
    private String nombre;

    @Column(name = "correo_contacto", nullable = false, length = 100)
    private String correoContacto;

    @Column(nullable = false)
    private Boolean activo = true;
}
