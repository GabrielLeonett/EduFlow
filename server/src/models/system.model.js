// Importación de la conexión a la base de datos
import pg from "../database/pg.js";

// Importación de clase para formateo de respuestas
import FormatterResponseModel from "../utils/FormatterResponseModel.js";

/**
 * @class SystemModel
 * @description Contiene los métodos para todas las operaciones relacionadas con el sistema
 */
export default class SystemModel {
  /**
   * @method obtenerMetricasSistema
   * @description Obtiene las métricas generales del sistema (cambios, logs, eventos)
   */
  static async obtenerMetricasSistema() {
    try {
      const [cambiosGeneradosResult, resumenGeneralResult] = await Promise.all([
        pg.query("SELECT * FROM public.vista_estadisticas_logs"),
        pg.query(`
          SELECT 
            (SELECT COUNT(*) FROM aulas WHERE activa = true) as total_aulas,
            (SELECT COUNT(*) FROM profesores WHERE activo = true) as total_profesores,
            (SELECT COUNT(*) FROM unidades_curriculares) as total_unidades_curriculares
        `),
      ]);

      const data = {
        cambiosSistema: {
          totalTiposEventos: cambiosGeneradosResult.rows.length,
          eventos: cambiosGeneradosResult.rows,
          totalEventos: cambiosGeneradosResult.rows.reduce(
            (sum, row) => sum + parseInt(row.total_eventos),
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
      const [seccionesTotalesResult, cargaPlanificadaResult, cargaRealResult] =
        await Promise.all([
          pg.query(`SELECT
            p.nombre_pnf,    
            tr.valor_trayecto,
            COUNT(s.*)::INTEGER  AS total_secciones
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
          pg.query(
            "SELECT SUM(horas_clase)::INTEGER as total FROM unidades_curriculares"
          ),
          pg.query(`
            SELECT 
SUM(EXTRACT(EPOCH FROM horas_disponibles) / 3600)::INTEGER as total 
            FROM public.profesores_informacion_completa
          `),
        ]);

      const cargaPlanificada = parseInt(cargaPlanificadaResult.rows[0].total);
      const cargaReal = parseFloat(cargaRealResult.rows[0].total);

      const data = {
        seccionesTotales: seccionesTotalesResult.rows,
        cargaPlanificada: cargaPlanificada,
        cargaReal: cargaReal,
        diferenciaCarga:  cargaReal - cargaPlanificada,
        eficienciaAsignacion:
          cargaPlanificada > 0
            ? parseFloat(((cargaPlanificada / cargaReal) * 100).toFixed(2))
            : 0,
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
      const saturacionResult = await pg.query(`
        WITH intervalos_academicos AS (
  SELECT 
    n,
    ('07:00'::time + (n * '45 minutes'::interval)) as hora_inicio,
    ('07:00'::time + ((n + 1) * '45 minutes'::interval)) as hora_fin
  FROM generate_series(0, 17) as n
),
dias_semana AS (
  SELECT unnest(ARRAY['Lunes','Martes','Miercoles','Jueves','Viernes','Sabado']) as dia
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
    WHEN 'Miercoles' THEN 3
    WHEN 'Jueves' THEN 4
    WHEN 'Viernes' THEN 5
    WHEN 'Sabado' THEN 6
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
