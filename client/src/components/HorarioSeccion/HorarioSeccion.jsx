import React, { useCallback, useMemo } from "react";
import { Box, useTheme } from "@mui/material";

// Hooks
import useHorarioState from "./hooks/useHorarioState";
import useHorarioData from "./hooks/useHorarioData";
import useClassMovement from "./hooks/useClassMovement";
import useSlotManagement from "./hooks/useSlotManagement";
import useHorarioEffects from "./hooks/useHorarioEffects";

// Components
import HorarioTable from "./components/HorarioTable";
import ClassForm from "./components/ClassForm";
import TableOverlay from "./components/TableOverlay";

// Utils
import { UTILS } from "../../utils/utils";
import useApi from "../../hook/useApi";
import useSweetAlert from "../../hook/useSweetAlert";
import useCoordinador from "../../hook/useCoordinador";

const HorarioSeccion = ({
  pnf,
  trayecto,
  seccion,
  horario: initialHorario,
  turno,
}) => {
  const theme = useTheme();
  const axios = useApi();
  const alert = useSweetAlert();
  const { isCustom } = useCoordinador(pnf?.id_pnf);

  // Props consolidados
  const componentProps = useMemo(
    () => ({
      pnf,
      trayecto,
      seccion,
      horario: initialHorario,
      turno,
      isCustom,
    }),
    [pnf, trayecto, seccion, initialHorario, turno, isCustom]
  );

  // 1. Estado principal
  const {
    tableHorario,
    selectedClass,
    availableSlots,
    unidadesCurriculares,
    profesores,
    aulas,
    loading,
    classToMove,
    overlayVisible,
    Custom,
    setOverlayVisible,
    setCustom,
    state,
    stateSetters,
  } = useHorarioState(componentProps);

  // 2. Datos
  const dataActions = useHorarioData(
    axios,
    componentProps,
    state,
    stateSetters,
    isCustom,
    alert
  );

  // 3. Movimiento de clases
  const movementActions = useClassMovement(state, stateSetters, UTILS, {
    fetchProfesorCompleto: dataActions.fetchProfesorCompleto,
    fetchAulaCompleta: dataActions.fetchAulaCompleta,
    fetchProfesoresHorario: dataActions.fetchProfesoresHorario,
    fetchAulaHorario: dataActions.fetchAulaHorario,
  });

  // 4. Gestión de slots
  const slotActions = useSlotManagement(
    state,
    stateSetters,
    UTILS,
    movementActions
  );

  // 5. Efectos
  useHorarioEffects(
    componentProps,
    state,
    { ...movementActions, ...slotActions },
    stateSetters
  );

  // CORRECCIÓN: Handler para búsqueda libre DEBUGGEADA
  const handleBusquedaLibreProfesor = useCallback(
    (textoBusqueda) => {
      console.log("🎯 handleBusquedaLibreProfesor llamado con:", textoBusqueda);

      if (!textoBusqueda.trim()) {
        console.log("⚠️ Texto de búsqueda vacío");
        return;
      }

      if (!state.unidadCurricularSelected) {
        console.log("❌ No hay unidad curricular seleccionada");
        alert.warning("Primero seleccione una unidad curricular");
        return;
      }

      console.log("🚀 Ejecutando búsqueda de profesores...");
      console.log("📚 Unidad curricular:", state.unidadCurricularSelected);
      console.log("🔎 Término de búsqueda:", textoBusqueda);

      // La búsqueda se ejecutará y actualizará la lista de profesores
      // Luego el usuario deberá seleccionar de la lista actualizada
      dataActions
        .fetchProfesores(state.unidadCurricularSelected, textoBusqueda)
    },
    [dataActions, state.unidadCurricularSelected, alert]
  );
  
  const handleProfesorChange = useCallback(
    (newValue) => {
      console.log("🔄 handleProfesorChange llamado con:", newValue);

      // 1. Limpiar selección
      if (!newValue) {
        console.log("🧹 Limpiando selección de profesor");
        stateSetters.setProfesorSelected(null);
        stateSetters.setAulas([]);
        return;
      }

      // 2. Si es string (búsqueda libre)
      if (typeof newValue === "string") {
        console.log("🔍 Búsqueda libre detectada:", newValue);
        handleBusquedaLibreProfesor(newValue);
        return;
      }

      // 3. Si es objeto (profesor completo) - CASO MÁS COMÚN
      if (typeof newValue === "object" && newValue.id_profesor) {
        console.log("👨‍🏫 Profesor objeto seleccionado:", newValue);
        stateSetters.setProfesorSelected(newValue);
        dataActions.fetchAulas(newValue);
        return;
      }

      // 4. Si es number (id_profesor) - VALIDAR que profesores existe
      const profesor_id = newValue;
      console.log("🔎 Buscando profesor por ID:", profesor_id);

      // ✅ VALIDACIÓN CRÍTICA: Asegurar que profesores existe y es array
      if (!profesores || !Array.isArray(profesores)) {
        console.error(
          "❌ profesores no está definido o no es un array:",
          profesores
        );
        console.log("📋 Estado actual de profesores:", profesores);
        alert.warning(
          "Error: Lista de profesores no disponible. Intente nuevamente."
        );
        return;
      }

      const profesorEncontrado = profesores.find(
        (profe) => profe.id_profesor === profesor_id
      );

      if (profesorEncontrado) {
        console.log(
          "✅ Profesor encontrado en lista local:",
          profesorEncontrado
        );
        stateSetters.setProfesorSelected(profesorEncontrado);
        dataActions.fetchAulas(profesorEncontrado);
      } else {
        console.log("❌ Profesor no encontrado en lista local:", profesor_id);
        console.log("📋 Lista actual de profesores:", profesores);
        alert.warning("Profesor no encontrado. Intente buscar nuevamente.");
      }
    },
    [
      profesores,
      stateSetters,
      handleBusquedaLibreProfesor,
      alert,
      dataActions
    ]
  );

  // CORRECCIÓN 2: handleUnidadChange
  const handleUnidadChange = useCallback(
    (unidadId) => {
      const unidad = unidadesCurriculares.find(
        (u) => u.id_unidad_curricular === unidadId
      );
      stateSetters.setUnidadCurricularSelected(unidad);
      stateSetters.setProfesorSelected(null); // ← Limpiar profesor anterior
      stateSetters.setProfesores([]); // ← Limpiar lista de profesores
      dataActions.fetchProfesores(unidad);
    },
    [unidadesCurriculares, stateSetters, dataActions]
  );

  const handleAulaChange = useCallback(
    (aulaId) => {
      const aula = aulas.find((a) => a.id_aula === aulaId);
      stateSetters.setAulaSelected(aula);
    },
    [aulas, stateSetters]
  );

  const handleCancel = useCallback(async () => {
    try {
      stateSetters.setLoading(true);
      stateSetters.setTableHorario(state.tableHorarioOriginal);
      alert.success(
        "Cambios cancelados",
        "Se han restaurado los cambios originales del horario."
      );
    } catch (error) {
      console.error("Error al cancelar cambios:", error);
      alert.error(
        "Error",
        "No se pudieron cancelar los cambios. Intente nuevamente."
      );
    } finally {
      stateSetters.setLoading(false);
    }
  }, [stateSetters, alert, state.tableHorarioOriginal]);

  const handleExitModeCustom = useCallback(() => {
    setCustom(false);
    stateSetters.setHayCambios(false);
  }, [setCustom, stateSetters]);

  const handleSave = useCallback(async () => {
    try {
      stateSetters.setLoading(true);
      await dataActions.fetchCambiosTableHorario(alert);
      alert.success(
        "horario guardado",
        "Los cambios se han guardado exitosamente."
      );
    } catch (error) {
      console.error("Error al guardar:", error);
      alert.error(
        "Error al guardar",
        "No se pudieron guardar los cambios. Intente nuevamente."
      );
    } finally {
      stateSetters.setLoading(false);
    }
  }, [stateSetters, alert, dataActions]);

  const handleCloseOverlay = useCallback(() => {
    setOverlayVisible(false);
  }, [setOverlayVisible]);

  const handleToggleOverlay = useCallback(() => {
    setOverlayVisible((prev) => !prev);
  }, [setOverlayVisible]);

  // Título del horario
  const horarioTitle = useMemo(() => {
    const parts = [
      pnf?.nombre_pnf,
      trayecto && `Trayecto ${trayecto.valor_trayecto}`,
      seccion.valor_seccion && `Sección ${seccion.valor_seccion}`,
    ].filter(Boolean);
    return parts.join(" - ");
  }, [pnf, trayecto, seccion]);

  const handlePrint = useCallback(async () => {
    try {
      setOverlayVisible(false);
      const id_seccion = seccion?.id_seccion;

      if (!id_seccion) {
        alert.warning(
          "Advertencia",
          "No se encontró la sección para exportar."
        );
        return;
      }

      const response = await axios.get(`/exportar/seccion/${id_seccion}`, {
        responseType: "blob",
      });
      console.log(response);

      const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `Horario_${horarioTitle}.docx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);

      console.log("✅ Archivo PDF descargado correctamente.");
      alert.success(
        "Éxito",
        "El horario se ha exportado y descargado correctamente."
      );
    } catch (error) {
      console.error("❌ Error al descargar el horario:", error);
      alert.error(
        "Error al exportar",
        "No se pudo descargar el horario. Intente nuevamente."
      );
    }
  }, [axios, seccion, setOverlayVisible, alert, horarioTitle]);
  
  // Configuración de la tabla
  const tableConfig = useMemo(
    () => ({
      tableHorario,
      availableSlots,
      isSlotAvailable: slotActions.isSlotAvailable,
      handleSlotClick: slotActions.handleSlotClick,
      handleClassDeleteClick: movementActions.handleDeleteClass,
      handleMoveRequest: movementActions.handleMoveRequest,
      handleCancelMoveRequest: movementActions.handleCancelMoveRequest,
      selectedClass,
      classToMove,
      Custom,
      UnidadesCurriculares: unidadesCurriculares,
      horarioTitle,
    }),
    [
      unidadesCurriculares,
      tableHorario,
      availableSlots,
      slotActions,
      movementActions,
      selectedClass,
      classToMove,
      Custom,
      horarioTitle,
    ]
  );

  return (
    <Box sx={{ position: "relative", minHeight: "400px" }}>
      {/* Tabla del horario */}
      <Box
        sx={{
          flex: 1,
          position: "relative",
          border: overlayVisible
            ? `2px solid ${theme.palette.primary.main}`
            : "2px solid transparent",
          borderRadius: 2,
          transition: "all 0.3s ease",
          minHeight: "500px",
          zIndex: 1,
          overflow: "hidden",
          backgroundColor: "background.paper",
        }}
        onDoubleClick={handleToggleOverlay}
      >
        <HorarioTable {...tableConfig} />

        {/* Overlay de acciones */}
        {!Custom && (
          <TableOverlay
            isVisible={overlayVisible}
            isCustom={isCustom}
            setCustom={setCustom}
            onPrint={handlePrint}
            onClose={handleCloseOverlay}
            title={horarioTitle}
          />
        )}
      </Box>

      {/* Formulario para nueva clase */}
      {Custom && (
        <Box sx={{ mt: 3 }}>
          <ClassForm
            unidadesCurriculares={unidadesCurriculares}
            unidadCurricularSelected={state.unidadCurricularSelected}
            profesores={profesores}
            profesorSelected={state.profesorSelected}
            aulas={aulas}
            aulaSelected={state.aulaSelected}
            onUnidadChange={handleUnidadChange}
            onProfesorChange={handleProfesorChange}
            onAulaChange={handleAulaChange}
            Custom={Custom}
            loading={loading}
            errors={{}}
            ButtonSave={handleSave}
            ButtonCancel={handleCancel}
            ButtonExitModeCustom={handleExitModeCustom}
            HayCambios={state.hayCambios}
          />
        </Box>
      )}
    </Box>
  );
};

export default React.memo(HorarioSeccion);
