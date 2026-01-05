import { useState } from "react";
import {
  Card,
  CardContent,
  Box,
  Typography,
  Divider,
  Avatar,
  Chip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import {
  Settings as SettingsIcon,
  ManageAccounts as ManageAccountsIcon,
  PersonOff as PersonOffIcon,
  Person as PersonIcon,
} from "@mui/icons-material";
import CustomChip from "./CustomChip";
import ModalCambiarRolAdmin from "./ModalCambiarRolAdmin";
import useApi from "../hook/useApi"; // Importar useApi
import useSweetAlert from "../hook/useSweetAlert"; // Importar useSweetAlert

export default function CardAdmin({ usuario, onActualizado }) {
  const axios = useApi();
  const alert = useSweetAlert();

  // Estados internos
  const [usuarioLocal, setUsuarioLocal] = useState(usuario);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [cargando, setCargando] = useState(false);

  const menuAbierto = Boolean(anchorEl);

  // Función para obtener iniciales del nombre
  const getInitials = (nombres, apellidos) => {
    const firstInitial = nombres ? nombres.charAt(0) : "";
    const lastInitial = apellidos ? apellidos.charAt(0) : "";
    return `${firstInitial}${lastInitial}`.toUpperCase();
  };

  // Función para formatear fecha
  const formatDate = (dateString) => {
    if (!dateString) return "No especificado";
    return new Date(dateString).toLocaleDateString("es-ES");
  };

  // Función para determinar el color del estado
  const getStatusColor = (activo) => {
    return activo ? "success" : "error";
  };

  // Manejar apertura del menú
  const handleAbrirMenu = (event) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  // Manejar cierre del menú
  const handleCerrarMenu = () => {
    setAnchorEl(null);
  };

  // Manejar apertura del modal de roles
  const handleAbrirModalRoles = () => {
    handleCerrarMenu();
    setModalAbierto(true);
  };

  // Manejar cambio de estado del usuario
  const handleCambiarEstado = async () => {
    handleCerrarMenu();
    setCargando(true);

    try {
      const nuevoEstado = !usuarioLocal.activo;

      if (nuevoEstado) {
        await axios.put(`/user/${usuarioLocal.cedula}/activar`);
      } else {
        await axios.delete(`/user/${usuarioLocal.cedula}/desactivar`);
      }

      // ✅ Actualizar estado local
      setUsuarioLocal((prev) => ({ ...prev, activo: nuevoEstado }));

      alert.success(
        nuevoEstado ? "Usuario activado" : "Usuario desactivado",
        nuevoEstado
          ? "El usuario se ha activado satisfactoriamente"
          : "El usuario se ha desactivado satisfactoriamente"
      );

      // ✅ Notificar al componente padre si es necesario
      if (onActualizado) {
        onActualizado(usuarioLocal.cedula, { activo: nuevoEstado });
      }
    } catch (error) {
      console.log("❌ Error completo:", error);

      if (error.error?.totalErrors > 0) {
        error.error.validationErrors.forEach((error_validacion) => {
          alert.toast(error_validacion.field, error_validacion.message);
        });
      } else if (error.error) {
        alert.error(error.title, error.message);
      } else {
        alert.error("Error", "Ha ocurrido un error inesperado");
      }
    } finally {
      setCargando(false);
    }
  };

  // Manejar cierre del modal
  const handleCerrarModal = () => {
    setModalAbierto(false);
  };

  // Manejar guardado de roles
  const handleGuardarRoles = async (nuevosRoles) => {
    setUsuarioLocal((prev) => ({
      ...prev,
      roles: nuevosRoles,
      nombre_roles: nuevosRoles.map((rol) => rol.nombre_rol || rol.nombre),
    }));
  };

  // Preparar datos del usuario para el modal
  const usuarioParaModal = {
    id: usuarioLocal.cedula,
    nombre: `${usuarioLocal.nombres} ${usuarioLocal.apellidos}`,
    roles: usuarioLocal.roles || [],
  };

  return (
    <>
      <Card
        elevation={2}
        sx={{
          borderRadius: "16px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
          transition: "transform 0.2s, box-shadow 0.2s",
          ":hover": {
            transform: "translateY(-4px)",
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
          },
          height: "100%",
          cursor: "pointer",
          opacity: cargando ? 0.7 : 1,
        }}
      >
        <CardContent>
          {/* Header con avatar e información básica */}
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <Box display="flex" alignItems="center" gap={2} flex={1}>
              <Avatar
                src={
                  usuarioLocal.imagen
                    ? `/uploads/${usuarioLocal.imagen}`
                    : undefined
                }
                sx={{
                  width: 60,
                  height: 60,
                  bgcolor: usuarioLocal.imagen ? "transparent" : "primary.main",
                  fontSize: "1.2rem",
                  fontWeight: "bold",
                }}
              >
                {!usuarioLocal.imagen &&
                  getInitials(usuarioLocal.nombres, usuarioLocal.apellidos)}
              </Avatar>

              <Box flex={1}>
                <Typography variant="h6" fontWeight={600} noWrap>
                  {usuarioLocal.nombres} {usuarioLocal.apellidos}
                </Typography>
                <Typography variant="body2" color="text.secondary" noWrap>
                  {usuarioLocal.email}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  C.I: {usuarioLocal.cedula}
                </Typography>
              </Box>
            </Box>

            {/* Icono de Settings con menú */}
            <Box
              sx={{
                cursor: cargando ? "not-allowed" : "pointer",
                padding: "8px",
                borderRadius: "50%",
                transition: "background-color 0.2s",
                ":hover": {
                  backgroundColor: cargando ? "transparent" : "action.hover",
                },
              }}
              onClick={cargando ? undefined : handleAbrirMenu}
            >
              <SettingsIcon />
            </Box>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Información adicional */}
          <Box mb={2}>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              mb={1}
            >
              <Typography variant="caption" color="text.secondary">
                Estado:
              </Typography>
              <CustomChip
                label={usuarioLocal.activo ? "Activo" : "Inactivo"}
                color={getStatusColor(usuarioLocal.activo)}
                size="small"
              />
            </Box>

            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              mb={1}
            >
              <Typography variant="caption" color="text.secondary">
                Último acceso:
              </Typography>
              <Typography variant="caption" fontWeight="medium">
                {usuarioLocal.last_login
                  ? formatDate(usuarioLocal.last_login)
                  : "Nunca"}
              </Typography>
            </Box>

            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
            >
              <Typography variant="caption" color="text.secondary">
                Primera vez:
              </Typography>
              <CustomChip
                label={usuarioLocal.primera_vez ? "Sí" : "No"}
                color={usuarioLocal.primera_vez ? "warning" : "default"}
                size="small"
              />
            </Box>
          </Box>

          {/* Roles */}
          <Box mb={2}>
            <Typography
              variant="caption"
              color="text.secondary"
              display="block"
              mb={1}
            >
              Roles:
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={0.5}>
              {usuarioLocal.nombre_roles?.map((rol, index) => (
                <Chip
                  key={index}
                  label={rol}
                  size="small"
                  variant="outlined"
                  color="primary"
                  sx={{ fontSize: "0.7rem" }}
                />
              ))}
              {(!usuarioLocal.nombre_roles ||
                usuarioLocal.nombre_roles.length === 0) && (
                <Typography variant="caption" color="text.disabled">
                  Sin roles asignados
                </Typography>
              )}
            </Box>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Información de registro */}
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <Box>
              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
              >
                Registrado: {formatDate(usuarioLocal.created_at)}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Menú de opciones */}
      <Menu
        anchorEl={anchorEl}
        open={menuAbierto}
        onClose={handleCerrarMenu}
        onClick={handleCerrarMenu}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
      >
        <MenuItem onClick={handleAbrirModalRoles} disabled={cargando}>
          <ListItemIcon>
            <ManageAccountsIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Gestionar Roles</ListItemText>
        </MenuItem>

        <MenuItem onClick={handleCambiarEstado} disabled={cargando}>
          <ListItemIcon>
            {usuarioLocal.activo ? (
              <PersonOffIcon fontSize="small" color="error" />
            ) : (
              <PersonIcon fontSize="small" color="success" />
            )}
          </ListItemIcon>
          <ListItemText>
            {usuarioLocal.activo ? "Desactivar Usuario" : "Activar Usuario"}
          </ListItemText>
        </MenuItem>
      </Menu>

      {/* Modal para gestionar roles */}
      <ModalCambiarRolAdmin
        open={modalAbierto}
        onClose={handleCerrarModal}
        usuario={usuarioParaModal}
        onGuardar={handleGuardarRoles}
        cargando={cargando}
      />
    </>
  );
}
