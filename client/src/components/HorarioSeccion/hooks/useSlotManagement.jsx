import { useCallback } from "react";
import useSweetAlert from "../../../hook/useSweetAlert";

// Gestión de slots y disponibilidad
const useSlotManagement = (state, stateSetters, utils, actions) => {
  const {
    availableSlots,
    selectedClass,
    classToMove,
    profesorSelected,
    aulaSelected,
    unidadCurricularSelected,
  } = state;

  const {
    setSelectedClass,
    setClassToMove,
    setAvailableSlots,
    setAulaSelected,
    setProfesorSelected,
    setUnidadCurricularSelected,
    setTableHorario,
  } = stateSetters;

  const { completarMovimiento } = actions;
  const alert = useSweetAlert();

  // Mover clase al horario - DEFINIR PRIMERO
  const MoverClassEnHorario = useCallback(
    (slot) => {
      const { dia_index, hora_inicio, bloques_necesarios } = slot;
      console.warn("Esto son los datos de el slot:", slot);

      setTableHorario((prev) => {
        const nuevaMatriz = prev.map((item) => ({
          ...item,
          horas: { ...item.horas },
        }));

        // Crear la clase con formato correcto
        const nuevaClase = {
          ...classToMove,
          hora_inicio: `${Math.floor(hora_inicio / 100)}:${String(
            hora_inicio % 100
          ).padStart(2, "0")}`,
          horaFin: utils.sumar45Minutos(hora_inicio, bloques_necesarios),
        };

        console.warn("Esto son los datos de la nueva clase:", nuevaClase);

        // Ocupar los bloques necesarios
        for (let i = 0; i < bloques_necesarios; i++) {
          const minutosExtra = i * 45;
          const minutosTotales =
            Math.floor(hora_inicio / 100) * 60 +
            (hora_inicio % 100) +
            minutosExtra;

          const nuevasHoras = Math.floor(minutosTotales / 60);
          const nuevosMinutos = minutosTotales % 60;
          const horaHHMM = nuevasHoras * 100 + nuevosMinutos;

          nuevaMatriz[dia_index].horas[horaHHMM] = {
            ocupado: true,
            datos_clase: nuevaClase,
            bloque: i,
            bloques_totales: bloques_necesarios,
          };
        }

        return nuevaMatriz;
      });

      // Limpiar selección después de agregar
      setProfesorSelected({});
      setUnidadCurricularSelected({});
      setAulaSelected({});
      setSelectedClass([]);
      setAvailableSlots([]);

      // ALERTA AGREGADA
      alert.success(
        "Clase Programada",
        `Clase programada exitosamente para ${utils.obtenerDiaNombre(
          dia_index
        )} a ${utils.formatearHora(hora_inicio)}`
      );
    },
    [
      classToMove,
      setTableHorario,
      setUnidadCurricularSelected,
      setProfesorSelected,
      setAulaSelected,
      setSelectedClass,
      setAvailableSlots,
      utils,
      alert, // ALERTA AGREGADA
    ]
  );

  // Verificar si un slot está disponible
  const isSlotAvailable = useCallback(
    (dia_index, hora) => {
      return availableSlots.some(
        (slot) =>
          slot.dia_index === dia_index &&
          hora >= slot.hora_inicio &&
          hora <
            parseInt(
              utils.sumar45Minutos(slot.hora_inicio, slot.bloques_necesarios)
            )
      );
    },
    [availableSlots, utils]
  );

  // Manejar click en slots disponibles
  const handleSlotClick = useCallback(
    async (dia_index, hora_inicio) => {
      // async AGREGADO
      if (!selectedClass) {
        // ALERTA AGREGADA
        alert.warning("Advertencia", "No hay clase seleccionada");
        return;
      }

      console.log("classToMove:", classToMove);
      console.log("selectedClass:", selectedClass);

      const slot = availableSlots.find(
        (slot) =>
          slot.dia_index === dia_index && slot.hora_inicio === hora_inicio
      );

      if (!slot) {
        // ALERTA AGREGADA
        alert.error("Error", "Horario no disponible");
        return;
      }

      if (classToMove) {
        console.log("Moviendo clase existente");

        // REEMPLAZO DE window.confirm CON ALERTA
        const result = await alert.confirm(
          "Mover Clase",
          `¿Mover ${
            classToMove.nombre_unidad_curricular ||
            classToMove.nombre_unidad_curricular
          } a ${utils.obtenerDiaNombre(dia_index)} a ${utils.formatearHora(
            hora_inicio
          )}?`,
          {
            confirmButtonText: "Mover",
            cancelButtonText: "Cancelar",
          }
        );
        console.log("Resultado de la alerta:", result);

        if (result) {
          completarMovimiento(slot);
        } else {
          // ALERTA AGREGADA
          alert.info("Información", "Movimiento cancelado");
        }
      } else {
        console.log("Agregando clase nueva");

        // REEMPLAZO DE window.confirm CON ALERTA
        const result = await alert.confirm(
          "Programar Clase",
          `¿Programar ${
            selectedClass.nombre_unidad_curricular ||
            selectedClass.nombre_unidad_curricular
          } en ${utils.obtenerDiaNombre(dia_index)} a ${utils.formatearHora(
            hora_inicio
          )}?`,
          {
            confirmButtonText: "Programar",
            cancelButtonText: "Cancelar",
          }
        );

        if (result.isConfirmed) {
          MoverClassEnHorario(slot);
        } else {
          // ALERTA AGREGADA
          alert.info("Información", "Programación cancelada");
        }
      }
    },
    [
      selectedClass,
      availableSlots,
      classToMove,
      completarMovimiento,
      MoverClassEnHorario,
      utils,
      alert, // ALERTA AGREGADA
    ]
  );

  // Crear nueva clase en el estado
  const crearClaseEnHorario = useCallback(() => {
    if (!profesorSelected || !aulaSelected || !unidadCurricularSelected) {
      console.warn("Datos incompletos para crear clase");
      // ALERTA AGREGADA
      alert.error("Error", "Datos incompletos para crear la clase");
      return;
    }

    const nuevaClase = {
      id: Date.now(),
      id_profesor: profesorSelected.id_profesor,
      id_aula: aulaSelected.id_aula,
      id_unidad_curricular: unidadCurricularSelected.id_unidad_curricular,
      nombre_profesor: profesorSelected.nombres,
      codigo_aula: aulaSelected.codigo_aula,
      apellido_profesor: profesorSelected.apellidos,
      nombre_unidad_curricular:
        unidadCurricularSelected.nombre_unidad_curricular,
      horas_clase: unidadCurricularSelected.horas_clase,
      nueva_clase: true,
    };

    setSelectedClass({ ...nuevaClase });
    setClassToMove({ ...nuevaClase });
    setProfesorSelected(null);
    setAulaSelected(null);
    setUnidadCurricularSelected(null);

    // ALERTA AGREGADA
    alert.success("Éxito", "Clase creada correctamente");
  }, [
    profesorSelected,
    aulaSelected,
    unidadCurricularSelected,
    setSelectedClass,
    setClassToMove,
    alert, // ALERTA AGREGADA
    setProfesorSelected,
    setAulaSelected,
    setUnidadCurricularSelected,
  ]);

  // Función para limpiar selección
  const limpiarSeleccion = useCallback(() => {
    setSelectedClass(null);
    setClassToMove(null);
    setAvailableSlots([]);

    // ALERTA AGREGADA
    alert.info("Información", "Selección limpiada");
  }, [setSelectedClass, setClassToMove, setAvailableSlots, alert]); // ALERTA AGREGADA

  return {
    isSlotAvailable,
    handleSlotClick,
    crearClaseEnHorario,
    MoverClassEnHorario,
    limpiarSeleccion,
  };
};

export default useSlotManagement;
