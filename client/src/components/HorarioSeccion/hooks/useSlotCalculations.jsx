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

      console.log("🚀 INICIANDO procesarDisponibilidadDocente");
      console.log("📋 Parámetros recibidos:", {
        disponibilidad,
        bloquesNecesarios,
        tableHorario: Object.keys(tableHorario || {}),
        tieneVerificarFunc: !!verificarDisponibilidadProfesor,
        clase,
      });

      try {
        // Validar parámetros críticos primero
        console.log("🔍 Paso 1: Validando parámetros críticos");
        if (
          !disponibilidad ||
          !disponibilidad.hora_inicio ||
          !disponibilidad.hora_fin
        ) {
          console.log("❌ FALLO: Disponibilidad incompleta", disponibilidad);
          return slotsDisponibles;
        }

        if (!clase || !clase.id_profesor || !clase.id_unidad_curricular) {
          console.log("❌ FALLO: Clase incompleta", clase);
          return slotsDisponibles;
        }

        if (!verificarDisponibilidadProfesor) {
          console.log(
            "❌ FALLO: Función verificarDisponibilidadProfesor no definida"
          );
          return slotsDisponibles;
        }

        console.log("✅ Parámetros válidos");

        console.log("🔍 Paso 2: Procesando horas");
        const [horaInicio, minutoInicio] = disponibilidad.hora_inicio
          .split(":")
          .map(Number);
        const [horaFin, minutoFin] = disponibilidad.hora_fin
          .split(":")
          .map(Number);

        console.log("⏰ Horas parseadas:", {
          horaInicio,
          minutoInicio,
          horaFin,
          minutoFin,
        });

        if (
          isNaN(horaInicio) ||
          isNaN(minutoInicio) ||
          isNaN(horaFin) ||
          isNaN(minutoFin)
        ) {
          console.log("❌ FALLO: Formato de hora inválido");
          return slotsDisponibles;
        }

        console.log("🔍 Paso 3: Convirtiendo día de la semana");
        const diaDisponibilidad = UTILS.obtenerDiaId(disponibilidad.dia_semana);
        console.log(
          `📅 Día: "${disponibilidad.dia_semana}" -> ID: ${diaDisponibilidad}`
        );

        if (diaDisponibilidad === null || diaDisponibilidad === undefined) {
          console.log("❌ FALLO: Día de semana inválido");
          return slotsDisponibles;
        }

        // VERIFICACIÓN CRÍTICA: ¿Ya existe esta unidad curricular en este día?
        console.log(
          "🔍 Paso 4: Verificando si unidad curricular ya está en este día"
        );
        const unidadCurricularYaAsignadaEnDia = () => {
          const horasDia = tableHorario[diaDisponibilidad]?.horas;
          console.log(
            `📊 Horas en día ${diaDisponibilidad}:`,
            horasDia ? Object.keys(horasDia).length : 0
          );

          if (!horasDia) {
            console.log("✅ No hay horas en este día, disponible");
            return false;
          }

          for (const horaKey in horasDia) {
            const celda = horasDia[horaKey];
            if (celda && celda.datos_clase) {
              console.log(`🔎 Revisando celda ${horaKey}:`, {
                id_unidad_curricular_celda:
                  celda.datos_clase.id_unidad_curricular,
                id_unidad_curricular_clase: clase.id_unidad_curricular,
                misma_unidad:
                  celda.datos_clase.id_unidad_curricular ===
                  clase.id_unidad_curricular,
                misma_clase: celda.datos_clase.id === clase.id,
              });

              // Si encontramos la misma unidad curricular en el mismo día (y no es la misma clase)
              if (
                celda.datos_clase.id_unidad_curricular ===
                  clase.id_unidad_curricular &&
                celda.datos_clase.id !== clase.id
              ) {
                console.log(
                  `🚫 BLOQUEO: Unidad curricular ${clase.id_unidad_curricular} ya asignada en día ${diaDisponibilidad}, hora ${horaKey}`
                );
                return true;
              }
            }
          }
          console.log("✅ Unidad curricular NO asignada en este día");
          return false;
        };

        // Si la unidad curricular ya está asignada en este día, saltar completamente
        if (unidadCurricularYaAsignadaEnDia()) {
          console.log(
            `⏭️  SALTANDO: Día ${diaDisponibilidad} - Unidad curricular ya asignada`
          );
          return slotsDisponibles;
        }

        console.log("🔍 Paso 5: Calculando horas HHMM");
        const horaHHMMInicio = UTILS.calcularHorasHHMM(
          UTILS.horasMinutos(horaInicio, minutoInicio)
        );
        const horaHHMMFin = UTILS.calcularHorasHHMM(
          UTILS.horasMinutos(horaFin, minutoFin)
        );

        console.log("🕐 Horas HHMM calculadas:", {
          horaHHMMInicio,
          horaHHMMFin,
        });

        if (horaHHMMInicio >= horaHHMMFin) {
          console.log("❌ FALLO: Hora de inicio mayor o igual que hora fin");
          return slotsDisponibles;
        }

        console.log("🔍 Paso 6: Filtrando horas disponibles");
        // Filtrar horas dentro del rango disponible
        const horasFiltradas = Object.keys(UTILS.initialHours)
          .map(Number)
          .filter(
            (horaHHMM) => horaHHMM >= horaHHMMInicio && horaHHMM <= horaHHMMFin
          )
          .sort((a, b) => a - b);

        console.log("📈 Horas filtradas:", horasFiltradas);
        console.log(
          `📊 Total horas: ${horasFiltradas.length}, Bloques necesarios: ${bloquesNecesarios}`
        );

        if (horasFiltradas.length < bloquesNecesarios) {
          console.log("❌ FALLO: No hay suficientes horas disponibles");
          return slotsDisponibles;
        }

        console.log("🔍 Paso 7: Buscando bloques consecutivos");
        let bloquesEvaluados = 0;
        let bloquesConsecutivos = 0;
        let bloquesDisponibles = 0;

        for (let i = 0; i <= horasFiltradas.length - bloquesNecesarios; i++) {
          bloquesEvaluados++;
          console.log(
            `\n🔍 Evaluando bloque ${i} (índice ${i} a ${
              i + bloquesNecesarios - 1
            })`
          );

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
            console.log(`  ✅ Bloque consecutivo válido`);
            return true;
          };

          if (!esConsecutivo()) {
            console.log(`  ⏭️  Saltando bloque ${i} - No consecutivo`);
            continue;
          }
          bloquesConsecutivos++;

          // Verificar disponibilidad en horario
          const horasBloque = horasFiltradas.slice(i, i + bloquesNecesarios);
          console.log(`  📋 Horas del bloque: [${horasBloque.join(", ")}]`);

          const esDisponible = horasBloque.every((hora, index) => {
            const celda = tableHorario[diaDisponibilidad]?.horas?.[hora];
            console.log(
              `    🔍 Hora ${hora}:`,
              celda ? "OCUPADA" : "DISPONIBLE"
            );

            // Si la celda está vacía, está disponible
            if (celda === null || celda === undefined) {
              console.log(`      ✅ Disponible (vacía)`);
              return true;
            }

            // Si la celda tiene datos, verificamos diferentes casos
            const datosCelda = celda.datos_clase;

            // CASO 1: Es la misma clase que estamos editando (mismo ID)
            if (datosCelda.id === clase.id) {
              console.log(`      ✅ Disponible (misma clase)`);
              return true;
            }

            // CASO 2: Mismo profesor pero DIFERENTE clase - NO disponible
            if (datosCelda.id_profesor === clase.id_profesor) {
              console.log(
                `      ❌ NO disponible: Mismo profesor en clase diferente`
              );
              return false;
            }

            // CASO 3: Diferente profesor y diferente aula - disponible
            console.log(`      ✅ Disponible (diferente profesor)`);
            return true;
          });

          if (!esDisponible) {
            console.log(`  ❌ Bloque ${i} no disponible en horario`);
            continue;
          }

          console.log(`  🔍 Verificando disponibilidad del profesor...`);
          const profesorDisponible = verificarDisponibilidadProfesor(
            clase.id_profesor,
            diaDisponibilidad,
            horasFiltradas[i],
            bloquesNecesarios,
            clase
          );

          console.log(`  👨‍🏫 Profesor disponible: ${profesorDisponible}`);

          if (!profesorDisponible) {
            console.log(`  ❌ Profesor no disponible para bloque ${i}`);
            continue;
          }

          bloquesDisponibles++;

          const slot = {
            dia_index: diaDisponibilidad,
            hora_inicio: horasFiltradas[i],
            hora_fin: horasFiltradas[i + bloquesNecesarios],
            horas_bloques: horasBloque,
            bloques_necesarios: bloquesNecesarios,
          };

          console.log(`  ✅✅✅ SLOT ENCONTRADO:`, slot);
          slotsDisponibles.push(slot);
        }

        console.log("\n📊 RESUMEN FINAL:");
        console.log(`   Bloques evaluados: ${bloquesEvaluados}`);
        console.log(`   Bloques consecutivos: ${bloquesConsecutivos}`);
        console.log(`   Bloques disponibles: ${bloquesDisponibles}`);
        console.log(`   Slots encontrados: ${slotsDisponibles.length}`);
      } catch (error) {
        console.error(
          "💥 ERROR CRÍTICO en procesarDisponibilidadDocente:",
          error
        );
        console.error("Stack trace:", error.stack);
      }

      console.log("🏁 FINALIZADO procesarDisponibilidadDocente");
      console.log("🎯 Slots retornados:", slotsDisponibles);
      console.log("===========================================\n");

      return slotsDisponibles;
    },
    []
  );

  const validarDatosClase = useCallback((clase) => {
    if (!clase || !clase.id_profesor || !clase.horas_clase) {
      console.warn("Datos de clase incompletos");
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
