// Importación de Knex
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

      // Construir query base con Knex
      let query = db("vista_auditoria").select(
        "log_id",
        "tipo_evento",
        "mensaje",
        "metadatos",
        "usuario_id",
        "referencia_id",
        "fecha_evento",
        "usuario_cedula",
        "usuario_nombres",
        "usuario_apellidos",
        "usuario_email",
        "usuario_activo",
        "usuario_genero",
        "categoria_evento",
        "entidad_afectada",
        "accion_especifica",
        "registro_afectado_id",
        "direccion_ip",
        "agente_usuario",
        "detalles_adicionales",
        "estado_evento"
      );

      // Aplicar filtros dinámicos
      if (usuarioId) {
        query = query.where("usuario_id", usuarioId);
      }

      if (tipoEvento) {
        query = query.where("tipo_evento", tipoEvento);
      }

      if (categoria) {
        query = query.where("categoria_evento", categoria);
      }

      if (entidad) {
        query = query.where("entidad_afectada", entidad);
      }

      if (estado) {
        query = query.where("estado_evento", estado);
      }

      if (fechaDesde) {
        query = query.where("fecha_evento", ">=", fechaDesde);
      }

      if (fechaHasta) {
        query = query.where("fecha_evento", "<=", `${fechaHasta} 23:59:59`);
      }

      if (search) {
        query = query.where(function () {
          this.where("mensaje", "ilike", `%${search}%`)
            .orWhere("usuario_nombres", "ilike", `%${search}%`)
            .orWhere("usuario_apellidos", "ilike", `%${search}%`)
            .orWhere("usuario_email", "ilike", `%${search}%`);
        });
      }

      // Obtener total para paginación (clonar query antes de limit/offset)
      const totalResult = await query.clone().count("* as total").first();
      const total = parseInt(totalResult.total);

      // Aplicar ordenamiento y paginación
      const eventos = await query
        .orderBy("fecha_evento", "desc")
        .limit(limit)
        .offset(offset);

      return FormatterResponseModel.respuestaPostgres(
        {
          eventos,
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
      throw FormatterResponseModel.respuestaError(
        error,
        "Error al obtener registros de auditoría"
      );
    }
  }

  /**
   * @method obtenerMetricasSistema
   * @description Obtiene las métricas generales del sistema (cambios, logs, eventos)
   */
  static async obtenerMetricasSistema() {
    try {
      console.log("Obteniendo metricas del sistema");

      const [cambiosGenerados, resumenGeneral] = await Promise.all([
        db("vista_estadisticas_logs").select("*"),
        db.raw(`
          SELECT 
            (SELECT COUNT(*) FROM aulas WHERE activa = true) as total_aulas,
            (SELECT COUNT(*) FROM profesores WHERE activo = true) as total_profesores,
            (SELECT COUNT(*) FROM unidades_curriculares) as total_unidades_curriculares
        `),
      ]);

      const cambiosData = cambiosGenerados.map((row) => ({
        ...row,
        total_cambios: parseInt(row.total_cambios),
      }));

      const data = {
        cambiosSistema: {
          totalTiposEventos: cambiosData.length,
          eventos: cambiosData,
          totalEventos: cambiosData.reduce(
            (sum, row) => sum + row.total_cambios,
            0
          ),
        },
        resumenGeneral: {
          fechaGeneracion: new Date().toISOString(),
          totalAulas: parseInt(resumenGeneral.rows[0].total_aulas),
          totalProfesores: parseInt(resumenGeneral.rows[0].total_profesores),
          totalUnidadesCurriculares: parseInt(
            resumenGeneral.rows[0].total_unidades_curriculares
          ),
        },
      };

      return FormatterResponseModel.respuestaPostgres(
        [data],
        "Métricas del sistema obtenidas exitosamente"
      );
    } catch (error) {
      console.error("❌ Error en obtenerMetricasSistema:", error);
      throw FormatterResponseModel.respuestaError(
        error,
        "Error al obtener métricas del sistema"
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
        db.raw(`
          SELECT
            p.nombre_pnf,    
            tr.valor_trayecto,
            COUNT(s.*)::INTEGER AS total_secciones
          FROM secciones s
          INNER JOIN trayectos tr ON s.id_trayecto = tr.id_trayecto
          INNER JOIN pnfs p ON tr.id_pnf = p.id_pnf
          GROUP BY p.nombre_pnf, tr.valor_trayecto
          ORDER BY p.nombre_pnf, tr.valor_trayecto
        `),
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

      // Para consultas raw, necesitamos acceder a .rows
      const totalHorasUnidades = parseInt(
        cargaUnidadesCurriculares.rows?.[0]?.total || 0
      );
      const totalSeccionesCount = parseInt(
        totalSecciones.rows?.[0]?.total || 0
      );
      const cargaReal = parseFloat(cargaRealResult.rows?.[0]?.total || 0);

      // Calcular carga planificada (horas totales * número de secciones)
      const cargaPlanificada = totalHorasUnidades * totalSeccionesCount;

      const data = {
        seccionesTotales: seccionesTotalesResult.rows || [],
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

      return FormatterResponseModel.respuestaPostgres(
        [data],
        "Métricas académicas obtenidas exitosamente"
      );
    } catch (error) {
      console.error("❌ Error en obtenerMetricasAcademicas:", error);
      throw FormatterResponseModel.respuestaError(
        error,
        "Error al obtener métricas académicas"
      );
    }
  }

  /**
   * @method obtenerMapaCalorOcupacion
   * @description Obtiene los datos de saturación y ocupación para el mapa de calor
   */
  static async obtenerMapaCalorOcupacion() {
    try {
      // Para consultas complejas con CTEs, mantenemos db.raw
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

      const rows = saturacionResult.rows || [];
      const saturacionMaxima =
        rows.length > 0
          ? Math.max(...rows.map((row) => parseFloat(row.densidad)))
          : 0;

      // Procesar datos de saturación para encontrar horas pico
      const horasPico = rows
        .filter((row) => row.densidad >= 0.7)
        .sort((a, b) => b.densidad - a.densidad)
        .slice(0, 10);

      // Calcular estadísticas resumidas de saturación
      const estadisticasSaturacion = {
        totalBloques: rows.length,
        horasPico: horasPico.length,
        saturacionMaxima,
        porcentajeOcupacion:
          rows.length > 0
            ? parseFloat(
                (
                  (rows.filter((row) => row.densidad > 0).length /
                    rows.length) *
                  100
                ).toFixed(2)
              )
            : 0,
      };

      const data = {
        datos: rows,
        estadisticas: estadisticasSaturacion,
        horasPico: horasPico,
      };

      return FormatterResponseModel.respuestaPostgres(
        [data],
        "Mapa de calor de ocupación obtenido exitosamente"
      );
    } catch (error) {
      console.error("❌ Error en obtenerMapaCalorOcupacion:", error);
      throw FormatterResponseModel.respuestaError(
        error,
        "Error al obtener mapa de calor de ocupación"
      );
    }
  }

  /**
   * @method reportesEstadisticas
   * @description Método principal que combina todos los reportes
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

      return FormatterResponseModel.respuestaPostgres(
        [data],
        "Reportes estadísticos generados exitosamente"
      );
    } catch (error) {
      console.error("❌ Error en reportesEstadisticas:", error);
      throw FormatterResponseModel.respuestaError(
        error,
        "Error al generar reportes estadísticos"
      );
    }
  }

  /**
   * @method obtenerEstadisticasUsuarios
   * @description Obtiene estadísticas de usuarios por rol y actividad
   */
  static async obtenerEstadisticasUsuarios() {
    try {
      const [totalUsuarios, usuariosPorRol, usuariosActivos, ultimosAccesos] =
        await Promise.all([
          db("users").count("* as total").first(),
          db("usuario_rol as ur")
            .select("r.nombre_rol", db.raw("COUNT(*) as total"))
            .join("roles as r", "ur.rol_id", "r.id_rol")
            .groupBy("r.nombre_rol")
            .orderBy("total", "desc"),
          db("users").count("* as total").where("activo", true).first(),
          db("users")
            .select("cedula", "nombres", "apellidos", "email", "last_login")
            .whereNotNull("last_login")
            .orderBy("last_login", "desc")
            .limit(10),
        ]);

      const data = {
        total: parseInt(totalUsuarios.total),
        activos: parseInt(usuariosActivos.total),
        inactivos:
          parseInt(totalUsuarios.total) - parseInt(usuariosActivos.total),
        porRol: usuariosPorRol.map((rol) => ({
          rol: rol.nombre_rol,
          total: parseInt(rol.total),
        })),
        ultimosAccesos: ultimosAccesos.map((user) => ({
          ...user,
          ultimo_acceso: user.last_login,
          dias_desde_ultimo_acceso: user.last_login
            ? Math.floor(
                (new Date() - new Date(user.last_login)) / (1000 * 60 * 60 * 24)
              )
            : null,
        })),
      };

      return FormatterResponseModel.respuestaPostgres(
        [data],
        "Estadísticas de usuarios obtenidas exitosamente"
      );
    } catch (error) {
      console.error("❌ Error en obtenerEstadisticasUsuarios:", error);
      throw FormatterResponseModel.respuestaError(
        error,
        "Error al obtener estadísticas de usuarios"
      );
    }
  }

  /**
   * @method obtenerEstadisticasHorarios
   * @description Obtiene estadísticas de horarios y carga académica
   */
  static async obtenerEstadisticasHorarios() {
    try {
      const [
        horariosPorDia,
        horasPorPNF,
        aulasMasOcupadas,
        profesoresCargaAlta,
      ] = await Promise.all([
        db("horarios")
          .select("dia_semana", db.raw("COUNT(*) as total"))
          .where("activo", true)
          .groupBy("dia_semana")
          .orderBy(
            db.raw(`CASE dia_semana 
            WHEN 'Lunes' THEN 1 
            WHEN 'Martes' THEN 2 
            WHEN 'Miércoles' THEN 3 
            WHEN 'Jueves' THEN 4 
            WHEN 'Viernes' THEN 5 
            WHEN 'Sábado' THEN 6 END`)
          ),
        db.raw(`
          SELECT 
            p.nombre_pnf,
            COUNT(h.id_horario) as total_horarios,
            SUM(EXTRACT(EPOCH FROM (h.hora_fin - h.hora_inicio))/3600)::INTEGER as horas_totales
          FROM horarios h
          INNER JOIN trayectos t ON h.id_trayecto = t.id_trayecto
          INNER JOIN pnfs p ON t.id_pnf = p.id_pnf
          WHERE h.activo = true
          GROUP BY p.nombre_pnf
          ORDER BY horas_totales DESC
        `),
        db("horarios as h")
          .select("a.nombre as aula", db.raw("COUNT(*) as total_horarios"))
          .join("aulas as a", "h.aula_id", "a.id_aula")
          .where("h.activo", true)
          .groupBy("a.nombre")
          .orderBy("total_horarios", "desc")
          .limit(10),
        db.raw(`
          SELECT 
            u.nombres,
            u.apellidos,
            COUNT(h.id_horario) as total_horarios,
            SUM(EXTRACT(EPOCH FROM (h.hora_fin - h.hora_inicio))/3600)::DECIMAL(10,2) as horas_totales
          FROM horarios h
          INNER JOIN users u ON h.profesor_id = u.cedula
          WHERE h.activo = true
          GROUP BY u.nombres, u.apellidos
          HAVING COUNT(h.id_horario) > 15
          ORDER BY horas_totales DESC
          LIMIT 10
        `),
      ]);

      const data = {
        horariosPorDia: horariosPorDia.map((dia) => ({
          dia: dia.dia_semana,
          total: parseInt(dia.total),
        })),
        horasPorPNF: horasPorPNF.rows || [],
        aulasMasOcupadas: aulasMasOcupadas.map((aula) => ({
          aula: aula.aula,
          total_horarios: parseInt(aula.total_horarios),
        })),
        profesoresCargaAlta: profesoresCargaAlta.rows || [],
        estadisticasGenerales: {
          totalHorariosActivos: horariosPorDia.reduce(
            (sum, dia) => sum + parseInt(dia.total),
            0
          ),
          promedioHorariosPorDia: Math.round(
            horariosPorDia.reduce((sum, dia) => sum + parseInt(dia.total), 0) /
              (horariosPorDia.length || 1)
          ),
        },
      };

      return FormatterResponseModel.respuestaPostgres(
        [data],
        "Estadísticas de horarios obtenidas exitosamente"
      );
    } catch (error) {
      console.error("❌ Error en obtenerEstadisticasHorarios:", error);
      throw FormatterResponseModel.respuestaError(
        error,
        "Error al obtener estadísticas de horarios"
      );
    }
  }

  /**
   * @method obtenerReporteConsolidado
   * @description Obtiene un reporte consolidado con todas las estadísticas del sistema
   */
  static async obtenerReporteConsolidado() {
    try {
      const [
        metricasSistema,
        metricasAcademicas,
        estadisticasUsuarios,
        estadisticasHorarios,
        mapaCalor,
      ] = await Promise.all([
        this.obtenerMetricasSistema(),
        this.obtenerMetricasAcademicas(),
        this.obtenerEstadisticasUsuarios(),
        this.obtenerEstadisticasHorarios(),
        this.obtenerMapaCalorOcupacion(),
      ]);

      const reporte = {
        fechaGeneracion: new Date().toISOString(),
        resumen: {
          sistema: metricasSistema.data?.[0]?.resumenGeneral || {},
          academicas: metricasAcademicas.data?.[0]?.metricasDetalladas || {},
          usuarios: estadisticasUsuarios.data?.[0] || {},
          horarios: estadisticasHorarios.data?.[0]?.estadisticasGenerales || {},
        },
        metricasDetalladas: {
          sistema: metricasSistema.data?.[0]?.cambiosSistema || {},
          academicas: metricasAcademicas.data?.[0] || {},
          usuarios: estadisticasUsuarios.data?.[0]?.porRol || [],
          horarios: estadisticasHorarios.data?.[0] || {},
          ocupacion: mapaCalor.data?.[0]?.estadisticas || {},
        },
        alertas: this._generarAlertas(
          metricasAcademicas.data?.[0],
          estadisticasHorarios.data?.[0],
          mapaCalor.data?.[0]
        ),
      };

      return FormatterResponseModel.respuestaPostgres(
        [reporte],
        "Reporte consolidado generado exitosamente"
      );
    } catch (error) {
      console.error("❌ Error en obtenerReporteConsolidado:", error);
      throw FormatterResponseModel.respuestaError(
        error,
        "Error al generar reporte consolidado"
      );
    }
  }

  /**
   * Método auxiliar para generar alertas basadas en métricas
   * @private
   */
  static _generarAlertas(metricasAcademicas, estadisticasHorarios, mapaCalor) {
    const alertas = [];

    // Alertas de carga académica
    if (metricasAcademicas?.eficienciaAsignacion < 70) {
      alertas.push({
        tipo: "advertencia",
        titulo: "Baja eficiencia en asignación",
        mensaje: `La eficiencia de asignación es del ${metricasAcademicas.eficienciaAsignacion}%`,
        prioridad: "media",
      });
    }

    if (metricasAcademicas?.diferenciaCarga > 100) {
      alertas.push({
        tipo: "critico",
        titulo: "Sobrecarga académica",
        mensaje: `Existe una sobrecarga de ${metricasAcademicas.diferenciaCarga} horas`,
        prioridad: "alta",
      });
    }

    // Alertas de horarios
    const aulasSobrecargadas = estadisticasHorarios?.aulasMasOcupadas?.filter(
      (aula) => aula.total_horarios > 30
    );
    if (aulasSobrecargadas?.length > 0) {
      alertas.push({
        tipo: "advertencia",
        titulo: "Aulas sobrecargadas",
        mensaje: `${aulasSobrecargadas.length} aulas tienen más de 30 horarios asignados`,
        prioridad: "media",
      });
    }

    // Alertas de ocupación
    if (mapaCalor?.estadisticas?.horasPico > 20) {
      alertas.push({
        tipo: "info",
        titulo: "Horas pico detectadas",
        mensaje: `Se detectaron ${mapaCalor.estadisticas.horasPico} horas con alta ocupación`,
        prioridad: "baja",
      });
    }

    return alertas;
  }
}
