-- 2. Probar el procedimiento completo
DO $test$
DECLARE
    resultado JSON;
BEGIN
    CALL public.asignar_coordinador(999999999, 33335596, 1, resultado);
    RAISE NOTICE 'Resultado: %', resultado;
END $test$;
