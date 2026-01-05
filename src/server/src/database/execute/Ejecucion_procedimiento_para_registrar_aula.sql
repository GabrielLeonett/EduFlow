DO $$
DECLARE
    v_resultado JSON;
BEGIN
    -- Llamar al procedimiento
    CALL registrar_aula_completo(
        999999999,              -- Usuario admin
        1,              -- Sede principal
        'COM-701',      -- Código de aula
        'Computación',  -- Tipo de aula
        25,             -- Capacidad
        v_resultado     -- Variable para capturar el resultado
    );
    
    -- Mostrar el resultado
    RAISE NOTICE 'Resultado del registro: %', v_resultado;
END;
$$;