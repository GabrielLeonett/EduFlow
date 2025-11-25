import { UTILS } from "../../../utils/utils";

// Función para encontrar slot original
export const findOriginalSlot = (clase, tableHorario) => {
  for (let dia_index = 0; dia_index < tableHorario.length; dia_index++) {
    const dia = tableHorario[dia_index];
    const horas = Object.keys(dia.horas);

    for (const hora of horas) {
      const celda = dia.horas[hora];
      if (celda?.ocupado && celda.datos_clase.id === clase.id) {

        const bloques_necesarios = celda.bloques_totales;
        return {
          dia_index,
          hora_inicio: parseInt(hora),
          bloques_necesarios,
        };
      }
    }
  }
  return null;
};

// Función para liberar slot original
export const liberarSlotOriginal = (originalSlot, tableHorario) => {
  if (!originalSlot) return tableHorario;

  return tableHorario.map((item, index) => ({
    ...item,
    horas: { ...item.horas },
    ...(index === originalSlot.dia_index && {
      horas: Object.keys(item.horas).reduce((acc, hora) => {
        const horaNum = parseInt(hora);
        if (
          horaNum >= originalSlot.hora_inicio &&
          horaNum <
            parseInt(
              UTILS.sumar45Minutos(
                originalSlot.hora_inicio,
                originalSlot.bloques_necesarios
              )
            )
        ) {
          acc[hora] = null;
        } else {
          acc[hora] = item.horas[hora];
        }
        return acc;
      }, {}),
    }),
  }));
};

// Función para ocupar nuevo slot
export const ocuparNuevoSlot = (nuevoSlot, classToMove, tableHorario) => {
  const { dia_index, hora_inicio, bloques_necesarios } = nuevoSlot;

  return tableHorario.map((item, index) => ({
    ...item,
    horas: { ...item.horas },
    ...(index === dia_index && {
      horas: Object.keys(item.horas).reduce((acc, hora) => {
        const horaNum = parseInt(hora);
        const hora_fin = parseInt(
          UTILS.sumar45Minutos(hora_inicio, bloques_necesarios)
        );

        if (horaNum >= hora_inicio && horaNum < hora_fin) {
          const bloqueIndex = Math.floor((horaNum - hora_inicio) / 45);
          acc[hora] = {
            ocupado: true,
            datos_clase: {
              ...classToMove,
              dia_semana: UTILS.obtenerDiaNombre(dia_index),
              hora_inicio: UTILS.sumar45MinutosHHMM(hora_inicio, 0),
              hora_fin: UTILS.sumar45MinutosHHMM(
                hora_inicio,
                bloques_necesarios
              ),
              ...(!classToMove.nueva_clase && { clase_move: true }),
            },
            bloque: bloqueIndex,
            bloques_totales: bloques_necesarios,
          };
        } else {
          acc[hora] = item.horas[hora];
        }
        return acc;
      }, {}),
    }),
  }));
};
