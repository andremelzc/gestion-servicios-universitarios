package edu.universidad.servicios.solicitud.domain;

import edu.universidad.servicios.usuario.domain.Usuario;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Entity
@Table(name = "comentarios_solicitud")
@Getter
@Setter
public class ComentarioSolicitud {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_solicitud", nullable = false)
    private Solicitud solicitud;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_usuario", nullable = false)
    private Usuario usuario;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String comentario;

    @Column(name = "es_privado_cuadrilla", nullable = false)
    private boolean privado;

    @Column(name = "fecha_comentario", nullable = false, updatable = false)
    private LocalDateTime fechaComentario;
}
