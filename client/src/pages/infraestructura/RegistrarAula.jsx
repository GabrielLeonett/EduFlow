import { useCallback, useEffect, useState } from "react";
import {
  Box,
  Typography,
  MenuItem,
  Paper,
  Stack,
  Divider,
  Alert,
  Grid,
  CircularProgress,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import ResponsiveAppBar from "../../components/navbar";
import CustomLabel from "../../components/customLabel";
import CustomButton from "../../components/customButton";
import useApi from "../../hook/useApi";
import AulaSchema from "../../schemas/aula.schema";
import useSweetAlert from "../../hook/useSweetAlert";

// Valores iniciales para el formulario
const defaultValues = {
  codigo: "",
  tipo: "",
  capacidad: "",
  id_sede: "",
  id_pnf: undefined,
};

export default function RegistrarAula() {
  const theme = useTheme();
  const axios = useApi();
  const alert = useSweetAlert();
  
  const {
    control,
    register,
    watch,
    formState: { errors, isValid },
    handleSubmit,
    reset,
  } = useForm({
    resolver: zodResolver(AulaSchema),
    mode: "onChange",
    defaultValues,
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sedes, setSedes] = useState([]);
  const [pnfs, setPnfs] = useState([]);
  const [loadingSedes, setLoadingSedes] = useState(true);
  const [loadingPnfs, setLoadingPnfs] = useState(false);

  // Observar el valor de la sede seleccionada
  const selectedSede = watch("id_sede");

  const fetchSedes = useCallback(async () => {
    try {
      const responseSedes = await axios.get("/sedes");
      setSedes(responseSedes.sedes || []);
    } catch (error) {
      console.error("Error al cargar sedes:", error);
      alert.error("Error", "No se pudieron cargar los núcleos");
    } finally {
      setLoadingSedes(false);
    }
  }, [alert, axios]);

  const fetchPnfs = useCallback(
    async (idSede) => {
      if (!idSede) {
        setPnfs([]);
        return;
      }

      setLoadingPnfs(true);
      try {
        const responsePnfs = await axios.get(`/pnf?id_sede=${idSede}`);
        setPnfs(responsePnfs.pnfs || []);
      } catch (error) {
        console.error("Error al cargar PNFs:", error);
        alert.error("Error", "No se pudieron cargar los PNFs");
        setPnfs([]);
      } finally {
        setLoadingPnfs(false);
      }
    },
    [alert, axios]
  );

  // 👉 Cargar sedes al inicio
  useEffect(() => {
    console.log("🔄 Cargando núcleos...");
    fetchSedes();
  }, []);

  // 👉 Cargar PNFs cuando cambia la sede seleccionada
  useEffect(() => {
    if (selectedSede) {
      console.log(`🔄 Cargando PNFs para sede: ${selectedSede}`);
      fetchPnfs(selectedSede);
    } else {
      setPnfs([]); // Limpiar PNFs si no hay sede seleccionada
    }
  }, [selectedSede]);

  const onSubmit = async (data) => {
    setIsSubmitting(true);

    try {
      // Confirmación antes de enviar
      const confirm = await alert.confirm(
        "¿Desea registrar esta aula?",
        "Verifique que los datos sean correctos antes de continuar."
      );
      if (!confirm) {
        setIsSubmitting(false);
        return;
      }

      // Preparar datos para enviar
      const formData = {
        ...data,
        capacidad: Number(data.capacidad),
      };

      await axios.post("/aulas", formData);

      alert.success(
        "Aula registrada con éxito",
        "La información del aula se ha guardado correctamente."
      );

      // Resetear formulario a valores iniciales
      handleReset();
    } catch (error) {
      console.error("Error al registrar el aula:", error);

      if (error?.error?.totalErrors > 0) {
        error.error.validationErrors.forEach((error_validacion) => {
          alert.toast({
            title: error_validacion.field,
            message: error_validacion.message,
            config: { icon: "error" },
          });
        });
      } else {
        alert.error(
          error.title || "Error al registrar el aula",
          error.message ||
            "No se pudo completar el registro. Intente nuevamente."
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = useCallback(() => {
    // Resetear el formulario
    reset(defaultValues);
    // Limpiar los PNFs inmediatamente
    setPnfs([]);
    // Forzar un pequeño delay para asegurar que el estado se actualice
    setTimeout(() => {
      setPnfs([]);
    }, 100);
  }, [reset]);

  const handleDebug = () => {
    console.log("Estado actual del formulario:", {
      values: watch(),
      errors,
      isValid,
      selectedSede,
      sedesCount: sedes.length,
      pnfsCount: pnfs.length,
      loadingSedes,
      loadingPnfs,
    });
  };

  return (
    <>
      <ResponsiveAppBar backgroundColor />

      <Box
        sx={{
          minHeight: "100vh",
          backgroundColor: theme.palette.background.default,
          mt: 12,
        }}
      >
        {/* Formulario */}
        <Paper
          elevation={2}
          sx={{
            borderRadius: 3,
            m: 2,
            overflow: "hidden",
            border: `1px solid ${theme.palette.divider}`,
            maxWidth: "lg",
            mx: "auto",
          }}
        >
          <Box
            sx={{
              backgroundColor: theme.palette.primary.main,
              color: "white",
              px: 4,
              py: 3,
            }}
          >
            <Typography variant="h5" component="h2" fontWeight="bold">
              Registro de Aula
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Ingrese los datos básicos del aula
            </Typography>
          </Box>

          <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ p: 4 }}>
            <Stack spacing={4}>
              {/* Información Básica del Aula */}
              <Box>
                <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
                  Información Básica del Aula
                </Typography>
                <Grid container spacing={3}>
                  {/* Código del Aula */}
                  <Grid size={{ xs: 12, md: 6 }}>
                    <CustomLabel
                      fullWidth
                      label="Código del Aula *"
                      variant="outlined"
                      {...register("codigo")}
                      error={!!errors.codigo}
                      helperText={
                        errors.codigo?.message ||
                        "Código único identificador del aula (Ej: AULA-101, LAB-202)"
                      }
                      placeholder="Ej: AULA-101"
                    />
                  </Grid>

                  {/* Tipo de Aula */}
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Controller
                      name="tipo"
                      control={control}
                      render={({ field, fieldState: { error } }) => (
                        <CustomLabel
                          select
                          label="Tipo de Aula *"
                          variant="outlined"
                          fullWidth
                          {...field}
                          error={!!error}
                          helperText={
                            error?.message || "Seleccione el tipo de aula"
                          }
                        >
                          <MenuItem value="">Seleccione un tipo</MenuItem>
                          <MenuItem value="Convencional">Convencional</MenuItem>
                          <MenuItem value="Laboratorio">Laboratorio</MenuItem>
                          <MenuItem value="Taller">Taller</MenuItem>
                          <MenuItem value="Auditorio">Auditorio</MenuItem>
                          <MenuItem value="Sala de Conferencias">
                            Sala de Conferencias
                          </MenuItem>
                        </CustomLabel>
                      )}
                    />
                  </Grid>

                  {/* Capacidad */}
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Controller
                      name="capacidad"
                      control={control}
                      render={({ field, fieldState: { error } }) => (
                        <CustomLabel
                          fullWidth
                          label="Capacidad *"
                          variant="outlined"
                          type="number"
                          {...field}
                          onChange={(e) => {
                            // Convertir a número
                            const value =
                              e.target.value === ""
                                ? ""
                                : Number(e.target.value);
                            field.onChange(value);
                          }}
                          error={!!error}
                          helperText={
                            error?.message || "Número máximo de estudiantes"
                          }
                          placeholder="Ej: 30"
                          inputProps={{ min: 1, max: 500 }}
                        />
                      )}
                    />
                  </Grid>

                  {/* Sede */}
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Controller
                      name="id_sede"
                      control={control}
                      render={({ field, fieldState: { error } }) => (
                        <CustomLabel
                          select
                          label="Núcleos *"
                          variant="outlined"
                          fullWidth
                          {...field}
                          error={!!error}
                          helperText={error?.message || "Seleccione el Núcleo"}
                          disabled={loadingSedes}
                        >
                          <MenuItem value="">Seleccione el Núcleo</MenuItem>
                          {loadingSedes ? (
                            <MenuItem disabled>
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 1,
                                }}
                              >
                                <CircularProgress size={20} />
                                Cargando núcleos...
                              </Box>
                            </MenuItem>
                          ) : (
                            sedes.map((sede) => (
                              <MenuItem key={sede.id_sede} value={sede.id_sede}>
                                {sede.nombre_sede}
                              </MenuItem>
                            ))
                          )}
                        </CustomLabel>
                      )}
                    />
                  </Grid>
                </Grid>
              </Box>

              <Divider />

              {/* PNF Preferencial - Solo se muestra si hay una sede seleccionada */}
              {selectedSede && (
                <Box>
                  <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
                    Asignación Preferencial (Opcional)
                  </Typography>
                  <Grid container spacing={3}>
                    <Grid size={{ xs: 12 }}>
                      <Controller
                        name="id_pnf"
                        control={control}
                        render={({ field, fieldState: { error } }) => (
                          <CustomLabel
                            select
                            label="PNF Preferencial"
                            variant="outlined"
                            fullWidth
                            {...field}
                            error={!!error}
                            helperText={
                              error?.message ||
                              "Seleccione el PNF al que estará asignada preferencialmente el aula"
                            }
                            disabled={loadingPnfs}
                          >
                            <MenuItem value={undefined}>
                              {loadingPnfs
                                ? "Cargando PNFs..."
                                : pnfs.length === 0
                                ? "No hay PNFs en esta sede"
                                : "Sin PNF preferencial"}
                            </MenuItem>
                            {pnfs.map((pnf) => (
                              <MenuItem key={pnf.id_pnf} value={pnf.id_pnf}>
                                {pnf.codigo_pnf} - {pnf.nombre_pnf}
                                {pnf.tiene_coordinador && " 👨‍🏫"}
                              </MenuItem>
                            ))}
                          </CustomLabel>
                        )}
                      />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <Alert
                        severity="info"
                        sx={{
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        <Typography variant="body2">
                          <strong>Información:</strong> Esta asignación es
                          opcional. El aula podrá ser utilizada por cualquier PNF,
                          pero tendrá prioridad para el PNF seleccionado.
                        </Typography>
                      </Alert>
                    </Grid>
                  </Grid>
                </Box>
              )}

              {/* Nota informativa */}
              <Alert severity="info" sx={{ borderRadius: 2 }}>
                <Typography variant="body2">
                  <strong>Nota:</strong> Todos los campos marcados con (*) son
                  obligatorios. Asegúrese de que la información sea correcta
                  antes de guardar.
                </Typography>
              </Alert>

              {/* Botones de acción */}
              <Box
                sx={{
                  display: "flex",
                  gap: 2,
                  justifyContent: "flex-end",
                  pt: 2,
                  borderTop: `1px solid ${theme.palette.divider}`,
                }}
              >
                <CustomButton
                  tipo="secondary"
                  onClick={handleReset}
                  disabled={isSubmitting}
                  sx={{ minWidth: 120 }}
                >
                  Limpiar
                </CustomButton>
                
                <CustomButton
                  tipo="secondary"
                  onClick={handleDebug}
                  sx={{ minWidth: 120 }}
                >
                  Debug
                </CustomButton>

                <CustomButton
                  tipo="primary"
                  type="submit"
                  disabled={!isValid || isSubmitting}
                  sx={{ minWidth: 200 }}
                >
                  {isSubmitting ? "Registrando..." : "Registrar Aula"}
                </CustomButton>
              </Box>
            </Stack>
          </Box>
        </Paper>
      </Box>
    </>
  );
}