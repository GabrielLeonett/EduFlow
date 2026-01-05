SELECT * FROM public.vista_notificaciones_completa 
       WHERE es_masiva = true 
       AND user_id IS NULL
       AND roles_destinatarios = '{}'::varchar[]
       ORDER BY fecha_creacion DESC;