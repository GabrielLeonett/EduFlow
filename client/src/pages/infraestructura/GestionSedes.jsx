// src/pages/ViewSede.jsx
import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Grid,
  CircularProgress,
  Tooltip,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import ResponsiveAppBar from "../../components/navbar";
import useApi from "../../hook/useApi";
import CardSede from "../../components/CardSede";
import CustomButton from "../../components/customButton";
import { useNavigate } from "react-router-dom";
import AddIcon from "@mui/icons-material/Add";
import { Route as RouteIcon } from "@mui/icons-material";
import { useTour } from "../../hook/useTour";

export default function GestionSedes() {
  const theme = useTheme();
  const axios = useApi();
  const navigate = useNavigate();
  const [sedes, setSedes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // 👉 Cargar sedes
  useEffect(() => {
    const fetchSedes = async () => {
      try {
        const response = await axios.get("/sedes");
        console.log(response.sedes);
        setSedes(response.sedes || []);
      } catch (err) {
        console.error("Error al obtener las sedes:", err);
        setError("No se pudieron cargar las sedes.");
      } finally {
        setLoading(false);
      }
    };
    fetchSedes();
  }, [axios]);

  const { startTour, resetTour } = useTour(
    [
      {
        intro: "👋 Bienvenido a Núcleos. Te mostraré dónde está todo."
      },
      {
        element: "#sede-container",
        intro: "Aquí verás todos los núcleos registrados en el sistema.",
        position: "right"
      },
      {
        element: "#sede-card-ejemplo",
        intro: "Cada tarjeta muestra la información de un núcleo, incluyendo ubicación y datos relevantes.",
        position: "bottom"
      },
      {
        element: "#btn-crear-sede",
        intro: "Haz clic aquí para registrar un nuevo núcleo.",
        position: "left"
      },
      {
        element: "#btn-reiniciar-tour",
        intro: "Puedes repetir este recorrido cuando quieras haciendo clic aquí.",
        position: "top"
      }
    ],
    "tourGestionSedes" // clave única para este módulo
  );

  // ✅ Iniciar el tour cuando ya cargaron las sedes
  useEffect(() => {
    if (!loading && sedes.length > 0) {
      startTour();
    }
  }, [loading, sedes]);

  return (
    <>
      <ResponsiveAppBar backgroundColor />

      <Box
        sx={{
          mt: 12,
          backgroundColor: theme.palette.background.default,
        }}
      >
        {/* Encabezado */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Typography
            variant="h3"
            component="h1"
            sx={{
              fontWeight: "bold",
            }}
          >
            Núcleos
          </Typography>
        </Box>

        {/* 👉 Loading */}
        {loading && (
          <Box className="flex justify-center items-center h-64">
            <CircularProgress />
          </Box>
        )}

        {/* 👉 Error */}
        {error && (
          <Typography color="error" variant="h6" align="center">
            {error}
          </Typography>
        )}

        {/* 👉 Grid de sedes */}
        {!loading && !error && (
          <Grid container spacing={4} id="sede-container">
            {sedes.length > 0 ? (
              sedes.map((sede, index) => <CardSede sede={sede} key={sede.id}
                {...(index === 0 ? { id: "sede-card-ejemplo" } : {})} />)
            ) : (
              <Typography
                variant="h6"
                align="center"
                sx={{ width: "100%", mt: 4 }}
              >
                No hay núcleos registrados todavía.
              </Typography>
            )}
          </Grid>
        )}
        <Tooltip title={"Crear Núcleo"} placement="left-start">
          <CustomButton
            id="btn-crear-sede"
            onClick={() => {
              navigate("/infraestructura/sedes/registrar");
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
            aria-label={"Crear Núcleo"}
          >
            <AddIcon />
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
      </Box>
    </>
  );
}
