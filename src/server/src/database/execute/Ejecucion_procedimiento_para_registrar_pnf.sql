DO $$
DECLARE
    resultado JSON;
BEGIN
    CALL public.registrar_pnf_completo(
        p_usuario_accion := 999999999::integer,                     -- ID del usuario administrador
        p_nombre_pnf := 'Informática'::varchar,             -- Nombre del PNF
        p_descripcion_pnf := 'Programación y sistemas'::varchar, -- Descripción
        p_codigo_pnf := 'INF-01'::varchar,                  -- Código del PNF
        p_id_sede := 1::smallint,                        -- ID de ubicación
        p_resultado := resultado                             -- Parámetro OUT
    );
    
    RAISE NOTICE 'Resultado del registro: %', resultado;
END $$;