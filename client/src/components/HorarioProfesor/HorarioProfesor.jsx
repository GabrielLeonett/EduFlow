import React, { useCallback, useMemo } from "react";
import { Box, useTheme } from "@mui/material";

// Hooks
import useHorarioState from "./hooks/useHorarioState";
import useHorarioEffects from "./hooks/useHorarioEffects";

// Components
import HorarioTable from "./components/HorarioTable";
import TableOverlay from "./components/TableOverlay";

// Utils
import useApi from "../../hook/useApi";
import useSweetAlert from "../../hook/useSweetAlert";

const HorarioProfesor = ({ profesor, horario: initialHorario, turno }) => {
  console.log("🧑‍🏫 Profesor en HorarioProfesor:", profesor);
  const theme = useTheme();
  const axios = useApi();
  const alert = useSweetAlert();

  // Props consolidados
  const componentProps = useMemo(
    () => ({
      horario: initialHorario,
      turno,
    }),
    [initialHorario, turno]
  );

  // 1. Estado principal
  const {
    tableHorario,
    selectedClass,
    availableSlots,
    unidadesCurriculares,

    classToMove,
    overlayVisible,
    Custom,
    setOverlayVisible,
    setCustom,
    state,
    stateSetters,
  } = useHorarioState(componentProps);

  // 5. Efectos
  useHorarioEffects(componentProps, state, stateSetters);

  const handlePrint = useCallback(async () => {
    try {
      setOverlayVisible(false);

      console.log("✅ Archivo PDF descargado correctamente.");
    } catch (error) {
      console.error("❌ Error al descargar el horario:", error);
      alert.error(
        "Error al exportar",
        "No se pudo descargar el horario. Intente nuevamente."
      );
    }
  }, [axios, setOverlayVisible, alert]);

  const handleCloseOverlay = useCallback(() => {
    setOverlayVisible(false);
  }, [setOverlayVisible]);

  const handleToggleOverlay = useCallback(() => {
    setOverlayVisible((prev) => !prev);
  }, [setOverlayVisible]);

  // Título del horario
  const horarioTitle = useMemo(() => {
    const parts = [
      profesor?.nombres_profesor,
      profesor?.apellidos_profesor,
    ].filter(Boolean);
    return parts.join("  ");
  }, [profesor]);

  // Configuración de la tabla
  const tableConfig = useMemo(
    () => ({
      profesor,
      tableHorario,
      availableSlots,
      selectedClass,
      classToMove,
      Custom,
      UnidadesCurriculares: unidadesCurriculares,
    }),
    [
      profesor,
      unidadesCurriculares,
      tableHorario,
      availableSlots,
      selectedClass,
      classToMove,
      Custom,
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
            setCustom={setCustom}
            onPrint={handlePrint}
            onClose={handleCloseOverlay}
            title={horarioTitle}
          />
        )}
      </Box>
    </Box>
  );
};

export default React.memo(HorarioProfesor);
