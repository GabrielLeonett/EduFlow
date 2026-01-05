-- Ejemplo de llamada
DO $$
DECLARE
    resultado JSON;
BEGIN
    CALL eliminar_destituir_profesor(
        resultado,           -- OUT parameter
        999999999,           -- p_usuario_accion (admin)
        31264460,            -- p_id_profesor
        'DESTITUCION',       -- p_tipo_accion
        'Incumplimiento grave de normas institucionales', -- p_razon
        'Se verificaron múltiples quejas de estudiantes', -- p_observaciones
        '2024-09-29'         -- p_fecha_efectiva
    );
    RAISE NOTICE 'Resultado: %', resultado;
END $$;