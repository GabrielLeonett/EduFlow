import { Typography, Box, IconButton, Menu, MenuItem, Stack, Divider, Chip } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ScheduleIcon from "@mui/icons-material/Schedule";
import SchoolIcon from "@mui/icons-material/School";
import CategoryIcon from "@mui/icons-material/Category";
import ScienceIcon from "@mui/icons-material/Science";
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

  // Calcular horas totales
  const horasTotales = (
    parseFloat(unidadCurricular.hte || 0) +
    parseFloat(unidadCurricular.hse || 0) +
    parseFloat(unidadCurricular.hta || 0) +
    parseFloat(unidadCurricular.hsa || 0) +
    parseFloat(unidadCurricular.hti || 0) +
    parseFloat(unidadCurricular.hsi || 0)
  ).toFixed(1);

  // Formatear horas para mostrar
  const formatearHoras = (horas) => {
    return parseFloat(horas || 0).toFixed(1);
  };

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
          width: "24rem",
          height: '35rem',
          marginBottom: 2,
          backgroundColor: theme.palette.background.paper,
          boxShadow: 3,
          transition: "transform 0.3s, box-shadow 0.3s",
          position: "relative",
          "&:hover": {
            transform: "scale(1.02)",
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

        {/* Header con información principal */}
        <Stack spacing={1} sx={{ mb: 2 }}>
          <Typography
            component="h2"
            variant="h6"
            color={theme.palette.primary.main}
            gutterBottom
            sx={{ fontWeight: "bold", pr: 4, lineHeight: 1.2 }}
          >
            {unidadCurricular.nombre_unidad_curricular}
          </Typography>

          <Stack direction="row" spacing={1} flexWrap="wrap" gap={0.5}>
            <CustomChip
              label={unidadCurricular.codigo_unidad}
              color="primary"
              size="small"
              variant="outlined"
            />
            <CustomChip
              label={unidadCurricular.tipo_unidad}
              color="secondary"
              size="small"
            />
            <CustomChip
              label={`Trayecto ${unidadCurricular.valor_trayecto || unidadCurricular.id_trayecto}`}
              color="info"
              size="small"
            />
          </Stack>
        </Stack>

        {/* Descripción */}
        <Typography 
          variant="body2" 
          color="text.secondary" 
          sx={{ 
            mb: 2,
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}
        >
          {unidadCurricular.descripcion_unidad_curricular}
        </Typography>

        <Divider sx={{ my: 1.5 }} />

        {/* Información académica */}
        <Stack spacing={1.5}>
          {/* Créditos y semanas */}
          <Stack direction="row" spacing={2} justifyContent="space-between">
            <Box>
              <Typography variant="caption" color="text.secondary" display="block">
                Créditos
              </Typography>
              <Typography variant="body2" fontWeight="medium">
                {unidadCurricular.creditos || 0}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary" display="block">
                Semanas
              </Typography>
              <Typography variant="body2" fontWeight="medium">
                {unidadCurricular.semanas || 0}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary" display="block">
                Horas Clase
              </Typography>
              <Typography variant="body2" fontWeight="medium">
                {unidadCurricular.horas_clase || 0}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary" display="block">
                Total Horas
              </Typography>
              <Typography variant="body2" fontWeight="medium">
                {horasTotales}h
              </Typography>
            </Box>
          </Stack>

          {/* Distribución de horas (expandible) */}
          <Box>
            <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
              <ScheduleIcon sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
              Distribución Horas
            </Typography>
            <Stack direction="row" spacing={0.5} flexWrap="wrap" gap={0.5}>
              <Chip 
                size="small" 
                label={`HTE: ${formatearHoras(unidadCurricular.hte)}h`}
                variant="outlined"
              />
              <Chip 
                size="small" 
                label={`HSE: ${formatearHoras(unidadCurricular.hse)}h`}
                variant="outlined"
              />
              <Chip 
                size="small" 
                label={`HTA: ${formatearHoras(unidadCurricular.hta)}h`}
                variant="outlined"
              />
              <Chip 
                size="small" 
                label={`HSA: ${formatearHoras(unidadCurricular.hsa)}h`}
                variant="outlined"
              />
              <Chip 
                size="small" 
                label={`HTI: ${formatearHoras(unidadCurricular.hti)}h`}
                variant="outlined"
              />
              <Chip 
                size="small" 
                label={`HSI: ${formatearHoras(unidadCurricular.hsi)}h`}
                variant="outlined"
              />
            </Stack>
          </Box>
        </Stack>

        <Divider sx={{ my: 1.5 }} />

        {/* Áreas de Conocimiento */}
        <Box sx={{ mb: 1.5 }}>
          <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
            <CategoryIcon sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
            Áreas de Conocimiento
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
            {unidadCurricular.areas_conocimiento && unidadCurricular.areas_conocimiento.length > 0 ? (
              unidadCurricular.areas_conocimiento.map((area, index) => (
                <CustomChip
                  key={index}
                  label={area.nombre_area_conocimiento}
                  color="primary"
                  size="small"
                />
              ))
            ) : (
              <Typography variant="caption" color="text.disabled">
                Sin áreas asignadas
              </Typography>
            )}
          </Box>
        </Box>

        {/* Líneas de Investigación */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
            <ScienceIcon sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
            Líneas de Investigación
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
            {unidadCurricular.lineas_investigacion && unidadCurricular.lineas_investigacion.length > 0 ? (
              unidadCurricular.lineas_investigacion.map((linea, index) => (
                <CustomChip
                  key={index}
                  label={linea.nombre_linea_investigacion}
                  color="secondary"
                  size="small"
                />
              ))
            ) : (
              <Typography variant="caption" color="text.disabled">
                Sin líneas asignadas
              </Typography>
            )}
          </Box>
        </Box>

        {/* Footer con estado */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="caption" color="text.secondary">
            Actualizado: {new Date(unidadCurricular.updated_at).toLocaleDateString()}
          </Typography>
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