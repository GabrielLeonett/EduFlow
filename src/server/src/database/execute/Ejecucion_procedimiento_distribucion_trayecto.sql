DO $$
DECLARE 
	RESULTADO JSONB;
BEGIN
	CALL public.distribuir_estudiantes_secciones(
	p_id_trayecto := 1, 
	p_total_estudiantes := 200, 
	p_resultado := RESULTADO
	);

	RAISE NOTICE 'Resultado del la distribucion: %', RESULTADO;
END $$