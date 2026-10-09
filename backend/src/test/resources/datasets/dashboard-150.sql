-- Fixture determinístico para DashboardRepositoryIT.
-- Ejecutar después de las migraciones V1/V2. Reejecutable: solo reemplaza
-- las solicitudes y los usuarios reservados para este dataset.

INSERT INTO usuarios (
    codigo_institucional, nombre, apellido, correo, password_hash, id_rol, id_area, activo
)
SELECT fixture.codigo, fixture.nombre, 'Dataset', fixture.correo, 'test-only-not-a-real-password-hash', rol.id, NULL, TRUE
FROM (
    SELECT 'DASH01-EST-001' AS codigo, 'Estudiante 1' AS nombre, 'dash01.estudiante1@universidad.test' AS correo
    UNION ALL
    SELECT 'DASH01-EST-002', 'Estudiante 2', 'dash01.estudiante2@universidad.test'
) fixture
JOIN roles rol ON rol.nombre = 'ROLE_ESTUDIANTE'
WHERE NOT EXISTS (
    SELECT 1 FROM usuarios existente WHERE existente.codigo_institucional = fixture.codigo
);

DELETE FROM solicitudes WHERE codigo LIKE 'DASH-01-%';

INSERT INTO solicitudes (
    codigo,
    id_usuario_solicitante,
    id_categoria,
    id_prioridad,
    titulo,
    descripcion,
    ubicacion_campus,
    ubicacion_ambiente,
    estado,
    fecha_registro,
    fecha_limite_sla,
    fecha_asignacion,
    fecha_inicio_atencion,
    fecha_resolucion,
    fecha_cierre
)
WITH RECURSIVE numeros (numero) AS (
    SELECT 1
    UNION ALL
    SELECT numero + 1 FROM numeros WHERE numero < 150
), datos AS (
    SELECT
        numero,
        CASE
            WHEN numero <= 14 THEN 0
            WHEN numero <= 36 THEN 1
            WHEN numero <= 45 THEN 2
            WHEN numero <= 50 THEN 3
            WHEN numero <= 80 THEN 4
            ELSE 5
        END AS estado_indice,
        MOD(numero - 1, 2) AS area_indice,
        CASE MOD(numero - 1, 2)
            WHEN 0 THEN MOD(FLOOR((numero - 1) / 2), 3)
            ELSE MOD(FLOOR((numero - 1) / 2), 2)
        END AS categoria_indice,
        MOD(numero - 1, 4) AS prioridad_indice,
        DATE_SUB('2026-10-09 12:00:00', INTERVAL MOD(numero - 1, 90) DAY) AS fecha
    FROM numeros
)
SELECT
    CONCAT('DASH-01-', LPAD(datos.numero, 4, '0')),
    usuario.id,
    categoria.id,
    prioridad.id,
    CONCAT('Solicitud de dashboard ', LPAD(datos.numero, 3, '0')),
    CONCAT('Registro determinístico para pruebas de dashboard. Caso ', datos.numero, '.'),
    CASE datos.area_indice WHEN 0 THEN 'Campus Central' ELSE 'Campus Norte' END,
    CONCAT('Edificio ', 1 + MOD(datos.numero, 8), ', ambiente ', 1 + MOD(datos.numero, 30)),
    estado.codigo,
    datos.fecha,
    DATE_ADD(datos.fecha, INTERVAL prioridad.sla_max_horas HOUR),
    CASE WHEN datos.estado_indice >= 2 THEN DATE_ADD(datos.fecha, INTERVAL 2 HOUR) END,
    CASE WHEN datos.estado_indice >= 3 THEN DATE_ADD(datos.fecha, INTERVAL 4 HOUR) END,
    CASE
        WHEN datos.estado_indice = 4 THEN DATE_ADD(datos.fecha, INTERVAL 8 HOUR)
        WHEN datos.estado_indice = 5 THEN DATE_ADD(datos.fecha, INTERVAL 10 HOUR)
    END,
    CASE WHEN datos.estado_indice = 5 THEN DATE_ADD(datos.fecha, INTERVAL 12 HOUR) END
FROM datos
JOIN usuarios usuario
    ON usuario.codigo_institucional = CASE MOD(datos.numero, 2)
        WHEN 0 THEN 'DASH01-EST-001'
        ELSE 'DASH01-EST-002'
    END
JOIN estados_solicitud estado
    ON estado.codigo = CASE datos.estado_indice
        WHEN 0 THEN 'REGISTRADA'
        WHEN 1 THEN 'EN_EVALUACION'
        WHEN 2 THEN 'ASIGNADA'
        WHEN 3 THEN 'EN_ATENCION'
        WHEN 4 THEN 'RESUELTA'
        ELSE 'CERRADA'
    END
JOIN prioridades prioridad
    ON prioridad.nivel = CASE datos.prioridad_indice
        WHEN 0 THEN 'BAJA'
        WHEN 1 THEN 'MEDIA'
        WHEN 2 THEN 'ALTA'
        ELSE 'CRITICA'
    END
JOIN categorias categoria
    ON categoria.nombre = CASE datos.area_indice
        WHEN 0 THEN CASE datos.categoria_indice
            WHEN 0 THEN 'Soporte de Software'
            WHEN 1 THEN 'Redes y Wi-Fi'
            ELSE 'Equipos de Cómputo'
        END
        ELSE CASE datos.categoria_indice
            WHEN 0 THEN 'Electricidad'
            ELSE 'Mobiliario'
        END
    END
JOIN areas area ON area.id = categoria.id_area
WHERE area.nombre = CASE datos.area_indice
    WHEN 0 THEN 'Tecnologías de la Información'
    ELSE 'Mantenimiento e Infraestructura'
END;
