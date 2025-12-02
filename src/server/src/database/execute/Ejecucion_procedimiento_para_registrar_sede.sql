-- Caso de prueba 1: Registro exitoso
DO $$
DECLARE
    v_resultado JSON;
BEGIN
    CALL public.registrar_sede_completo(
        p_usuario_accion := 999999999,  -- ID de usuario administrador
        p_id_sede := 1,      -- NULL para nuevo registro
        p_nombre_sede := 'Sede Central',
        p_ubicacion_sede := 'Av. Principal 123, Ciudad',
        p_google_sede := 'google-maps-id-123',
        p_resultado := v_resultado
    );
    
    RAISE NOTICE 'Resultado prueba 1 (éxito esperado): %', v_resultado;
END $$;
