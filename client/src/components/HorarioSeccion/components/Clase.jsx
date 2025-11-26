import { Typography, Box, IconButton } from "@mui/material";
import { useState, useEffect, useCallback } from "react";
import { Info as InfoIcon, Delete as DeleteIcon } from "@mui/icons-material";
import ModalConflictoClase from "./ModalConflictoClase";

export default function Clase({
  clase,
  isSelected,
  onMoveRequest,
  onCancelMove,
  onDeleteClass,
}) {
  const [activo, setActivo] = useState(false);
  const [showDeleteButton, setShowDeleteButton] = useState(false);
  const [modalConflictosOpen, setModalConflictosOpen] = useState(false);

  // Extraer primer nombre y apellido de forma segura
  const nombre = clase.nombre_profesor?.split(" ")[0] || "";
  const apellido = clase.apellido_profesor?.split(" ")[0] || "";

  // Función memorizada para convertir a minutos
  const convertirAMinutos = useCallback((hora) => {
    if (!hora) return 0;
    const [horas, minutos] = hora.split(":").map(Number);
    return (horas || 0) * 60 + (minutos || 0);
  }, []);

  // Verificar si la clase está activa actualmente
  useEffect(() => {
    const verificarSiActiva = () => {
      if (!clase?.hora_inicio || !clase?.hora_fin) {
        setActivo(false);
        return;
      }

      const ahora = new Date();
      const minutosActuales = ahora.getHours() * 60 + ahora.getMinutes();
      const inicioMin = convertirAMinutos(clase.hora_inicio);
      const finMin = convertirAMinutos(clase.hora_fin);

      setActivo(minutosActuales >= inicioMin && minutosActuales <= finMin);
    };

    verificarSiActiva();

    // Actualizar cada minuto para clases en curso
    const interval = setInterval(verificarSiActiva, 60000);

    return () => clearInterval(interval);
  }, [clase, convertirAMinutos]);

  // Determinar estilos basados en el estado
  const getEstilos = () => {
    if (isSelected) {
      return {
        backgroundColor: "#e8f5e8",
        border: "2px solid #4caf50",
        color: "#2e7d32",
      };
    }
    if (activo) {
      return {
        backgroundColor: "#fff3cd",
        border: "2px solid #ffc107",
        color: "#856404",
      };
    }
    // Si hay conflictos, mostrar estilo de advertencia
    if (clase.conflictos && clase.conflictos.length > 0) {
      return {
        backgroundColor: "#ffebee",
        border: "2px solid #f44336",
        color: "#c62828",
      };
    }
    return {
      backgroundColor: "#d1ecf1",
      border: "1px solid #bee5eb",
      color: "#0c5460",
    };
  };

  const estilos = getEstilos();

  const handleClick = (e) => {
    // Solo procesar clicks que vengan directamente del contenedor principal
    if (e.target !== e.currentTarget) {
      return;
    }

    if (e.detail === 1) {
      // Click simple - Mover
      onMoveRequest(clase);
    } else if (e.detail === 2) {
      // Doble click - Cancelar
      onCancelMove(clase);
    }
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (onDeleteClass) {
      onDeleteClass(clase);
    }
  };

  const handleConflictosClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setModalConflictosOpen(true);
  };

  const handleMouseEnter = () => {
    setShowDeleteButton(true);
  };

  const handleMouseLeave = () => {
    setShowDeleteButton(false);
  };

  return (
    <>
      <Box
        className={`clase ${isSelected ? "selected" : ""}`}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        sx={{
          cursor: "pointer",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
          width: {xs: 130 ,sm: 140, md: 150, lg: 160},
          height: '100%',
          padding: {},
          borderRadius: "4px",
          transition: "all 0.2s ease-in-out",
          position: "relative",
          "&:hover": {
            transform: "scale(1.02)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          },
          ...estilos,
        }}
      >
        {/* Botón de eliminar - aparece al hacer hover */}
        {onDeleteClass && (
          <IconButton
            className="delete-button"
            onClick={handleDeleteClick}
            sx={{
              position: "absolute",
              top: 2,
              right: 2,
              width: 24,
              height: 24,
              opacity: showDeleteButton ? 1 : 0,
              transition: "opacity 0.2s ease-in-out",
              backgroundColor: "rgba(255,255,255,0.9)",
              "&:hover": {
                backgroundColor: "#ffebee",
              },
              "& .MuiSvgIcon-root": {
                fontSize: "0.7rem",
                color: "#d32f2f",
              },
              zIndex: 10, // Asegurar que esté por encima
            }}
          >
            <DeleteIcon />
          </IconButton>
        )}

        {/* Botón de información de conflictos - solo aparece si hay conflictos */}
        {clase.conflictos && clase.conflictos.length > 0 && (
          <IconButton
            className="conflict-button"
            onClick={handleConflictosClick}
            sx={{
              position: "absolute",
              top: 2,
              left: 2,
              width: 24,
              height: 24,
              opacity: 1, // Siempre visible cuando hay conflictos
              transition: "all 0.2s ease-in-out",
              backgroundColor: "rgba(255,255,255,0.9)",
              "&:hover": {
                backgroundColor: "#fff3e0",
                transform: "scale(1.1)",
              },
              "& .MuiSvgIcon-root": {
                fontSize: "0.7rem",
                color: "#f57c00",
              },
              zIndex: 10, // Asegurar que esté por encima
            }}
          >
            <InfoIcon />
          </IconButton>
        )}

        {/* Indicador visual de conflictos (badge) */}
        {clase.conflictos && clase.conflictos.length > 0 && (
          <Box
            sx={{
              position: "absolute",
              top: -4,
              right: -4,
              width: 16,
              height: 16,
              backgroundColor: "#f44336",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: "0.5rem",
              fontWeight: "bold",
              border: "2px solid white",
              zIndex: 5,
            }}
          >
            {clase.conflictos.length}
          </Box>
        )}

        {/* Contenido de la clase */}
        <Box sx={{ width: "100%", pointerEvents: "none" }}>
          {/* Nombre de la unidad curricular */}
          <Typography
            variant="caption"
            component="div"
            sx={{
              fontWeight: "bold",
              lineHeight: 1.2,
              mb: 0.5,
              fontSize: "0.7rem",
              maxWidth: "100%",
              textDecoration: clase.conflictos ? "line-through" : "none",
              pointerEvents: "none",
            }}
          >
            {clase.nombre_unidad_curricular || "Sin nombre"}
          </Typography>

          {/* Información del profesor */}
          <Typography
            variant="caption"
            component="div"
            sx={{
              lineHeight: 1.1,
              fontSize: "0.65rem",
              opacity: 0.9,
              maxWidth: "100%",
              pointerEvents: "none",
            }}
          >
            {nombre || apellido ? `Prof. ${nombre} ${apellido}` : "Sin profesor"}
          </Typography>

          {/* Horario de la clase */}
          <Typography
            variant="caption"
            component="div"
            sx={{
              lineHeight: 1.1,
              fontSize: "0.6rem",
              opacity: 0.8,
              mt: 0.5,
              pointerEvents: "none",
            }}
          >
            {clase.hora_inicio} - {clase.hora_fin}
          </Typography>

          {/* Aula */}
          <Typography
            variant="caption"
            component="div"
            sx={{
              lineHeight: 1.1,
              fontSize: "0.65rem",
              opacity: 0.9,
              pointerEvents: "none",
            }}
          >
            Aula: {clase.codigo_aula}
          </Typography>

          {/* Mensaje de conflicto (solo se muestra si hay conflictos) */}
          {clase.conflictos && clase.conflictos.length > 0 && (
            <Typography
              variant="caption"
              component="div"
              sx={{
                lineHeight: 1,
                fontSize: "0.55rem",
                color: "#d32f2f",
                fontWeight: "bold",
                mt: 0.5,
                backgroundColor: "rgba(255,255,255,0.7)",
                px: 0.5,
                borderRadius: 1,
                pointerEvents: "none",
              }}
            >
              {clase.conflictos.length} conflicto(s)
            </Typography>
          )}
        </Box>
      </Box>

      {/* Modal de conflictos */}
      <ModalConflictoClase
        open={modalConflictosOpen}
        onClose={() => setModalConflictosOpen(false)}
        conflictos={clase.conflictos || []}
        claseData={clase}
      />
    </>
  );
}

// Agregar animación de pulso para el indicador activo
const styles = `
@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.4; }
  100% { opacity: 1; }
}

.clase.con-conflictos {
  animation: pulse 2s infinite;
}
`;

// Injectar estilos
if (typeof document !== "undefined") {
  const styleSheet = document.createElement("style");
  styleSheet.innerText = styles;
  document.head.appendChild(styleSheet);
}