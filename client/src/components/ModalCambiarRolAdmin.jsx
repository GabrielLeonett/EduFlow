import { useState, useEffect } from "react";
import {
  Box,
  Grid,
  Typography,
  Dialog,
  DialogContent,
  DialogActions,
  Chip,
} from "@mui/material";
import CustomButton from "./customButton";
import useApi from "../hook/useApi";
import {
  School, // Director Curricular
  Groups, // Gestión Docente
  AssignmentInd, // Secretaria
} from "@mui/icons-material";
import useSweetAlert from "../hook/useSweetAlert";

export default function ModalEditarRolesAdmin({
  open,
  onClose,
  usuario,
  onGuardar,
}) {
  const axios = useApi();
  const alert = useSweetAlert();
  const [rolesSeleccionados, setRolesSeleccionados] = useState([]);
  const [rolesActuales, setRolesActuales] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  // ✅ SOLO roles administrativos (excluyendo Profesor y Coordinador)
  const opcionesRoles = [
    {
      id_rol: 7,
      nombre_rol: "Director/a de gestión Curricular",
      icon: <School sx={{ fontSize: 40 }} />,
      descripcion: "Gestiona planes de estudio",
      removible: true,
      tipo: "admin",
    },
    {
      id_rol: 8,
      nombre_rol: "Director/a de Gestión Permanente y Docente",
      icon: <Groups sx={{ fontSize: 40 }} />,
      descripcion: "Administra cuerpo docente",
      removible: true,
      tipo: "admin",
    },
    {
      id_rol: 9,
      nombre_rol: "Secretari@ Vicerrect@r",
      icon: <AssignmentInd sx={{ fontSize: 40 }} />,
      descripcion: "Apoyo administrativo",
      removible: true,
      tipo: "admin",
    },
  ];

  // Inicializar roles cuando el usuario cambia
  useEffect(() => {
    if (usuario && usuario.roles) {
      // ✅ Filtrar solo roles administrativos (excluir Profesor=1 y Coordinador=2)
      const rolesAdminActuales = usuario.roles.filter(
        (rol) => rol.id_rol !== 1 && rol.id_rol !== 2
      );
      
      setRolesActuales([...rolesAdminActuales]);
      setRolesSeleccionados([...rolesAdminActuales]);
    }
  }, [usuario]);

  const handleRoleSelect = (rol) => {
    setError("");

    // Verificar si el rol ya está seleccionado
    const yaSeleccionado = rolesSeleccionados.some(
      (r) => r.id_rol === rol.id_rol
    );

    if (yaSeleccionado) {
      // Permitir remover cualquier rol administrativo
      setRolesSeleccionados((prev) =>
        prev.filter((r) => r.id_rol !== rol.id_rol)
      );
    } else {
      // Para roles administrativos, reemplazar el admin actual
      // Mantener solo el nuevo rol administrativo (son mutuamente excluyentes)
      const otrosRoles = rolesSeleccionados.filter((r) => r.tipo !== "admin");
      setRolesSeleccionados([...otrosRoles, rol]);
    }
  };

  const isRoleSelected = (rol) => {
    return rolesSeleccionados.some((r) => r.id_rol === rol.id_rol);
  };

  const isRoleActual = (rol) => {
    return rolesActuales.some((r) => r.id_rol === rol.id_rol);
  };

  const handleGuardar = async () => {
    setCargando(true);
    setError("");

    try {
      // ✅ Confirmar acción antes de enviar
      const confirm = await alert.confirm(
        "¿Desea actualizar los roles administrativos?",
        "Esta acción modificará los permisos administrativos asignados al usuario."
      );
      if (!confirm) {
        setCargando(false);
        return;
      }

      // ✅ Preparar datos para enviar - SOLO roles administrativos
      const datosActualizar = {
        roles: rolesSeleccionados.map((rol) => ({
          id_rol: rol.id_rol,
          nombre_rol: rol.nombre_rol,
        })),
      };

      // ✅ Enviar PATCH request
      await axios.patch(`/admins/${usuario.id}/rol`, datosActualizar);
      
      alert.toast({
        title: "Roles actualizados con éxito",
        message: "Los roles administrativos se actualizaron correctamente.",
        config: { icon: "success" },
      });

      onGuardar(rolesSeleccionados);
      onClose();
    } catch (error) {
      console.error("Error al actualizar roles:", error);

      if (error?.error?.totalErrors > 0) {
        error.error.validationErrors.forEach((error_validacion) => {
          alert.toast({
            title: error_validacion.field,
            message: error_validacion.message,
            config: { icon: "warning" },
          });
        });
      } else {
        alert.toast({
          title: error.title || "Error al actualizar los roles",
          message:
            error.message ||
            "No se pudieron actualizar los roles administrativos.",
          config: { icon: "error" },
        });
      }

      setError("Error al actualizar los roles. Intente nuevamente.");
    } finally {
      setCargando(false);
    }
  };

  const handleCancelar = () => {
    // Restaurar roles originales al cancelar
    setRolesSeleccionados([...rolesActuales]);
    setError("");
    onClose();
  };

  // ✅ Función para obtener roles base del usuario (Profesor/Coordinador)
  const getRolesBaseUsuario = () => {
    if (!usuario?.roles) return [];
    
    return usuario.roles.filter(
      (rol) => rol.id_rol === 1 || rol.id_rol === 2
    );
  };

  const rolesBase = getRolesBaseUsuario();

  return (
    <Dialog open={open} onClose={handleCancelar} maxWidth="md" fullWidth>
      <DialogContent>
        <Typography component="h3" variant="h4" fontWeight="bold" gutterBottom>
          Roles Administrativos
        </Typography>
        <Typography variant="body1" color="text.secondary" mb={2}>
          Gestiona los roles administrativos para{" "}
          {usuario?.nombre || "el usuario"}
        </Typography>

        {/* Mostrar roles base (Profesor/Coordinador) que no se pueden modificar */}
        {rolesBase.length > 0 && (
          <Box mb={2}>
            <Typography variant="subtitle2" gutterBottom>
              Roles base del usuario (no modificables):
            </Typography>
            <Box display="flex" gap={1} flexWrap="wrap">
              {rolesBase.map((rol) => (
                <Chip
                  key={rol.id_rol}
                  label={rol.nombre_rol}
                  color="primary"
                  variant="filled"
                  size="small"
                  sx={{ opacity: 0.8 }}
                />
              ))}
            </Box>
          </Box>
        )}

        {/* Mostrar roles administrativos actuales */}
        {rolesActuales.length > 0 && (
          <Box mb={3}>
            <Typography variant="subtitle2" gutterBottom>
              Roles administrativos actuales:
            </Typography>
            <Box display="flex" gap={1} flexWrap="wrap">
              {rolesActuales.map((rol) => (
                <Chip
                  key={rol.id_rol}
                  label={rol.nombre_rol}
                  color="secondary"
                  variant="filled"
                  size="small"
                />
              ))}
            </Box>
          </Box>
        )}

        {/* Mensaje de error */}
        {error && (
          <Typography color="error" variant="body2" mb={2}>
            {error}
          </Typography>
        )}

        <Grid
          container
          spacing={3}
          justifyContent={"center"}
          alignContent={"center"}
        >
          {opcionesRoles.map((rol) => {
            const seleccionado = isRoleSelected(rol);
            const esActual = isRoleActual(rol);

            return (
              <Grid lg={6} md={6} xs={12} sm={6} key={rol.id_rol}>
                <CustomButton
                  tipo={seleccionado ? "primary" : "outlined"}
                  onClick={() => handleRoleSelect(rol)}
                  sx={{
                    width: "100%",
                    height: { xs: 120, sm: 150 },
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 1,
                    p: 3,
                    position: "relative",
                  }}
                >
                  {rol.icon}
                  <Box textAlign="center">
                    <Typography variant="subtitle1" fontWeight="medium">
                      {rol.nombre_rol}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color: seleccionado
                          ? "primary.contrastText"
                          : "text.secondary",
                      }}
                    >
                      {rol.descripcion}
                    </Typography>
                  </Box>

                  {/* Indicador visual si es el rol actual */}
                  {esActual && (
                    <Box
                      sx={{
                        position: "absolute",
                        top: 8,
                        right: 8,
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        bgcolor: "success.main",
                      }}
                    />
                  )}
                </CustomButton>
              </Grid>
            );
          })}
        </Grid>

        {/* Información adicional */}
        <Box mt={3} p={2} bgcolor="grey.50" borderRadius={1}>
          <Typography variant="caption" color="text.secondary">
            💡 <strong>Nota:</strong> Este módulo gestiona únicamente roles administrativos. 
            Los roles de <strong>Profesor</strong> y <strong>Coordinador</strong> son permanentes 
            y se muestran solo como referencia. Los roles administrativos son mutuamente excluyentes.
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, gap: 2 }}>
        <CustomButton
          tipo="outlined"
          onClick={handleCancelar}
          disabled={cargando}
        >
          Cancelar
        </CustomButton>
        <CustomButton
          tipo="primary"
          onClick={handleGuardar}
          disabled={cargando}
          loading={cargando}
        >
          Guardar Cambios
        </CustomButton>
      </DialogActions>
    </Dialog>
  );
}