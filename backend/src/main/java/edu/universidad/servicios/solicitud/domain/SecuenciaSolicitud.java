package edu.universidad.servicios.solicitud.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "secuencias_solicitud")
@Getter
@Setter
public class SecuenciaSolicitud {

    @Id
    @Column(nullable = false)
    private Short anio;

    @Column(name = "ultimo_numero", nullable = false)
    private Integer ultimoNumero = 0;
}
