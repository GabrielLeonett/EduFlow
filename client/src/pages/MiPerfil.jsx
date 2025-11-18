import { Box, Typography, Avatar, Chip, Grid, Card, CardContent, Container, Divider, Paper, useTheme, Fade } from "@mui/material";
import CustomButton from "../components/customButton";
import { useAuth } from "../hook/useAuth";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/navbar";
import { motion, AnimatePresence } from "framer-motion";
import { Person, Schedule, Notifications, Assignment, AdminPanelSettings, Dashboard, BarChart, Groups, School, SupervisorAccount, ManageAccounts, TrendingUp, Password } from "@mui/icons-material";
import Footer from "../components/footer";

const Miuser = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();

  // Todos los roles usan color primary (azul)
  const getRoleColor = (role) => "primary";

  // Función para obtener icono según el rol
  const getRoleIcon = (role) => {
    const roleIcons = {
      Profesor: <School />,
      Coordinador: <SupervisorAccount />,
      "Director General de Gestión Curricular": <ManageAccounts />,
      Vicerrector: <TrendingUp />,
      SuperAdmin: <AdminPanelSettings />,
    };
    return roleIcons[role] || <Person />;
  };

  const ActionButton = ({ label, onClick, icon }) => (
    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
      <CustomButton variant="outlined" onClick={onClick} startIcon={icon}>
        {label}
      </CustomButton>
    </motion.div>
  );

  const roleSections = {
    Profesor: {
      actions: [
        { label: "Ver Horario", path: "/horarios", icon: <Schedule /> },
        {
          label: "Datos Personales",
          path: "/datos-personales",
          icon: <Person />,
        }
      ],
    },
    Coordinador: {
      actions: [
        {
          label: "Gestionar Horarios",
          path: "/horarios",
          icon: <Schedule />,
        },
        {
          label: "Gestionar Profesores",
          path: "/eliminar-profesores",
          icon: <Person />,
        },
        {
          label: "Disponibilidad",
          path: "/disponibilidad",
          icon: <Schedule />,
        },
      ],
    },
    "Director General de Gestión Curricular": {
      actions: [

        {
          label: "Gestionar Profesores",
          path: "/profesores",
          icon: <Groups />,
        }
      ],
    },
    Vicerrector: {
      actions: [
        { label: "Ver Indicadores", path: "/indicadores", icon: <BarChart /> },
        {
          label: "Gestionar Profesores",
          path: "/academico/profesores",
          icon: <Groups />,
        },
      ],
    },
    SuperAdmin: {
      actions: [
        {
          label: "Asignar Administradores",
          path: "/administradores/crear",
          icon: <AdminPanelSettings />,
        },
        {
          label: "Reportes Globales",
          path: "/reportes-globales",
          icon: <BarChart />,
        },
        {
          label: "Panel de Administracion",
          path: "/administracion",
          icon: <Dashboard />
        },
        {
          label: "Cambiar Contraseña",
          path: "/cambiar-contraseña",
          icon: <Password />
        },
      ],
    },
  };

  if (!user) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="60vh"
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Typography variant="h6" color="textSecondary">
            Cargando perfil...
          </Typography>
        </motion.div>
      </Box>
    );
  }

  return (
    <>
      <Navbar backgroundColor />
      <Container maxWidth="xl" sx={{ py: 4, mt: 10 }}>
        {/* Header del perfil - diseño minimalista */}
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
              backgroundColor: "white",
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 2,
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            }}
          >
            <Box display="flex" alignItems="center" gap={4}>
              <Avatar
                sx={{
                  width: 80,
                  height: 80,
                  bgcolor: theme.palette.primary.main,
                  color: "white",
                  fontSize: "1.8rem",
                  fontWeight: "bold",
                }}
              >
                {user.nombres?.[0]}
                {user.apellidos?.[0]}
              </Avatar>

              <Box flex={1}>
                <Typography variant="h4" fontWeight="600" gutterBottom>
                  {user.nombres} {user.apellidos}
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {user.correo}
                </Typography>
                <Box display="flex" gap={1} flexWrap="wrap">
                  <AnimatePresence>
                    {user.roles?.map((role, index) => (
                      <motion.div
                        key={role.trim()}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Chip
                          label={role.trim()}
                          variant="filled"
                          color="primary"
                          size="small"
                          sx={{
                            fontWeight: "500",
                          }}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </Box>
              </Box>
            </Box>
          </Paper>
        </motion.div>

        <Grid container spacing={4}>
          {/* Columna izquierda - Acciones por rol */}
          <Grid item xs={12} md={8}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card
                elevation={0}
                sx={{
                  borderRadius: 2,
                  backgroundColor: "white",
                  border: `1px solid ${theme.palette.divider}`,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                }}
              >
                <CardContent sx={{ p: 4 }}>
                  <Typography
                    variant="h5"
                    fontWeight="600"
                    gutterBottom
                    sx={{ mb: 3 }}
                  >
                    Acciones Disponibles
                  </Typography>
                  <Divider sx={{ mb: 4 }} />

                  <Box
                    sx={{ display: "flex", flexDirection: "column", gap: 4 }}
                  >
                    {user.roles?.map((role) => {
                      const section = roleSections[role.trim()];
                      if (!section) return null;

                      return (
                        <Fade in timeout={800} key={role}>
                          <Box>
                            <Typography
                              variant="h6"
                              color="primary"
                              gutterBottom
                              sx={{
                                fontWeight: 600,
                                mb: 2,
                              }}
                            >
                              {role.trim()}
                            </Typography>

                            {/* Contenedor grid para las acciones */}
                            <Grid container spacing={2}>
                              {section.actions.map((action) => (
                                <Grid item xs={12} sm={6} key={action.path}>
                                  <ActionButton
                                    label={action.label}
                                    onClick={() => navigate(action.path)}
                                    icon={action.icon}
                                  />
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
          <Grid item xs={12} md={4}>
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
                    borderRadius: 2,
                    backgroundColor: "white",
                    border: `1px solid ${theme.palette.divider}`,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" fontWeight="600" gutterBottom>
                      Información del Sistema
                    </Typography>
                    <Divider sx={{ mb: 3 }} />

                    <Box display="flex" flexDirection="column" gap={2}>
                      <Box>
                        <Typography variant="body2" gutterBottom>
                          Último acceso
                        </Typography>
                        <Typography variant="body1" fontWeight="500">
                          {new Date().toLocaleDateString("es-ES")}
                        </Typography>
                      </Box>

                      <Box>
                        <Typography variant="body2" gutterBottom>
                          Estado de la cuenta
                        </Typography>
                        <Chip
                          label="Activa"
                          color="success"
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </motion.div>
            </Box>
          </Grid>
        </Grid>
      </Container>
      {/* Footer */}
      <Footer
      />
    </>
  );
};

export default Miuser;
