import {
  Typography,
  Container,
  Stack,
  Box,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Grid,
  Divider,
  useTheme,
} from "@mui/material";
import ResponsiveAppBar from "../../components/navbar";
import HeatmapCell from "../../components/HeatmapCell";
import { useCallback, useEffect, useState } from "react";
import useApi from "../../hook/useApi";
import useSweetAlert from "../../hook/useSweetAlert";
import { UTILS } from "../../utils/utils.js";
import { interpolateReds } from "d3-scale-chromatic";
import { PieChart, pieArcLabelClasses } from "@mui/x-charts/PieChart";
import { Gauge } from "@mui/x-charts/Gauge";
import { ArrowUpward } from "@mui/icons-material";

// Componente para el centro del PieChart
const PieCenterLabel = ({ children }) => {
  return (
    <text
      x="50%"
      y="50%"
      textAnchor="middle"
      dominantBaseline="middle"
      style={{
        fontSize: "1.2rem",
        fontWeight: "bold",
        fill: "currentColor",
      }}
    >
      {children}
    </text>
  );
};

export default function ReportesEstadisticas() {
  const theme = useTheme();
  const axios = useApi();
  const alert = useSweetAlert();
  const [mapaCalorData, setMapaCalorData] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Configuración de radios para el PieChart
  const innerRadius = 60;
  const middleRadius = 100;

  // Crear matriz de datos para la tabla
  const crearMatrizDatos = (datosBackend) => {
    if (!datosBackend || !Array.isArray(datosBackend)) {
      // Crear matriz vacía
      return UTILS.horariosAcademicos.map((hora) => {
        const fila = { hora };
        UTILS.diasSemana.forEach((dia) => {
          fila[dia] = 0;
        });
        return fila;
      });
    }

    // Crear matriz con datos reales
    const matriz = UTILS.horariosAcademicos.map((hora) => {
      const fila = { hora };
      UTILS.diasSemana.forEach((dia) => {
        const dato = datosBackend.find(
          (item) => item.dia === dia && item.hora_inicio === hora
        );
        fila[dia] = dato;
      });
      return fila;
    });
    return matriz;
  };

  const fetchMapaCalor = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get("/system/mapa-calor/horarios");
      const matrizDatos = crearMatrizDatos(response.datos);
      setMapaCalorData(matrizDatos);
    } catch (error) {
      console.error("Error al traer el mapa de calor:", error);
      setError(
        error.response?.data?.message || "Error al cargar el mapa de calor"
      );
      alert.error("Error al cargar los datos del mapa de calor");
    } finally {
      setLoading(false);
    }
  }, [axios, alert]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await axios.get("/system/metricas/academicas");
      setStats(response);
    } catch (error) {
      console.error("Error al traer las estadísticas:", error);
      // No setear error aquí para no interrumpir la carga del mapa de calor
      console.log("No se pudieron cargar las estadísticas académicas");
    }
  }, [axios]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await Promise.all([fetchMapaCalor(), fetchStats()]);
      setLoading(false);
    };
    fetchData();
  }, []);

  // Función para procesar los datos de secciones
  const procesarDatosSecciones = (seccionesTotales) => {
    if (!seccionesTotales || !Array.isArray(seccionesTotales)) {
      return {
        datosAnilloInterno: [],
        datosAnilloExterno: [],
        totalSecciones: 0,
      };
    }

    // 1. Agrupar por PNF para el anillo interno
    const seccionesPorPNF = seccionesTotales.reduce((acc, item) => {
      if (!acc[item.nombre_pnf]) {
        acc[item.nombre_pnf] = 0;
      }
      acc[item.nombre_pnf] += item.total_secciones;
      return acc;
    }, {});

    // 2. Convertir a array para el PieChart
    const datosAnilloInterno = Object.entries(seccionesPorPNF).map(
      ([pnf, total]) => ({
        id: pnf,
        label: pnf,
        value: total,
        percentage:
          (total /
            seccionesTotales.reduce(
              (sum, item) => sum + item.total_secciones,
              0
            )) *
          100,
      })
    );

    // 3. Preparar datos para anillo externo (trayectos)
    const datosAnilloExterno = seccionesTotales.map((item) => ({
      id: `${item.nombre_pnf} - ${item.valor_trayecto}`,
      label: `${item.valor_trayecto}`,
      value: item.total_secciones,
      pnf: item.nombre_pnf,
      percentage:
        (item.total_secciones /
          seccionesTotales.reduce(
            (sum, curr) => sum + curr.total_secciones,
            0
          )) *
        100,
    }));

    return {
      datosAnilloInterno,
      datosAnilloExterno,
      totalSecciones: seccionesTotales.reduce(
        (sum, item) => sum + item.total_secciones,
        0
      ),
    };
  };

  // Procesar los datos para el PieChart
  const { datosAnilloInterno, datosAnilloExterno, totalSecciones } =
    procesarDatosSecciones(stats.seccionesTotales || []);

  // Componente para la leyenda de colores
  const LeyendaColores = () => {
    const niveles = [
      { valor: 0, etiqueta: "0% - Libre" },
      { valor: 0.2, etiqueta: "20% - Muy Baja" },
      { valor: 0.4, etiqueta: "40% - Baja" },
      { valor: 0.6, etiqueta: "60% - Media" },
      { valor: 0.8, etiqueta: "80% - Alta" },
      { valor: 1, etiqueta: "100% - Crítica" },
    ];

    return (
      <Card sx={{ minWidth: 200, ml: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom fontWeight="bold">
            Leyenda de Ocupación
          </Typography>
          <Stack spacing={1}>
            {niveles.map((nivel, index) => (
              <Box
                key={index}
                sx={{ display: "flex", alignItems: "center", gap: 1 }}
              >
                <Box
                  sx={{
                    width: 20,
                    height: 20,
                    backgroundColor: interpolateReds(nivel.valor),
                    border: "1px solid #ccc",
                    borderRadius: 1,
                  }}
                />
                <Typography variant="body2" fontSize="0.8rem">
                  {nivel.etiqueta}
                </Typography>
              </Box>
            ))}
          </Stack>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <>
        <ResponsiveAppBar backgroundColor />
        <Container
          sx={{
            mt: 12,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "50vh",
          }}
        >
          <Stack alignItems="center" spacing={2}>
            <CircularProgress size={60} />
            <Typography variant="h6" color="text.secondary">
              Cargando reportes...
            </Typography>
          </Stack>
        </Container>
      </>
    );
  }

  if (error) {
    return (
      <>
        <ResponsiveAppBar backgroundColor />
        <Container sx={{ mt: 12 }}>
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
          <Typography variant="h6" align="center" color="text.secondary">
            No se pudieron cargar los datos del mapa de calor
          </Typography>
        </Container>
      </>
    );
  }

  return (
    <>
      <ResponsiveAppBar backgroundColor />

      <Container sx={{ mt: 12, mb: 4 }}>
        {/* Header principal */}
        <Box sx={{ textAlign: "center", mb: 4 }}>
          <Typography variant="h3" fontWeight={600} gutterBottom>
            Reportes y Estadísticas
          </Typography>
          <Typography
            variant="h5"
            color="primary.main"
            fontWeight={500}
            gutterBottom
          >
            Mapa de Calor de Ocupación Académica
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            maxWidth="800px"
            mx="auto"
          >
            Visualización de la densidad de horarios académicos por día y hora.
            Los colores representan el nivel de ocupación del sistema.
          </Typography>
        </Box>

        {/* Contenedor principal: Tabla + Leyenda */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "flex-start",
            m: 3,
          }}
        >
          {/* Tabla de mapa de calor */}
          <Box>
            <Typography variant="h6" align="center" gutterBottom sx={{ mb: 2 }}>
              Distribución Semanal de Horarios
            </Typography>

            {mapaCalorData.length > 0 ? (
              <TableContainer
                component={Paper}
                sx={{
                  maxHeight: "600px",
                  maxWidth: "fit-content",
                  overflow: "auto",
                  border: "2px solid",
                  borderColor: "divider",
                }}
              >
                <Table
                  stickyHeader
                  size="small"
                  sx={{
                    "& .MuiTableCell-root": {
                      padding: "0px !important",
                      margin: "0px !important",
                      minWidth: "60px !important",
                      width: "80px !important",
                      height: "15px !important",
                    },
                    "& .MuiTableRow-root": {
                      height: "15px !important",
                    },
                  }}
                >
                  <TableHead>
                    <TableRow>
                      <TableCell
                        sx={{
                          position: "sticky",
                          left: 0,
                          zIndex: 3,
                          minWidth: "60px !important",
                          width: "80px !important",
                          height: "15px !important",
                          borderRight: "2px solid #ddd",
                          fontSize: "0.7rem",
                          fontWeight: "bold",
                        }}
                      />
                      {UTILS.diasSemana.map((dia) => (
                        <TableCell
                          key={dia}
                          sx={{
                            color: "text.primary",
                            fontWeight: "bold",
                            textAlign: "center",
                            minWidth: "60px !important",
                            width: "80px !important",
                            height: "15px !important",
                            fontSize: "0.7rem !important",
                            borderBottom: "2px solid #ddd",
                            borderRight: "1px solid #e0e0e0",
                            padding: "0px !important",
                          }}
                        >
                          {dia.charAt(0)}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {mapaCalorData.map((fila, index) => (
                      <TableRow key={index}>
                        {/* Celda de hora (sticky) */}
                        <TableCell
                          sx={{
                            color: "text.primary",
                            fontWeight: "bold",
                            textAlign: "right",
                            position: "sticky",
                            left: 0,
                            zIndex: 2,
                            minWidth: "60px !important",
                            width: "80px !important",
                            height: "15px !important",
                            fontSize: "0.7rem !important",
                            padding: "0px 8px !important",
                            borderRight: "2px solid #ddd",
                            borderBottom: "1px solid #e0e0e0",
                          }}
                        >
                          {fila.hora}
                        </TableCell>

                        {/* Celdas para cada día de la semana */}
                        {UTILS.diasSemana.map((dia) => {
                          const datoDia = fila[dia];
                          return <HeatmapCell key={dia} info={datoDia} />;
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  height: 412,
                  flexDirection: "column",
                  gap: 2,
                }}
              >
                <Typography variant="h6" color="text.secondary">
                  No hay datos disponibles para el mapa de calor
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  No se encontraron horarios activos en el sistema
                </Typography>
              </Box>
            )}
          </Box>

          {/* Leyenda a la derecha */}
          <LeyendaColores />
        </Box>

        <Divider sx={{ my: 4 }} />

        <Box sx={{ textAlign: "center", mb: 4 }}>
          <Typography
            variant="h5"
            color="primary.main"
            fontWeight={500}
            gutterBottom
          >
            Distribución de Secciones por PNF y Trayecto
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            maxWidth="800px"
            mx="auto"
          >
            Visualización de la distribución de secciones por Programa Nacional
            de Formación (PNF) y trayectos
          </Typography>
        </Box>
        {/* PieChart */}
        {datosAnilloInterno.length > 0 && datosAnilloExterno.length > 0 ? (
          <Box sx={{ display: "flex", justifyContent: "center", height: 400 }}>
            <PieChart
              width={600}
              height={400}
              series={[
                {
                  innerRadius,
                  outerRadius: middleRadius,
                  data: datosAnilloInterno,
                  arcLabel: (item) =>
                    `${item.label} (${item.percentage.toFixed(0)}%)`,
                  valueFormatter: ({ value }) =>
                    `${value} secciones (${(
                      (value / totalSecciones) *
                      100
                    ).toFixed(0)}%)`,
                  highlightScope: { fade: "global", highlight: "item" },
                  highlighted: { additionalRadius: 2 },
                  cornerRadius: 3,
                },
                {
                  innerRadius: middleRadius,
                  outerRadius: middleRadius + 20,
                  data: datosAnilloExterno,
                  arcLabel: (item) => `Trayecto ${item.label}`,
                  valueFormatter: ({ value }) => `${value} secciones`,
                  arcLabelRadius: 160,
                  highlightScope: { fade: "global", highlight: "item" },
                  highlighted: { additionalRadius: 2 },
                  cornerRadius: 3,
                },
              ]}
              sx={{
                [`& .${pieArcLabelClasses.root}`]: {
                  fontSize: "12px",
                },
              }}
              slotProps={{
                legend: {
                  hidden: true,
                },
              }}
            >
              <PieCenterLabel>Secciones</PieCenterLabel>
            </PieChart>
          </Box>
        ) : (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: 200,
              flexDirection: "column",
              gap: 2,
            }}
          >
            <Typography variant="h6" color="text.secondary">
              No hay datos disponibles para el gráfico de secciones
            </Typography>
            <Typography variant="body2" color="text.secondary">
              No se encontraron secciones en el sistema
            </Typography>
          </Box>
        )}
        <Divider />
        <Grid container spacing={4} sx={{ p: 3 }}>
          {/* 1. Encabezado */}
          <Grid size={12}>
            <Box sx={{ textAlign: "center" }}>
              <Typography
                variant="h4"
                color="primary.main"
                fontWeight={600}
                gutterBottom
              >
                Análisis de Eficiencia en Asignación de Carga
              </Typography>
              <Typography
                variant="body1"
                color="text.secondary"
                maxWidth="900px"
                mx="auto"
              >
                Comparación de las horas requeridas por las Unidades
                Curriculares (Demanda) frente a la disponibilidad total de horas
                de los profesores (Oferta).
              </Typography>
            </Box>
          </Grid>

          {/* 2. Tarjetas KPI - Dimensiones md:12, xs:12 */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Card elevation={3}>
              <CardContent>
                <Typography variant="subtitle1" color="text.secondary">
                  Demanda (Carga Planificada)
                </Typography>
                <Typography variant="h3" color="error.main" fontWeight={700}>
                  {stats.cargaPlanificada} Horas
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Card elevation={3}>
              <CardContent>
                <Typography variant="subtitle1" color="text.secondary">
                  Oferta (Carga Real)
                </Typography>
                <Typography variant="h3" color="success.main" fontWeight={700}>
                  {stats.cargaReal} Horas
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Card
              elevation={3}
              sx={{ backgroundColor: theme.palette.success.light }}
            >
              <CardContent>
                <Typography variant="subtitle1" color="text.primary">
                  Superávit de Recursos
                </Typography>
                <Typography variant="h3" color="success.dark" fontWeight={700}>
                  <ArrowUpward
                    sx={{
                      verticalAlign: "middle",
                      mr: 1,
                      fontSize: "2.5rem",
                    }}
                  />
                  +{stats.diferenciaCarga} Horas
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* 3. Visualización de Eficiencia (Gauge) - Ocupa la mitad inferior */}
          <Grid size={12}>
            <Box sx={{ p: 2, height: "100%" }}>
              <Typography variant="h6" align="center" gutterBottom>
                Ratio de Eficiencia de Asignación (Ideal = 1.0 a 1.5)
              </Typography>

              <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
                <Gauge
                  value={stats.eficienciaAsignacion}
                  valueMax={10}
                  startAngle={-90}
                  endAngle={90}
                  height={200}
                  sx={{
                    "& .MuiGauge-valueText": {
                      fontSize: theme.typography.h3.fontSize,
                      transform: "translate(0px, 0px)",
                      fontWeight: 700,
                    },
                    // Personalización para las zonas del arco de FONDO (pista)
                    [`& .MuiGauge-arc:nth-child(1)`]: {
                      fill: theme.palette.error.light,
                    },
                    [`& .MuiGauge-arc:nth-child(2)`]: {
                      fill: theme.palette.warning.light,
                    },
                    [`& .MuiGauge-arc:nth-child(3)`]: {
                      fill: theme.palette.success.light,
                    },
                  }}
                />
              </Box>
            </Box>
          </Grid>

          {/* 4. Conclusión/Explicación - Ocupa la otra mitad inferior */}
          <Grid
            item
            xs={12}
            md={6}
            sx={{ display: "flex", alignItems: "center" }}
          >
            <Card
              elevation={3}
              sx={{
                p: 3,
                backgroundColor: theme.palette.background.paper,
                height: "100%",
              }}
            >
              <Typography variant="h6" color="primary.main" gutterBottom>
                Análisis y Recomendación
              </Typography>
              <Typography variant="body1">
                El indicador de **Eficiencia de Asignación (
                {stats.eficienciaAsignacion})** es extremadamente alto. Esto
                significa que por cada hora de clase que las Unidades
                Curriculares necesitan, la institución tiene disponibles **
                {stats.eficienciaAsignacion} horas** de carga por parte de los
                profesores.
              </Typography>
              <Typography variant="body1" sx={{ mt: 2, fontWeight: "bold" }}>
                Conclusión:
              </Typography>
              <Typography variant="body1">
                Existe un **superávit significativo** de **
                {stats.diferenciaCarga} horas**, lo que sugiere que la carga
                docente actual podría estar subutilizada o que hay una
                oportunidad para planificar nuevas actividades académicas o de
                extensión.
              </Typography>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </>
  );
}
