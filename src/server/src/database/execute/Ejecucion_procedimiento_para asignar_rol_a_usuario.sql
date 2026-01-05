-- Prueba directa del procedimiento
DO $simple_test$
DECLARE
    resultado JSON;
BEGIN
    -- Llamar al procedimiento
    CALL asignar_rol_administrador_usuario(999999999, 999999999, 1, resultado);
    
    -- Mostrar resultado
    RAISE NOTICE 'Resultado: %', resultado;
END $simple_test$;