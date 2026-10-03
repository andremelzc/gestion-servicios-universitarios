-- =============================================================================
-- V2__datos_maestros.sql
-- Datos maestros mínimos para que el sistema arranque y el flujo MVP funcione
-- (login -> registrar -> consultar -> cambiar estado) ANTES de que exista el
-- CRUD de administración (TASK-018). Los catálogos se pueden modificar luego
-- desde el módulo de Administración.
--
-- NO se insertan usuarios aquí: los hashes BCrypt no deben vivir en migraciones
-- (ver docs/03-calidad-y-operacion/seguridad-owasp.md). Los usuarios de demostración los crea el
-- DemoDataSeeder (perfil Spring `demo`) con el PasswordEncoder y contraseñas
-- tomadas de variables de entorno.
-- =============================================================================

INSERT INTO roles (nombre, descripcion) VALUES
    ('ROLE_ESTUDIANTE', 'Usuario solicitante de la comunidad universitaria'),
    ('ROLE_TECNICO',    'Técnico operativo que atiende solicitudes asignadas'),
    ('ROLE_SUPERVISOR', 'Supervisor de área: evalúa, prioriza, asigna y supervisa'),
    ('ROLE_ADMIN',      'Administrador general: usuarios, catálogos y configuración');

INSERT INTO prioridades (nivel, ponderador, sla_max_horas) VALUES
    ('BAJA',    1, 72),
    ('MEDIA',   2, 48),
    ('ALTA',    3, 24),
    ('CRITICA', 4,  4);

INSERT INTO estados_solicitud (codigo, nombre_visible, descripcion, color_hex, orden, es_final) VALUES
    ('REGISTRADA',    'Registrada',    'Solicitud recibida, pendiente de evaluación',         '#6B7280', 1, FALSE),
    ('EN_EVALUACION', 'En evaluación', 'El supervisor revisa pertinencia y prioridad',        '#D97706', 2, FALSE),
    ('ASIGNADA',      'Asignada',      'Asignada a un técnico del área',                      '#2563EB', 3, FALSE),
    ('EN_ATENCION',   'En atención',   'El técnico está interviniendo',                       '#7C3AED', 4, FALSE),
    ('RESUELTA',      'Resuelta',      'El técnico reportó la solución, pendiente de cierre', '#059669', 5, FALSE),
    ('CERRADA',       'Cerrada',       'Conformidad confirmada por solicitante o supervisor', '#047857', 6, TRUE);

INSERT INTO areas (nombre, correo_contacto) VALUES
    ('Tecnologías de la Información',   'ti@universidad.edu'),
    ('Mantenimiento e Infraestructura', 'mantenimiento@universidad.edu'),
    ('Servicios Generales',             'servicios.generales@universidad.edu');

-- Las categorías referencian áreas por nombre para no depender de IDs fijos.
INSERT INTO categorias (nombre, descripcion, id_area, tiempo_sla_horas)
SELECT c.nombre, c.descripcion, a.id, c.sla
FROM (
    SELECT 'Soporte de Software'      AS nombre, 'Instalación, licencias y fallas de aplicaciones'  AS descripcion, 'Tecnologías de la Información'   AS area, 24 AS sla UNION ALL
    SELECT 'Redes y Wi-Fi',                      'Conectividad cableada e inalámbrica',                            'Tecnologías de la Información',           24 UNION ALL
    SELECT 'Equipos de Cómputo',                 'Hardware, laboratorios y proyectores',                           'Tecnologías de la Información',           48 UNION ALL
    SELECT 'Electricidad',                       'Instalaciones eléctricas, iluminación y tableros',               'Mantenimiento e Infraestructura',         24 UNION ALL
    SELECT 'Mobiliario',                         'Carpetas, pizarras, puertas y ventanas',                         'Mantenimiento e Infraestructura',         72 UNION ALL
    SELECT 'Limpieza e Higiene',                 'Aulas, servicios higiénicos y áreas comunes',                    'Servicios Generales',                     24
) c
JOIN areas a ON a.nombre = c.area;
