DO $$
DECLARE
    v_resultado JSON;
    -- Datos del profesor
    v_id INTEGER := 12345678; -- Cédula del profesor
    v_nombres VARCHAR := 'Juan';
    v_apellidos VARCHAR := 'Pérez';
    v_email VARCHAR := 'juan.perez@example.com';
    v_direccion VARCHAR := 'Calle Principal 123';
    v_password VARCHAR := 'password123';
    v_telefono_movil VARCHAR := '04121234567';
    v_telefono_local VARCHAR := '02121234567';
    v_fecha_nacimiento DATE := '1980-05-15';
    v_genero VARCHAR := 'masculino';
    v_nombre_categoria VARCHAR := 'Asociado';
    v_nombre_dedicacion VARCHAR := 'Tiempo Completo';
    v_fecha_ingreso DATE := '2023-01-01';
    -- Datos académicos
    v_pre_grado JSON[] := ARRAY[
        '{"id_pre_grado": 3, "nombre_pre_grado": "En Informática", "tipo_pre_grado": "Ingeniería"}'::JSON
    ];
    v_pos_grado JSON[] := NULL;
    v_area_de_conocimiento TEXT[] := ARRAY['Matematicas'];
    -- Usuario que ejecuta el procedimiento
    v_usuario_accion INTEGER := 999999999;
BEGIN
    -- Ejecutar el procedimiento
    CALL public.registrar_profesor_completo(
        v_usuario_accion,
        v_id,
        v_nombres,
        v_apellidos,
        v_email,
        v_direccion,
        v_password,
        v_telefono_movil,
        v_telefono_local,
        v_fecha_nacimiento,
        v_genero,
        v_nombre_categoria,
        v_nombre_dedicacion,
        v_pre_grado,
        v_pos_grado,
        v_area_de_conocimiento,
        v_fecha_ingreso,
        v_resultado
    );
    
    -- Mostrar el resultado
    RAISE NOTICE 'Resultado del registro: %', v_resultado;
END;
$$;