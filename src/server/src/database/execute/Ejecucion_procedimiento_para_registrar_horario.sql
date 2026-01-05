DO $$
DECLARE
    resultado JSONB;
BEGIN
    CALL public.registrar_horario_completo(
        p_usuario_accion := 999999999,                     -- ID usuario administrador
        p_id_seccion := 1,                        -- ID sección existente
        p_id_profesor := 1,                      -- ID profesor existente
        p_unidad_curricular_id := 1,               -- ID unidad curricular existente
        p_dia_semana := 'Lunes',                   -- Día de la semana
        p_hora_inicio := '09:00:00',               -- Hora inicio
        p_id_aula := 1,                         -- Aula
        p_activo := true,                          -- Horario activo
        p_resultado := resultado                   -- Parámetro OUT
    );
    
    RAISE NOTICE 'Resultado exitoso: %', resultado;
END $$;