DO $$
DECLARE
    resultado JSON;
BEGIN
    CALL public.registrar_administrador_completo(
        p_usuario_accion := 999999999::integer,               -- Admin user ID performing the action
        p_id := 25896322::integer,                     -- New admin's ID number
        p_nombres := 'María José'::varchar,           -- First name
        p_apellidos := 'González Pérez'::varchar,     -- Last name
        p_email := 'maria.gonzalezzz@instituto.edu'::varchar, -- Email
        p_direccion := 'Av. Universidad 123'::varchar, -- Address
        p_password := 'AdminSecure123!'::varchar,      -- Password (should be hashed)
        p_telefono_movil := '04141234567'::varchar,    -- Mobile phone
        p_telefono_local := '02123456789'::varchar,    -- Landline
        p_fecha_nacimiento := '1985-07-15'::date,      -- Birth date
        p_genero := 'femenino'::varchar,                      -- Gender
        p_id_rol := 2::smallint,                       -- Admin role ID (1 for superadmin)
        p_resultado := resultado                       -- OUT parameter
    );
    
    RAISE NOTICE 'Result: %', resultado;
END $$;