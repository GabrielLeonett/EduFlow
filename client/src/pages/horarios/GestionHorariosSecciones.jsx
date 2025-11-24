import { useEffect, useState } from "react";
import HorarioSeccion from "../../components/HorarioSeccion/HorarioSeccion";
import ResponsiveAppBar from "../../components/navbar";
import { Grid, Typography, Container } from "@mui/material";
import { Schedule as ScheduleIcon } from "@mui/icons-material";
import useApi from "../../hook/useApi";
import FiltroAcordeonHorario from "../../components/FiltroAcordeonHorario";
import SkeletonHorario from "../../components/SkeletonHorarios";

export default function GestionHorariosSecciones() {
  const [horario, setHorario] = useState(null);
  const [seccion, setSeccion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false); // Nuevo estado para controlar búsquedas
  const axios = useApi();

  // Efecto para cargar horario cuando se selecciona una sección
  useEffect(() => {
    const fetchHorarios = async () => {
      if (!seccion?.id_seccion) {
        setHorario(null);
        setHasSearched(false);
        return;
      }
      
      setLoading(true);
      setHasSearched(true); // Indica que se ha realizado una búsqueda
      
      try {
        const response = await axios.get(
          `/horarios/seccion/${seccion.id_seccion}`
        );
        console.log("📊 Respuesta del horario:", response);
        setHorario(response?.data || response || null);
      } catch (e) {
        console.error("Error al consultar el horario: ", e);
        setHorario(null);
      } finally {
        setLoading(false);
      }
    };

    fetchHorarios();
  }, [seccion, axios]);

  const manejarSeleccionSeccion = (seccion) => {
    setSeccion(seccion);
  };

  // Determinar qué contenido mostrar
  const renderContent = () => {
    // Si está cargando, mostrar skeleton
    if (loading) {
      return <SkeletonHorario />;
    }

    // Si hay horario, mostrarlo
    if (horario) {
      return (
        <HorarioSeccion
          pnf={horario.pnf}
          turno={horario.turno}
          trayecto={horario.trayecto}
          seccion={{
            valor_seccion: seccion?.valor_seccion,
            id_seccion: seccion?.id_seccion,
          }}
          horario={horario.horario}
          Custom={true}
        />
      );
    }

    // Si no hay horario pero se ha realizado una búsqueda, mostrar mensaje de no disponible
    if (hasSearched && !horario) {
      return (
        <Grid
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
        </Grid>
      );
    }

    // Estado inicial (antes de seleccionar cualquier sección)
    return (
      <Grid
        sx={{
          width: "100%",
          textAlign: "center",
          px: 22,
          py: 18,
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
          Selecciona una sección
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Elige una sección del panel izquierdo para visualizar su horario.
        </Typography>
      </Grid>
    );
  };

  return (
    <>
      <ResponsiveAppBar backgroundColor={true} />
      <Container maxWidth="xl" sx={{ mt: 12 }}>
        {/* Header */}
        <Grid mb={4}>
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
            Gestión de Horarios
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Visualiza el horario académico por sección
          </Typography>
        </Grid>

        {/* Layout principal con sidebar de filtros y contenido */}
        <Grid container spacing={4} direction={{md: 'column', lg:'row'}}>
          {/* Sidebar de Filtros */}
          <Grid size={{ xs: 12, lg: 3 }}>
            <FiltroAcordeonHorario
              onSeccionSelect={manejarSeleccionSeccion}
              selectedSeccion={seccion}
            />
          </Grid>

          {/* Contenido principal */}
          <Grid size={{ xs: 12, lg: 9 }}>
            {renderContent()}
          </Grid>
        </Grid>
      </Container>
    </>
  );
}