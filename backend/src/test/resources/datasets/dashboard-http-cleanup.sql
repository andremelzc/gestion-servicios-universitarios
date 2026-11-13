DELETE FROM solicitudes WHERE codigo LIKE 'DASH-01-%' OR codigo LIKE 'DASH-02-%';
DELETE FROM usuarios WHERE codigo_institucional LIKE 'QA06-%' OR codigo_institucional LIKE 'DASH01-EST-%';
