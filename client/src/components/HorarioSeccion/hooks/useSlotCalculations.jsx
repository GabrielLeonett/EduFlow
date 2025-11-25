import { useCallback } from "react";
import { UTILS } from "../../../utils/utils";

export const useSlotCalculations = () => {
 const procesarDisponibilidadDocente = useCallback(
  (
    disponibilidad,
    bloquesNecesarios,
    tableHorario,
    verificarDisponibilidadProfesor,
    clase
  ) => {
    const slotsDisponibles = [];

    try {
      // Validar parámetros críticos primero
      if (
        !disponibilidad ||
        !disponibilidad.hora_inicio ||
        !disponibilidad.hora_fin
      ) {
        console.warn("❌ Disponibilidad incompleta", disponibilidad);
        return slotsDisponibles;
      }
      console.log(clase)
      if (!clase || !clase.id_profesor || !clase.id_unidad_curricular) {
        console.warn("❌ Clase, id_profesor o id_unidad_curricular no definido", clase);
        return slotsDisponibles;
      }

      if (!verificarDisponibilidadProfesor) {
        console.warn(
          "❌ Función verificarDisponibilidadProfesor no definida"
        );
        return slotsDisponibles;
      }

      const [horaInicio, minutoInicio] = disponibilidad.hora_inicio
        .split(":")
        .map(Number);
      const [horaFin, minutoFin] = disponibilidad.hora_fin
        .split(":")
        .map(Number);

      if (
        isNaN(horaInicio) ||
        isNaN(minutoInicio) ||
        isNaN(horaFin) ||
        isNaN(minutoFin)
      ) {
        console.warn("❌ Formato de hora inválido", disponibilidad);
        return slotsDisponibles;
      }

      const diaDisponibilidad = UTILS.obtenerDiaId(disponibilidad.dia_semana);

      if (diaDisponibilidad === null || diaDisponibilidad === undefined) {
        console.warn("❌ Día de semana inválido", disponibilidad.dia_semana);
        return slotsDisponibles;
      }

      // VERIFICACIÓN CRÍTICA: ¿Ya existe esta unidad curricular en este día?
      const unidadCurricularYaAsignadaEnDia = () => {
        const horasDia = tableHorario[diaDisponibilidad]?.horas;
        if (!horasDia) return false;

        for (const horaKey in horasDia) {
          const celda = horasDia[horaKey];
          if (celda && celda.datos_clase) {
            // Si encontramos la misma unidad curricular en el mismo día (y no es la misma clase)
            if (celda.datos_clase.id_unidad_curricular === clase.id_unidad_curricular && 
                celda.datos_clase.id !== clase.id) {
              console.log(`🚫 Unidad curricular ${clase.id_unidad_curricular} ya asignada en día ${diaDisponibilidad}, hora ${horaKey}`);
              return true;
            }
          }
        }
        return false;
      };

      // Si la unidad curricular ya está asignada en este día, saltar completamente
      if (unidadCurricularYaAsignadaEnDia()) {
        console.log(`⏭️  Saltando día ${diaDisponibilidad} - Unidad curricular ya asignada`);
        return slotsDisponibles;
      }

      const horaHHMMInicio = UTILS.calcularHorasHHMM(
        UTILS.horasMinutos(horaInicio, minutoInicio)
      );
      const horaHHMMFin = UTILS.calcularHorasHHMM(
        UTILS.horasMinutos(horaFin, minutoFin)
      );

      if (horaHHMMInicio >= horaHHMMFin) {
        console.warn(
          "❌ Hora de inicio mayor o igual que hora fin",
          disponibilidad
        );
        return slotsDisponibles;
      }

      // Filtrar horas dentro del rango disponible
      const horasFiltradas = Object.keys(UTILS.initialHours)
        .map(Number)
        .filter(
          (horaHHMM) => horaHHMM >= horaHHMMInicio && horaHHMM <= horaHHMMFin
        )
        .sort((a, b) => a - b);

      if (horasFiltradas.length < bloquesNecesarios) {
        console.log("❌ No hay suficientes horas disponibles");
        return slotsDisponibles;
      }

      for (let i = 0; i <= horasFiltradas.length - bloquesNecesarios; i++) {
        const esConsecutivo = () => {
          for (let j = 0; j < bloquesNecesarios - 1; j++) {
            const indexActual = i + j;
            const indexSiguiente = i + j + 1;

            if (indexSiguiente >= horasFiltradas.length) {
              console.log(
                `  ❌ Índice siguiente fuera de rango: ${indexSiguiente}`
              );
              return false;
            }

            const horaActual = horasFiltradas[indexActual];
            const horaSiguiente = horasFiltradas[indexSiguiente];

            if (horaSiguiente <= horaActual) {
              console.log(
                `  ❌ Horas no consecutivas: ${horaActual} -> ${horaSiguiente}`
              );
              return false;
            }
          }
          return true;
        };

        if (!esConsecutivo()) continue;

        // Verificar disponibilidad en horario
        const horasBloque = horasFiltradas.slice(i, i + bloquesNecesarios);

        const esDisponible = horasBloque.every((hora) => {
          const celda = tableHorario[diaDisponibilidad]?.horas?.[hora];

          // Si la celda está vacía, está disponible
          if (celda === null || celda === undefined) {
            return true;
          }

          // Si la celda tiene datos, verificamos diferentes casos
          const datosCelda = celda.datos_clase;

          // CASO 1: Es la misma clase que estamos editando (mismo ID)
          // Esto permite mover/redimensionar la misma clase
          if (datosCelda.id === clase.id) {
            return true;
          }

          // CASO 2: Mismo profesor pero DIFERENTE clase - NO disponible
          if (datosCelda.id_profesor === clase.id_profesor) {
            console.log(`    ❌ Hora ${hora} no disponible: Mismo profesor en clase diferente`);
            return false;
          }

          // CASO 3: Diferente profesor y diferente aula - disponible
          return true;
        });

        if (!esDisponible) {
          console.log(`  ❌ Bloque ${i} no disponible`);
          continue;
        }

        const profesorDisponible = verificarDisponibilidadProfesor(
          clase.id_profesor,
          diaDisponibilidad,
          horasFiltradas[i],
          bloquesNecesarios,
          clase
        );

        if (!profesorDisponible) {
          console.log(`  ❌ Profesor no disponible para bloque ${i}`);
          continue;
        }

        slotsDisponibles.push({
          dia_index: diaDisponibilidad,
          hora_inicio: horasFiltradas[i],
          hora_fin: horasFiltradas[i + bloquesNecesarios - 1],
          horas_bloques: horasBloque,
          bloques_necesarios: bloquesNecesarios,
        });
      }
    } catch (error) {
      console.error("❌ ERROR procesando disponibilidad:", error, {
        disponibilidad,
        clase,
        bloquesNecesarios,
      });
    }

    return slotsDisponibles;
  },
  []
);

  const validarDatosClase = useCallback((clase) => {
    if (!clase || !clase.id_profesor || !clase.horas_clase) {
      console.warn("Datos de clase incompletos");
      console.log(clase);
      return false;
    }

    const bloquesNecesarios = parseInt(clase.horas_clase);
    if (isNaN(bloquesNecesarios) || bloquesNecesarios <= 0) {
      console.warn("Duración de clase inválida");
      return false;
    }

    return bloquesNecesarios;
  }, []);

  return {
    procesarDisponibilidadDocente,
    validarDatosClase,
  };
};
