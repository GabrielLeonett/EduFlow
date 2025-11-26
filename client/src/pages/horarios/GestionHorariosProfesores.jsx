import { useEffect, useState } from "react";
import HorarioProfesor from "../../components/HorarioProfesor/HorarioProfesor";
import ResponsiveAppBar from "../../components/navbar";
import { Box, Typography, Grid, Container, Alert } from "@mui/material";
import { Schedule as ScheduleIcon } from "@mui/icons-material";
import useApi from "../../hook/useApi";
import { useParams } from "react-router-dom";

export default function GestionHorariosProfesores() {
  const [horario, setHorario] = useState(null);
  const { id_profesor } = useParams();
  const axios = useApi();
  // Efecto para cargar horario cuando se selecciona una sección
  useEffect(() => {
    const fetchHorarios = async () => {
      if (!id_profesor) {
        setHorario(null);
        return;
      }

      try {
        const response = await axios.get(`/horarios/profesor/${id_profesor}`);
        console.log("📊 Respuesta del horario:", response);
        setHorario(response);
      } catch (e) {
        console.error("Error al consultar el horario: ", e);
        setHorario(null);
      }
    };

    fetchHorarios();
  }, [id_profesor, axios]);

  return (
    <>
      <ResponsiveAppBar backgroundColor={true} />
      <Container maxWidth="xl" sx={{ mt: 18, py: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h3"
            component="h1"
            gutterBottom
            sx={{
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: 2,
            }}
          >
            <ScheduleIcon fontSize="large" />
            Planificación de Horarios Académicos
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Visualiza el horario académico por sección
          </Typography>
        </Box>

        {/* Layout principal con sidebar de filtros y contenido */}
        <Grid container spacing={4}>
          {/* Contenido principal */}
          <Grid item xs={12} md={8} lg={9}>
            {/* HorarioAula */}
            {horario ? (
              <HorarioProfesor
                profesor={horario.profesor}
                turno={horario.turno}
                horario={horario.horario}
                Custom={true}
              />
            ) : (
              <Box
                sx={{
                  textAlign: "center",
                  py: 8,
                  border: "2px dashed",
                  borderColor: "divider",
                  borderRadius: 2,
                  bgcolor: "background.paper",
                }}
              >
                <ScheduleIcon
                  sx={{ fontSize: 64, color: "text.secondary", mb: 2 }}
                />
                <Typography variant="h5" gutterBottom color="text.secondary">
                  No hay horario disponible
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  No se encontró horario para la sección seleccionada.
                </Typography>
              </Box>
            )}
          </Grid>
        </Grid>
      </Container>
    </>
  );
}
