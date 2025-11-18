import { useState, useEffect, useCallback } from "react";
import {
  Button,
  Typography,
  Paper,
  Box,
  Table,
  TableBody,
  TableCell,
  TableRow,
  TableHead,
  useTheme,
  Chip,
  Grid,
  Card,
  CardContent,
  useMediaQuery,
} from "@mui/material";
import ResponsiveAppBar from "../../../components/navbar";
import useApi from "../../../hook/useApi";
import useSweetAlert from "../../../hook/useSweetAlert";
import { useNavigate, useParams } from "react-router-dom";
import { UTILS } from "../../../utils/UTILS";

// Constantes
const DAYS = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sábado"];

export default function DisponibilidadProfesor() {
  // Hooks
  const axios = useApi();
  const alert = useSweetAlert();
  const theme = useTheme();
  const { id_profesor } = useParams();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));

  // Estados
  const [selectedBlocks, setSelectedBlocks] = useState({});
  const [loading, setLoading] = useState(false);
  const timeBlocks = UTILS.initialHours;

  // Efecto para validar id_profesor
  useEffect(() => {
    if (!id_profesor) {
      alert.error("Lo sentimos", "No se encontró id_profesor", {
        didClose: () => {
          navigate(-1);
        },
      });
    }
  }, [id_profesor, alert, navigate]);

  // Función para cargar la disponibilidad existente
  const cargarDisponibilidadExistente = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `/profesores/${id_profesor}/disponibilidad`
      );

      console.log("Respuesta completa:", response);
      const disponibilidades = response.disponibilidades || response.data?.disponibilidades || [];

      // Inicializar selectedBlocks con arrays vacíos para cada día
      const nuevosBloques = {};
      DAYS.forEach((day) => {
        nuevosBloques[day] = [];
      });

      // Procesar cada disponibilidad
      disponibilidades.forEach((disp) => {
        console.log("Procesando disponibilidad:", disp);

        try {
          const [horaInicio, minutosInicio] = disp.hora_inicio
            .split(":")
            .map(Number);

          const [horaFin, minutosFin] = disp.hora_fin.split(":").map(Number);

          console.log("Hora inicio:", horaInicio, minutosInicio);
          console.log("Hora fin:", horaFin, minutosFin);

          const inicioTotalMinutos = UTILS.horasMinutos(
            horaInicio,
            minutosInicio
          );
          const finTotalMinutos = UTILS.horasMinutos(horaFin, minutosFin);

          const horasMilitarInicio = UTILS.calcularHorasHHMM(inicioTotalMinutos);
          const horasMilitarFin = UTILS.calcularHorasHHMM(finTotalMinutos);

          console.log("Total minutos - Inicio:", horasMilitarInicio, "Fin:", horasMilitarFin);

          // Obtener los bloques individuales
          const bloquesDia = UTILS.RangoHorasSeguidasDisponibilidad(
            horasMilitarInicio, horasMilitarFin
          );

          console.log(
            "Bloques expandidos para",
            disp.dia_semana,
            ":",
            bloquesDia
          );

          nuevosBloques[disp.dia_semana] = [
            ...(nuevosBloques[disp.dia_semana] || []),
            ...bloquesDia,
          ];
        } catch (error) {
          console.error("Error procesando horario:", disp, error);
        }
      });
      console.log("Bloques cargados antes de setState:", nuevosBloques);

      setSelectedBlocks(nuevosBloques);
      console.log("Bloques finales cargados:", nuevosBloques);
    } catch (error) {
      console.error("Error al cargar la disponibilidad existente:", error);
      alert.error({
        icon: "error",
        title: "Error",
        text: "No se pudo cargar la disponibilidad existente del profesor",
      });

      // Inicializar con arrays vacíos en caso de error
      const bloquesVacios = {};
      DAYS.forEach((day) => {
        bloquesVacios[day] = [];
      });
      setSelectedBlocks(bloquesVacios);
    } finally {
      setLoading(false);
    }
  }, [axios, id_profesor, alert]);

  // Efecto para cargar la disponibilidad
  useEffect(() => {
    if (id_profesor) {
      cargarDisponibilidadExistente();
    }
  }, [id_profesor]);

  const toggleBlock = (day, hour) => {
    console.log(`Toggle block - Día: ${day}, Hora: ${hour}`);
    const current = selectedBlocks[day] || [];
    const updated = current.includes(hour)
      ? current.filter((h) => h !== hour)
      : [...current, hour];
    console.log(`Bloques actualizados para ${day}:`, updated);
    setSelectedBlocks({ ...selectedBlocks, [day]: updated });
  };

  // Función para agrupar bloques consecutivos en rangos
  const agruparBloquesConsecutivos = (bloques) => {
    if (!bloques || bloques.length === 0) return [];

    const bloquesOrdenados = [...bloques].sort((a, b) => {
      const [horaA] = a.split(':').map(Number);
      const [horaB] = b.split(':').map(Number);
      return horaA - horaB;
    });

    console.log("🔍 Bloques ordenados para agrupar:", bloquesOrdenados);

    const rangos = [];
    let inicio = bloquesOrdenados[0];
    let fin = bloquesOrdenados[0];

    for (let i = 1; i < bloquesOrdenados.length; i++) {
      const horaActual = bloquesOrdenados[i];
      const [horaFinNum] = fin.split(':').map(Number);
      const [horaActualNum] = horaActual.split(':').map(Number);

      // Si la hora actual es consecutiva a la final
      if (horaActualNum === horaFinNum + 1) {
        fin = horaActual;
      } else {
        // Guardar el rango actual y comenzar uno nuevo
        rangos.push({ inicio });
        inicio = horaActual;
        fin = horaActual;
      }
    }

    // Guardar el último rango
    rangos.push({ inicio });

    console.log("📊 Rangos agrupados:", rangos);
    return rangos;
  };

  // Función para formatear el resumen por días - CORREGIDA
  const getResumenPorDias = () => {
    const resumen = {};

    DAYS.forEach(day => {
      const bloquesDia = selectedBlocks[day] || [];
      if (bloquesDia.length > 0) {
        const rangos = agruparBloquesConsecutivos(bloquesDia);
        // 🔥 CORREGIDO: Asignar el array de rangos completo
        resumen[day] = rangos.map(rango => ({
          inicio: rango.inicio
        }));
      }
    });

    console.log("📋 Resumen por días:", resumen);
    return resumen;
  };

  // Función para contar total de horas seleccionadas
  const getTotalHoras = () => {
    let total = 0;
    Object.values(selectedBlocks).forEach(bloques => {
      total += bloques.length;
    });
    return total;
  };

  const guardarDisponibilidad = async () => {
    if (!id_profesor) {
      alert.error({
        icon: "error",
        title: "Error",
        text: "ID de profesor no válido",
      });
      return;
    }

    // Agrupar los bloques consecutivos en rangos continuos
    const resumen = getResumenPorDias();

    // Preparar los datos listos para enviar al backend
    const disponibilidadData = [];

    Object.entries(resumen).forEach(([dia, rangos]) => {
      const totalRangos = rangos.length;
      disponibilidadData.push({
        dia_semana: dia,
        hora_inicio: `${UTILS.formatearHoraMilitar(rangos[0].inicio)}`,  // Formato: "8", "14:00"
        hora_fin: `${UTILS.formatearHoraMilitar(rangos[totalRangos - 1].inicio)}`,  // Formato: "8", "14:00"
        disponibilidad_activa: true,
      });
    });

    // 🔍 DEBUG: Verificar datos antes de enviar
    console.log("📤 Datos a enviar al backend:", disponibilidadData);

    if (disponibilidadData.length === 0) {
      alert.error({
        icon: "warning",
        title: "Sin datos",
        text: "No hay horarios seleccionados para guardar",
      });
      return;
    }

    setLoading(true);

    disponibilidadData.map(async (item) => {
      try {
        // 🔹 Enviar todo en un solo POST agrupado por día
        const response = await axios.post(
          `/profesores/${id_profesor}/disponibilidad`, item
        );

        await alert.confirm({
          icon: "success",
          title: "¡Éxito!",
          text: `Disponibilidad guardada correctamente (${disponibilidadData.length} rangos registrados)`,
          timer: 2000,
          showConfirmButton: false,
        });

        console.log("✅ Respuesta del backend:", response);
      } catch (error) {
        console.error("❌ Error al guardar disponibilidad:", error);

        let errorMessage = "Error al guardar la disponibilidad";
        if (error.response) {
          errorMessage = error.response.data?.message || errorMessage;
          console.error("🔍 Detalles del error del backend:", error.response.data);
        }

        alert.error({
          icon: "error",
          title: "Error",
          text: errorMessage,
        });
      } finally {
        setLoading(false);
      }
    });

  };

  // Obtener resumen para mostrar en UI
  const resumen = getResumenPorDias();

  // Vista móvil simplificada
  const renderMobileView = () => (
    <Box>
      {DAYS.map(day => (
        <Card key={day} sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6" sx={{ color: theme.palette.primary.main, mb: 2 }}>
              {day}
            </Typography>
            <Grid container spacing={1}>
              {Object.keys(timeBlocks).map((hour) => (
                <Grid item xs={4} key={hour}>
                  <Chip
                    label={UTILS.formatearHora(hour)}
                    onClick={() => toggleBlock(day, hour)}
                    color={selectedBlocks[day]?.includes(hour) ? "primary" : "default"}
                    variant={selectedBlocks[day]?.includes(hour) ? "filled" : "outlined"}
                    sx={{ width: '100%' }}
                  />
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      ))}
    </Box>
  );

  // Vista desktop completa
  const renderDesktopView = () => (
    <Table
      sx={{
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 1,
        overflow: "hidden"
      }}
    >
      <TableHead>
        <TableRow sx={{ backgroundColor: theme.palette.primary.main }}>
          <TableCell sx={{ color: theme.palette.primary.contrastText, fontWeight: "bold" }}>
            Hora
          </TableCell>
          {DAYS.map((day) => (
            <TableCell
              key={day}
              sx={{
                color: theme.palette.primary.contrastText,
                fontWeight: "bold",
                textAlign: "center"
              }}
            >
              {day}
            </TableCell>
          ))}
        </TableRow>
      </TableHead>
      <TableBody>
        {Object.keys(timeBlocks).map((hour) => (
          <TableRow key={hour} sx={{ "&:nth-of-type(odd)": { backgroundColor: theme.palette.action.hover } }}>
            <TableCell sx={{ fontWeight: "bold", borderRight: `1px solid ${theme.palette.divider}` }}>
              {UTILS.formatearHora(hour)}
            </TableCell>
            {DAYS.map((day) => (
              <TableCell
                key={day}
                onClick={() => toggleBlock(day, hour)}
                sx={{
                  cursor: "pointer",
                  textAlign: "center",
                  backgroundColor: selectedBlocks[day]?.includes(hour)
                    ? theme.palette.success.main
                    : "transparent",
                  color: selectedBlocks[day]?.includes(hour)
                    ? theme.palette.success.contrastText
                    : "inherit",
                  "&:hover": {
                    backgroundColor: selectedBlocks[day]?.includes(hour)
                      ? theme.palette.success.dark
                      : theme.palette.action.hover
                  }
                }}
              >
                {selectedBlocks[day]?.includes(hour) ? "✔" : ""}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  return (
    <>
      <ResponsiveAppBar pages={[]} backgroundColor />

      <Box
        sx={{
          padding: { xs: 1, sm: 2, md: 3 },
          marginTop: "80px",
          backgroundColor: theme.palette.background.default,
          minHeight: "100vh"
        }}
      >
        <Paper
          elevation={3}
          sx={{
            padding: { xs: 2, sm: 3 },
            backgroundColor: theme.palette.background.paper,
            borderRadius: 2
          }}
        >
          <Typography
            variant="h4"
            gutterBottom
            sx={{
              color: theme.palette.primary.main,
              fontWeight: "bold",
              marginBottom: 3,
              fontSize: { xs: '1.5rem', sm: '2rem' }
            }}
          >
            Disponibilidad del Profesor
          </Typography>

          {/* Tabla o vista móvil */}
          {isMobile ? renderMobileView() : renderDesktopView()}

          {/* Resumen de disponibilidad */}
          <Card
            sx={{
              marginTop: 3,
              backgroundColor: theme.palette.background.default,
              border: `1px solid ${theme.palette.divider}`
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ color: theme.palette.text.primary, fontWeight: "bold" }}>
                  Resumen de disponibilidad:
                </Typography>
                <Chip
                  label={`${getTotalHoras()} horas totales`}
                  color="primary"
                  variant="outlined"
                />
              </Box>

              {Object.keys(resumen).length === 0 ? (
                <Typography color="textSecondary" sx={{ fontStyle: "italic" }}>
                  No hay horarios seleccionados
                </Typography>
              ) : (
                <Grid container spacing={2}>
                  {Object.entries(resumen).map(([dia, rangos]) => (
                    <Grid item xs={12} sm={6} md={4} key={dia}>
                      <Paper
                        elevation={1}
                        sx={{
                          padding: 2,
                          backgroundColor: theme.palette.background.paper
                        }}
                      >
                        <Typography
                          sx={{
                            color: theme.palette.primary.main,
                            fontWeight: "bold",
                            marginBottom: 1
                          }}
                        >
                          {dia}
                        </Typography>
                        {rangos.map((rango, index) => (
                          <Chip
                            key={index}
                            label={`${UTILS.formatearHoraMilitar(rango.inicio)}`}
                            size="small"
                            color="success"
                            variant="outlined"
                            sx={{ margin: 0.5 }}
                          />
                        ))}
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              )}
            </CardContent>
          </Card>

          {/* Botones */}
          <Box
            sx={{
              marginTop: 3,
              display: "flex",
              gap: 2,
              flexWrap: "wrap",
              justifyContent: { xs: 'center', sm: 'flex-start' }
            }}
          >
            <Button
              variant="contained"
              color="primary"
              sx={{
                borderRadius: 2,
                paddingX: 3,
                paddingY: 1,
                fontWeight: "bold",
                textTransform: "none",
                minWidth: { xs: '100%', sm: 200 }
              }}
              onClick={guardarDisponibilidad}
              disabled={loading}
            >
              {loading ? "Guardando..." : "Guardar disponibilidad"}
            </Button>

            <Button
              variant="outlined"
              color="secondary"
              sx={{
                borderRadius: 2,
                paddingX: 3,
                paddingY: 1,
                fontWeight: "bold",
                textTransform: "none",
                minWidth: { xs: '100%', sm: 200 }
              }}
              onClick={cargarDisponibilidadExistente}
              disabled={loading}
            >
              Recargar disponibilidad
            </Button>
          </Box>
        </Paper>
      </Box>
    </>
  );
}