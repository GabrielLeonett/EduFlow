import { useCallback } from "react";
import { UTILS } from "../../../utils/utils";
import useHorarioState from "./useHorarioState"; // Si necesitas acceder al estado

// En useProfessorAvailability.js
export const useProfessorAvailability = () => {
  const { state } = useHorarioState();
  const verificarDisponibilidadProfesor = useCallback(
    (
      profesor_id,
      dia_index,
      hora_inicio,
      bloques_necesarios,
      profesorHorario,
      claseActual = null
    ) => {
      console.log('🔍 INICIANDO VERIFICACIÓN DE PROFESOR');
      console.log('📋 Parámetros recibidos:', {
        profesor_id,
        dia_index,
        hora_inicio,
        bloques_necesarios,
        claseActual: claseActual?.id_horario || 'Ninguna',
        tieneProfesorHorario: !!profesorHorario,
        horariosEliminados: state?.horariosEliminados
      });

      // 1. Verificar si el objeto existe y si tiene la propiedad 'horario'
      if (!profesorHorario || !profesorHorario.horario) {
        console.log('❌ No hay datos de horario del profesor - RETORNA TRUE');
        return true;
      }

      // 2. Si el array existe, verificar si está vacío
      if (profesorHorario.horario.length === 0) {
        console.log('📭 Array de horarios vacío - RETORNA TRUE');
        return true;
      }

      console.log('📊 Días con horario:', profesorHorario.horario.length);
      console.log('📊 Estructura completa:', profesorHorario);

      const diasProfesor = profesorHorario.horario;

      console.log('👨‍🏫 Días del profesor:', {
        dias_count: diasProfesor.length,
        dias: diasProfesor.map(d => d.nombre)
      });

      if (!diasProfesor || diasProfesor.length === 0) {
        console.log('📭 No se encontraron días para el profesor - RETORNA TRUE');
        return true;
      }

      // Calcular hora fin
      const horaFin = parseInt(
        UTILS.sumar45Minutos(hora_inicio, bloques_necesarios)
      );

      console.log('⏰ Cálculo de horario:', {
        hora_inicio,
        bloques_necesarios,
        horaFin_calculada: horaFin,
        duracion_minutos: bloques_necesarios * 45
      });

      // Convertir a minutos para debugging
      const nuevaInicioMinutos = Math.floor(hora_inicio / 100) * 60 + (hora_inicio % 100);
      const nuevaFinMinutos = Math.floor(horaFin / 100) * 60 + (horaFin % 100);

      console.log('🕒 Nueva clase en minutos:', {
        inicio: nuevaInicioMinutos,
        fin: nuevaFinMinutos,
        formato: `${Math.floor(nuevaInicioMinutos / 60)}:${(nuevaInicioMinutos % 60).toString().padStart(2, '0')} - ${Math.floor(nuevaFinMinutos / 60)}:${(nuevaFinMinutos % 60).toString().padStart(2, '0')}`
      });

      let tieneConflicto = false;
      let detallesConflicto = null;

      // ✅ CORRECCIÓN: Usar diasProfesor directamente
      const resultado = !diasProfesor.some((dia) => {
        const diaId = UTILS.obtenerDiaId(dia.nombre);
        console.log(`📅 Verificando día: ${dia.nombre} (ID: ${diaId}) vs Buscado: ${dia_index}`);

        if (diaId !== dia_index) {
          console.log(`⏩ Saltando día ${dia.nombre} - no coincide`);
          return false;
        }

        console.log(`✅ Día coincide: ${dia.nombre}`);
        console.log(`📚 Clases en este día:`, dia.clases);

        return dia.clases.some((clase, index) => {
          console.log(`\n🔍 Verificando clase ${index + 1}:`, {
            id_horario: clase.id,
            hora_inicio: clase.hora_inicio,
            horaFin: clase.hora_fin,  // ✅ CORRECCIÓN: es hora_fin, no horaFin
            materia: clase.nombre_unidad_curricular
          });

          // ✅ SALTEAR la clase que se está moviendo
          if (claseActual && clase.id === claseActual.id_horario) {
            console.log('🔄 Saltando clase actual (misma que se está editando)');
            return false;
          }

          // ✅ OPCIONAL: Saltear horarios eliminados
          if (state?.horariosEliminados?.includes(clase.id)) {
            console.log('🗑️ Saltando horario eliminado');
            return false;
          }

          // Convertir horarios existentes a minutos
          const [claseHoraIni, claseMinIni] = clase.hora_inicio.split(":");
          const [claseHoraFin, claseMinFin] = clase.hora_fin.split(":");  // ✅ CORRECCIÓN

          const claseInicioMinutos = parseInt(claseHoraIni) * 60 + parseInt(claseMinIni);
          const claseFinMinutos = parseInt(claseHoraFin) * 60 + parseInt(claseMinFin);

          console.log('🕒 Comparación de horarios:', {
            clase_existente: `${clase.hora_inicio}-${clase.hora_fin}`,
            clase_minutos: `${claseInicioMinutos}-${claseFinMinutos}`,
            nueva_clase: `${hora_inicio}-${horaFin}`,
            nueva_minutos: `${nuevaInicioMinutos}-${nuevaFinMinutos}`
          });

          // Verificar solapamiento
          const hayConflicto = (
            nuevaInicioMinutos < claseFinMinutos &&
            nuevaFinMinutos > claseInicioMinutos
          );

          if (hayConflicto) {
            console.log('❌ ¡CONFLICTO DETECTADO!');
            console.log('📊 Detalles del conflicto:', {
              condicion1: `${nuevaInicioMinutos} < ${claseFinMinutos} = ${nuevaInicioMinutos < claseFinMinutos}`,
              condicion2: `${nuevaFinMinutos} > ${claseInicioMinutos} = ${nuevaFinMinutos > claseInicioMinutos}`,
              solapamiento: 'LAS CLASES SE SUPERPONEN'
            });
            tieneConflicto = true;
            detallesConflicto = {
              claseExistente: clase,
              nuevaClase: { hora_inicio, horaFin }
            };
          } else {
            console.log('✅ No hay conflicto con esta clase');
          }

          return hayConflicto;
        });
      });

      console.log('🎯 RESULTADO FINAL:', {
        tieneConflicto,
        disponible: resultado,
        detallesConflicto
      });
      console.log('='.repeat(50));

      return resultado;
    },
    [state.horariosEliminados]
  );

  return {
    verificarDisponibilidadProfesor,
  };
};
