import { useCallback } from "react";
import { useProfessorAvailability } from "./useProfessorAvailability";
import { useAulaAvailability } from "./useAulaAvailability";
import { useSlotCalculations } from "./useSlotCalculations";
import {
  findOriginalSlot,
  liberarSlotOriginal,
  ocuparNuevoSlot,
} from "../utils/movementUtils";
import useSweetAlert from "../../../hook/useSweetAlert";

const useClassMovement = (state, stateSetters, utils, actionData) => {
  const alert = useSweetAlert();
  const {
    tableHorario,
    profesorSelected,
    profesorHorario,
    aulaHorario,
    classToMove,
    originalSlot,
  } = state;

  const {
    setTableHorario,
    setClassToMove,
    setOriginalSlot,
    setSelectedClass,
    setAvailableSlots,
    setAulaSelected,
    setProfesorSelected,
    setHayCambios,
    setHorariosEliminados,
  } = stateSetters;

  const {
    fetchProfesoresHorario,
    fetchProfesorCompleto,
    fetchAulaCompleta,
    fetchAulaHorario,
  } = actionData;

  const { verificarDisponibilidadProfesor } = useProfessorAvailability();
  const { verificarDisponibilidadAula } = useAulaAvailability();

  const { procesarDisponibilidadDocente, validarDatosClase } =
    useSlotCalculations();

  const handleCancelMoveRequest = useCallback(() => {
    setClassToMove(null);
    setSelectedClass(null);
    setOriginalSlot(null);
  }, [setClassToMove, setOriginalSlot, setSelectedClass]);

  // Cancelar movimiento
  const cancelarMovimiento = useCallback(() => {
    setClassToMove(null);
    setOriginalSlot(null);
    setAvailableSlots([]);
    setSelectedClass(null);
  }, [setClassToMove, setOriginalSlot, setAvailableSlots, setSelectedClass]);

  const handleDeleteClass = useCallback(
    async (clase) => {
      // Agregar async aquí
      if (!clase) {
        console.error("No hay clase para eliminar");
        return;
      }

      // Mostrar confirmación antes de eliminar
      const result = await alert.confirm(
        // Agregar await aquí
        "Eliminar Clase",
        `¿Estás seguro de que quieres eliminar esta clase de ${clase.nombre_unidad_curricular}?`,
        {
          confirmButtonText: "Eliminar",
          cancelButtonText: "Cancelar",
        }
      );

      if (result.isConfirmed) {
        setTableHorario((prev) => {
          console.log("Eliminando clase:", clase);
          console.log("Horario antes de eliminar:", prev);

          let nuevaMatriz = [...prev];

          // Buscar y liberar el slot donde está la clase
          const slotOriginal = findOriginalSlot(clase, nuevaMatriz);
          if (slotOriginal) {
            nuevaMatriz = liberarSlotOriginal(slotOriginal, nuevaMatriz);
            if (!clase.nueva_clase) {
              setHorariosEliminados((prev) => {
                if (!prev.includes(clase.id)) {
                  return [...prev, clase.id];
                }
                return prev; // ✅ IMPORTANTE: Retornar el estado anterior si no hay cambios
              });
            }
            console.log("Horario después de eliminar:", nuevaMatriz);
          } else {
            console.warn("No se encontró el slot original para eliminar");
          }

          return nuevaMatriz;
        });

        // Limpiar estados si la clase eliminada es la seleccionada
        if (classToMove && classToMove.id_clase === clase.id_clase) {
          cancelarMovimiento();
        }

        setHayCambios(true);
        alert.success(
          "Clase Eliminada",
          "La clase ha sido eliminada exitosamente del horario"
        );
      } else {
        // ALERTA AGREGADA
        alert.info("Información", "Eliminación cancelada");
      }
    },
    [
      alert,
      setTableHorario,
      classToMove,
      cancelarMovimiento,
      setHayCambios,
      setHorariosEliminados,
    ]
  );

  // Eliminar clase actual seleccionada
  const handleDeleteSelectedClass = useCallback(() => {
    if (classToMove) {
      handleDeleteClass(classToMove);
    } else {
      alert.info("Sin Clase", "No hay clase seleccionada para eliminar");
    }
  }, [classToMove, handleDeleteClass, alert]);

  // Calcular horarios disponibles
  const calcularHorariosDisponibles = useCallback(
    (clase) => {
      const bloques_necesarios = validarDatosClase(clase);
      if (!bloques_necesarios) {
        setAvailableSlots([]);
        return;
      }

      if (!profesorSelected) {
        console.warn(`Profesor con ID ${clase.id_profesor} no encontrado`);
        setAvailableSlots([]);
        return;
      }

      if (
        !profesorSelected.disponibilidades ||
        profesorSelected.disponibilidades.length === 0
      ) {
        console.log(profesorSelected);
        console.warn("Profesor no tiene disponibilidad definida");
        setAvailableSlots([]);
        return;
      }

      const slotsDisponibles = [];

      profesorSelected.disponibilidades.forEach((disponibilidad) => {
        if (
          !disponibilidad.dia_semana ||
          !disponibilidad.hora_inicio ||
          !disponibilidad.hora_fin
        ) {
          console.warn("Disponibilidad con datos incompletos", disponibilidad);
          return;
        }

        const slots = procesarDisponibilidadDocente(
          disponibilidad,
          bloques_necesarios,
          tableHorario,
          (profesor_id, dia_index, hora_inicio, bloques) => {
            // VERIFICAR PROFESOR
            const profesorDisponible = verificarDisponibilidadProfesor(
              profesor_id,
              dia_index,
              hora_inicio,
              bloques,
              profesorHorario,
              clase // ✅ Pasar la clase actual para saltarse a sí misma
            );

            // VERIFICAR AULA - pasando la clase actual
            const aulaDisponible = verificarDisponibilidadAula(
              clase.id_aula,
              dia_index,
              hora_inicio,
              bloques,
              aulaHorario,
              clase // ✅ Pasar la clase actual para saltarse a sí misma
            );

            // Solo disponible si AMBOS están libres
            return profesorDisponible && aulaDisponible;
          },
          clase
        );
        slotsDisponibles.push(...slots);
      });

      console.log("Slots disponibles (profesor Y aula):", slotsDisponibles);
      setAvailableSlots(slotsDisponibles);
    },
    [
      aulaHorario,
      profesorSelected,
      tableHorario,
      profesorHorario,
      setAvailableSlots,
      validarDatosClase,
      procesarDisponibilidadDocente,
      verificarDisponibilidadProfesor,
      verificarDisponibilidadAula,
    ]
  );

  // Manejar solicitud de movimiento
  const handleMoveRequest = useCallback(
    async (clase) => {
      setClassToMove(clase);

      const original = findOriginalSlot(clase, tableHorario);
      setOriginalSlot(original);

      if (original) {
        setSelectedClass(clase);

        try {
          // CARGAR DATOS COMPLETOS EN PARALELO
          const [profesorData, aulaData] = await Promise.all([
            // 1. Cargar datos COMPLETOS del profesor con disponibilidades
            fetchProfesorCompleto({ id_profesor: clase.id_profesor }),

            // 2. Cargar datos COMPLETOS del aula con horarios
            fetchAulaCompleta({ id_aula: clase.id_aula }),

            // 3. Cargar horario actual del profesor
            fetchProfesoresHorario({ id_profesor: clase.id_profesor }),

            // 4. Cargar horario actual del aula
            fetchAulaHorario({ id_aula: clase.id_aula }),
          ]);

          if (!profesorData || !aulaData) {
            throw new Error("No se pudieron cargar los datos necesarios");
          }

          // Actualizar estados con los datos cargados
          setProfesorSelected(profesorData);
          setAulaSelected(aulaData);

          // Ahora calcular disponibilidades con TODOS los datos cargados
          calcularHorariosDisponibles(clase);
        } catch (error) {
          console.error("Error cargando datos para movimiento:", error);
          alert.error(
            "Error",
            "No se pudieron cargar los datos necesarios para el movimiento"
          );
        }
      }
    },
    [
      alert,
      calcularHorariosDisponibles,
      fetchAulaCompleta,
      fetchAulaHorario,
      fetchProfesorCompleto,
      fetchProfesoresHorario,
      setAulaSelected,
      setClassToMove,
      setOriginalSlot,
      setSelectedClass,
      setProfesorSelected,
      tableHorario,
    ]
  );

  // Completar movimiento
  const completarMovimiento = useCallback(
    (nuevoSlot) => {
      // Verificar si tenemos los datos mínimos necesarios
      if (!classToMove) {
        console.error("No hay clase para mover");
        return;
      }

      console.log("Moviendo clase:", classToMove);
      console.log("Desde:", originalSlot);
      console.log("Hacia:", nuevoSlot);

      setTableHorario((prev) => {
        console.log("Horario antes de modificar:", prev);

        let nuevaMatriz = [...prev];

        // Liberar el slot original si existe (sin importar si es clase nueva o no)
        if (originalSlot) {
          nuevaMatriz = liberarSlotOriginal(originalSlot, nuevaMatriz);
          console.log("Horario después de liberar:", nuevaMatriz);
        }

        // Ocupar el nuevo slot
        nuevaMatriz = ocuparNuevoSlot(nuevoSlot, classToMove, nuevaMatriz);
        console.log("Horario después de ocupar:", nuevaMatriz);

        return nuevaMatriz;
      });

      // Limpiar estados
      cancelarMovimiento();

      //Notificar cambio
      setHayCambios(true);

      // Determinar el tipo de operación para el mensaje
      let tipoOperacion, mensaje;

      if (classToMove.nueva_clase && !originalSlot) {
        // Primera vez que se coloca una clase nueva
        tipoOperacion = "Clase Agregada";
        mensaje = `Clase agregada exitosamente a ${utils.obtenerDiaNombre(
          nuevoSlot.dia_index
        )} ${utils.formatearHora(nuevoSlot.hora_inicio)}`;
      } else if (classToMove.nueva_clase && originalSlot) {
        // Moviendo una clase nueva que ya estaba colocada
        tipoOperacion = "Clase Reubicada";
        mensaje = `Clase reubicada a ${utils.obtenerDiaNombre(
          nuevoSlot.dia_index
        )} ${utils.formatearHora(nuevoSlot.hora_inicio)}`;
      } else {
        // Moviendo una clase existente (no nueva)
        tipoOperacion = "Clase Movida";
        mensaje = `Clase movida exitosamente a ${utils.obtenerDiaNombre(
          nuevoSlot.dia_index
        )} ${utils.formatearHora(nuevoSlot.hora_inicio)}`;
      }

      alert.success(tipoOperacion, mensaje);
    },
    [
      classToMove,
      originalSlot,
      setTableHorario,
      cancelarMovimiento,
      utils,
      alert,
      setHayCambios,
    ]
  );

  return {
    handleMoveRequest,
    cancelarMovimiento,
    completarMovimiento,
    calcularHorariosDisponibles,
    handleCancelMoveRequest,
    // Métodos de eliminación
    handleDeleteClass,
    handleDeleteSelectedClass,
    verificarDisponibilidadProfesor: (
      profesor_id,
      dia_index,
      hora_inicio,
      bloques_necesarios
    ) =>
      verificarDisponibilidadProfesor(
        profesor_id,
        dia_index,
        hora_inicio,
        bloques_necesarios,
        profesorHorario
      ),
  };
};

export default useClassMovement;
