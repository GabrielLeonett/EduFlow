import { useEffect, useCallback } from "react";
import { UTILS } from "../../../utils/utils";

// Efecto para carga inicial de horario
const useHorarioInitialization = (props, stateSetters) => {
  const { horario, turno } = props;
  const { setTableHorario, setTableHorarioOriginal } = stateSetters;

  const obtenerTurno = useCallback((turno) => {
    const [hora_inicio, minInicio] = turno.hora_inicio.split(":");
    const [hora_fin, minFin] = turno.hora_fin.split(":");

    const MinutosInicio = UTILS.horasMinutos(hora_inicio, minInicio);
    const MinutosFin = UTILS.horasMinutos(hora_fin, minFin);

    const horaInicioHHMM = UTILS.calcularHorasHHMM(MinutosInicio);
    const horaFinHHMM = UTILS.calcularHorasHHMM(MinutosFin);

    return { horaInicioHHMM, horaFinHHMM };
  }, []);

  const obtenerClases = useCallback(
    (Dias, turno) => {
      const { horaInicioHHMM, horaFinHHMM } = obtenerTurno(turno);

      // Filtrar horas dentro del turno
      const horasFiltradas = {};
      Object.keys(UTILS.initialHours).forEach((key) => {
        const horaHHMM = Number(key);
        if (horaHHMM >= horaInicioHHMM && horaHHMM <= horaFinHHMM) {
          horasFiltradas[key] = UTILS.initialHours[key];
        }
      });

      setTableHorario((prev) => {
        const nuevaMatriz = prev.map((item) => ({
          dia: item.dia,
          horas: { ...horasFiltradas },
        }));

        Dias.forEach((dia) => {
          if (dia.nombre === null) return;
          let idDia = UTILS.obtenerDiaId(dia.nombre.toLowerCase());

          if (idDia === -1) return;

          dia.clases.forEach((clase) => {
            const [hIni, mIni] = clase.hora_inicio.split(":");
            const [hFin, mFin] = clase.hora_fin.split(":");
            const inicio = UTILS.horasMinutos(hIni, mIni);
            const fin = UTILS.horasMinutos(hFin, mFin);
            const bloques = Math.ceil((fin - inicio) / 45);

            for (let i = 0; i < bloques; i++) {
              const minutosActual = inicio + i * 45;
              const h = Math.floor(minutosActual / 60);
              const m = minutosActual % 60;
              const horaHHMM = h * 100 + m;

              // Verificar si la hora existe en las horas filtradas
              if (horasFiltradas[horaHHMM] !== undefined) {
                nuevaMatriz[idDia].horas[horaHHMM] = {
                  ocupado: true,
                  datos_clase: { ...clase, horas_clase: bloques },
                  bloque: i,
                  bloques_totales: bloques,
                };
              }
            }
          });
        });
        setTableHorarioOriginal(nuevaMatriz);
        return nuevaMatriz;
      });
    },
    [obtenerTurno, setTableHorario, setTableHorarioOriginal]
  );

  useEffect(() => {
    if (horario && turno) {
      obtenerClases(horario, turno);
    }
  }, [horario, turno, obtenerClases]);
};

const dividirUnidadCurricular = (unidadCurricular, maxHorasPorClase = 3) => {
  const horasTotales = unidadCurricular.horas_clase;
  const horasFaltantes = unidadCurricular.faltan_horas_clase || horasTotales;

  // Validaciones
  if (horasFaltantes <= 0) {
    console.log(
      `✅ "${unidadCurricular.nombre_unidad_curricular}" ya está completa`
    );
    return [];
  }

  if (horasFaltantes > horasTotales) {
    console.warn(
      `⚠️ Horas faltantes (${horasFaltantes}) exceden horas totales (${horasTotales})`
    );
    return [horasFaltantes];
  }

  // Estrategias de división
  if (horasFaltantes <= maxHorasPorClase) {
    // Una sola clase con todas las horas faltantes
    return [horasFaltantes];
  }

  if (horasFaltantes <= 6) {
    // Dividir en dos clases balanceadas
    const primeraClase = Math.ceil(horasFaltantes / 2);
    const segundaClase = horasFaltantes - primeraClase;
    return [primeraClase, segundaClase];
  }

  // Dividir en múltiples clases de máximo 3 horas
  const divisiones = [];
  let horasRestantes = horasFaltantes;

  while (horasRestantes > 0) {
    const horasClase = Math.min(horasRestantes, maxHorasPorClase);
    divisiones.push(horasClase);
    horasRestantes -= horasClase;
  }

  return divisiones;
};

// Efecto para nueva clase completa - VERSIÓN CORREGIDA
const useNewClassEffect = (state, actions, stateSetters) => {
  const {
    profesorSelected,
    aulaSelected,
    unidadCurricularSelected,
    procesoClases,
    classToMove,
    selectedClass,
  } = state;
  const { calcularHorariosDisponibles, crearClaseEnHorario } = actions;
  const { setProcesoClases } = stateSetters;

  useEffect(() => {
    if (
      !procesoClases.enProgreso &&
      unidadCurricularSelected?.horas_clase &&
      profesorSelected?.id_profesor &&
      aulaSelected?.codigo_aula
    ) {
      const horasClase = dividirUnidadCurricular(unidadCurricularSelected);

      // Iniciar proceso secuencial
      setProcesoClases({
        enProgreso: true,
        clasesPendientes: horasClase,
        claseActualIndex: 0,
      });
    }
  }, [
    profesorSelected,
    aulaSelected,
    unidadCurricularSelected,
    procesoClases.enProgreso,
    setProcesoClases,
  ]);

  // Efecto para procesar clases secuencialmente
  useEffect(() => {
    if (procesoClases.enProgreso && procesoClases.claseActualIndex >= 0) {
      const procesarSiguienteClase = async () => {
        const { clasesPendientes, claseActualIndex } = procesoClases;
        const horasClase = clasesPendientes[claseActualIndex];

        if (horasClase) {
          console.log(
            `🔄 Procesando clase ${claseActualIndex + 1}/${
              clasesPendientes.length
            }`
          );

          if (classToMove === null && selectedClass === null) {
            // 1. Calcular horarios disponibles para esta clase específica
            await calcularHorariosDisponibles({
              id_profesor: profesorSelected.id_profesor,
              horas_clase: horasClase,
              id_unidad_curricular: unidadCurricularSelected.id_unidad_curricular
            });

            // 3. Crear la clase
            crearClaseEnHorario(
              clasesPendientes.length,
              claseActualIndex,
              horasClase
            );

            // 4. Pasar a la siguiente clase o finalizar
            if (claseActualIndex < clasesPendientes.length - 1) {
              setProcesoClases((prev) => ({
                ...prev,
                claseActualIndex: prev.claseActualIndex + 1,
              }));
            } else {
              // Proceso completado
              console.log("✅ Todas las clases procesadas");
              setProcesoClases({
                enProgreso: false,
                clasesPendientes: [],
                claseActualIndex: -1,
              });
            }
          }
        }
      };

      procesarSiguienteClase();
    }
  }, [
    procesoClases,
    calcularHorariosDisponibles,
    crearClaseEnHorario,
    profesorSelected,
    setProcesoClases,
    classToMove,
    selectedClass,
  ]);

  return procesoClases.enProgreso;
};

// Efecto para recalcular cuando cambia clase seleccionada
const useSelectedClassEffect = (state, actions) => {
  const { selectedClass, classToMove } = state;
  const { calcularHorariosDisponibles } = actions;

  useEffect(() => {
    if (selectedClass && !classToMove) {
      calcularHorariosDisponibles(selectedClass);
    }
  }, [selectedClass, classToMove, calcularHorariosDisponibles]);
};

// Hook principal de efectos
const useHorarioEffects = (props, state, actions, stateSetters) => {
  // Efecto para carga inicial de horario
  useHorarioInitialization(props, stateSetters);

  // Efecto para nueva clase completa
  useNewClassEffect(state, actions, stateSetters);

  // Efecto para recalcular cuando cambia clase seleccionada
  useSelectedClassEffect(state, actions);
};

export default useHorarioEffects;
