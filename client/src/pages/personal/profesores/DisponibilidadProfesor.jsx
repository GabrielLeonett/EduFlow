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
  LinearProgress,
  Tooltip,
  Alert,
} from "@mui/material";
import ResponsiveAppBar from "../../../components/navbar";
import useApi from "../../../hook/useApi";
import useSweetAlert from "../../../hook/useSweetAlert";
import { useNavigate, useParams } from "react-router-dom";
import { UTILS } from "../../../utils/UTILS";

// Constantes
const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

export default function DisponibilidadProfesor() {
  // Hooks
  const axios = useApi();
  const alert = useSweetAlert();
  const theme = useTheme();
  const { id_profesor } = useParams();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  // Estados
  const [selectedBlocks, setSelectedBlocks] = useState({});
  const [profesor, setProfesor] = useState(false);
  const [horasDocenciaSemanales, setHorasDocenciaSemanales] = useState(0);
  const [loading, setLoading] = useState(false);
  const [existingDisponibilidades, setExistingDisponibilidades] = useState([]);
  const timeBlocks = UTILS.initialHours;

  // 🔥 FUNCIÓN PARA CALCULAR HORAS SELECCIONADAS
  const calcularHorasSeleccionadas = useCallback((bloques) => {
    let totalHoras = 0;

    Object.values(bloques).forEach((bloquesDia) => {
      // Cada bloque representa 1 hora académica (45 minutos)
      const horasBloquesDia = bloquesDia.length * 0.75; // 45 minutos = 0.75 horas
      totalHoras += horasBloquesDia;
    });

    return totalHoras;
  }, []);

  // 🔥 CALCULOS REACTIVOS - ELIMINAMOS LOS ESTADOS INDIVIDUALES
  const horasRegistradas = calcularHorasSeleccionadas(selectedBlocks);
  const horasFaltantes = Math.max(0, horasDocenciaSemanales - horasRegistradas);
  const porcentajeCumplimiento =
    horasDocenciaSemanales > 0
      ? Math.min(100, (horasRegistradas / horasDocenciaSemanales) * 100)
      : 0;

  const fetchProfesor = useCallback(
    async (profesorId) => {
      if (!profesorId) return;

      try {
        const respuesta = await axios.get(
          `/profesores?id_profesor=${profesorId}`
        );
        setProfesor(respuesta.profesor);

        // 🔥 CALCULAR HORAS DE DOCENCIA SEMANALES
        const horasDocencia = respuesta.profesor.horas_docencia_semanales;
        if (horasDocencia) {
          const totalHoras = horasDocencia.hours || 0;
          const totalMinutos = (horasDocencia.minutes || 0) / 60;
          const horasTotales = totalHoras + totalMinutos;
          setHorasDocenciaSemanales(horasTotales);
        }
      } catch (error) {
        console.log("Error al traer informacion del profesor: ", error);
      }
    },
    [axios]
  );

  // Efecto para validar id_profesor
  useEffect(() => {
    if (!id_profesor) {
      alert.error("Lo sentimos", "No se encontró id_profesor", {
        didClose: () => {
          navigate(-1);
        },
      });
      return;
    }

    fetchProfesor(id_profesor);
  }, []);

  // Función para cargar la disponibilidad existente
  const cargarDisponibilidadExistente = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `/profesores/${id_profesor}/disponibilidad`
      );

      const disponibilidades =
        response.disponibilidades || response.data?.disponibilidades || [];

      setExistingDisponibilidades(disponibilidades);

      const nuevosBloques = {};
      DAYS.forEach((day) => {
        nuevosBloques[day] = [];
      });

      disponibilidades.forEach((disp) => {
        try {
          const [horaInicio, minutosInicio] = disp.hora_inicio
            .split(":")
            .map(Number);

          const [horaFin, minutosFin] = disp.hora_fin.split(":").map(Number);

          const inicioTotalMinutos = UTILS.horasMinutos(
            horaInicio,
            minutosInicio
          );
          const finTotalMinutos = UTILS.horasMinutos(horaFin, minutosFin);

          const horasMilitarInicio =
            UTILS.calcularHorasHHMM(inicioTotalMinutos);
          const horasMilitarFin = UTILS.calcularHorasHHMM(finTotalMinutos);

          const bloquesDia = UTILS.RangoHorasSeguidasDisponibilidad(
            horasMilitarInicio,
            horasMilitarFin
          );

          nuevosBloques[disp.dia_semana] = [
            ...(nuevosBloques[disp.dia_semana] || []),
            ...bloquesDia,
          ];
        } catch (error) {
          console.error("Error procesando horario:", disp, error);
        }
      });

      setSelectedBlocks(nuevosBloques);
    } catch (error) {
      console.error("Error al cargar la disponibilidad existente:", error);
      alert.error({
        icon: "error",
        title: "Error",
        text: "No se pudo cargar la disponibilidad existente del profesor",
      });

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
    const current = selectedBlocks[day] || [];
    const estaAgregando = !current.includes(hour);

    if (estaAgregando) {
      // 🔥 CALCULAR DIRECTAMENTE SIN LLAMAR FUNCIONES EXTRA
      const horasPorAgregar = 0.75; // 45 minutos = 0.75 horas
      const nuevasHoras = horasRegistradas + horasPorAgregar;

      if (nuevasHoras > horasDocenciaSemanales) {
        alert.info(
          "Límite alcanzado",
          `No puedes agregar más horas. Ya has cubierto ${horasRegistradas.toFixed(
            1
          )} de ${horasDocenciaSemanales} horas (${porcentajeCumplimiento.toFixed(
            0
          )}%)`,
          { timer: 2000 }
        );
        return;
      }
    }

    const updated = estaAgregando
      ? [...current, hour]
      : current.filter((h) => h !== hour);

    setSelectedBlocks({ ...selectedBlocks, [day]: updated });
  };

  // 🔥 FUNCIÓN PARA VALIDAR SI PUEDE GUARDAR
  const puedeGuardar = () => {
    // Permite guardar si está completo o falta máximo 1 hora
    return horasFaltantes <= 1 && horasRegistradas > 0;
  };

  // 🔥 FUNCIÓN PARA OBTENER EL COLOR DEL PROGRESO
  const getColorProgreso = () => {
    if (porcentajeCumplimiento >= 95) return "success";
    if (porcentajeCumplimiento >= 80) return "warning";
    return "error";
  };

  // 🔥 FUNCIÓN PARA OBTENER MENSAJE DE ESTADO
  const getMensajeEstado = () => {
    if (horasRegistradas === 0) {
      return "No hay horas registradas";
    }
    if (horasFaltantes === 0) {
      return "¡Completado! Has cubierto todas las horas de docencia";
    }
    if (horasFaltantes <= 1) {
      return "Casi completo - Te falta 1 hora por cubrir";
    }
    return `Te faltan ${horasFaltantes.toFixed(
      1
    )} horas por cubrir de las ${horasDocenciaSemanales} requeridas`;
  };

  // 🔥 FUNCIÓN PARA AGRUPAR BLOQUES CONSECUTIVOS - CORREGIDA
  const agruparBloquesConsecutivos = useCallback((bloques) => {
    if (!bloques || bloques.length === 0) return [];

    // Ordenar los bloques
    const bloquesOrdenados = [...bloques].sort((a, b) => {
      const horaA = parseInt(a);
      const horaB = parseInt(b);
      return horaA - horaB;
    });

    const rangos = [];
    let inicio = bloquesOrdenados[0];
    let fin = bloquesOrdenados[0];

    // 🔥 NUEVA FUNCIÓN PARA CÁLCULOS (formato 24h)
    const convertirHoraMilitarAMinutos = (horaMilitar) => {
      const horas = Math.floor(horaMilitar / 100);
      const minutos = horaMilitar % 100;
      return horas * 60 + minutos;
    };

    for (let i = 1; i < bloquesOrdenados.length; i++) {
      const horaActual = bloquesOrdenados[i];

      // 🔥 USAR LAS NUEVAS FUNCIONES PARA CÁLCULOS
      const finMinutos = convertirHoraMilitarAMinutos(fin);
      const actualMinutos = convertirHoraMilitarAMinutos(horaActual);

      // Si la diferencia es de 45 minutos (1 bloque), es consecutivo
      if (actualMinutos - finMinutos === 45) {
        fin = horaActual;
      } else {
        // Terminar el rango actual y empezar uno nuevo
        const finConMinutos = UTILS.sumar45Minutos(fin, 1);

        const rango = {
          inicio: inicio, // 🔥 USAR
          fin: finConMinutos, // 🔥 USAR formatearHora24
        };

        rangos.push(rango);

        inicio = horaActual;
        fin = horaActual;
      }
    }

    // Procesar el último rango
    const finConMinutos = UTILS.sumar45Minutos(fin, 1);

    const ultimoRango = {
      inicio: inicio, // 🔥 USAR
      fin: finConMinutos, // 🔥 USAR formatearHora24
    };

    rangos.push(ultimoRango);

    return rangos;
  }, []);

  // 🔥 FUNCIÓN PARA FORMATEAR RESUMEN - CON USECALLBACK
  const getResumenPorDias = useCallback(() => {
    const resumen = {};

    DAYS.forEach((day) => {
      const bloquesDia = selectedBlocks[day] || [];
      if (bloquesDia.length > 0) {
        const rangos = agruparBloquesConsecutivos(bloquesDia);
        resumen[day] = rangos;
      }
    });

    return resumen;
  }, [selectedBlocks, agruparBloquesConsecutivos]);

  const findExistingDisponibilidad = (dia, horaInicio, horaFin) => {
    return existingDisponibilidades.find(
      (disp) =>
        disp.dia_semana === dia &&
        (disp.hora_inicio >= horaInicio || disp.hora_fin <= horaFin)
    );
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

    if (!puedeGuardar()) {
      alert.error({
        icon: "warning",
        title: "Horas insuficientes",
        text: `Debes cubrir al menos ${(horasDocenciaSemanales - 1).toFixed(
          1
        )} de las ${horasDocenciaSemanales} horas de docencia semanales. Actualmente tienes ${horasRegistradas.toFixed(
          1
        )} horas registradas.`,
      });
      return;
    }

    const resumen = getResumenPorDias();
    const disponibilidadData = [];

    // 🔥 PASO 1: IDENTIFICAR NUEVOS RANGOS
    Object.entries(resumen).forEach(([dia, rangos]) => {
      rangos.forEach((rango) => {
        const horaInicio = UTILS.formatearHora24(rango.inicio);
        const horaFin = UTILS.formatearHora24(rango.fin);

        const existing = findExistingDisponibilidad(dia, horaInicio, horaFin);

        disponibilidadData.push({
          id_disponibilidad: existing?.id_disponibilidad || null,
          dia_semana: dia,
          hora_inicio: horaInicio,
          hora_fin: horaFin,
          disponibilidad_activa: true,
        });
      });
    });

    console.log("📤 Datos a enviar al backend:", disponibilidadData);

    // 🔥 PASO 2: IDENTIFICAR DISPONIBILIDADES A ELIMINAR
    const disponibilidadesAEliminar = existingDisponibilidades.filter(
      (dispExistente) => {
        // Buscar si esta disponibilidad existe en los nuevos datos
        const sigueExistiendo = disponibilidadData.some(
          (dispNueva) =>
            dispNueva.id_disponibilidad === dispExistente.id_disponibilidad
        );

        // Si NO existe en los nuevos datos, hay que eliminarla
        return !sigueExistiendo;
      }
    );

    console.log("🗑️ Disponibilidades a eliminar:", disponibilidadesAEliminar);

    if (
      disponibilidadData.length === 0 &&
      disponibilidadesAEliminar.length === 0
    ) {
      alert.error({
        icon: "warning",
        title: "Sin datos",
        text: "No hay horarios seleccionados para guardar",
      });
      return;
    }

    setLoading(true);

    try {
      // 🔥 EJECUCIÓN EN ORDEN CORRECTO - SECUENCIAL

      // PASO 1: ELIMINAR primero las que ya no existen
      if (disponibilidadesAEliminar.length > 0) {
        console.log("🗑️ Ejecutando eliminaciones...");
        for (const dispAEliminar of disponibilidadesAEliminar) {
          try {
            await axios.delete(
              `/profesores/${id_profesor}/disponibilidad/${dispAEliminar.id_disponibilidad}`
            );
            console.log(`✅ Eliminado ID: ${dispAEliminar.id_disponibilidad}`);
          } catch (error) {
            console.error(
              `❌ Error eliminando ID ${dispAEliminar.id_disponibilidad}:`,
              error
            );
            throw new Error(
              `Error eliminando disponibilidad: ${error.message}`
            );
          }
        }
      }

      // PASO 2: ACTUALIZAR las existentes
      const disponibilidadesAActualizar = disponibilidadData.filter(
        (item) => item.id_disponibilidad
      );

      if (disponibilidadesAActualizar.length > 0) {
        console.log("✏️ Ejecutando actualizaciones...");
        for (const item of disponibilidadesAActualizar) {
          try {
            await axios.put(`/profesores/${id_profesor}/disponibilidad`, item);
            console.log(`✅ Actualizado ID: ${item.id_disponibilidad}`);
          } catch (error) {
            console.error(
              `❌ Error actualizando ID ${item.id_disponibilidad}:`,
              error
            );
            throw new Error(
              `Error actualizando disponibilidad: ${error.message}`
            );
          }
        }
      }

      // PASO 3: CREAR las nuevas
      const disponibilidadesACrear = disponibilidadData.filter(
        (item) => !item.id_disponibilidad
      );

      if (disponibilidadesACrear.length > 0) {
        console.log("🆕 Ejecutando creaciones...");
        for (const item of disponibilidadesACrear) {
          try {
            await axios.post(`/profesores/${id_profesor}/disponibilidad`, item);
            console.log(
              `✅ Creada nueva disponibilidad para ${item.dia_semana}`
            );
          } catch (error) {
            console.error(`❌ Error creando disponibilidad:`, error);
            throw new Error(`Error creando disponibilidad: ${error.message}`);
          }
        }
      }

      // 🔥 RESUMEN DE OPERACIONES
      const totalOperaciones =
        disponibilidadesAEliminar.length +
        disponibilidadesAActualizar.length +
        disponibilidadesACrear.length;

      console.log(`✅ Operaciones completadas: ${totalOperaciones}`);
      console.log(`   - Eliminadas: ${disponibilidadesAEliminar.length}`);
      console.log(`   - Actualizadas: ${disponibilidadesAActualizar.length}`);
      console.log(`   - Creadas: ${disponibilidadesACrear.length}`);

      alert.success(
        "¡Éxito!",
        `Disponibilidad guardada correctamente\n` +
          `• Horas cubiertas: ${horasRegistradas.toFixed(
            1
          )}/${horasDocenciaSemanales.toFixed(1)}\n` +
          `• Operaciones: ${totalOperaciones} realizadas`
      );

      // Recargar la disponibilidad para sincronizar el estado
      await cargarDisponibilidadExistente();
    } catch (error) {
      console.error("❌ Error al guardar disponibilidad:", error);

      // Mensaje de error más específico
      let mensajeError = "Error al guardar la disponibilidad";
      if (error.message.includes("horas semanales")) {
        mensajeError =
          "Has excedido las horas de docencia permitidas. Por favor, ajusta los horarios.";
      } else if (error.message.includes("conflicto")) {
        mensajeError =
          "Existe un conflicto de horarios. Verifica que no haya solapamientos.";
      } else if (error.message.includes("dependencias")) {
        mensajeError =
          "No se puede eliminar esta disponibilidad porque tiene asignaciones relacionadas.";
      }

      alert.error("Error", mensajeError);

      // Recargar para restaurar el estado anterior
      await cargarDisponibilidadExistente();
    } finally {
      setLoading(false);
    }
  };

  // Obtener resumen para mostrar en UI
  const resumen = getResumenPorDias();

  // Vista móvil simplificada
  const renderMobileView = () => (
    <Box>
      {DAYS.map((day) => (
        <Card key={day} sx={{ mb: 2 }}>
          <CardContent>
            <Typography
              variant="h6"
              sx={{ color: theme.palette.primary.main, mb: 2 }}
            >
              {day}
            </Typography>
            <Grid container spacing={1}>
              {Object.keys(timeBlocks).map((hour) => (
                <Grid size={4} key={hour}>
                  <Chip
                    label={UTILS.formatearHora(hour)}
                    onClick={() => toggleBlock(day, hour)}
                    color={
                      selectedBlocks[day]?.includes(hour)
                        ? "primary"
                        : "default"
                    }
                    variant={
                      selectedBlocks[day]?.includes(hour)
                        ? "filled"
                        : "outlined"
                    }
                    sx={{ width: "100%" }}
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
        overflow: "hidden",
      }}
    >
      <TableHead>
        <TableRow sx={{ backgroundColor: theme.palette.primary.main }}>
          <TableCell
            sx={{
              color: theme.palette.primary.contrastText,
              fontWeight: "bold",
            }}
          >
            Hora
          </TableCell>
          {DAYS.map((day) => (
            <TableCell
              key={day}
              sx={{
                color: theme.palette.primary.contrastText,
                fontWeight: "bold",
                textAlign: "center",
              }}
            >
              {day}
            </TableCell>
          ))}
        </TableRow>
      </TableHead>
      <TableBody>
        {Object.keys(timeBlocks).map((hour) => (
          <TableRow
            key={hour}
            sx={{
              "&:nth-of-type(odd)": {
                backgroundColor: theme.palette.action.hover,
              },
            }}
          >
            <TableCell
              sx={{
                fontWeight: "bold",
                borderRight: `1px solid ${theme.palette.divider}`,
              }}
            >
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
                      : theme.palette.action.hover,
                  },
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
      <ResponsiveAppBar backgroundColor />

      <Box
        sx={{
          padding: { xs: 1, sm: 2, md: 3 },
          marginTop: "80px",
          backgroundColor: theme.palette.background.default,
          minHeight: "100vh",
        }}
      >
        <Paper
          elevation={3}
          sx={{
            padding: { xs: 2, sm: 3 },
            backgroundColor: theme.palette.background.paper,
            borderRadius: 2,
          }}
        >
          <Typography
            variant="h4"
            gutterBottom
            sx={{
              color: theme.palette.primary.main,
              fontWeight: "bold",
              marginBottom: 3,
              fontSize: { xs: "1.5rem", sm: "2rem" },
            }}
          >
            Disponibilidad del Profesor
          </Typography>

          {profesor && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{ fontWeight: "bold" }}
                >
                  Información del Profesor
                </Typography>

                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="body1">
                      <strong>Nombre:</strong> {profesor.nombres}{" "}
                      {profesor.apellidos}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="body1">
                      <strong>Cédula:</strong> {profesor.cedula}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="body1">
                      <strong>Email:</strong> {profesor.email}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="body1">
                      <strong>Categoría:</strong> {profesor.categoria}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="body1">
                      <strong>Dedicación:</strong> {profesor.dedicacion}
                    </Typography>
                  </Grid>

                  {/* 🔥 CONTROL DE HORAS DE DOCENCIA */}
                  <Grid size={12}>
                    <Card
                      variant="outlined"
                      sx={{
                        p: 2,
                        backgroundColor: theme.palette.background.default,
                      }}
                    >
                      <Typography
                        variant="h6"
                        gutterBottom
                        sx={{ fontWeight: "bold" }}
                      >
                        Control de Horas de Docencia
                      </Typography>

                      <Box sx={{ mb: 2 }}>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            mb: 1,
                          }}
                        >
                          <Typography variant="body2">
                            Progreso: {horasRegistradas.toFixed(1)} /{" "}
                            {horasDocenciaSemanales.toFixed(1)} horas
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{ fontWeight: "bold" }}
                          >
                            {porcentajeCumplimiento.toFixed(0)}%
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={porcentajeCumplimiento}
                          color={getColorProgreso()}
                          sx={{ height: 10, borderRadius: 5 }}
                        />
                      </Box>

                      <Alert
                        severity={
                          horasFaltantes === 0
                            ? "success"
                            : horasFaltantes <= 1
                            ? "warning"
                            : "error"
                        }
                        sx={{ mb: 1 }}
                      >
                        {getMensajeEstado()}
                      </Alert>

                      {horasFaltantes > 1 && (
                        <Typography
                          variant="body2"
                          color="error"
                          sx={{ fontStyle: "italic" }}
                        >
                          ⚠️ Debes cubrir al menos{" "}
                          {(horasDocenciaSemanales - 1).toFixed(1)} horas para
                          poder guardar
                        </Typography>
                      )}
                    </Card>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          )}

          {/* Tabla o vista móvil */}
          {isMobile ? renderMobileView() : renderDesktopView()}

          {/* Resumen de disponibilidad */}
          <Card
            sx={{
              marginTop: 3,
              backgroundColor: theme.palette.background.default,
              border: `1px solid ${theme.palette.divider}`,
            }}
          >
            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 2,
                }}
              >
                <Typography
                  variant="h6"
                  sx={{ color: theme.palette.text.primary, fontWeight: "bold" }}
                >
                  Resumen de disponibilidad:
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {horasRegistradas.toFixed(1)} horas registradas
                </Typography>
              </Box>

              {Object.keys(resumen).length === 0 ? (
                <Typography color="textSecondary" sx={{ fontStyle: "italic" }}>
                  No hay horarios seleccionados
                </Typography>
              ) : (
                <Grid container spacing={2}>
                  {Object.entries(resumen).map(([dia, rangos]) => (
                    <Grid size={{ xs: 12, sm: 6 }} md={4} key={dia}>
                      <Paper
                        elevation={1}
                        sx={{
                          padding: 2,
                          backgroundColor: theme.palette.background.paper,
                        }}
                      >
                        <Typography
                          sx={{
                            color: theme.palette.primary.main,
                            fontWeight: "bold",
                            marginBottom: 1,
                          }}
                        >
                          {dia} ({rangos.length} rangos)
                        </Typography>
                        {rangos.map((rango, index) => (
                          <Chip
                            key={index}
                            label={`${UTILS.formatearHora(
                              rango.inicio
                            )} - ${UTILS.formatearHora(rango.fin)}`}
                            size="small"
                            color="success"
                            variant="outlined"
                            sx={{ margin: 0.5, display: "block" }}
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
              justifyContent: { xs: "center", sm: "flex-start" },
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
                minWidth: { xs: "100%", sm: 200 },
              }}
              onClick={guardarDisponibilidad}
              disabled={loading || !puedeGuardar()}
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
                minWidth: { xs: "100%", sm: 200 },
              }}
              onClick={cargarDisponibilidadExistente}
              disabled={loading}
            >
              Recargar disponibilidad
            </Button>
          </Box>

          {/* 🔥 MENSAJE DE VALIDACIÓN */}
          {!puedeGuardar() && horasRegistradas > 0 && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              No puedes guardar hasta que cubras al menos{" "}
              {(horasDocenciaSemanales - 1).toFixed(1)} de las{" "}
              {horasDocenciaSemanales} horas de docencia. Actualmente tienes{" "}
              {horasRegistradas.toFixed(1)} horas registradas.
            </Alert>
          )}
        </Paper>
      </Box>
    </>
  );
}
