-- Vista: clases_completas
-- Descripción: Vista que une información completa de horarios de clases incluyendo
-- profesores, unidades curriculares, secciones, trayectos, PNFs, turnos y aulas
CREATE OR REPLACE VIEW public.clases_completas AS
SELECT 
    h.id_horario,
    p.id_profesor,
    h.hora_inicio,
    h.hora_fin,
    h.dia_semana,
    u.nombres AS nombres_profesor,
    u.apellidos AS apellidos_profesor,
    uc.id_unidad_curricular,
    uc.nombre_unidad_curricular,
    s.valor_seccion,
    s.id_seccion,
    tr.valor_trayecto,
    pnf.nombre_pnf,
    tur.nombre_turno,
    tur.inicio_hora AS turno_hora_inicio,
    tur.fin_hora AS turno_hora_fin,
    au.codigo_aula,
    au.id_aula
FROM secciones s
    JOIN turnos tur ON s.id_turno = tur.id_turno
    JOIN trayectos tr ON s.id_trayecto = tr.id_trayecto
    JOIN pnfs pnf ON tr.id_pnf = pnf.id_pnf
    LEFT JOIN horarios h ON s.id_seccion = h.seccion_id
    LEFT JOIN aulas au ON h.aula_id = au.id_aula
    LEFT JOIN profesores p ON h.profesor_id = p.id_profesor
    LEFT JOIN users u ON p.id_cedula = u.cedula
    LEFT JOIN unidades_curriculares uc ON h.unidad_curricular_id = uc.id_unidad_curricular
ORDER BY pnf.id_pnf, tr.id_trayecto DESC, s.id_seccion;

-- Vista: coordinadores_informacion_completa
-- Descripción: Vista que proporciona información completa de los coordinadores
-- incluyendo datos personales, académicos, dedicación, categoría y experiencia
CREATE OR REPLACE VIEW public.coordinadores_informacion_completa AS
SELECT 
    c.id_coordinador,
    c.id_profesor,
    c.id_pnf,
    c.created_at AS fecha_designacion,
    c.updated_at AS fecha_actualizacion,
    pnf.nombre_pnf,
    pnf.codigo_pnf,
    u.nombres,
    u.apellidos,
    u.cedula::text AS cedula,
    u.telefono_movil,
    u.telefono_local,
    u.fecha_nacimiento,
    u.genero,
    u.email,
    u.direccion,
    pr.fecha_ingreso,
    -- Dedicación actual del profesor
    (SELECT d.nombre_dedicacion
     FROM dedicaciones d
     WHERE d.id_dedicacion = (
         SELECT rdp.dedicacion_id
         FROM relacion_dedicacion_profesor rdp
         WHERE rdp.profesor_id = pr.id_profesor AND rdp.fecha_fin IS NULL
         LIMIT 1
     )) AS dedicacion,
    -- Categoría actual del profesor
    (SELECT c2.nombre_categoria
     FROM categorias c2
     WHERE c2.id_categoria = (
         SELECT rcp.categoria_id
         FROM relacion_categoria_profesor rcp
         WHERE rcp.profesor_id = pr.id_profesor AND rcp.fecha_fin IS NULL
         LIMIT 1
     )) AS categoria,
    -- Áreas de conocimiento del profesor como array
    ARRAY(
        SELECT adc.nombre_area_conocimiento
        FROM areas_de_conocimiento adc
        WHERE adc.id_area_conocimiento IN (
            SELECT pac.area_id
            FROM profesor_area_conocimiento pac
            WHERE pac.profesor_id = pr.id_profesor
        )
    ) AS areas_de_conocimiento,
    -- Disponibilidad horaria del profesor como array de objetos JSON
    ARRAY(
        SELECT json_build_object(
            'dia_semana', dd.dia_semana, 
            'hora_inicio', dd.hora_inicio, 
            'hora_fin', dd.hora_fin
        ) AS disponibilidad
        FROM disponibilidad_docente dd
        WHERE dd.id_profesor = pr.id_profesor
    ) AS disponibilidad,
    -- Pregrados del profesor como array de objetos JSON
    ARRAY(
        SELECT json_build_object(
            'id_pre_grado', pg.id_pre_grado,
            'tipo_pre_grado', pg.tipo_pre_grado,
            'nombre_pre_grado', pg.nombre_pre_grado,
            'completo', format('%s %s', pg.tipo_pre_grado, pg.nombre_pre_grado)
        ) AS pre_grado_info
        FROM pre_grado pg
        WHERE pg.id_pre_grado IN (
            SELECT rppg.pre_grado_id
            FROM relacion_profesor_pre_grado rppg
            WHERE rppg.profesor_id = pr.id_profesor
        )
    ) AS pre_grados,
    -- Posgrados del profesor como array de objetos JSON
    ARRAY(
        SELECT json_build_object(
            'id_pos_grado', pog.id_pos_grado,
            'tipo_pos_grado', pog.tipo_pos_grado,
            'nombre_pos_grado', pog.nombre_pos_grado,
            'completo', format('%s %s', pog.tipo_pos_grado, pog.nombre_pos_grado)
        ) AS pos_grado_info
        FROM pos_grado pog
        WHERE pog.id_pos_grado IN (
            SELECT rppg.pos_grado_id
            FROM relacion_profesor_pos_grado rppg
            WHERE rppg.profesor_id = pr.id_profesor
        )
    ) AS pos_grados,
    -- Horas disponibles para docencia (horas totales - horas asignadas)
    (
        (SELECT d.horas_docencia_semanales
         FROM dedicaciones d
         WHERE d.id_dedicacion = (
             SELECT rdp.dedicacion_id
             FROM relacion_dedicacion_profesor rdp
             WHERE rdp.profesor_id = pr.id_profesor AND rdp.fecha_fin IS NULL
             LIMIT 1
         ))
        - COALESCE(
            (SELECT sum(h.hora_fin - h.hora_inicio) AS sum
             FROM horarios h
             WHERE h.profesor_id = pr.id_profesor),
            '00:00:00'::interval
        )
    ) AS horas_disponibles,
    -- Estatus del coordinador (activo/inactivo basado en última actualización)
    CASE
        WHEN c.updated_at > (CURRENT_TIMESTAMP - '1 year'::interval) THEN 'activo'::text
        ELSE 'inactivo'::text
    END AS estatus_coordinador,
    -- Años de experiencia como coordinador
    EXTRACT(year FROM age(CURRENT_TIMESTAMP, c.created_at)) AS anos_experiencia_coordinador
FROM coordinadores c
    JOIN profesores pr ON c.id_profesor = pr.id_profesor
    JOIN users u ON pr.id_cedula = u.cedula
    JOIN pnfs pnf ON c.id_pnf = pnf.id_pnf;

-- Vista: profesores_informacion_completa
-- Descripción: Vista que proporciona información completa de todos los profesores
-- incluyendo datos personales, académicos y carga horaria
CREATE OR REPLACE VIEW public.profesores_informacion_completa AS
SELECT 
    u.nombres,
    pr.id_profesor,
    u.apellidos,
    u.cedula::text AS cedula,
    u.telefono_movil,
    u.telefono_local,
    u.fecha_nacimiento,
    u.genero,
    u.email,
    u.imagen,
    pr.fecha_ingreso,
    -- Dedicación actual del profesor
    (SELECT d.nombre_dedicacion
     FROM dedicaciones d
     WHERE d.id_dedicacion = (
         SELECT rdp.dedicacion_id
         FROM relacion_dedicacion_profesor rdp
         WHERE rdp.profesor_id = pr.id_profesor AND rdp.fecha_fin IS NULL
         LIMIT 1
     )) AS dedicacion,
    -- Categoría actual del profesor
    (SELECT c.nombre_categoria
     FROM categorias c
     WHERE c.id_categoria = (
         SELECT rcp.categoria_id
         FROM relacion_categoria_profesor rcp
         WHERE rcp.profesor_id = pr.id_profesor AND rcp.fecha_fin IS NULL
         LIMIT 1
     )) AS categoria,
    -- Áreas de conocimiento del profesor como array
    ARRAY(
        SELECT adc.nombre_area_conocimiento
        FROM areas_de_conocimiento adc
        WHERE adc.id_area_conocimiento IN (
            SELECT pac.area_id
            FROM profesor_area_conocimiento pac
            WHERE pac.profesor_id = pr.id_profesor
        )
    ) AS areas_de_conocimiento,
    -- Disponibilidad horaria del profesor como array de objetos JSON
    ARRAY(
        SELECT json_build_object(
            'dia_semana', dd.dia_semana,
            'hora_inicio', dd.hora_inicio,
            'hora_fin', dd.hora_fin
        ) AS json_build_object
        FROM disponibilidad_docente dd
        WHERE dd.id_profesor = pr.id_profesor
    ) AS disponibilidad,
    -- Pregrados del profesor como array de strings formateados
    ARRAY(
        SELECT format('%s %s', pg.tipo_pre_grado, pg.nombre_pre_grado) AS format
        FROM pre_grado pg
        WHERE pg.id_pre_grado IN (
            SELECT rppg.pre_grado_id
            FROM relacion_profesor_pre_grado rppg
            WHERE rppg.profesor_id = pr.id_profesor
        )
    ) AS pre_grados,
    -- Posgrados del profesor como array de strings formateados
    ARRAY(
        SELECT format('%s %s', pog.tipo_pos_grado, pog.nombre_pos_grado) AS format
        FROM pos_grado pog
        WHERE pog.id_pos_grado IN (
            SELECT rppg.pos_grado_id
            FROM relacion_profesor_pos_grado rppg
            WHERE rppg.profesor_id = pr.id_profesor
        )
    ) AS pos_grados,
    -- Horas disponibles para docencia
    (
        (SELECT d.horas_docencia_semanales
         FROM dedicaciones d
         WHERE d.id_dedicacion = (
             SELECT rdp.dedicacion_id
             FROM relacion_dedicacion_profesor rdp
             WHERE rdp.profesor_id = pr.id_profesor AND rdp.fecha_fin IS NULL
             LIMIT 1
         ))
        - COALESCE(
            (SELECT sum(h.hora_fin - h.hora_inicio) AS sum
             FROM horarios h
             WHERE h.profesor_id = pr.id_profesor),
            '00:00:00'::interval
        )
    ) AS horas_disponibles,
    -- Indicador si el profesor es coordinador
    (EXISTS (
        SELECT 1
        FROM coordinadores c
        WHERE c.id_profesor = pr.id_profesor
    )) AS is_coordinador
FROM profesores pr
    JOIN users u ON pr.id_cedula = u.cedula;

-- Vista: vista_notificaciones_completa
-- Descripción: Vista que proporciona información completa de notificaciones
-- incluyendo destinatarios, estados y métricas de entrega
CREATE OR REPLACE VIEW public.vista_notificaciones_completa AS
SELECT 
    n.id,
    n.user_id,
    n.type AS tipo_notificacion,
    n.title AS titulo,
    n.body AS contenido,
    n.is_read AS leida,
    n.read_at AS fecha_lectura,
    n.metadata AS metadatos,
    n.created_at AS fecha_creacion,
    n.is_mass AS es_masiva,
    n.mass_parent_id AS id_notificacion_padre,
    -- Roles destinatarios como array
    COALESCE(
        array_agg(DISTINCT r.nombre_rol) FILTER (WHERE r.nombre_rol IS NOT NULL),
        '{}'::character varying[]
    ) AS roles_destinatarios,
    -- IDs de roles destinatarios como array
    COALESCE(
        array_agg(DISTINCT nr.role_id) FILTER (WHERE nr.role_id IS NOT NULL),
        '{}'::integer[]
    ) AS roles_ids,
    -- IDs de usuarios destinatarios como array
    COALESCE(
        array_agg(DISTINCT nr2.user_id) FILTER (WHERE nr2.user_id IS NOT NULL),
        '{}'::bigint[]
    ) AS usuarios_destinatarios,
    -- Total de destinatarios
    (SELECT count(*) AS count
     FROM notification_recipients nr3
     WHERE nr3.notification_id = n.id) AS total_destinatarios,
    -- Cantidad de destinatarios que han leído la notificación
    (SELECT count(*) AS count
     FROM notification_recipients nr4
     WHERE nr4.notification_id = n.id AND nr4.is_read = true) AS destinatarios_leido,
    -- Tipo de envío (masivo/individual)
    CASE
        WHEN n.is_mass THEN 'Notificación Masiva'::text
        WHEN n.user_id IS NOT NULL THEN 'Notificación Individual'::text
        ELSE 'Tipo No Definido'::text
    END AS tipo_envio,
    -- Estado de lectura
    CASE
        WHEN n.is_read THEN 'Leída'::text
        WHEN n.read_at IS NOT NULL THEN 'Leída'::text
        ELSE 'No Leída'::text
    END AS estado_lectura,
    -- Prioridad de la notificación
    COALESCE(n.metadata ->> 'priority'::text, 'normal'::text) AS prioridad,
    -- Indicador si tiene notificaciones hijas (para notificaciones masivas)
    (EXISTS (
        SELECT 1
        FROM notifications n2
        WHERE n2.mass_parent_id = n.id
    )) AS tiene_notificaciones_hijas
FROM notifications n
    LEFT JOIN notification_roles nr ON n.id = nr.notification_id
    LEFT JOIN roles r ON nr.role_id = r.id_rol
    LEFT JOIN notification_recipients nr2 ON n.id = nr2.notification_id
GROUP BY n.id, n.user_id, n.type, n.title, n.body, n.is_read, n.read_at, n.metadata, n.created_at, n.is_mass, n.mass_parent_id;

-- Vista: vista_pnfs
-- Descripción: Vista que proporciona información completa de los PNFs
-- incluyendo sede, coordinador y estado
CREATE OR REPLACE VIEW public.vista_pnfs AS
SELECT 
    p.id_pnf,
    p.codigo_pnf,
    p.nombre_pnf,
    p.descripcion_pnf,
    p.poblacion_estudiantil_pnf,
    p.activo,
    s.nombre_sede,
    -- Indicador si el PNF tiene coordinador asignado
    (EXISTS (
        SELECT 1
        FROM coordinadores c
        WHERE c.id_pnf = p.id_pnf
    )) AS tiene_coordinador,
    -- Nombre completo del coordinador (si existe)
    (SELECT (u.nombres::text || ' '::text) || u.apellidos::text
     FROM coordinadores c
        JOIN profesores pr ON c.id_profesor = pr.id_profesor
        JOIN users u ON pr.id_cedula = u.cedula
     WHERE c.id_pnf = p.id_pnf
     LIMIT 1) AS nombre_coordinador,
    -- Campos adicionales para compatibilidad
    p.created_at,
    s.id_sede,
    s.ubicacion_sede,
    s.google_sede
FROM pnfs p
    JOIN sedes s ON p.id_sede = s.id_sede;

CREATE OR REPLACE VIEW vista_sedes_completa AS
SELECT 
    p.id_pnf,
    p.codigo_pnf,
    p.nombre_pnf,
    p.poblacion_estudiantil_pnf,
    s.id_sede,
    s.nombre_sede,
    s.ubicacion_sede,
    s.google_sede
FROM pnfs p
INNER JOIN sedes s ON p.id_sede = s.id_sede;