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
  Grid,
  ListItem,
  Card,
} from "@mui/material";
import { useTheme, useMediaQuery } from "@mui/material";
import dayjs from "dayjs";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ListItemIcon from "@mui/material/ListItemIcon";
import {
  PersonRemove as PersonRemoveIcon,
  Class as ClassIcon,
  Schedule as ScheduleIcon,
  Settings as SettingsIcon,
  Edit as EditIcon,
} from "@mui/icons-material";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import useApi from "../hook/useApi.jsx";
import ModalDestitucion from "./ModalDestitucion.jsx";
import ModalEditarCampoProfesor from "./ModalEditarCampoProfesor.jsx";
import CustomChip from "./CustomChip.jsx";
import useSweetAlert from "../hook/useSweetAlert.jsx";

export default function CardProfesor({ profesor }) {
  const axios = useApi(false);
  const theme = useTheme();
  const navigate = useNavigate();
  const alert = useSweetAlert();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [profesorActual, setProfesorActual] = useState(profesor);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [openModalEliminar, setOpenModalEliminar] = useState(false);
  const [openModalEditar, setOpenModalEditar] = useState(false);
  const [campoEditando, setCampoEditando] = useState(null);
  const [valorEditando, setValorEditando] = useState("");
  const [profesorEditado, setProfesorEditado] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current || !profesor?.cedula) return;

    const loadProfessorImage = async () => {
      hasFetched.current = true;
      try {
        const response = await axios.get(
          `/profesores/${profesor.cedula}/imagen`,
          { responseType: "blob" }
        );
        const imageUrl = URL.createObjectURL(response.data);
        setAvatarUrl(imageUrl);
      } catch (error) {
        console.error("Error cargando imagen:", error);
        setAvatarUrl(null);
      }
    };
    loadProfessorImage();
  }, [profesor?.cedula, axios]);

  useEffect(() => {
    return () => {
      if (avatarUrl) URL.revokeObjectURL(avatarUrl);
    };
  }, [avatarUrl]);

  // Handlers
  const handleOpenModalEditar = (campo, valorActual) => {
    setCampoEditando(campo);
    setValorEditando(valorActual || "");
    setOpenModalEditar(true);
  };

  const handleGuardarCampo = (campo, nuevoValor) => {
    const actualizado = { ...profesorActual, [campo]: nuevoValor };
    setProfesorActual(actualizado);
    setProfesorEditado(true);
    setOpenModalEditar(false);
  };

  const handleGuardarCambiosServidor = async () => {
    try {
      console.log(profesorActual);
      const respuesta = await axios.put(
        `/profesores/${profesorActual.cedula}`,
        profesorActual
      );
      console.log(respuesta);
      setProfesorEditado(false);
    } catch (error) {
      console.error("Error al guardar cambios:", error);
    }
  };

  const handleProfesorEliminado = () => {
    setTimeout(() => {
      navigate("/profesores");
    }, 1200);
  };

  const getInitials = () => {
    const firstname = profesor?.nombres?.charAt(0) || "N";
    const lastname = profesor?.apellidos?.charAt(0) || "E";
    return `${firstname}${lastname}`;
  };

  // Menu handlers
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const handleClick = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const onSubmitDestitucion = async (data) => {
    try {
      const confirm = await alert.confirm(
        "¿Está seguro de eliminar este profesor?",
        "Esta acción no se puede deshacer."
      );
      if (!confirm) return;

      setIsLoading(true);

      // ✅ Construcción del payload
      const payload = {
        id_profesor: profesor.id_profesor,
        tipo_accion: data.tipo_accion,
        razon: data.razon,
        observaciones: data.observaciones,
        fecha_efectiva: data.fecha_efectiva,
      };

      // ✅ Petición DELETE con axios
      await axios.delete(`/profesores/${profesor.id_profesor}`, {
        data: payload,
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
      });

      // 🔽 Reemplazamos alert.success() por toast
      alert.toast({
        title: "Profesor eliminado",
        message: "El profesor fue eliminado correctamente del sistema.",
        config: { icon: "success" },
      });

      navigate("/academico/profesores/eliminados");
    } catch (error) {
      console.error("❌ Error al eliminar profesor:", error);

      // ✅ Si hay errores de validación enviados desde el backend
      if (error.error?.totalErrors > 0) {
        error.error.validationErrors.forEach((e) => {
          // 🔽 toast para cada error de validación
          alert.toast({
            title: e.field,
            message: e.message,
            config: { icon: "warning" },
          });
        });
      } else {
        // 🔽 Reemplazamos alert.error() por toast
        alert.toast({
          title: error.title || "Error al eliminar",
          message:
            error.message ||
            "Ocurrió un error al intentar eliminar el profesor.",
          config: { icon: "error" },
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const render = () => {
    if (isMobile) {
      return (
        <>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6" color="primary" fontWeight="bold">
                Información Personal
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <InfoRow label="Cédula" value={profesorActual?.cedula} />
              <InfoRow label="Género" value={profesorActual?.genero} />
              <InfoRow
                label="Fecha Nac."
                value={
                  profesor?.fecha_nacimiento
                    ? dayjs(profesor.fecha_nacimiento).format("DD/MM/YYYY")
                    : "No especificado"
                }
              />
              <EditableInfoRow
                label="Email"
                value={profesorActual?.email}
                onEdit={() =>
                  handleOpenModalEditar("email", profesorActual.email)
                }
              />
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6" color="primary" fontWeight="bold">
                Información Educativa
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <ChipSection
                label="Áreas"
                items={profesorActual?.areas_de_conocimiento}
                getLabel={(area) => area.nombre_area_conocimiento}
                color="primary"
                onEdit={() =>
                  handleOpenModalEditar(
                    "areas_de_conocimiento",
                    profesorActual?.areas_de_conocimiento || []
                  )
                }
              />

              <ChipSection
                label="Pre-Grados"
                items={profesorActual?.pre_grados}
                getLabel={(pregrado) =>
                  `${pregrado.tipo_pre_grado} ${pregrado.nombre_pre_grado}`
                }
                color="secondary"
                onEdit={() =>
                  handleOpenModalEditar(
                    "pre_grados",
                    profesorActual?.pre_grados || []
                  )
                }
              />

              <ChipSection
                label="Pos-Grados"
                items={profesorActual?.pos_grados}
                getLabel={(posgrado) =>
                  `${posgrado.tipo_pos_grado} ${posgrado.nombre_pos_grado}`
                }
                color="success"
                onEdit={() =>
                  handleOpenModalEditar(
                    "pos_grados",
                    profesorActual?.pos_grados || []
                  )
                }
              />
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6" color="primary" fontWeight="bold">
                Información Profesional
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <EditableInfoRow
                label="Categoría"
                value={profesorActual?.categoria}
                onEdit={() =>
                  handleOpenModalEditar("categoria", profesorActual.categoria)
                }
              />
              <EditableInfoRow
                label="Dedicación"
                value={profesorActual?.dedicacion}
                onEdit={() =>
                  handleOpenModalEditar("dedicacion", profesorActual.dedicacion)
                }
              />
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6" color="primary" fontWeight="bold">
                Disponibilidad
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <List dense>
                {profesor.disponibilidad &&
                profesor.disponibilidad.length > 0 ? (
                  profesor.disponibilidad.map((dis, index) => (
                    <ListItem key={dis.id_disponibilidad || index}>
                      <Typography variant="body2">
                        {dis.dia_semana}: {dis.hora_inicio} - {dis.hora_fin}
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
        </>
      );
    } else {
      return (
        <>
          <Grid container size={4}>
            <Grid size={12}>
              <Typography variant="h6" color="primary" fontWeight="bold">
                Información Personal
              </Typography>
              <InfoRow label="Cédula" value={profesorActual?.cedula} />
              <InfoRow label="Género" value={profesorActual?.genero} />
              <InfoRow
                label="Fecha Nac."
                value={
                  profesor?.fecha_nacimiento
                    ? dayjs(profesor.fecha_nacimiento).format("DD/MM/YYYY")
                    : "No especificado"
                }
              />
              <EditableInfoRow
                label="Email"
                value={profesorActual?.email}
                onEdit={() =>
                  handleOpenModalEditar("email", profesorActual.email)
                }
              />
            </Grid>
            <Grid size={12} spacing={1}>
              <Typography variant="h6" color="primary" fontWeight="bold">
                Información Profesional
              </Typography>
              <EditableInfoRow
                label="Categoría"
                value={profesorActual?.categoria}
                onEdit={() =>
                  handleOpenModalEditar("categoria", profesorActual.categoria)
                }
              />
              <EditableInfoRow
                label="Dedicación"
                value={profesorActual?.dedicacion}
                onEdit={() =>
                  handleOpenModalEditar("dedicacion", profesorActual.dedicacion)
                }
              />
            </Grid>
          </Grid>
          <Grid size={5}>
            <Typography variant="h6" color="primary" fontWeight="bold">
              Información Educativa
            </Typography>
            <ChipSection
              label="Áreas"
              items={profesorActual?.areas_de_conocimiento}
              getLabel={(area) => area.nombre_area_conocimiento}
              color="primary"
              onEdit={() =>
                handleOpenModalEditar(
                  "areas_de_conocimiento",
                  profesorActual?.areas_de_conocimiento || []
                )
              }
            />

            <ChipSection
              label="Pre-Grados"
              items={profesorActual?.pre_grados}
              getLabel={(pregrado) =>
                `${pregrado.tipo_pre_grado} ${pregrado.nombre_pre_grado}`
              }
              color="secondary"
              onEdit={() =>
                handleOpenModalEditar(
                  "pre_grados",
                  profesorActual?.pre_grados || []
                )
              }
            />

            <ChipSection
              label="Pos-Grados"
              items={profesorActual?.pos_grados}
              getLabel={(posgrado) =>
                `${posgrado.tipo_pos_grado} ${posgrado.nombre_pos_grado}`
              }
              color="success"
              onEdit={() =>
                handleOpenModalEditar(
                  "pos_grados",
                  profesorActual?.pos_grados || []
                )
              }
            />
          </Grid>

          <Grid size={3}>
            <Typography variant="h6" color="primary" fontWeight="bold">
              Disponibilidad
            </Typography>
            <Typography variant="body2">
              horas disponibles:
              {profesor.horas_disponibles?.hours
                ? `${profesor.horas_disponibles.hours}h`
                : null}{" "}
              {profesor.horas_disponibles?.minutes
                ? `${profesor.horas_disponibles.minutes}min`
                : null}
            </Typography>

            <List dense>
              {profesor.disponibilidad && profesor.disponibilidad.length > 0 ? (
                profesor.disponibilidad.map((dis, index) => (
                  <ListItem key={dis.id_disponibilidad || index}>
                    <Typography variant="body2">
                      {dis.dia_semana}: {dis.hora_inicio} - {dis.hora_fin}
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
          </Grid>
        </>
      );
    }
  };

  return (
    <Card elevation={3}>
      <Grid container spacing={2}>
        <Grid
          sx={{
            position: "relative",
            width: "100%",
            height: { xs: "300px", sm: "300px", md: "300px", lg: "auto" },
            overflow: "hidden",
          }}
          size={{ sm: 12, lg: 3 }}
        >
          <Avatar
            variant="square"
            src={avatarUrl || undefined}
            alt={`${profesorActual?.nombres} ${profesorActual?.apellidos}`}
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

          {/* Overlay gradiente */}
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

          {/* Botones de acción */}
          <Tooltip title="Editar Imagen" arrow>
            <IconButton
              size="small"
              sx={{
                position: "absolute",
                left: 15,
                top: 15,
                color: "white",
                backgroundColor: "rgba(0,0,0,0.3)",
                "&:hover": { backgroundColor: "rgba(163, 163, 163, 0.3)" },
              }}
            >
              <EditIcon />
            </IconButton>
          </Tooltip>

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
                "&:hover": { backgroundColor: "rgba(163, 163, 163, 0.3)" },
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
            {profesorActual?.nombres?.split(" ")[0] || "No"}{" "}
            {profesorActual?.apellidos?.split(" ")[0] || "Especificado"}
          </Typography>
        </Grid>

        <Grid
          size={{ sm: 12, lg: 9 }}
          sx={{
            padding: "20px",
            display: "flex",
            flexDirection: { sm: "column", md: "row" },
            gap: 2,
          }}
        >
          {render()}
        </Grid>
      </Grid>

      {/* Modales */}
      <ModalEditarCampoProfesor
        open={openModalEditar}
        onClose={() => setOpenModalEditar(false)}
        campo={campoEditando}
        valorActual={valorEditando}
        onGuardar={handleGuardarCampo}
      />

      <ModalDestitucion
        profesor={profesorActual}
        open={openModalEliminar}
        onSubmit={onSubmitDestitucion}
        isLoading={isLoading}
        onClose={() => setOpenModalEliminar(false)}
        onEliminado={handleProfesorEliminado}
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
            navigate(`/horarios/profesores/${profesor.id_profesor}`)
          }
        >
          <ListItemIcon>
            <ClassIcon fontSize="small" />
          </ListItemIcon>
          Horario Profesor
        </MenuItem>
        <MenuItem
          onClick={() =>
            navigate(
              `/academico/profesores/disponibilidad/${profesor.id_profesor}`
            )
          }
        >
          <ListItemIcon>
            <ScheduleIcon fontSize="small" />
          </ListItemIcon>
          Disponibilidad Profesor
        </MenuItem>
        <MenuItem onClick={() => setOpenModalEliminar(true)}>
          <ListItemIcon>
            <PersonRemoveIcon fontSize="small" />
          </ListItemIcon>
          Eliminar Profesor
        </MenuItem>
        {profesorEditado && (
          <MenuItem onClick={() => handleGuardarCambiosServidor(true)}>
            <ListItemIcon>
              <PersonRemoveIcon fontSize="small" />
            </ListItemIcon>
            Guardar Cambios
          </MenuItem>
        )}
      </Menu>
    </Card>
  );
}

// Componentes auxiliares para mejor organización
const InfoRow = ({ label, value }) => (
  <Typography component={"p"} variant="body2">
    <strong>{label}:</strong> {value || "No especificado"}
  </Typography>
);

const EditableInfoRow = ({ label, value, onEdit }) => (
  <Box
    sx={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
    }}
  >
    <Typography component={"p"} variant="body2">
      <strong>{label}:</strong> {value || "No especificado"}
    </Typography>
    <Tooltip title={`Editar ${label.toLowerCase()}`} arrow>
      <IconButton size="small" onClick={onEdit}>
        <EditIcon fontSize="small" />
      </IconButton>
    </Tooltip>
  </Box>
);

const ChipSection = ({ label, items, getLabel, color, onEdit }) => (
  <Box sx={{ display: "flex", alignItems: "flex-start", mb: 2 }}>
    <Typography
      variant="body2"
      sx={{ minWidth: 100, fontWeight: "bold", mt: 0.5 }}
    >
      {label}:
    </Typography>
    <Box
      sx={{
        flex: 1,
        display: "flex",
        flexWrap: "wrap",
        gap: 0.5,
        alignItems: "center",
      }}
    >
      {items && items.length > 0 ? (
        <>
          {items.map((item, index) => (
            <CustomChip
              key={item.id || index}
              label={getLabel(item)}
              color={color}
              variant="outlined"
              size="small"
            />
          ))}
          <Tooltip title={`Editar ${label.toLowerCase()}`} arrow>
            <IconButton size="small" onClick={onEdit}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </>
      ) : (
        <>
          <Typography variant="body2" color="text.secondary">
            No especificado
          </Typography>
          <Tooltip title={`Editar ${label.toLowerCase()}`} arrow>
            <IconButton size="small" onClick={onEdit}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </>
      )}
    </Box>
  </Box>
);
