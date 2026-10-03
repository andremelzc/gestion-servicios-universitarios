-- =============================================================================
-- V1__esquema_inicial.sql
-- Sistema Web Inteligente para la Gestión Integral de Servicios Universitarios
-- Motor: MySQL 8.0+ (InnoDB, utf8mb4 / utf8mb4_unicode_ci)
--
-- FUENTE ÚNICA DE VERDAD del esquema físico. La descripción funcional de cada
-- tabla está en docs/02-diseno/modelo-datos.md. Cualquier cambio de esquema se hace con
-- una nueva migración (V3__..., V4__...), nunca editando una ya aplicada.
--
-- Convenciones:
--   * Todas las marcas de tiempo se guardan en UTC (el backend arranca con
--     -Duser.timezone=UTC; el frontend convierte a America/Lima al mostrar).
--   * Baja lógica (columna `activo`) en usuarios, areas, categorias y prioridades:
--     nunca se usa DELETE sobre catálogos referenciados (RN-14).
--   * El historial de solicitudes es inmutable: triggers bloquean UPDATE/DELETE.
--   * La base de datos la crea el contenedor/servidor (MYSQL_DATABASE); este
--     script no ejecuta CREATE DATABASE para que sea idéntico en todos los
--     ambientes (dev, test, prod).
-- =============================================================================

-- 1. Roles (RBAC) -------------------------------------------------------------
CREATE TABLE roles (
    id          INT          NOT NULL AUTO_INCREMENT,
    nombre      VARCHAR(30)  NOT NULL,
    descripcion VARCHAR(150) NULL,
    CONSTRAINT pk_roles PRIMARY KEY (id),
    CONSTRAINT uq_roles_nombre UNIQUE (nombre)
) ENGINE=InnoDB;

-- 2. Áreas responsables -------------------------------------------------------
CREATE TABLE areas (
    id              INT          NOT NULL AUTO_INCREMENT,
    nombre          VARCHAR(100) NOT NULL,
    correo_contacto VARCHAR(100) NOT NULL,
    activo          BOOLEAN      NOT NULL DEFAULT TRUE,
    CONSTRAINT pk_areas PRIMARY KEY (id),
    CONSTRAINT uq_areas_nombre UNIQUE (nombre)
) ENGINE=InnoDB;

-- 3. Usuarios -----------------------------------------------------------------
CREATE TABLE usuarios (
    id                   BIGINT       NOT NULL AUTO_INCREMENT,
    codigo_institucional VARCHAR(20)  NOT NULL,
    nombre               VARCHAR(60)  NOT NULL,
    apellido             VARCHAR(60)  NOT NULL,
    correo               VARCHAR(100) NOT NULL,
    password_hash        VARCHAR(255) NOT NULL,
    telefono             VARCHAR(20)  NULL,
    id_rol               INT          NOT NULL,
    id_area              INT          NULL,
    activo               BOOLEAN      NOT NULL DEFAULT TRUE,
    ultimo_acceso        TIMESTAMP    NULL,
    fecha_creacion       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT pk_usuarios PRIMARY KEY (id),
    CONSTRAINT uq_usuarios_codigo UNIQUE (codigo_institucional),
    CONSTRAINT uq_usuarios_correo UNIQUE (correo),
    CONSTRAINT fk_usuarios_roles FOREIGN KEY (id_rol)  REFERENCES roles (id),
    CONSTRAINT fk_usuarios_areas FOREIGN KEY (id_area) REFERENCES areas (id)
) ENGINE=InnoDB;

CREATE INDEX idx_usuarios_rol_area ON usuarios (id_rol, id_area, activo);

-- 4. Categorías de servicio ---------------------------------------------------
CREATE TABLE categorias (
    id               INT          NOT NULL AUTO_INCREMENT,
    nombre           VARCHAR(80)  NOT NULL,
    descripcion      VARCHAR(255) NULL,
    id_area          INT          NOT NULL,
    tiempo_sla_horas INT          NOT NULL DEFAULT 48,
    activo           BOOLEAN      NOT NULL DEFAULT TRUE,
    CONSTRAINT pk_categorias PRIMARY KEY (id),
    CONSTRAINT uq_categorias_nombre UNIQUE (nombre),
    CONSTRAINT fk_categorias_areas FOREIGN KEY (id_area) REFERENCES areas (id),
    CONSTRAINT ck_categorias_sla CHECK (tiempo_sla_horas > 0)
) ENGINE=InnoDB;

CREATE INDEX idx_categorias_area ON categorias (id_area, activo);

-- 5. Prioridades --------------------------------------------------------------
CREATE TABLE prioridades (
    id            INT         NOT NULL AUTO_INCREMENT,
    nivel         VARCHAR(20) NOT NULL,
    ponderador    INT         NOT NULL,
    sla_max_horas INT         NOT NULL,
    activo        BOOLEAN     NOT NULL DEFAULT TRUE,
    CONSTRAINT pk_prioridades PRIMARY KEY (id),
    CONSTRAINT uq_prioridades_nivel UNIQUE (nivel),
    CONSTRAINT ck_prioridades_sla CHECK (sla_max_horas > 0)
) ENGINE=InnoDB;

-- 6. Catálogo de estados (el código es fijo; la presentación es configurable) -
CREATE TABLE estados_solicitud (
    codigo         VARCHAR(20)  NOT NULL,
    nombre_visible VARCHAR(40)  NOT NULL,
    descripcion    VARCHAR(255) NULL,
    color_hex      CHAR(7)      NOT NULL DEFAULT '#6B7280',
    orden          TINYINT      NOT NULL,
    es_final       BOOLEAN      NOT NULL DEFAULT FALSE,
    CONSTRAINT pk_estados_solicitud PRIMARY KEY (codigo),
    CONSTRAINT ck_estados_color CHECK (color_hex REGEXP '^#[0-9A-Fa-f]{6}$')
) ENGINE=InnoDB;

-- 7. Secuencia anual para el código SOL-AAAA-NNNN -----------------------------
CREATE TABLE secuencias_solicitud (
    anio          SMALLINT NOT NULL,
    ultimo_numero INT      NOT NULL DEFAULT 0,
    CONSTRAINT pk_secuencias_solicitud PRIMARY KEY (anio)
) ENGINE=InnoDB;

-- 8. Solicitudes (entidad central) -------------------------------------------
CREATE TABLE solicitudes (
    id                      BIGINT       NOT NULL AUTO_INCREMENT,
    codigo                  VARCHAR(30)  NOT NULL,
    id_usuario_solicitante  BIGINT       NOT NULL,
    id_categoria            INT          NOT NULL,
    id_prioridad            INT          NOT NULL,
    id_tecnico_asignado     BIGINT       NULL,
    id_supervisor_asignador BIGINT       NULL,
    titulo                  VARCHAR(150) NOT NULL,
    descripcion             TEXT         NOT NULL,
    ubicacion_campus        VARCHAR(100) NOT NULL,
    ubicacion_ambiente      VARCHAR(100) NOT NULL,
    estado                  VARCHAR(20)  NOT NULL DEFAULT 'REGISTRADA',
    informe_resolucion      TEXT         NULL,
    fecha_registro          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_limite_sla        TIMESTAMP    NULL,
    fecha_asignacion        TIMESTAMP    NULL,
    fecha_inicio_atencion   TIMESTAMP    NULL,
    fecha_resolucion        TIMESTAMP    NULL,
    fecha_cierre            TIMESTAMP    NULL,
    CONSTRAINT pk_solicitudes PRIMARY KEY (id),
    CONSTRAINT uq_solicitudes_codigo UNIQUE (codigo),
    CONSTRAINT fk_solicitudes_solicitante FOREIGN KEY (id_usuario_solicitante)  REFERENCES usuarios (id),
    CONSTRAINT fk_solicitudes_categoria   FOREIGN KEY (id_categoria)            REFERENCES categorias (id),
    CONSTRAINT fk_solicitudes_prioridad   FOREIGN KEY (id_prioridad)            REFERENCES prioridades (id),
    CONSTRAINT fk_solicitudes_tecnico     FOREIGN KEY (id_tecnico_asignado)     REFERENCES usuarios (id),
    CONSTRAINT fk_solicitudes_supervisor  FOREIGN KEY (id_supervisor_asignador) REFERENCES usuarios (id),
    CONSTRAINT fk_solicitudes_estado      FOREIGN KEY (estado)                  REFERENCES estados_solicitud (codigo)
) ENGINE=InnoDB;

-- Índices orientados a la bandeja (filtros) y al dashboard (agregaciones)
CREATE INDEX idx_solicitudes_estado_fecha    ON solicitudes (estado, fecha_registro);
CREATE INDEX idx_solicitudes_solicitante     ON solicitudes (id_usuario_solicitante, fecha_registro);
CREATE INDEX idx_solicitudes_tecnico_estado  ON solicitudes (id_tecnico_asignado, estado);
CREATE INDEX idx_solicitudes_categoria       ON solicitudes (id_categoria, estado);
CREATE INDEX idx_solicitudes_prioridad       ON solicitudes (id_prioridad, estado);
CREATE INDEX idx_solicitudes_limite_sla      ON solicitudes (fecha_limite_sla);

-- 9. Historial de transiciones (auditoría inmutable) -------------------------
CREATE TABLE historial_solicitudes (
    id              BIGINT      NOT NULL AUTO_INCREMENT,
    id_solicitud    BIGINT      NOT NULL,
    id_usuario      BIGINT      NOT NULL,
    estado_anterior VARCHAR(20) NULL,
    estado_nuevo    VARCHAR(20) NOT NULL,
    nota            TEXT        NULL,
    fecha_cambio    TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_historial PRIMARY KEY (id),
    CONSTRAINT fk_historial_solicitud FOREIGN KEY (id_solicitud) REFERENCES solicitudes (id),
    CONSTRAINT fk_historial_usuario   FOREIGN KEY (id_usuario)   REFERENCES usuarios (id),
    CONSTRAINT fk_historial_est_ant   FOREIGN KEY (estado_anterior) REFERENCES estados_solicitud (codigo),
    CONSTRAINT fk_historial_est_nuevo FOREIGN KEY (estado_nuevo)    REFERENCES estados_solicitud (codigo)
) ENGINE=InnoDB;

CREATE INDEX idx_historial_solicitud_fecha ON historial_solicitudes (id_solicitud, fecha_cambio);

CREATE TRIGGER trg_historial_no_update
    BEFORE UPDATE ON historial_solicitudes
    FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'historial_solicitudes es inmutable: UPDATE no permitido';

CREATE TRIGGER trg_historial_no_delete
    BEFORE DELETE ON historial_solicitudes
    FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'historial_solicitudes es inmutable: DELETE no permitido';

-- 10. Evidencias (metadatos; el binario vive fuera de la BD) -----------------
CREATE TABLE evidencias_archivos (
    id                 BIGINT       NOT NULL AUTO_INCREMENT,
    id_solicitud       BIGINT       NOT NULL,
    id_usuario_subio   BIGINT       NOT NULL,
    tipo_evidencia     ENUM('INICIAL', 'SOLUCION') NOT NULL DEFAULT 'INICIAL',
    nombre_original    VARCHAR(255) NOT NULL,
    nombre_almacenado  VARCHAR(100) NOT NULL,
    ruta_almacenamiento VARCHAR(500) NOT NULL,
    mime_type          VARCHAR(100) NOT NULL,
    tamano_bytes       BIGINT       NOT NULL,
    fecha_subida       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_evidencias PRIMARY KEY (id),
    CONSTRAINT uq_evidencias_almacenado UNIQUE (nombre_almacenado),
    CONSTRAINT fk_evidencias_solicitud FOREIGN KEY (id_solicitud)     REFERENCES solicitudes (id),
    CONSTRAINT fk_evidencias_usuario   FOREIGN KEY (id_usuario_subio) REFERENCES usuarios (id),
    CONSTRAINT ck_evidencias_tamano CHECK (tamano_bytes > 0)
) ENGINE=InnoDB;

CREATE INDEX idx_evidencias_solicitud ON evidencias_archivos (id_solicitud, tipo_evidencia);

-- 11. Comentarios -------------------------------------------------------------
CREATE TABLE comentarios_solicitud (
    id                   BIGINT    NOT NULL AUTO_INCREMENT,
    id_solicitud         BIGINT    NOT NULL,
    id_usuario           BIGINT    NOT NULL,
    comentario           TEXT      NOT NULL,
    es_privado_cuadrilla BOOLEAN   NOT NULL DEFAULT FALSE,
    fecha_comentario     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_comentarios PRIMARY KEY (id),
    CONSTRAINT fk_comentarios_solicitud FOREIGN KEY (id_solicitud) REFERENCES solicitudes (id),
    CONSTRAINT fk_comentarios_usuario   FOREIGN KEY (id_usuario)   REFERENCES usuarios (id)
) ENGINE=InnoDB;

CREATE INDEX idx_comentarios_solicitud ON comentarios_solicitud (id_solicitud, fecha_comentario);
