DO $$
DECLARE
    resultado JSON;
BEGIN
    CALL actualizar_profesor_completo_o_parcial(
        p_resultado => resultado,
        p_usuario_accion => 999999999,
        p_id => 31264460,
        p_nombres => 'Gabriel Dayer',
        p_apellidos => 'Leonett Armas',
        p_email => 'delegadogabrielleonett@email.com',
        p_genero => 'masculino'
    );
    RAISE NOTICE 'Resultado: %', resultado;
END $$;