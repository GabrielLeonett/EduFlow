-- Ejemplo: Notificación para los roles 1 (admin) y 3 (moderador)
SELECT guardar_notificacion_roles(
    ARRAY[1, 3],                   -- Array de IDs de roles
    'system_alert',                -- type
    'Mantenimiento programado',    -- title
    'El sistema estará inactivo mañana de 2:00 a 4:00 AM', -- body
    '{"impact": "high", "date": "2023-12-15"}'::jsonb  -- metadata (opcional)
);