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
} from "@mui/material";

import {
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  Settings as SettingsIcon,
  PersonRemove as PersonRemoveIcon,
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
  const axios = useApi(false);
  const navigate = useNavigate();
  const { confirm, alert: showAlert } = useSweetAlert(); // 👈 Corregido: desestructurar correctamente

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

  // 👇 Función para eliminar PNF con useSweetAlert
  const handleEliminarPNF = async () => {
    try {
      await axios.delete(`/pnf/${pnfActual.id_pnf}`);
      
      // Mostrar alerta de éxito con SweetAlert
      showAlert({
        title: "¡Éxito!",
        text: `PNF "${pnfActual.nombre_pnf}" eliminado correctamente`,
        icon: "success",
        timer: 3000
      });

      // Recargar o actualizar la lista
      if (onActualizar) {
        setTimeout(() => {
          onActualizar();
        }, 500);
      }

    } catch (error) {
      console.error("Error al eliminar PNF:", error);
      
      // Mostrar alerta de error con SweetAlert
      showAlert({
        title: "Error",
        text: `Error al eliminar el PNF: ${error.response?.data?.message || error.message}`,
        icon: "error",
        timer: 4000
      });
    }
  };

  // 👇 Función para manejar la opción de eliminar del menú (con confirmación SweetAlert)
  const handleEliminarClick = async () => {
    const result = await confirm(
      '¿Desea eliminar el PNF?', 
      `Desea eliminar el PNF ${pnfActual.nombre_pnf}`
    );
    
    if (result) {
      handleEliminarPNF();
    }
  };

  return (
    <Box
      component="div"
      id={pnfActual.codigo}
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
      {/* ✅ Botón Acciones - Mismo estilo que CardProfesor */}
      <Box
        sx={{
          position: "absolute",
          right: 15,
          top: 15,
          color: theme.palette.text.primary,
          fontWeight: "bold",
          "&:hover": {
            backgroundColor: "rgba(163, 163, 163, 0.3)",
          },
          borderRadius: "50%",
          transition: "background-color 0.2s ease-in-out",
        }}
      >
        <Tooltip title="Acciones" arrow>
          <IconButton
            onClick={handleClick}
            size="small"
            sx={{
              color: "inherit",
              "&:hover": {
                backgroundColor: "transparent",
              },
            }}
            aria-controls={open ? "account-menu" : undefined}
            aria-haspopup="true"
            aria-expanded={open ? "true" : undefined}
          >
            <SettingsIcon sx={{ color: "inherit" }} />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Título principal */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          pr: 4,
        }}
      >
        <Typography
          component="h2"
          variant="h5"
          gutterBottom
          sx={{
            fontWeight: "bold",
            color: theme.palette.primary.main,
          }}
        >
          {pnfActual?.nombre_pnf || "PNF sin nombre"}
        </Typography>
        
      </Box>

      {/* Información general */}
      <Box sx={{ mt: 1 }}>
        <Typography>
          <strong>Código:</strong>&nbsp;{pnfActual?.codigo_pnf}
        </Typography>

        <Typography sx={{ mt: 1 }}>
          <strong>Población Estudiantil:</strong>&nbsp;
          {pnfActual?.poblacion_estudiantil}
        </Typography>

        <Typography sx={{ mt: 1, display: "flex", alignItems: "center" }}>
          <strong>Descripción:</strong>&nbsp;
          {pnfActual?.descripcion_pnf}
          <Tooltip title="Editar descripción" arrow>
            <IconButton
              size="small"
              sx={{ ml: 1 }}
              onClick={() =>
                handleOpenModalEditar("descripcion_pnf", pnfActual.descripcion_pnf)
              }
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Typography>

        <Typography sx={{ mt: 1, display: "flex", alignItems: "center" }}>
          <strong>Duración Trayectos:</strong>&nbsp;
          {pnfActual?.duracion_trayectos}
          <Tooltip title="Editar duración" arrow>
            <IconButton
              size="small"
              sx={{ ml: 1 }}
              onClick={() =>
                handleOpenModalEditar("duracion_trayectos", pnfActual.duracion_trayectos)
              }
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Typography>

        {pnfEditado && (
          <CustomButton
            tipo="success"
            variant="contained"
            sx={{ mt: 2 }}
            onClick={handleGuardarCambiosServidor}
          >
            Guardar Cambios
          </CustomButton>
        )}
      </Box>

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

        {/* 👇 Opción eliminar con SweetAlert */}
        <MenuItem onClick={handleEliminarClick}>
          <ListItemIcon>
            <PersonRemoveIcon fontSize="small" />
          </ListItemIcon>
          Eliminar PNF
        </MenuItem>
      </Menu>
    </Box>
  );
}