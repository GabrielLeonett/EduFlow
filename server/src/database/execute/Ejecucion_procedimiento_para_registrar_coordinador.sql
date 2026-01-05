DO $$
DECLARE
    resultado JSON;
BEGIN
    CALL public.registrar_coordinador_completo(
        p_usuario_accion := 999999999::integer,                           -- ID del usuario administrador
        p_id_cedula := 25896314::bigint,                         -- Cédula del coordinador
        p_nombres := 'Ana María'::varchar,                       -- Nombres
        p_apellidos := 'González Pérez'::varchar,                -- Apellidos
        p_email := 'ana.gonzalez@instituto.edu'::varchar,        -- Email
        p_direccion := 'Av. Universidad 123'::varchar,           -- Dirección
        p_password := 'PasswordSeguro123!'::varchar,             -- Contraseña
        p_telefono_movil := '04141234567'::varchar,              -- Teléfono móvil
        p_telefono_local := '02123456789'::varchar,              -- Teléfono local
        p_fecha_nacimiento := '1985-07-15'::date,                -- Fecha de nacimiento
        p_genero := 'femenino'::varchar,                                -- Género
        p_id_pnf := 1::bigint,                                   -- ID del PNF
        p_id_ubicacion := 1::bigint,                             -- ID de la ubicación
        p_resultado := resultado                                  -- Parámetro OUT
    );
    
    RAISE NOTICE 'Resultado del registro: %', resultado;
END $$;