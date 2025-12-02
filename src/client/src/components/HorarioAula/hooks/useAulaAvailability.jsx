import { useCallback } from "react";
import { UTILS } from "../../../utils/utils";
import useHorarioState from "./useHorarioState";

export const useAulaAvailability = () => {
  const { state } = useHorarioState();
  const verificarDisponibilidadAula = useCallback(
    (
      id_aula,
      dia_index,
      hora_inicio,
      bloques_necesarios,
      aulas_horarios,
      claseActual = null
    ) => {
      const horarioAula = aulas_horarios.find(
        (aula) => aula.idAula === id_aula || aula.id_aula === id_aula
      );
      if (!horarioAula || !horarioAula.dias) return true;

      // Calcular hora fin
      const horaFin = parseInt(
        UTILS.sumar45Minutos(hora_inicio, bloques_necesarios)
      );

      // Verificar si el aula ya tiene clase en este día y rango de horas
      return !horarioAula.dias.some((dias) => {
        if (UTILS.obtenerDiaId(dias.nombre) !== dia_index) return false;

        return dias.clases.some((clase) => {
          // ✅ SALTEAR la clase que se está moviendo
          if (claseActual && clase.id_horario === claseActual.id_horario) {
            return false;
          }
          if (state.horariosEliminados && state.horariosEliminados.includes(clase.id_horario)) {
            return false;
          }

          const [claseHoraIni, claseMinIni] = clase.hora_inicio.split(":");
          const [claseHoraFin, claseMinFin] = clase.horaFin.split(":");

          const claseInicioMinutos =
            parseInt(claseHoraIni) * 60 + parseInt(claseMinIni);
          const claseFinMinutos =
            parseInt(claseHoraFin) * 60 + parseInt(claseMinFin);

          const nuevaInicioMinutos =
            Math.floor(hora_inicio / 100) * 60 + (hora_inicio % 100);
          const nuevaFinMinutos =
            Math.floor(horaFin / 100) * 60 + (horaFin % 100);

          // Verificar superposición de horarios
          return (
            nuevaInicioMinutos < claseFinMinutos &&
            nuevaFinMinutos > claseInicioMinutos
          );
        });
      });
    },
    [state.horariosEliminados]
  );

  return {
    verificarDisponibilidadAula,
  };
};
