DO $$
DECLARE
    resultado JSON;
BEGIN
    CALL public.registrar_unidad_curricular_completo(
        p_usuario_accion := 999999999::integer,                     -- ID usuario administrador
        p_id_trayecto := 1,                        -- ID trayecto existente
        p_nombre_unidad_curricular := 'Matemáticas Avanzadas',
        p_descripcion_unidad_curricular := 'Curso de matemáticas para el tercer trayecto',
        p_carga_horas := 3,                       -- Horas de carga académica
        p_codigo_unidad := 'MAT-313',              -- Código único
        p_resultado := resultado                    -- Parámetro OUT
    );
    
    RAISE NOTICE 'Resultado exitoso: %', resultado;
END $$;