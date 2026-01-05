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
        console.log("=== INICIANDO PROCESAMIENTO DISPONIBILIDAD ===");
        console.log("Disponibilidad recibida:", disponibilidad);
        console.log("Bloques necesarios:", bloquesNecesarios);
        console.log("Clase:", clase);
        console.log("TableHorario length:", tableHorario?.length);

        // Validar parámetros críticos primero
        if (
          !disponibilidad ||
          !disponibilidad.hora_inicio ||
          !disponibilidad.hora_fin
        ) {
          console.warn("❌ Disponibilidad incompleta", disponibilidad);
          return slotsDisponibles;
        }

        if (!clase || !clase.id_profesor) {
          console.warn("❌ Clase o id_profesor no definido", clase);
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

        console.log("Hora inicio parseada:", { horaInicio, minutoInicio });
        console.log("Hora fin parseada:", { horaFin, minutoFin });

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
        console.log(
          "Día disponibilidad:",
          disponibilidad.dia_semana,
          "->",
          diaDisponibilidad
        );

        if (diaDisponibilidad === null || diaDisponibilidad === undefined) {
          console.warn("❌ Día de semana inválido", disponibilidad.dia_semana);
          return slotsDisponibles;
        }

        const horaHHMMInicio = UTILS.calcularHorasHHMM(
          UTILS.horasMinutos(horaInicio, minutoInicio)
        );
        const horaHHMMFin = UTILS.calcularHorasHHMM(
          UTILS.horasMinutos(horaFin, minutoFin)
        );

        console.log("Hora HHMM inicio:", horaHHMMInicio);
        console.log("Hora HHMM fin:", horaHHMMFin);

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

        console.log("Horas filtradas disponibles:", horasFiltradas);
        console.log("Total horas filtradas:", horasFiltradas.length);

        if (horasFiltradas.length < bloquesNecesarios) {
          console.log("❌ No hay suficientes horas disponibles");
          return slotsDisponibles;
        }

        // Buscar bloques consecutivos
        console.log("Buscando bloques consecutivos...");
        let bloquesEncontrados = 0;

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
          console.log(`  Probando bloque ${i}:`, horasBloque);

          const esDisponible = horasBloque.every((hora) => {
            const celda = tableHorario[diaDisponibilidad]?.horas?.[hora];
            const estaDisponible = celda === null;

            if (!estaDisponible) {
              console.log(`    ❌ Hora ${hora} no disponible:`, celda);
            }

            return estaDisponible;
          });

          if (!esDisponible) {
            console.log(`  ❌ Bloque ${i} no disponible`);
            continue;
          }

          // Verificar disponibilidad del profesor
          console.log(
            `  ✅ Bloque ${i} disponible en horario, verificando profesor...`
          );
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

          console.log(`  ✅✅ Bloque ${i} COMPLETAMENTE DISPONIBLE`);
          slotsDisponibles.push({
            dia_index: diaDisponibilidad,
            hora_inicio: horasFiltradas[i],
            hora_fin: horasFiltradas[i + bloquesNecesarios - 1],
            horas_bloques: horasBloque,
            bloques_necesarios: bloquesNecesarios,
          });
          bloquesEncontrados++;
        }

        console.log(
          `=== FIN PROCESAMIENTO: ${bloquesEncontrados} bloques encontrados ===`
        );
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
      console.log(clase)
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
