-- Datos aislados para CA-7: tres solicitudes resueltas en 2, 4 y 6 horas
-- y una abierta sin fecha de resolución. Usa catálogos sembrados por V2.
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
    fecha_resolucion
)
SELECT
    fixture.codigo,
    usuario.id,
    categoria.id,
    prioridad.id,
    fixture.titulo,
    'Registro determinístico para validar el cálculo del MTTR.',
    'Campus de prueba',
    'Ambiente de prueba',
    estado.codigo,
    fixture.fecha_registro,
    DATE_SUB(fixture.fecha_registro, INTERVAL 1 HOUR),
    CASE
        WHEN fixture.horas_resolucion IS NULL THEN NULL
        ELSE DATE_ADD(fixture.fecha_registro, INTERVAL fixture.horas_resolucion HOUR)
    END
FROM (
    SELECT 'DASH-02-MTTR-2H' AS codigo, 'Resuelta en 2 horas' AS titulo,
        CAST('2025-01-01 00:00:00' AS DATETIME) AS fecha_registro, 2 AS horas_resolucion, 'RESUELTA' AS estado
    UNION ALL
    SELECT 'DASH-02-MTTR-4H', 'Resuelta en 4 horas', CAST('2025-01-01 00:00:00' AS DATETIME), 4, 'RESUELTA'
    UNION ALL
    SELECT 'DASH-02-MTTR-6H', 'Resuelta en 6 horas', CAST('2025-01-01 00:00:00' AS DATETIME), 6, 'RESUELTA'
    UNION ALL
    SELECT 'DASH-02-MTTR-OPEN', 'Aún abierta', CAST('2025-01-01 00:00:00' AS DATETIME), NULL, 'REGISTRADA'
) fixture
JOIN usuarios usuario ON usuario.codigo_institucional = 'DASH01-EST-001'
JOIN categorias categoria ON categoria.nombre = 'Electricidad'
JOIN prioridades prioridad ON prioridad.nivel = 'BAJA'
JOIN estados_solicitud estado ON estado.codigo = fixture.estado;
