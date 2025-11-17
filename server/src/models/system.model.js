// Importación de la conexión a la base de datos
import pg from "../database/pg.js";

// Importación de clase para formateo de respuestas
import FormatterResponseModel from "../utils/FormatterResponseModel.js";

/**
 * @class SystemModel
 * @description Contiene los métodos para todas las operaciones relacionadas con el sistema
 */
export default class SystemModel {
    static async reportesEstadisticas() {
        try {
            // Ejecutar todas las consultas en paralelo
            const [
                cambiosGeneradosResult,
                seccionesTotalesResult,
                cargaPlanificadaResult,
                cargaRealResult,
                saturacionResult
            ] = await Promise.all([
                pg.query('SELECT * FROM public.vista_estadisticas_logs'),
                pg.query('SELECT COUNT(*) as total FROM secciones'),
                pg.query('SELECT COALESCE(SUM(horas_clase), 0) as total FROM unidades_curriculares'),
                // CORRECCIÓN: Convertir intervalo a horas numéricas
                pg.query(`
                SELECT COALESCE(
                    SUM(
                        EXTRACT(EPOCH FROM horas_disponibles) / 3600
                    ), 0
                ) as total 
                FROM public.profesores_informacion_completa
            `),
                pg.query(`
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
                ocupacion_calculada AS (
                    SELECT 
                        d.dia,
                        i.hora_inicio,
                        i.hora_fin,
                        COUNT(h.id_horario) as horarios_activos,
                        COUNT(DISTINCT h.aula_id) as aulas_ocupadas,
                        COUNT(DISTINCT h.profesor_id) as profesores_ocupados,
                        CASE 
                            WHEN (SELECT COUNT(*) FROM aulas WHERE activa = true) = 0 THEN 0
                            ELSE LEAST(
                                COUNT(DISTINCT h.aula_id)::numeric / 
                                NULLIF((SELECT COUNT(*) FROM aulas WHERE activa = true), 0)::numeric, 
                                1.0
                            )
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
                    END as nivel_ocupacion,
                    CASE 
                        WHEN densidad = 0 THEN '#E8F5E8'
                        WHEN densidad < 0.2 THEN '#C8E6C9'
                        WHEN densidad < 0.4 THEN '#FFF9C4'
                        WHEN densidad < 0.6 THEN '#FFE082'
                        WHEN densidad < 0.8 THEN '#FFB74D'
                        ELSE '#EF5350'
                    END as color_hex
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
                    hora_inicio
            `)
            ]);

            // Procesar datos de saturación para encontrar horas pico
            const horasPico = saturacionResult.rows
                .filter(row => row.densidad >= 0.7)
                .sort((a, b) => b.densidad - a.densidad)
                .slice(0, 10); // Top 10 horas más saturadas

            // Calcular estadísticas resumidas de saturación
            const estadisticasSaturacion = {
                totalBloques: saturacionResult.rows.length,
                bloquesOcupados: saturacionResult.rows.filter(row => row.densidad > 0).length,
                ocupacionPromedio: parseFloat((
                    saturacionResult.rows.reduce((sum, row) => sum + parseFloat(row.densidad), 0) /
                    saturacionResult.rows.length
                ).toFixed(3)),
                horasPico: horasPico.length,
                saturacionMaxima: Math.max(...saturacionResult.rows.map(row => parseFloat(row.densidad)))
            };

            // Estructurar la respuesta
            const datosReporte = {
                cambiosSistema: {
                    totalTiposEventos: cambiosGeneradosResult.rows.length,
                    eventos: cambiosGeneradosResult.rows,
                    totalEventos: cambiosGeneradosResult.rows.reduce((sum, row) => sum + parseInt(row.total_eventos), 0)
                },
                metricasAcademicas: {
                    totalSecciones: parseInt(seccionesTotalesResult.rows[0].total),
                    cargaPlanificada: parseInt(cargaPlanificadaResult.rows[0].total),
                    cargaReal: parseFloat(cargaRealResult.rows[0].total), // Cambiado a parseFloat
                    diferenciaCarga: parseInt(cargaPlanificadaResult.rows[0].total) - parseFloat(cargaRealResult.rows[0].total)
                },
                mapaCalor: {
                    datos: saturacionResult.rows,
                    estadisticas: estadisticasSaturacion,
                    horasPico: horasPico
                },
                resumenGeneral: {
                    fechaGeneracion: new Date().toISOString(),
                    totalAulas: (await pg.query('SELECT COUNT(*) as total FROM aulas WHERE activa = true')).rows[0].total,
                    totalProfesores: (await pg.query('SELECT COUNT(*) as total FROM profesores WHERE activo = true')).rows[0].total,
                    totalUnidadesCurriculares: (await pg.query('SELECT COUNT(*) as total FROM unidades_curriculares')).rows[0].total
                }
            };


            return datosReporte
        } catch (error) {
            console.error("❌ Error en reportesEstadisticas:", error);
            return FormatterResponseModel.respuestaError(
                `Error al generar reportes estadísticos: ${error.message}`
            );
        }
    }

    /**
     * @name obtenerEstadisticasRapidas
     * @description Obtiene estadísticas rápidas del sistema
     */
    static async obtenerEstadisticasRapidas() {
        try {
            const [
                totalSecciones,
                totalProfesores,
                totalAulas,
                totalHorarios,
                totalUnidadesCurriculares,
                eventosHoy
            ] = await Promise.all([
                pg.query('SELECT COUNT(*) as total FROM secciones'),
                pg.query('SELECT COUNT(*) as total FROM profesores WHERE activo = true'),
                pg.query('SELECT COUNT(*) as total FROM aulas WHERE activa = true'),
                pg.query('SELECT COUNT(*) as total FROM horarios WHERE activo = true'),
                pg.query('SELECT COUNT(*) as total FROM unidades_curriculares'),
                pg.query(`
                    SELECT COUNT(*) as total 
                    FROM logs 
                    WHERE DATE(created_at) = CURRENT_DATE
                `)
            ]);

            const estadisticas = {
                totalSecciones: parseInt(totalSecciones.rows[0].total),
                totalProfesores: parseInt(totalProfesores.rows[0].total),
                totalAulas: parseInt(totalAulas.rows[0].total),
                totalHorarios: parseInt(totalHorarios.rows[0].total),
                totalUnidadesCurriculares: parseInt(totalUnidadesCurriculares.rows[0].total),
                eventosHoy: parseInt(eventosHoy.rows[0].total),
                fechaActual: new Date().toISOString()
            };

            return FormatterResponseModel.respuestaSuccess(
                estadisticas,
                "Estadísticas rápidas obtenidas exitosamente"
            );

        } catch (error) {
            console.error("❌ Error en obtenerEstadisticasRapidas:", error);
            return FormatterResponseModel.respuestaError(error,
                `Error al obtener estadísticas rápidas: ${error.message}`
            );
        }
    }

    /**
     * @name obtenerMetricasRendimiento
     * @description Obtiene métricas de rendimiento del sistema
     */
    static async obtenerMetricasRendimiento() {
        try {
            const [
                ocupacionAulas,
                distribucionCarga,
                eficienciaHorarios,
                tendenciaUso
            ] = await Promise.all([
                // Ocupación promedio de aulas
                pg.query(`
                    SELECT 
                        ROUND(
                            COUNT(DISTINCT aula_id)::numeric / 
                            NULLIF((SELECT COUNT(*) FROM aulas WHERE activa = true), 0)::numeric, 
                            3
                        ) as ocupacion_promedio
                    FROM horarios 
                    WHERE activo = true
                `),
                // Distribución de carga por profesores
                pg.query(`
                    SELECT 
                        COUNT(*) as total_profesores,
                        COUNT(*) FILTER (WHERE horas_asignadas > 0) as profesores_con_carga,
                        AVG(horas_asignadas) as promedio_horas,
                        MAX(horas_asignadas) as maximo_horas
                    FROM profesores_informacion_completa
                `),
                // Eficiencia en uso de horarios
                pg.query(`
                    SELECT 
                        COUNT(*) as total_horarios,
                        COUNT(DISTINCT aula_id) as aulas_utilizadas,
                        COUNT(DISTINCT profesor_id) as profesores_activos,
                        COUNT(DISTINCT seccion_id) as secciones_atendidas
                    FROM horarios 
                    WHERE activo = true
                `),
                // Tendencia de uso en los últimos 7 días
                pg.query(`
                    SELECT 
                        DATE(created_at) as fecha,
                        COUNT(*) as total_eventos
                    FROM logs 
                    WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
                    GROUP BY DATE(created_at)
                    ORDER BY fecha DESC
                `)
            ]);

            const metricas = {
                ocupacionAulas: {
                    promedio: parseFloat(ocupacionAulas.rows[0]?.ocupacion_promedio || 0),
                    totalAulas: (await pg.query('SELECT COUNT(*) as total FROM aulas WHERE activa = true')).rows[0].total
                },
                distribucionCarga: {
                    totalProfesores: parseInt(distribucionCarga.rows[0]?.total_profesores || 0),
                    profesoresConCarga: parseInt(distribucionCarga.rows[0]?.profesores_con_carga || 0),
                    promedioHoras: parseFloat(distribucionCarga.rows[0]?.promedio_horas || 0),
                    maximoHoras: parseFloat(distribucionCarga.rows[0]?.maximo_horas || 0)
                },
                eficienciaHorarios: {
                    totalHorarios: parseInt(eficienciaHorarios.rows[0]?.total_horarios || 0),
                    aulasUtilizadas: parseInt(eficienciaHorarios.rows[0]?.aulas_utilizadas || 0),
                    profesoresActivos: parseInt(eficienciaHorarios.rows[0]?.profesores_activos || 0),
                    seccionesAtendidas: parseInt(eficienciaHorarios.rows[0]?.secciones_atendidas || 0)
                },
                tendenciaUso: tendenciaUso.rows,
                timestamp: new Date().toISOString()
            };

            return FormatterResponseModel.respuestaSuccess(
                metricas,
                "Métricas de rendimiento obtenidas exitosamente"
            );

        } catch (error) {
            console.error("❌ Error en obtenerMetricasRendimiento:", error);
            return FormatterResponseModel.respuestaError(error,
                `Error al obtener métricas de rendimiento: ${error.message}`
            );
        }
    }
}