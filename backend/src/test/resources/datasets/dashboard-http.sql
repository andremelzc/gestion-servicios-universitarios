-- Usuarios exclusivos de QA-06; la autenticación HTTP los carga desde MySQL.
INSERT INTO usuarios (codigo_institucional, nombre, apellido, correo, password_hash, id_rol, id_area, activo)
SELECT f.codigo, f.nombre, f.apellido, CONCAT(f.codigo, '@universidad.test'), 'test-only', r.id, a.id, TRUE
FROM (
    SELECT 'QA06-ADMIN' codigo, 'Admin' nombre, 'QA' apellido, 'ROLE_ADMIN' rol, NULL area
    UNION ALL SELECT 'QA06-SUP-TI', 'Supervisor', 'TI', 'ROLE_SUPERVISOR', 'Tecnologías de la Información'
    UNION ALL SELECT 'QA06-SUP-MANT', 'Supervisor', 'Mantenimiento', 'ROLE_SUPERVISOR', 'Mantenimiento e Infraestructura'
    UNION ALL SELECT 'QA06-CARLOS', 'Carlos', 'Ruiz', 'ROLE_TECNICO', 'Tecnologías de la Información'
    UNION ALL SELECT 'QA06-LUCIA', 'Lucía', 'Vega', 'ROLE_TECNICO', 'Mantenimiento e Infraestructura'
    UNION ALL SELECT 'QA06-TEC', 'Tecnico', 'QA', 'ROLE_TECNICO', 'Tecnologías de la Información'
) f
JOIN roles r ON r.nombre = f.rol
LEFT JOIN areas a ON a.nombre = f.area;

UPDATE solicitudes SET id_tecnico_asignado = CASE
    WHEN MOD(CAST(RIGHT(codigo, 4) AS UNSIGNED), 2) = 1 AND CAST(RIGHT(codigo, 4) AS UNSIGNED) <= 35
        THEN (SELECT id FROM usuarios WHERE codigo_institucional = 'QA06-CARLOS')
    WHEN MOD(CAST(RIGHT(codigo, 4) AS UNSIGNED), 2) = 0 AND CAST(RIGHT(codigo, 4) AS UNSIGNED) <= 22
        THEN (SELECT id FROM usuarios WHERE codigo_institucional = 'QA06-LUCIA')
    WHEN MOD(CAST(RIGHT(codigo, 4) AS UNSIGNED), 2) = 1 AND CAST(RIGHT(codigo, 4) AS UNSIGNED) BETWEEN 37 AND 51
        THEN (SELECT id FROM usuarios WHERE codigo_institucional = 'QA06-TEC')
    ELSE NULL END,
    -- Evita depender del día de ejecución para clasificar las 50 pendientes.
    fecha_limite_sla = DATE_SUB(fecha_registro, INTERVAL 30 YEAR)
WHERE codigo LIKE 'DASH-01-%';
