// Importación de la conexión a la base de datos
import db from "../database/db.js";

// Importación de clase para formateo de respuestas
import FormatterResponseModel from "../utils/FormatterResponseModel.js";

/**
 * @class SystemModel
 * @description Contiene los métodos para todas las operaciones relacionadas con el sistema
 */
export default class SystemModel {
  /**
   * @method obtenerAuditoria
   * @description Obtiene los registros de auditoría con filtros opcionales
   * @param {Object} filtros - Filtros para la consulta de auditoría
   * @param {number} filtros.limit - Límite de registros (default: 100)
   * @param {number} filtros.offset - Offset para paginación (default: 0)
   * @param {string} filtros.usuarioId - Filtrar por ID de usuario
   * @param {string} filtros.tipoEvento - Filtrar por tipo de evento
   * @param {string} filtros.categoria - Filtrar por categoría de evento
   * @param {string} filtros.entidad - Filtrar por entidad afectada
   * @param {string} filtros.estado - Filtrar por estado del evento
   * @param {string} filtros.fechaDesde - Filtrar desde fecha (YYYY-MM-DD)
   * @param {string} filtros.fechaHasta - Filtrar hasta fecha (YYYY-MM-DD)
   * @param {string} filtros.search - Búsqueda en mensaje o nombres de usuario
   * @returns {Promise<Object>} Resultado de la consulta de auditoría
   */
  static async obtenerAuditoria(filtros = {}) {
    try {
      const {
        limit = 100,
        offset = 0,
        usuarioId,
        tipoEvento,
        categoria,
        entidad,
        estado,
        fechaDesde,
        fechaHasta,
        search,
      } = filtros;

      let query = `
        SELECT 
          log_id,
          tipo_evento,
          mensaje,
          metadatos,
          usuario_id,
          referencia_id,
          fecha_evento,
          usuario_cedula,
          usuario_nombres,
          usuario_apellidos,
          usuario_email,
          usuario_activo,
          usuario_genero,
          categoria_evento,
          entidad_afectada,
          accion_especifica,
          registro_afectado_id,
          direccion_ip,
          agente_usuario,
          detalles_adicionales,
          estado_evento
        FROM public.vista_auditoria 
        WHERE 1=1
      `;

      const params = [];
      let paramCount = 0;

      // Aplicar filtros
      if (usuarioId) {
        paramCount++;
        query += ` AND usuario_id = $${paramCount}`;
        params.push(usuarioId);
      }

      if (tipoEvento) {
        paramCount++;
        query += ` AND tipo_evento = $${paramCount}`;
        params.push(tipoEvento);
      }

      if (categoria) {
        paramCount++;
        query += ` AND categoria_evento = $${paramCount}`;
        params.push(categoria);
      }

      if (entidad) {
        paramCount++;
        query += ` AND entidad_afectada = $${paramCount}`;
        params.push(entidad);
      }

      if (estado) {
        paramCount++;
        query += ` AND estado_evento = $${paramCount}`;
        params.push(estado);
      }

      if (fechaDesde) {
        paramCount++;
        query += ` AND fecha_evento >= $${paramCount}`;
        params.push(fechaDesde);
      }

      if (fechaHasta) {
        paramCount++;
        query += ` AND fecha_evento <= $${paramCount}`;
        params.push(fechaHasta + " 23:59:59");
      }

      if (search) {
        paramCount++;
        query += ` AND (
          mensaje ILIKE $${paramCount} OR 
          usuario_nombres ILIKE $${paramCount} OR 
          usuario_apellidos ILIKE $${paramCount} OR
          usuario_email ILIKE $${paramCount}
        )`;
        params.push(`%${search}%`);
      }

      // Ordenamiento y paginación
      query += ` ORDER BY fecha_evento DESC`;

      paramCount++;
      query += ` LIMIT $${paramCount}`;
      params.push(limit);

      paramCount++;
      query += ` OFFSET $${paramCount}`;
      params.push(offset);

      console.log("🔍 Query auditoría:", query);
      console.log("🔍 Parámetros:", params);

      const result = await db.raw(query, params);

      // Consulta para el total (sin paginación)
      let countQuery = `SELECT COUNT(*) as total FROM public.vista_auditoria WHERE 1=1`;
      const countParams = [];

      // Aplicar los mismos filtros al count
      let countParamCount = 0;
      const filterConditions = [
        { condition: usuarioId, value: usuarioId },
        { condition: tipoEvento, value: tipoEvento },
        { condition: categoria, value: categoria },
        { condition: entidad, value: entidad },
        { condition: estado, value: estado },
        { condition: fechaDesde, value: fechaDesde },
        {
          condition: fechaHasta,
          value: fechaHasta ? fechaHasta + " 23:59:59" : null,
        },
        { condition: search, value: search ? `%${search}%` : null },
      ];

      filterConditions.forEach((filter) => {
        if (filter.condition) {
          countParamCount++;
          countQuery += ` AND ${this.getFilterCondition(
            filter,
            countParamCount
          )}`;
          countParams.push(filter.value);
        }
      });

      const countResult = await db.raw(countQuery, countParams);
      const total = parseInt(countResult.rows[0].total);

      return FormatterResponseModel.respuestaPostgres(
        {
          eventos: result.rows,
          pagination: {
            limit: parseInt(limit),
            offset: parseInt(offset),
            total,
            hasNext: offset + limit < total,
            hasPrev: offset > 0,
          },
          filtrosAplicados: filtros,
        },
        "Registros de auditoría obtenidos exitosamente"
      );
    } catch (error) {
      console.error("❌ Error en obtenerAuditoria:", error);
      return FormatterResponseModel.respuestaError(
        `Error al obtener registros de auditoría: ${error.message}`
      );
    }
  }

  /**
   * Helper method para construir condiciones de filtro
   */
  static getFilterCondition(filter, paramCount) {
    const conditions = {
      usuarioId: `usuario_id = $${paramCount}`,
      tipoEvento: `tipo_evento = $${paramCount}`,
      categoria: `categoria_evento = $${paramCount}`,
      entidad: `entidad_afectada = $${paramCount}`,
      estado: `estado_evento = $${paramCount}`,
      fechaDesde: `fecha_evento >= $${paramCount}`,
      fechaHasta: `fecha_evento <= $${paramCount}`,
      search: `(mensaje ILIKE $${paramCount} OR usuario_nombres ILIKE $${paramCount} OR usuario_apellidos ILIKE $${paramCount} OR usuario_email ILIKE $${paramCount})`,
    };

    return conditions[Object.keys(filter)[0]] || "1=1";
  }

  /**
   * @method obtenerMetricasSistema
   * @description Obtiene las métricas generales del sistema (cambios, logs, eventos)
   */
  static async obtenerMetricasSistema() {
    try {
      console.log("Obteniendo metricas del sistema");
      const [cambiosGeneradosResult, resumenGeneralResult] = await Promise.all([
        db.raw("SELECT * FROM public.vista_estadisticas_logs"),
        db.raw(`
          SELECT 
            (SELECT COUNT(*) FROM aulas WHERE activa = true) as total_aulas,
            (SELECT COUNT(*) FROM profesores WHERE activo = true) as total_profesores,
            (SELECT COUNT(*) FROM unidades_curriculares) as total_unidades_curriculares
        `),
      ]);
      console.log(cambiosGeneradosResult.rows.map(row => row.total_cambios));

      const data = {
        cambiosSistema: {
          totalTiposEventos: cambiosGeneradosResult.rows.length,
          eventos: cambiosGeneradosResult.rows,
          totalEventos: cambiosGeneradosResult.rows.reduce(
            (sum, row) => sum + parseInt(row.total_cambios),
            0
          ),
        },
        resumenGeneral: {
          fechaGeneracion: new Date().toISOString(),
          totalAulas: parseInt(resumenGeneralResult.rows[0].total_aulas),
          totalProfesores: parseInt(
            resumenGeneralResult.rows[0].total_profesores
          ),
          totalUnidadesCurriculares: parseInt(
            resumenGeneralResult.rows[0].total_unidades_curriculares
          ),
        },
      };

      // Si respuestaPostgres NO es async, no usar await
      return FormatterResponseModel.respuestaPostgres(
        [data],
        "Métricas del sistema obtenidas exitosamente"
      );
    } catch (error) {
      console.error("❌ Error en obtenerMetricasSistema:", error);
      return FormatterResponseModel.respuestaError(
        `Error al obtener métricas del sistema: ${error.message}`
      );
    }
  }

  /**
   * @method obtenerMetricasAcademicas
   * @description Obtiene las métricas académicas (secciones, carga horaria)
   */
  static async obtenerMetricasAcademicas() {
    try {
      const [
        seccionesTotalesResult,
        cargaUnidadesCurriculares,
        totalSecciones,
        cargaRealResult,
      ] = await Promise.all([
        db.raw(`SELECT
          p.nombre_pnf,    
          tr.valor_trayecto,
          COUNT(s.*)::INTEGER AS total_secciones
      FROM
          secciones s
      INNER JOIN
          trayectos tr ON s.id_trayecto = tr.id_trayecto
      INNER JOIN
          pnfs p ON tr.id_pnf = p.id_pnf
      GROUP BY
          p.nombre_pnf,
          tr.valor_trayecto
      ORDER BY
          p.nombre_pnf,
          tr.valor_trayecto`),
        db.raw(`
          SELECT SUM(horas_clase)::INTEGER as total 
          FROM unidades_curriculares
        `),
        db.raw(`
          SELECT COUNT(*)::INTEGER as total 
          FROM secciones
        `),
        db.raw(`
          SELECT 
            SUM(EXTRACT(EPOCH FROM horas_disponibles) / 3600)::INTEGER as total 
          FROM public.profesores_informacion_completa
        `),
      ]);

      // Corregir los nombres de las propiedades según lo que devuelve PostgreSQL
      const totalHorasUnidades = parseInt(
        cargaUnidadesCurriculares.rows[0]?.total || 0
      );
      const totalSeccionesCount = parseInt(totalSecciones.rows[0]?.total || 0);
      const cargaReal = parseFloat(cargaRealResult.rows[0]?.total || 0);

      // Calcular carga planificada (horas totales * número de secciones)
      const cargaPlanificada = totalHorasUnidades * totalSeccionesCount;

      const data = {
        seccionesTotales: seccionesTotalesResult.rows,
        cargaPlanificada: cargaPlanificada,
        cargaReal: cargaReal,
        diferenciaCarga: cargaReal - cargaPlanificada,
        eficienciaAsignacion:
          cargaReal > 0
            ? parseFloat(((cargaPlanificada / cargaReal) * 100).toFixed(2))
            : 0,
        metricasDetalladas: {
          totalHorasUnidades: totalHorasUnidades,
          totalSecciones: totalSeccionesCount,
        },
      };

      // Si respuestaPostgres NO es async, no usar await
      return FormatterResponseModel.respuestaPostgres(
        [data],
        "Métricas académicas obtenidas exitosamente"
      );
    } catch (error) {
      console.error("❌ Error en obtenerMetricasAcademicas:", error);
      return FormatterResponseModel.respuestaError(
        `Error al obtener métricas académicas: ${error.message}`
      );
    }
  }

  /**
   * @method obtenerMapaCalorOcupacion
   * @description Obtiene los datos de saturación y ocupación para el mapa de calor
   */
  static async obtenerMapaCalorOcupacion() {
    try {
      const saturacionResult = await db.raw(`
        WITH intervalos_academicos AS (
          SELECT 
            n,
            ('07:00'::time + (n * '45 minutes'::interval)) as hora_inicio,
            ('07:00'::time + ((n + 1) * '45 minutes'::interval)) as hora_fin
          FROM generate_series(0, 17) as n
        ),
        dias_semana AS (
          SELECT unnest(ARRAY['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado']) as dia
        ),
        -- Calcular el máximo de horarios activos en cualquier intervalo para normalizar
        max_horarios AS (
          SELECT MAX(contador) as max_horarios
          FROM (
            SELECT COUNT(*) as contador
            FROM dias_semana d
            CROSS JOIN intervalos_academicos i
            LEFT JOIN horarios h ON (
              h.dia_semana = d.dia 
              AND h.activo = true
              AND h.hora_inicio < i.hora_fin
              AND h.hora_fin > i.hora_inicio
            )
            GROUP BY d.dia, i.hora_inicio, i.hora_fin
          ) counts
        ),
        ocupacion_calculada AS (
          SELECT 
            d.dia,
            i.hora_inicio,
            i.hora_fin,
            COUNT(h.id_horario) as horarios_activos,
            COUNT(DISTINCT h.aula_id) as aulas_ocupadas,
            COUNT(DISTINCT h.profesor_id) as profesores_ocupados,
            -- Densidad basada en el número de horarios (normalizado 0-1)
            CASE 
              WHEN (SELECT max_horarios FROM max_horarios) = 0 THEN 0
              ELSE COUNT(h.id_horario)::numeric / (SELECT max_horarios FROM max_horarios)::numeric
            END as densidad
          FROM dias_semana d
          CROSS JOIN intervalos_academicos i
          LEFT JOIN horarios h ON (
            h.dia_semana = d.dia 
            AND h.activo = true
            AND h.hora_inicio < i.hora_fin
            AND h.hora_fin > i.hora_inicio
          )
          GROUP BY d.dia, i.hora_inicio, i.hora_fin
        )
        SELECT 
          dia,
          TO_CHAR(hora_inicio, 'HH24:MI') as hora_inicio,
          TO_CHAR(hora_fin, 'HH24:MI') as hora_fin,
          horarios_activos,
          aulas_ocupadas,
          profesores_ocupados,
          ROUND(densidad::numeric, 3) as densidad,
          CASE 
            WHEN densidad = 0 THEN 'Libre'
            WHEN densidad < 0.2 THEN 'Muy Baja'
            WHEN densidad < 0.4 THEN 'Baja'
            WHEN densidad < 0.6 THEN 'Media'
            WHEN densidad < 0.8 THEN 'Alta'
            ELSE 'Crítica'
          END as nivel_ocupacion
        FROM ocupacion_calculada
        ORDER BY 
          CASE dia
            WHEN 'Lunes' THEN 1
            WHEN 'Martes' THEN 2
            WHEN 'Miércoles' THEN 3
            WHEN 'Jueves' THEN 4
            WHEN 'Viernes' THEN 5
            WHEN 'Sábado' THEN 6
          END,
          hora_inicio;
      `);

      const saturacionMaxima = Math.max(
        ...saturacionResult.rows.map((row) => parseFloat(row.densidad))
      );

      // Procesar datos de saturación para encontrar horas pico
      const horasPico = saturacionResult.rows
        .filter((row) => row.densidad >= 0.7)
        .sort((a, b) => b.densidad - a.densidad)
        .slice(0, 10);

      // Calcular estadísticas resumidas de saturación
      const estadisticasSaturacion = {
        totalBloques: saturacionResult.rows.length,
        horasPico: horasPico.length,
        saturacionMaxima,
        porcentajeOcupacion: parseFloat(
          (
            (saturacionResult.rows.filter((row) => row.densidad > 0).length /
              saturacionResult.rows.length) *
            100
          ).toFixed(2)
        ),
      };

      const data = {
        datos: saturacionResult.rows,
        estadisticas: estadisticasSaturacion,
        horasPico: horasPico,
      };

      // Si respuestaPostgres NO es async, no usar await
      return FormatterResponseModel.respuestaPostgres(
        [data],
        "Mapa de calor de ocupación obtenido exitosamente"
      );
    } catch (error) {
      console.error("❌ Error en obtenerMapaCalorOcupacion:", error);
      return FormatterResponseModel.respuestaError(
        `Error al obtener mapa de calor de ocupación: ${error.message}`
      );
    }
  }

  /**
   * @method reportesEstadisticas
   * @description Método principal que combina todos los reportes (método original mantenido por compatibilidad)
   */
  static async reportesEstadisticas() {
    try {
      const [metricasSistema, metricasAcademicas, mapaCalor] =
        await Promise.all([
          this.obtenerMetricasSistema(),
          this.obtenerMetricasAcademicas(),
          this.obtenerMapaCalorOcupacion(),
        ]);

      // Extraer los datos de cada respuesta
      const dataMetricasSistema = metricasSistema.data?.[0] || {};
      const dataMetricasAcademicas = metricasAcademicas.data?.[0] || {};
      const dataMapaCalor = mapaCalor.data?.[0] || {};

      const data = {
        cambiosSistema: dataMetricasSistema.cambiosSistema,
        metricasAcademicas: dataMetricasAcademicas,
        mapaCalor: dataMapaCalor,
        resumenGeneral: dataMetricasSistema.resumenGeneral,
      };

      // Si respuestaPostgres NO es async, no usar await
      return FormatterResponseModel.respuestaPostgres(
        [data],
        "Reportes estadísticos generados exitosamente"
      );
    } catch (error) {
      console.error("❌ Error en reportesEstadisticas:", error);
      return FormatterResponseModel.respuestaError(
        `Error al generar reportes estadísticos: ${error.message}`
      );
    }
  }
}
