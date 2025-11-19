import {
  Tooltip,
  Avatar,
  Typography,
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Menu,
  MenuItem,
  List,
  ListItem,
  Chip,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import dayjs from "dayjs";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ListItemIcon from "@mui/material/ListItemIcon";
import {
  PersonRemove as PersonRemoveIcon,
  Class as ClassIcon,
  Schedule as ScheduleIcon,
  Settings as SettingsIcon,
  Edit as EditIcon,
  School as SchoolIcon,
  Badge as BadgeIcon,
} from "@mui/icons-material";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import useApi from "../hook/useApi.jsx";
import ModalEliminarProfe from "./ModalEliminarProfe.jsx";
import ModalEditarCampoProfesor from "./ModalEditarCampoProfesor.jsx";
import CustomButton from "./customButton.jsx";
import CustomChip from "./CustomChip.jsx";

export default function CardCoordinador({ coordinador, isSearch }) {
  const axios = useApi(false);
  const theme = useTheme();
  const navigate = useNavigate();

  const [coordinadorActual, setCoordinadorActual] = useState(coordinador);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [openModalEliminar, setOpenModalEliminar] = useState(false);
  const [openModalEditar, setOpenModalEditar] = useState(false);
  const [campoEditando, setCampoEditando] = useState(null);
  const [valorEditando, setValorEditando] = useState("");
  const [coordinadorEditado, setCoordinadorEditado] = useState(false);
  const [isTitileando, setIsTitileando] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const hasFetched = useRef(false);

  useEffect(() => {
    console.log(coordinadorActual);
  }, [coordinadorActual]);

  // Efecto de titileo cuando isSearch es true
  useEffect(() => {
    if (isSearch) {
      setIsTitileando(true);
      const timer = setTimeout(() => {
        setIsTitileando(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isSearch]);

  // Cargar imagen del coordinador
  useEffect(() => {
    if (hasFetched.current || !coordinador?.cedula) return;

    const loadCoordinadorImage = async () => {
      hasFetched.current = true;
      try {
        const response = await axios.get(
          `/profesores/${coordinador.cedula}/imagen`,
          { responseType: "blob" }
        );
        const imageUrl = URL.createObjectURL(response.data);
        setAvatarUrl(imageUrl);
      } catch (error) {
        console.error("Error cargando imagen:", error);
        setAvatarUrl(null);
      }
    };

    loadCoordinadorImage();
  }, [coordinador?.cedula, axios]);

  const onSubmitDestitucion = async (data) => {
    try {
      const confirm = await alert.confirm(
        "¿Está seguro de destituir a este coordinador?",
        "Esta acción removerá al coordinador de su cargo pero mantendrá su registro como profesor."
      );
      if (!confirm) return;

      setIsLoading(true);

      // ✅ Construcción del payload para coordinador
      const payload = {
        id_coordinador: coordinador.id_coordinador,
        id_profesor: coordinador.id_profesor,
        id_pnf: coordinador.id_pnf,
        tipo_accion: data.tipo_accion,
        razon: data.razon,
        observaciones: data.observaciones,
        fecha_efectiva: data.fecha_efectiva,
      };

      // ✅ Petición DELETE específica para coordinador
      await axios.delete(`/coordinadores/${coordinador.id_coordinador}`, {
        data: payload,
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
      });

      // ✅ Mensaje de éxito para coordinador
      alert.toast({
        title: "Coordinador destituido",
        message: "El coordinador fue destituido correctamente del cargo.",
        config: { icon: "success" },
      });

      // ✅ Navegación a la página de coordinadores
      navigate("/academico/coordinadores");
    } catch (error) {
      console.error("❌ Error al destituir coordinador:", error);

      // ✅ Si hay errores de validación enviados desde el backend
      if (error.error?.totalErrors > 0) {
        error.error.validationErrors.forEach((e) => {
          alert.toast({
            title: e.field,
            message: e.message,
            config: { icon: "warning" },
          });
        });
      } else {
        // ✅ Mensaje de error específico para coordinador
        alert.toast({
          title: error.title || "Error al destituir",
          message:
            error.message ||
            "Ocurrió un error al intentar destituir al coordinador.",
          config: { icon: "error" },
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (avatarUrl) URL.revokeObjectURL(avatarUrl);
    };
  }, [avatarUrl]);

  // Abrir modal de edición
  const handleOpenModalEditar = (campo, valorActual) => {
    setCampoEditando(campo);
    setValorEditando(valorActual || "");
    setOpenModalEditar(true);
  };

  // Guardar el campo editado
  const handleGuardarCampo = (campo, nuevoValor) => {
    const actualizado = { ...coordinadorActual, [campo]: nuevoValor };
    setCoordinadorActual(actualizado);
    setCoordinadorEditado(true);
    setOpenModalEditar(false);
  };

  // Guardar cambios en servidor
  const handleGuardarCambiosServidor = async () => {
    try {
      console.log(coordinadorActual);
      const respuesta = await axios.put(
        `/coordinadores/${coordinadorActual.id_coordinador}`,
        coordinadorActual
      );
      console.log(respuesta);
      setCoordinadorEditado(false);
    } catch (error) {
      console.error("Error al guardar cambios:", error);
    }
  };

  // Eliminar coordinador
  const handleCoordinadorEliminado = () => {
    setTimeout(() => {
      navigate("/coordinadores");
    }, 1200);
  };

  // Iniciales del coordinador
  const getInitials = () => {
    const firstname = coordinador?.nombres?.charAt(0) || "N";
    const lastname = coordinador?.apellidos?.charAt(0) || "E";
    return `${firstname}${lastname}`;
  };

  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  // Calcular años de experiencia
  const getAnosExperiencia = () => {
    if (!coordinadorActual?.fecha_designacion) return "0";
    const designacion = dayjs(coordinadorActual.fecha_designacion);
    const ahora = dayjs();
    return Math.floor(ahora.diff(designacion, "year", true)).toString();
  };

  return (
    <Box
      id="cardcoordinador"
      sx={{
        background: theme.palette.background.paper,
        borderRadius: "15px",
        width: "100%",
        maxWidth: "400px",
        margin: "0 auto",
        boxShadow: isTitileando ? 6 : 2,
        overflow: "hidden",
        transform: isTitileando ? "scale(1.02)" : "scale(1)",
        border: isTitileando
          ? `2px solid ${theme.palette.primary.main}`
          : "none",
        animation: isTitileando
          ? "titileo 0.5s ease-in-out infinite alternate"
          : "none",
        transition: "all 0.3s ease-in-out",
        "@keyframes titileo": {
          "0%": {
            boxShadow: `0 0 10px ${theme.palette.primary.main}`,
            transform: "scale(1.02)",
          },
          "100%": {
            boxShadow: `0 0 20px ${theme.palette.primary.main}, 0 0 30px ${theme.palette.primary.light}`,
            transform: "scale(1.03)",
          },
        },
      }}
    >
      {/* Imagen del coordinador */}
      <Box
        sx={{
          position: "relative",
          width: "100%",
          height: "300px",
          overflow: "hidden",
        }}
      >
        <Avatar
          variant="square"
          src={avatarUrl || undefined}
          alt={`${coordinadorActual?.nombres} ${coordinadorActual?.apellidos}`}
          sx={{
            width: "100%",
            height: "100%",
            backgroundColor: avatarUrl
              ? theme.palette.grey[300]
              : theme.palette.primary.main,
            fontSize: "3rem",
            color: "white",
          }}
          onError={() => setAvatarUrl(null)}
        >
          {!avatarUrl && getInitials()}
        </Avatar>

        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background:
              "linear-gradient(to top, rgba(0,0,0,0.8), rgba(0,0,0,0.3), transparent)",
          }}
        />

        {/* Badge de Coordinador */}
        <Chip
          icon={<BadgeIcon />}
          label="COORDINADOR"
          color="primary"
          variant="filled"
          sx={{
            position: "absolute",
            top: 15,
            left: "50%",
            transform: "translateX(-50%)",
            fontWeight: "bold",
            backgroundColor: theme.palette.success.main,
            color: "white",
          }}
        />

        {/* Botón Editar - Izquierda */}
        <Tooltip title="Editar Imagen" arrow>
          <IconButton
            size="small"
            sx={{
              position: "absolute",
              left: 15,
              top: 15,
              color: "white",
              backgroundColor: "rgba(0,0,0,0.3)",
              "&:hover": {
                backgroundColor: "rgba(163, 163, 163, 0.3)",
              },
            }}
          >
            <EditIcon />
          </IconButton>
        </Tooltip>

        {/* Botón Acciones - Derecha */}
        <Tooltip title="Acciones" arrow>
          <IconButton
            onClick={handleClick}
            size="small"
            sx={{
              position: "absolute",
              right: 15,
              top: 15,
              color: "white",
              backgroundColor: "rgba(0,0,0,0.3)",
              "&:hover": {
                backgroundColor: "rgba(163, 163, 163, 0.3)",
              },
            }}
          >
            <SettingsIcon />
          </IconButton>
        </Tooltip>

        <Typography
          variant="h5"
          sx={{
            position: "absolute",
            left: 15,
            bottom: 15,
            color: "white",
            fontWeight: "bold",
            textShadow: "2px 2px 4px rgba(0,0,0,0.5)",
          }}
        >
          {coordinadorActual?.nombres?.split(" ")[0] || "No"}{" "}
          {coordinadorActual?.apellidos?.split(" ")[0] || "Especificado"}
        </Typography>
      </Box>

      {/* Información */}
      <Box
        sx={{
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        {/* Información de Coordinación */}
        <Accordion defaultExpanded={true}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <SchoolIcon color="primary" />
              <Typography variant="subtitle1" fontWeight="bold">
                Información de Coordinación
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <InfoRow
              label="PNF"
              value={`${coordinadorActual?.nombre_pnf} (${coordinadorActual?.codigo_pnf})`}
            />
            <InfoRow
              label="Fecha Designación"
              value={
                coordinadorActual?.fecha_designacion
                  ? dayjs(coordinadorActual.fecha_designacion).format(
                      "DD/MM/YYYY"
                    )
                  : "No especificado"
              }
            />
            <InfoRow label="Años de Experiencia" value={getAnosExperiencia()} />
            <InfoRow
              label="Estatus"
              value={
                <Chip
                  label={coordinadorActual?.estatus_coordinador || "activo"}
                  color={
                    coordinadorActual?.estatus_coordinador === "activo"
                      ? "success"
                      : "default"
                  }
                  size="small"
                />
              }
            />
            <InfoRow
              label="Horas Disponibles"
              value={`${
                coordinadorActual?.horas_disponibles?.hours || 0
              } horas`}
            />
          </AccordionDetails>
        </Accordion>

        {/* Información Personal */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1" fontWeight="bold">
              Información Personal
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <InfoRow label="Cédula" value={coordinadorActual?.cedula} />
            <InfoRow label="Género" value={coordinadorActual?.genero} />
            <InfoRow
              label="Fecha Nacimiento"
              value={
                coordinadorActual?.fecha_nacimiento
                  ? dayjs(coordinadorActual.fecha_nacimiento).format(
                      "DD/MM/YYYY"
                    )
                  : "No especificado"
              }
            />
            <EditableInfoRow
              label="Email"
              value={coordinadorActual?.email}
              onEdit={() =>
                handleOpenModalEditar("email", coordinadorActual.email)
              }
            />
            <EditableInfoRow
              label="Teléfono Móvil"
              value={coordinadorActual?.telefono_movil}
              onEdit={() =>
                handleOpenModalEditar(
                  "telefono_movil",
                  coordinadorActual.telefono_movil
                )
              }
            />
            <EditableInfoRow
              label="Teléfono Local"
              value={coordinadorActual?.telefono_local}
              onEdit={() =>
                handleOpenModalEditar(
                  "telefono_local",
                  coordinadorActual.telefono_local
                )
              }
            />
            <InfoRow label="Dirección" value={coordinadorActual?.direccion} />
          </AccordionDetails>
        </Accordion>

        {/* Información Profesional */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1" fontWeight="bold">
              Información Profesional
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <InfoRow
              label="Fecha Ingreso"
              value={
                coordinadorActual?.fecha_ingreso
                  ? dayjs(coordinadorActual.fecha_ingreso).format("DD/MM/YYYY")
                  : "No especificado"
              }
            />
            <EditableInfoRow
              label="Categoría"
              value={coordinadorActual?.categoria}
              onEdit={() =>
                handleOpenModalEditar("categoria", coordinadorActual.categoria)
              }
            />
            <EditableInfoRow
              label="Dedicación"
              value={coordinadorActual?.dedicacion}
              onEdit={() =>
                handleOpenModalEditar(
                  "dedicacion",
                  coordinadorActual.dedicacion
                )
              }
            />
          </AccordionDetails>
        </Accordion>

        {/* Áreas de Conocimiento */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1" fontWeight="bold">
              Áreas de Conocimiento
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              {coordinadorActual?.areas_de_conocimiento &&
              coordinadorActual.areas_de_conocimiento.length > 0 ? (
                coordinadorActual.areas_de_conocimiento.map((area, index) => (
                  <CustomChip
                    key={index}
                    label={area}
                    color="primary"
                    variant="outlined"
                  />
                ))
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No especificado
                </Typography>
              )}
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* Formación Académica */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1" fontWeight="bold">
              Formación Académica
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="subtitle2" gutterBottom>
              Pre-Grados:
            </Typography>
            {coordinadorActual?.pre_grados &&
            coordinadorActual.pre_grados.length > 0 ? (
              coordinadorActual.pre_grados.map((pregrado, index) => (
                <Typography key={index} variant="body2" sx={{ mb: 1 }}>
                  • {pregrado.completo}
                </Typography>
              ))
            ) : (
              <Typography variant="body2" color="text.secondary">
                No especificado
              </Typography>
            )}

            <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
              Pos-Grados:
            </Typography>
            {coordinadorActual?.pos_grados &&
            coordinadorActual.pos_grados.length > 0 ? (
              coordinadorActual.pos_grados.map((posgrado, index) => (
                <Typography key={index} variant="body2" sx={{ mb: 1 }}>
                  • {posgrado.completo}
                </Typography>
              ))
            ) : (
              <Typography variant="body2" color="text.secondary">
                No especificado
              </Typography>
            )}
          </AccordionDetails>
        </Accordion>

        {/* Disponibilidad */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1" fontWeight="bold">
              Disponibilidad
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <List dense>
              {coordinadorActual?.disponibilidad &&
              coordinadorActual.disponibilidad.length > 0 ? (
                coordinadorActual.disponibilidad.map((dis, index) => (
                  <ListItem key={index}>
                    <Typography variant="body2">
                      <strong>{dis.dia_semana}:</strong> {dis.hora_inicio} -{" "}
                      {dis.hora_fin}
                    </Typography>
                  </ListItem>
                ))
              ) : (
                <ListItem>
                  <Typography variant="body2" color="text.secondary">
                    No especificado
                  </Typography>
                </ListItem>
              )}
            </List>
          </AccordionDetails>
        </Accordion>

        {coordinadorEditado && (
          <CustomButton
            tipo="success"
            variant="contained"
            onClick={handleGuardarCambiosServidor}
          >
            Guardar Cambios
          </CustomButton>
        )}
      </Box>

      {/* Modales */}
      <ModalEditarCampoProfesor
        open={openModalEditar}
        onClose={() => setOpenModalEditar(false)}
        campo={campoEditando}
        valorActual={valorEditando}
        onGuardar={handleGuardarCampo}
      />

      <ModalEliminarProfe
        profesor={coordinadorActual}
        open={openModalEliminar}
        onSubmit={onSubmitDestitucion}
        isLoading={isLoading}
        onClose={() => setOpenModalEliminar(false)}
        onEliminado={handleCoordinadorEliminado}
      />

      {/* Menú de acciones */}
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        onClick={handleClose}
        slotProps={{
          paper: {
            elevation: 3,
            sx: {
              overflow: "visible",
              filter: "drop-shadow(0px 2px 8px rgba(0,0,0,0.32))",
              mt: 1.5,
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
            navigate(`/horarios/profesores/${coordinador.id_profesor}`)
          }
        >
          <ListItemIcon>
            <ClassIcon fontSize="small" />
          </ListItemIcon>
          Horario Coordinador
        </MenuItem>
        <MenuItem
          onClick={() =>
            navigate(
              `/academico/profesores/disponibilidad/${coordinador.id_profesor}`
            )
          }
        >
          <ListItemIcon>
            <ScheduleIcon fontSize="small" />
          </ListItemIcon>
          Disponibilidad Coordinador
        </MenuItem>
        <MenuItem onClick={() => setOpenModalEliminar(true)}>
          <ListItemIcon>
            <PersonRemoveIcon fontSize="small" />
          </ListItemIcon>
          Eliminar Coordinador
        </MenuItem>
      </Menu>
    </Box>
  );
}

// Componentes auxiliares
const InfoRow = ({ label, value }) => (
  <Typography sx={{ mb: 1.5 }}>
    <strong>{label}:</strong> {value || "No especificado"}
  </Typography>
);

const EditableInfoRow = ({ label, value, onEdit }) => (
  <Box
    sx={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      mb: 1.5,
    }}
  >
    <Typography>
      <strong>{label}:</strong> {value || "No especificado"}
    </Typography>
    <Tooltip title={`Editar ${label.toLowerCase()}`} arrow>
      <IconButton size="small" onClick={onEdit}>
        <EditIcon fontSize="small" />
      </IconButton>
    </Tooltip>
  </Box>
);
