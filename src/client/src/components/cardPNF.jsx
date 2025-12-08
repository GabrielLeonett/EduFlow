import {
  Typography,
  Tooltip,
  IconButton,
  Snackbar,
  Alert,
  Box,
  Menu,
  MenuItem,
  ListItemIcon,
  Chip,
} from "@mui/material";

import {
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  Settings as SettingsIcon,
  Bookmark as BookmarkIcon,
  BookmarkRemove as BookmarkRemoveIcon,
  LocationOn as LocationIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
} from "@mui/icons-material";

import { useTheme } from "@mui/material/styles";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useApi from "../hook/useApi";
import useSweetAlert from "../hook/useSweetAlert";
import CustomButton from "./customButton";
import ModalEditarCampoPNF from "./ModalEditarCampoPNF";

export default function CardPNF({ PNF, onActualizar }) {
  const theme = useTheme();
  const axios = useApi();
  const navigate = useNavigate();
  const alert = useSweetAlert();

  // Estados
  const [pnfActual, setPnfActual] = useState(PNF);
  const [pnfEditado, setPnfEditado] = useState(false);
  const [openModalEditar, setOpenModalEditar] = useState(false);
  const [campoEditando, setCampoEditando] = useState(null);
  const [valorEditando, setValorEditando] = useState("");
  const [mensaje, setMensaje] = useState(null);

  // Estados para el menú
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  useEffect(() => {
    setPnfActual(PNF);
  }, [PNF]);

  // Abrir modal de edición
  const handleOpenModalEditar = (campo, valorActual) => {
    setCampoEditando(campo);
    setValorEditando(valorActual || "");
    setOpenModalEditar(true);
  };

  // Guardar el campo en memoria
  const handleGuardarCampo = (campo, nuevoValor) => {
    const actualizado = { ...pnfActual, [campo]: nuevoValor };
    setPnfActual(actualizado);
    setPnfEditado(true);
    setMensaje(`Campo "${campo}" actualizado localmente`);
    setOpenModalEditar(false);
  };

  // Guardar los cambios en el servidor
  const handleGuardarCambiosServidor = async () => {
    try {
      await axios.put(`/pnf/${pnfActual.id_pnf}`, pnfActual);
      setPnfEditado(false);
      setMensaje("Cambios guardados correctamente");

      if (onActualizar) onActualizar();
    } catch (error) {
      console.error("Error al guardar cambios:", error);
      setMensaje("Error al guardar los cambios");
    }
  };

  // Función para Desactivar PNF con useSweetAlert
  const handleDesactivarPNF = async () => {
    try {
      await axios.delete(`/pnfs/${pnfActual.id_pnf}`);

      alert.success(
        "¡Éxito!",
        `PNF "${pnfActual.nombre_pnf}" activar correctamente`,{
        icon: "success",
        timer: 3000,}
      );

      if (onActualizar) {
        setTimeout(() => {
          onActualizar();
        }, 500);
      }
    } catch (error) {
      console.error("Error al Desactivar PNF:", error);

      alert.error(
         "Error",
         `Error al Desactivar el PNF: ${
          error?.message
        }`,{
        icon: "error",
        timer: 4000,}
      );
    }
  };
  const handleReactivarPNF = async () => {
    try {
      await axios.post(`/pnfs/${pnfActual.id_pnf}/activar`);

      alert.success(
        "¡Éxito!",
        `PNF "${pnfActual.nombre_pnf}" reactivar correctamente`,
        {icon: "success",timer: 3000,}
      );

      if (onActualizar) {
        setTimeout(() => {
          onActualizar();
        }, 500);
      }
    } catch (error) {
      console.error("Error al Reactivar PNF:", error);

      alert.error(
        "Error",
         `Error al Reactivar el PNF: ${
          error?.message || error.message
        }`,{
        icon: "error",
        timer: 4000,}
      );
    }
  };

  // Función para manejar la opción de Desactivar del menú (con confirmación SweetAlert)
  const handleDesactivarClick = async () => {
    const result = await alert.confirm(
      "¿Desea Desactivar el PNF?",
      `Desea Desactivar el PNF ${pnfActual.nombre_pnf}`
    );

    if (result) {
      handleDesactivarPNF();
    }
  };
  // Función para manejar la opción de Reactivar del menú (con alert.confirmación SweetAlert)
  const handleReactivarClick = async () => {
    const result = await alert.confirm(
      "¿Desea activar el PNF?",
      `Desea activar el PNF ${pnfActual.nombre_pnf}`
    );

    if (result) {
      handleReactivarPNF();
    }
  };

  return (
    <Box
      component="div"
      id={pnfActual.codigo_pnf}
      sx={{
        position: "relative",
        maxWidth: "1100px",
        width: "100%",
        mx: "auto",
        mt: 5,
        p: 3,
        borderRadius: 3,
        backgroundColor: theme.palette.background.paper,
        boxShadow: 4,
        border: `1px solid ${theme.palette.divider}`,
        transition: "all 0.3s ease",
        "&:hover": {
          boxShadow: 6,
          transform: "scale(1.01)",
        },
      }}
    >
      {/* Header con título y estado */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          mb: 2,
        }}
      >
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}>
            <Typography
              component="h2"
              variant="h5"
              sx={{
                fontWeight: "bold",
                color: theme.palette.primary.main,
              }}
            >
              {pnfActual?.nombre_pnf || "PNF sin nombre"}
            </Typography>
            <Chip
              label={pnfActual?.activo ? "Activo" : "Inactivo"}
              color={pnfActual?.activo ? "success" : "error"}
              size="small"
              variant="outlined"
            />
          </Box>
          <Typography
            variant="subtitle1"
            sx={{
              color: theme.palette.text.secondary,
              fontWeight: "medium",
            }}
          >
            Código: {pnfActual?.codigo_pnf}
          </Typography>
        </Box>

        {/* Botón Acciones */}
        <Box>
          <Tooltip title="Acciones" arrow>
            <IconButton
              onClick={handleClick}
              size="small"
              sx={{
                color: theme.palette.text.primary,
                "&:hover": {
                  backgroundColor: "rgba(163, 163, 163, 0.3)",
                },
              }}
            >
              <SettingsIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Información principal en grid */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 3,
          mt: 2,
        }}
      >
        {/* Columna izquierda - Información académica */}
        <Box>
          <Typography
            variant="h6"
            sx={{ mb: 2, color: theme.palette.primary.main }}
          >
            Información Académica
          </Typography>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {/* Duración */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <ScheduleIcon color="action" fontSize="small" />
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Duración de trayectos
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Typography variant="body1">
                    {pnfActual?.duracion_trayectos} períodos
                  </Typography>
                  <Tooltip title="Editar duración" arrow>
                    <IconButton
                      size="small"
                      onClick={() =>
                        handleOpenModalEditar(
                          "duracion_trayectos",
                          pnfActual.duracion_trayectos
                        )
                      }
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            </Box>

            {/* Población estudiantil */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <PersonIcon color="action" fontSize="small" />
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Población estudiantil
                </Typography>
                <Typography variant="body1">
                  {pnfActual?.poblacion_estudiantil_pnf || 0} estudiantes
                </Typography>
              </Box>
            </Box>

            {/* Coordinador */}
            {pnfActual?.tiene_coordinador && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <PersonIcon color="action" fontSize="small" />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Coordinador
                  </Typography>
                  <Typography variant="body1">
                    {pnfActual?.nombre_coordinador}
                  </Typography>
                </Box>
              </Box>
            )}
          </Box>
        </Box>

        {/* Columna derecha - Información de sede y descripción */}
        <Box>
          <Typography
            variant="h6"
            sx={{ mb: 2, color: theme.palette.primary.main }}
          >
            Información General
          </Typography>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {/* Sede */}
            <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
              <LocationIcon color="action" fontSize="small" sx={{ mt: 0.5 }} />
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Sede
                </Typography>
                <Typography variant="body1">
                  {pnfActual?.nombre_sede}
                </Typography>
                {pnfActual?.ubicacion_sede && (
                  <Typography variant="caption" color="text.secondary">
                    {pnfActual.ubicacion_sede}
                  </Typography>
                )}
              </Box>
            </Box>

            {/* Descripción */}
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Descripción
              </Typography>
              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                <Typography variant="body2" sx={{ flex: 1 }}>
                  {pnfActual?.descripcion_pnf || "Sin descripción"}
                </Typography>
                <Tooltip title="Editar descripción" arrow>
                  <IconButton
                    size="small"
                    onClick={() =>
                      handleOpenModalEditar(
                        "descripcion_pnf",
                        pnfActual.descripcion_pnf
                      )
                    }
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Botón Guardar Cambios */}
      {pnfEditado && (
        <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}>
          <CustomButton
            tipo="success"
            variant="contained"
            onClick={handleGuardarCambiosServidor}
          >
            Guardar Cambios
          </CustomButton>
        </Box>
      )}

      {/* Modal Editar */}
      <ModalEditarCampoPNF
        open={openModalEditar}
        onClose={() => setOpenModalEditar(false)}
        campo={campoEditando}
        valorActual={valorEditando}
        onGuardar={handleGuardarCampo}
      />

      {/* Snackbar para mensajes generales */}
      <Snackbar
        open={!!mensaje}
        autoHideDuration={2500}
        onClose={() => setMensaje(null)}
      >
        <Alert severity={mensaje?.includes("error") ? "error" : "success"}>
          {mensaje}
        </Alert>
      </Snackbar>

      {/* MENU PNF */}
      <Menu
        anchorEl={anchorEl}
        id="account-menu"
        open={open}
        onClose={handleClose}
        onClick={handleClose}
        slotProps={{
          paper: {
            elevation: 0,
            sx: {
              overflow: "visible",
              filter: "drop-shadow(0px 2px 8px rgba(0,0,0,0.32))",
              mt: 1.5,
              "& .MuiAvatar-root": {
                width: 32,
                height: 32,
                ml: -0.5,
                mr: 1,
              },
              "&::before": {
                content: '""',
                display: "block",
                position: "absolute",
                top: 0,
                right: 14,
                width: 10,
                height: 10,
                bgcolor: "background.paper",
                transform: "translateY(-50%) rotate(45deg)",
                zIndex: 0,
              },
            },
          },
        }}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
      >
        <MenuItem
          onClick={() =>
            navigate(`/formacion/programas/${pnfActual.codigo_pnf}`, {
              state: { PNF: pnfActual.codigo_pnf },
            })
          }
        >
          <ListItemIcon>
            <VisibilityIcon fontSize="small" />
          </ListItemIcon>
          Ver detalles
        </MenuItem>

        {/* Opción Desactivar con SweetAlert */}
        {PNF.activo ? (
          <MenuItem onClick={handleDesactivarClick}>
            <ListItemIcon>
              <BookmarkRemoveIcon fontSize="small" />
            </ListItemIcon>
            Desactivar PNF
          </MenuItem>
        ) : (
          <MenuItem onClick={handleReactivarClick}>
            <ListItemIcon>
              <BookmarkIcon fontSize="small" />
            </ListItemIcon>
            Activar PNF
          </MenuItem>
        )}
      </Menu>
    </Box>
  );
}
