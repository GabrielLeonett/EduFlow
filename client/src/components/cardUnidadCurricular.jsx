import { Typography, Box, IconButton, Menu, MenuItem } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CustomChip from "./CustomChip";
import ModalEditarUnidadCurricular from "./ModalEditarUnidadCurricular";
import { useState } from "react";
import useApi from "../hook/useApi";
import useSweetAlert from "../hook/useSweetAlert";

export default function CardUnidadCurricular({
  uc,
  onUnidadEliminada,
}) {
  const theme = useTheme();
  const axios = useApi();
  const [unidadCurricular, setUnidadCurricular] = useState(uc);
  const alert = useSweetAlert();
  const [modalEditarOpen, setModalEditarOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const menuOpen = Boolean(anchorEl);

  // Manejar menú de opciones
  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  // Función para manejar la eliminación
  const handleEliminarUnidad = async () => {
    try {
      const confirm = await alert.confirm(
        "¿Está seguro de eliminar esta unidad curricular?",
        "Esta acción no se puede deshacer."
      );

      if (!confirm) return;

      await axios.delete(
        `/unidades-curriculares/${unidadCurricular.id_unidad_curricular}`
      );

      if (onUnidadEliminada) {
        onUnidadEliminada(unidadCurricular.id_unidad_curricular);
      }

      alert.toast({
        title: "Unidad eliminada",
        message: "La unidad curricular fue eliminada correctamente.",
        config: { icon: "success" },
      });

      handleMenuClose();
    } catch (error) {
      console.error("Error al eliminar unidad curricular:", error);
      alert.toast({
        title: "Error",
        message: "No se pudo eliminar la unidad curricular.",
        config: { icon: "error" },
      });
    }
  };

  return (
    <>
      <Box
        sx={{
          border: `1px solid ${theme.palette.primary.main}`,
          borderRadius: 2,
          padding: 2,
          width: "20rem",
          marginBottom: 2,
          backgroundColor: theme.palette.background.paper,
          boxShadow: 3,
          transition: "transform 0.3s, box-shadow 0.3s",
          position: "relative",
          "&:hover": {
            transform: "scale(1.05)",
            boxShadow: 6,
            borderColor: theme.palette.primary.dark,
          },
        }}
      >
        {/* Menú de opciones */}
        <IconButton
          sx={{
            position: "absolute",
            top: 8,
            right: 8,
          }}
          onClick={handleMenuClick}
          size="small"
        >
          <MoreVertIcon fontSize="small" />
        </IconButton>

        <Menu anchorEl={anchorEl} open={menuOpen} onClose={handleMenuClose}>
          <MenuItem
            onClick={() => {
              setModalEditarOpen(true);
              handleMenuClose();
            }}
          >
            <EditIcon sx={{ mr: 1 }} fontSize="small" />
            Editar
          </MenuItem>
          <MenuItem onClick={handleEliminarUnidad}>
            <DeleteIcon sx={{ mr: 1 }} fontSize="small" />
            Eliminar
          </MenuItem>
        </Menu>

        {/* Contenido de la tarjeta */}
        <Typography
          component="h2"
          variant="h6"
          color={theme.palette.primary.main}
          gutterBottom
          sx={{ fontWeight: "bold", pr: 4 }}
        >
          {unidadCurricular.nombre_unidad_curricular}
        </Typography>

        <Typography variant="body2" color="text.secondary" gutterBottom>
          {unidadCurricular.descripcion_unidad_curricular}
        </Typography>

        <Typography variant="body2" color="text.secondary" gutterBottom>
          <strong>Código:</strong> {unidadCurricular.codigo_unidad}
        </Typography>

        <Typography variant="body2" color="text.secondary">
          <strong>Carga horaria:</strong> {unidadCurricular.horas_clase} horas
        </Typography>

        {/* Áreas de Conocimiento */}
        <Box sx={{ marginTop: 1, display: "flex", flexWrap: "wrap", gap: 1 }}>
          {unidadCurricular.areas_conocimiento &&
            unidadCurricular.areas_conocimiento.map((area, index) => (
              <CustomChip
                key={index}
                label={area.nombre_area_conocimiento}
                color="primary"
                size="small"
              />
            ))}
        </Box>

        {/* Estado */}
        <Box sx={{ mt: 1, display: "flex", justifyContent: "flex-end" }}>
          <CustomChip
            label={unidadCurricular.activo ? "Activo" : "Inactivo"}
            color={unidadCurricular.activo ? "success" : "error"}
            size="small"
          />
        </Box>
      </Box>

      {/* Modal de edición */}
      <ModalEditarUnidadCurricular
        open={modalEditarOpen}
        onClose={() => setModalEditarOpen(false)}
        unidadCurricular={unidadCurricular}
        onGuardar={(unidad) => {
          setUnidadCurricular(unidad);
        }}
      />
    </>
  );
}
