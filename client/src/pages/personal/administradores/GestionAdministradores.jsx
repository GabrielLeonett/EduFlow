import { useCallback, useEffect, useState } from "react";
import {
  Box,
  Grid,
  Typography,
  MenuItem,
  InputAdornment,
  Tooltip,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import Navbar from "../../../components/navbar";
import CustomLabel from "../../../components/customLabel";
import CardAdmin from "../../../components/CardAdmin";
import { useNavigate } from "react-router-dom";
import CustomButton from "../../../components/customButton";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import useApi from "../../../hook/useApi";
import useSweetAlert from "../../../hook/useSweetAlert";
import { Route as RouteIcon } from "@mui/icons-material";
import { useTour } from "../../../hook/useTour";

export default function GestionAdministradores() {
  const axios = useApi();
  const navigate = useNavigate();
  const alert = useSweetAlert();
  const [usuarios, setUsuarios] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [filtroRol, setFiltroRol] = useState("todos");

  const pedirUsuario = useCallback(async () => {
    try {
      const { administradores } = await axios.get("/admins");
      console.log(administradores);
      setUsuarios(administradores || []);
    } catch (error) {
      console.log("❌ Error completo:", error);
      if (error.error?.totalErrors > 0) {
        error.error.validationErrors.forEach((error_validacion) => {
          alert.toast(error_validacion.field, error_validacion.message);
        });
      } else {
        alert.error(error.title, error.message);
      }
    }
  }, [axios, alert]);

  useEffect(() => {
    pedirUsuario();
  }, []);

  // Filtrado
  const usuariosFiltrados = usuarios.filter((u) => {
    const matchBusqueda =
      u.nombres.toLowerCase().includes(busqueda.toLowerCase()) ||
      u.correo.toLowerCase().includes(busqueda.toLowerCase());
    const matchRol = filtroRol === "todos" ? true : u.rol === filtroRol;
    return matchBusqueda && matchRol;
  });

  // 🔹 Definición del tour con Intro.js
  const { startTour, resetTour } = useTour(
    [
      {
        intro:
          "👋 Bienvenido al módulo de gestión de administradores. Te mostraré dónde está todo.",
      },
      {
        element: "#admin-container",
        intro: "Aquí verás la lista de todos los administradores registrados.",
        position: "right",
      },
      {
        element: "#admin-card-ejemplo",
        intro:
          "Cada tarjeta muestra la información de un administrador y sus permisos.",
        position: "bottom",
      },
      {
        element: "#btn-registrar-admin",
        intro: "Desde este botón puedes registrar un nuevo administrador.",
        position: "left",
      },
      {
        element: "#btn-reiniciar-tour",
        intro:
          "Puedes repetir el tutorial en cualquier momento desde este botón.",
        position: "top",
      },
    ],
    "tourGestionAdministradores" // clave única para este módulo
  );

  // ✅ Ejecutar el tour solo cuando ya cargaron los administradores
  useEffect(() => {
    if (usuarios.length > 0) {
      startTour();
    }
  }, [usuarios]);

  return (
    <>
      <Navbar backgroundColor={true} />
      <Box mt={12} p={3}>
        <Typography variant="h3" fontWeight={600} mb={1}>
          Gestión de Administradores
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>
          Asigna, edita o elimina privilegios administrativos de los usuarios
          del sistema.
        </Typography>

        {/* Filtros */}
        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          flexWrap="wrap"
          gap={2}
          mb={3}
        >
          <CustomLabel
            variant="outlined"
            size="small"
            placeholder="Buscar usuario..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }}
          />
          <CustomLabel
            select
            size="small"
            value={filtroRol}
            onChange={(e) => setFiltroRol(e.target.value)}
          >
            <MenuItem value="todos">Todos</MenuItem>
            <MenuItem value="usuario">Usuarios</MenuItem>
            <MenuItem value="admin">Administradores</MenuItem>
          </CustomLabel>
        </Box>

        {/* Tarjetas de usuario */}
        <Grid container spacing={3} id="admin-container">
          {usuariosFiltrados.map((usuario, index) => (
            <Grid
              size={{ xs: 12, sm: 6, md: 4 }}
              key={usuario.id}
              {...(index === 0 ? { id: "admin-card-ejemplo" } : {})}
            >
              <CardAdmin
                usuario={usuario}
              />
            </Grid>
          ))}
        </Grid>
      </Box>
      <Tooltip title={"Registrar Administrador"} placement="left-start">
        <CustomButton
          id="btn-registrar-admin"
          onClick={() => {
            navigate("/administradores/crear");
          }}
          sx={{
            position: "fixed",
            bottom: 78,
            right: 24,
            minWidth: "auto",
            width: 48,
            height: 48,
            borderRadius: "50%",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          aria-label={"Registrar Administrador"}
        >
          <PersonAddIcon />
        </CustomButton>
      </Tooltip>
      <Tooltip title={"Tutorial"} placement="left-start">
        <CustomButton
          id="btn-reiniciar-tour"
          variant="contained"
          onClick={resetTour}
          sx={{
            position: "fixed",
            bottom: 128,
            right: 24,
            minWidth: "auto",
            width: 48,
            height: 48,
            borderRadius: "50%",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          aria-label={"Registrar Profesor"}
        >
          <RouteIcon />
        </CustomButton>
      </Tooltip>
    </>
  );
}