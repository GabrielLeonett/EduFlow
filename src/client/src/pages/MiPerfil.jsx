import {
  Box,
  Typography,
  Avatar,
  Chip,
  Grid,
  Card,
  CardContent,
  Container,
  Divider,
  Paper,
  useTheme,
  Fade,
  CircularProgress,
} from "@mui/material";
import CustomButton from "../components/customButton";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/navbar";
import { motion, AnimatePresence } from "framer-motion";
import {
  Person,
  Schedule,
  AdminPanelSettings,
  Dashboard,
  BarChart,
  Groups,
  Password,
  School,
  Class,
  People,
  Settings,
  Security,
  Logout,
} from "@mui/icons-material";
import useApi from "../hook/useApi";
import { useCallback, useEffect, useState } from "react";
import useSweetAlert from "../hook/useSweetAlert";

const Miuser = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const axios = useApi();
  const alert = useSweetAlert();

  const traerPerfil = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get("/profile");
      console.log("Perfil cargado:", response);
      setProfile(response[0]);
    } catch (error) {
      console.error("❌ Error cargando perfil:", error);
      if (error.error?.totalErrors > 0) {
        error.error.validationErrors.forEach((error_validacion) => {
          alert.toast(error_validacion.field, error_validacion.message);
        });
      } else {
        alert.error(error.title, error.message);
      }
    } finally {
      setLoading(false);
    }
  }, [axios, alert]);

  useEffect(() => {
    traerPerfil();
  }, []);

  const roleSections = {
    Profesor: {
      icon: <School />,
      color: "primary",
      actions: [
        {
          label: "Ver Horario",
          path: "/horarios/profesores/:id_profesor",
          icon: <Schedule />,
          color: "primary",
        },
        {
          label: "Datos Personales",
          path: "/perfil",
          icon: <Person />,
          color: "secondary",
        },
      ],
    },
    Coordinador: {
      icon: <People />,
      color: "secondary",
      actions: [
        {
          label: "Gestionar Horarios",
          path: "/horarios/secciones",
          icon: <Schedule />,
          color: "primary",
        },
        {
          label: "Gestionar Profesores",
          path: "/academico/profesores",
          icon: <Groups />,
          color: "secondary",
        },
        {
          label: "Disponibilidad",
          path: "/academico/profesores/disponibilidad/:id_profesor",
          icon: <Schedule />,
          color: "info",
        },
      ],
    },
    "Director/a de gestión Curricular": {
      icon: <AdminPanelSettings />,
      color: "success",
      actions: [
        {
          label: "Gestionar Profesores",
          path: "/academico/profesores",
          icon: <Groups />,
          color: "primary",
        },
        {
          label: "Gestionar Aulas",
          path: "/infraestructura/sedes/:id_sede/aulas",
          icon: <Class />,
          color: "secondary",
        },
        {
          label: "Programas de Formación",
          path: "/formacion/programas",
          icon: <School />,
          color: "info",
        },
      ],
    },
    "Director/a de Gestión Permanente y Docente": {
      icon: <AdminPanelSettings />,
      color: "success",
      actions: [
        {
          label: "Gestionar Profesores",
          path: "/academico/profesores",
          icon: <Groups />,
          color: "primary",
        },
        {
          label: "Reportes Académicos",
          path: "/administracion/reportes-estadisticas",
          icon: <BarChart />,
          color: "secondary",
        },
        {
          label: "Gestión Curricular",
          path: "/curricular/unidades/registrar",
          icon: <Dashboard />,
          color: "info",
        },
      ],
    },
    "Secretari@ Vicerrect@r": {
      icon: <AdminPanelSettings />,
      color: "warning",
      actions: [
        {
          label: "Gestionar Administradores",
          path: "/administradores",
          icon: <People />,
          color: "primary",
        },
        {
          label: "Reportes Globales",
          path: "/administracion/reportes-estadisticas",
          icon: <BarChart />,
          color: "secondary",
        },
        {
          label: "Gestión de Sedes",
          path: "/infraestructura/sedes",
          icon: <School />,
          color: "info",
        },
      ],
    },
    Vicerrector: {
      icon: <AdminPanelSettings />,
      color: "warning",
      actions: [
        {
          label: "Ver Indicadores",
          path: "/administracion/reportes-estadisticas",
          icon: <BarChart />,
          color: "primary",
        },
        {
          label: "Gestionar Profesores",
          path: "/academico/profesores",
          icon: <Groups />,
          color: "secondary",
        },
        {
          label: "Panel de Administración",
          path: "/administracion",
          icon: <Dashboard />,
          color: "info",
        },
        {
          label: "Gestión de Programas",
          path: "/formacion/programas",
          icon: <School />,
          color: "success",
        },
      ],
    },
    SuperAdmin: {
      icon: <Security />,
      color: "error",
      actions: [
        {
          label: "Registrar Administradores",
          path: "/administradores/crear",
          icon: <AdminPanelSettings />,
          color: "primary",
        },
        {
          label: "Reportes Globales",
          path: "/administracion/reportes-estadisticas",
          icon: <BarChart />,
          color: "secondary",
        },
        {
          label: "Panel de Administración",
          path: "/administracion",
          icon: <Dashboard />,
          color: "info",
        },
        {
          label: "Gestión de Respaldos",
          path: "/administracion/respaldos",
          icon: <Security />,
          color: "success",
        },
      ],
    },
  };

  if (loading) {
    return (
      <>
        <Navbar backgroundColor />
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="70vh"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Box textAlign="center">
              <CircularProgress size={60} thickness={4} />
              <Typography variant="h6" color="textSecondary" sx={{ mt: 2 }}>
                Cargando perfil...
              </Typography>
            </Box>
          </motion.div>
        </Box>
      </>
    );
  }

  if (!profile) {
    return (
      <>
        <Navbar backgroundColor />
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="70vh"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Typography variant="h6" color="error">
              Error al cargar el perfil
            </Typography>
            <CustomButton
              variant="contained"
              onClick={traerPerfil}
              sx={{ mt: 2 }}
            >
              Reintentar
            </CustomButton>
          </motion.div>
        </Box>
      </>
    );
  }

  return (
    <>
      <Navbar backgroundColor />
      <Container maxWidth="xl" sx={{ py: 4, mt: 10 }}>
        {/* Header del perfil */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Paper
            elevation={0}
            sx={{
              p: 4,
              mb: 6,
              background: `linear-gradient(135deg, ${theme.palette.primary.main}10, ${theme.palette.secondary.main}10)`,
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 3,
              boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
              backdropFilter: "blur(10px)",
              position: "relative",
              overflow: "hidden",
              "&::before": {
                content: '""',
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "4px",
                background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              },
            }}
          >
            <Box display="flex" alignItems="center" gap={4} flexWrap="wrap">
              <Avatar
                sx={{
                  width: 120,
                  height: 120,
                  bgcolor: theme.palette.primary.main,
                  fontSize: "2.5rem",
                  fontWeight: "bold",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
                  border: `4px solid ${theme.palette.background.paper}`,
                  transition: "all 0.3s ease",
                  "&:hover": {
                    transform: "scale(1.05)",
                    boxShadow: "0 12px 32px rgba(0,0,0,0.3)",
                  },
                }}
              >
                {profile.nombres?.[0]?.toUpperCase()}
                {profile.apellidos?.[0]?.toUpperCase()}
              </Avatar>

              <Box flex={1} minWidth={300}>
                <Typography
                  variant="h3"
                  fontWeight="800"
                  gutterBottom
                  sx={{
                    background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                    backgroundClip: "text",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    textShadow: "0 2px 4px rgba(0,0,0,0.1)",
                  }}
                >
                  {profile.nombres} {profile.apellidos}
                </Typography>

                <Box display="flex" alignItems="center" gap={2} sx={{ mb: 2 }}>
                  <Typography
                    variant="h6"
                    color="text.secondary"
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      fontWeight: "500",
                    }}
                  >
                    📧 {profile.email}
                  </Typography>

                  <Chip
                    label={profile.activo ? "🟢 Activo" : "🔴 Inactivo"}
                    color={profile.activo ? "success" : "error"}
                    size="small"
                    variant="outlined"
                    sx={{ fontWeight: "600" }}
                  />
                </Box>

                <Box display="flex" gap={1} flexWrap="wrap" alignItems="center">
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ fontWeight: "600", mr: 1 }}
                  >
                    Roles:
                  </Typography>
                  <AnimatePresence>
                    {profile.nombre_roles?.map((role, index) => (
                      <motion.div
                        key={role}
                        initial={{ opacity: 0, scale: 0.8, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ delay: index * 0.15 }}
                      >
                        <Chip
                          label={role}
                          variant="filled"
                          color="primary"
                          size="medium"
                          sx={{
                            fontWeight: "700",
                            fontSize: "0.75rem",
                            px: 1,
                            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                            "&:hover": {
                              transform: "translateY(-2px)",
                              boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                            },
                            transition: "all 0.2s ease",
                          }}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </Box>

                {/* Información adicional */}
                <Box display="flex" gap={4} mt={3} flexWrap="wrap">
                  <Box>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      display="block"
                    >
                      📅 Último acceso
                    </Typography>
                    <Typography variant="body2" fontWeight="600">
                      {profile.last_login
                        ? new Date(profile.last_login).toLocaleDateString(
                            "es-ES",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )
                        : "Hoy"}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      display="block"
                    >
                      🆔 Cédula
                    </Typography>
                    <Typography variant="body2" fontWeight="600">
                      {profile.cedula}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      display="block"
                    >
                      📱 Teléfono
                    </Typography>
                    <Typography variant="body2" fontWeight="600">
                      {profile.telefono_movil || "No disponible"}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Paper>
        </motion.div>

        <Grid container spacing={4}>
          {/* Columna izquierda - Acciones por rol */}
          <Grid size={{ xs: 12, lg: 8 }}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card
                elevation={0}
                sx={{
                  borderRadius: 3,
                  border: `1px solid ${theme.palette.divider}`,
                  boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                }}
              >
                <CardContent sx={{ p: 4 }}>
                  <Typography
                    variant="h5"
                    fontWeight="700"
                    gutterBottom
                    sx={{
                      mb: 3,
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    🚀 Acciones Disponibles
                  </Typography>
                  <Divider sx={{ mb: 4 }} />

                  <Box
                    sx={{ display: "flex", flexDirection: "column", gap: 4 }}
                  >
                    {profile.nombre_roles?.map((roleName) => {
                      const section = roleSections[roleName];
                      if (!section) return null;

                      return (
                        <Fade in timeout={800} key={roleName}>
                          <Box>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                                mb: 2,
                              }}
                            >
                              <Box sx={{ color: `${section.color}.main` }}>
                                {section.icon}
                              </Box>
                              <Typography
                                variant="h6"
                                color={`${section.color}.main`}
                                sx={{ fontWeight: 600 }}
                              >
                                {roleName}
                              </Typography>
                            </Box>

                            <Grid container spacing={2}>
                              {section.actions.map((action) => (
                                <Grid xs={12} sm={6} key={action.path}>
                                  <motion.div
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                  >
                                    <CustomButton
                                      variant="outlined"
                                      onClick={() => navigate(action.path)}
                                      startIcon={action.icon}
                                      color={action.color}
                                      fullWidth
                                      sx={{
                                        justifyContent: "flex-start",
                                        py: 1.5,
                                        px: 2,
                                        textAlign: "left",
                                      }}
                                    >
                                      {action.label}
                                    </CustomButton>
                                  </motion.div>
                                </Grid>
                              ))}
                            </Grid>
                            <Divider sx={{ mt: 3, mb: 2 }} />
                          </Box>
                        </Fade>
                      );
                    })}
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          {/* Columna derecha - Información del sistema */}
          <Grid xs={12} lg={4}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {/* Información del sistema */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <Card
                  elevation={0}
                  sx={{
                    borderRadius: 3,
                    border: `1px solid ${theme.palette.divider}`,
                    boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Typography
                      variant="h6"
                      fontWeight="700"
                      gutterBottom
                      sx={{ display: "flex", alignItems: "center", gap: 1 }}
                    >
                      📊 Información del Sistema
                    </Typography>
                    <Divider sx={{ mb: 3 }} />

                    <Box display="flex" flexDirection="column" gap={3}>
                      <Box>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          gutterBottom
                        >
                          Último acceso
                        </Typography>
                        <Typography variant="body1" fontWeight="600">
                          {profile.last_login
                            ? new Date(profile.last_login).toLocaleDateString(
                                "es-ES",
                                {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )
                            : "Hoy"}
                        </Typography>
                      </Box>

                      <Box>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          gutterBottom
                        >
                          Estado de la cuenta
                        </Typography>
                        <Chip
                          label={profile.activo ? "Activa" : "Inactiva"}
                          color={profile.activo ? "success" : "error"}
                          size="small"
                          variant="filled"
                        />
                      </Box>

                      <Box>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          gutterBottom
                        >
                          Fecha de registro
                        </Typography>
                        <Typography variant="body1" fontWeight="600">
                          {profile.created_at
                            ? new Date(profile.created_at).toLocaleDateString(
                                "es-ES"
                              )
                            : "No disponible"}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Acciones rápidas */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
              >
                <Card
                  elevation={0}
                  sx={{
                    borderRadius: 3,
                    border: `1px solid ${theme.palette.divider}`,
                    boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Typography
                      variant="h6"
                      fontWeight="700"
                      gutterBottom
                      sx={{ display: "flex", alignItems: "center", gap: 1 }}
                    >
                      ⚡ Acciones Rápidas
                    </Typography>
                    <Divider sx={{ mb: 3 }} />

                    <Box display="flex" flexDirection="column" gap={2}>
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <CustomButton
                          variant="outlined"
                          onClick={() => navigate("/cambiar-contraseña")}
                          startIcon={<Password />}
                          color="info"
                          fullWidth
                          sx={{ justifyContent: "flex-start", py: 1.5 }}
                        >
                          Cambiar Contraseña
                        </CustomButton>
                      </motion.div>

                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <CustomButton
                          variant="outlined"
                          onClick={() => navigate("/logout")}
                          startIcon={<Logout />}
                          color="error"
                          fullWidth
                          sx={{ justifyContent: "flex-start", py: 1.5 }}
                        >
                          Cerrar Sesión
                        </CustomButton>
                      </motion.div>
                    </Box>
                  </CardContent>
                </Card>
              </motion.div>
            </Box>
          </Grid>
        </Grid>
      </Container>
    </>
  );
};

export default Miuser;
