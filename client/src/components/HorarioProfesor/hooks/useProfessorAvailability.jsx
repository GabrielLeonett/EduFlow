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
      const horarioProfesor = profesorHorario.find(
        (prof) => prof.id_profesor === profesor_id
      );

      if (!horarioProfesor || !horarioProfesor.dias) return true;

      const horaFin = parseInt(
        UTILS.sumar45Minutos(hora_inicio, bloques_necesarios)
      );

      return !horarioProfesor.dias.some((dias) => {
        if (UTILS.obtenerDiaId(dias.nombre) !== dia_index) return false;

        return dias.clases.some((clase) => {
          // ✅ SALTEAR la clase que se está moviendo
          if (claseActual && clase.id_horario === claseActual.id_horario) {
            return false;
          }

          // ✅ OPCIONAL: Saltear horarios eliminados (si aplica para profesores)
          if (state?.horariosEliminados?.includes(clase.id_horario)) {
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
    verificarDisponibilidadProfesor,
  };
};
