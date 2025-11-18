import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Box,
  Typography,
  Stack,
  useTheme,
  Paper,
  Grid,
  Divider,
  Alert,
  MenuItem,
} from "@mui/material";
import CustomButton from "../../components/customButton";
import CustomLabel from "../../components/customLabel";
import ResponsiveAppBar from "../../components/navbar";
import pnfSchema from "../../schemas/pnf.schema";
import useApi from "../../hook/useApi";
import useSweetAlert from "../../hook/useSweetAlert";

export default function PnfForm() {
  const theme = useTheme();
  const axios = useApi();
  const alert = useSweetAlert();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sedes, setSedes] = useState([]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm({
    resolver: zodResolver(pnfSchema),
    mode: "onChange",
    defaultValues: {
      nombre_pnf: "",
      codigo_pnf: "",
      descripcion_pnf: "",
      duracion_trayectos_pnf: "",
      sede_pnf: "",
    },
  });

  useEffect(() => {
    const fetchSedes = async () => {
      try {
        const response = await axios.get("/sedes");
        setSedes(response.sedes || []);
      } catch (error) {
        console.error("Error fetching sedes:", error);
      }
    };

    fetchSedes();
  }, [axios]);

  const onSubmit = async (data) => {
    setIsSubmitting(true);

    try {
      await axios.post("/pnf", data);

      alert.success(
        "PNF creado con éxito",
        "Se ha registrado el PNF exitosamente."
      );

      reset();
    } catch (error) {
      if (error?.error?.totalErrors > 0) {
        error.error.validationErrors.forEach((error_validacion) => {
          alert.toast(error_validacion.field, error_validacion.message);
        });
      } else {
        alert.error(
          error.title || "Error al registrar el PNF",
          error.message || "No se pudo registrar el PNF. Intente nuevamente."
        );
      }
      console.error("Error al registrar el PNF:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLimpiarFormulario = () => {
    reset();
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
              Registrar PNF
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Ingrese los datos básicos del PNF
            </Typography>
          </Box>

          <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ p: 4 }}>
            <Stack spacing={4}>
              {/* Información Básica */}
              <Box>
                <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
                  Información Básica
                </Typography>
                <Grid container spacing={3}>
                  <Grid size={{ md: 12, lg: 6 }}>
                    <CustomLabel
                      fullWidth
                      label="Nombre del PNF *"
                      variant="outlined"
                      {...register("nombre_pnf")}
                      error={!!errors.nombre_pnf}
                      helperText={
                        errors.nombre_pnf?.message || "Colocar el nombre del PNF"
                      }
                      inputProps={{ "aria-required": "true" }}
                    />
                  </Grid>
                  <Grid size={{ md: 12, lg: 6 }}>
                    <CustomLabel
                      fullWidth
                      label="Código del PNF *"
                      variant="outlined"
                      {...register("codigo_pnf")}
                      error={!!errors.codigo_pnf}
                      helperText={
                        errors.codigo_pnf?.message || "Código único del PNF"
                      }
                      inputProps={{ "aria-required": "true" }}
                    />
                  </Grid>
                </Grid>
              </Box>

              <Divider />

              {/* Duración y Sede */}
              <Box>
                <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
                  Configuración
                </Typography>
                <Grid container spacing={3}>
                  <Grid size={{ md: 12, lg: 6 }}>
                    <CustomLabel
                      fullWidth
                      type="number"
                      label="Número de trayectos *"
                      variant="outlined"
                      {...register("duracion_trayectos_pnf", {
                        valueAsNumber: true,
                      })}
                      error={!!errors.duracion_trayectos_pnf}
                      helperText={
                        errors.duracion_trayectos_pnf?.message ||
                        "Colocar el número de trayectos"
                      }
                      inputProps={{
                        "aria-required": "true",
                        min: 1,
                        step: 1,
                        onKeyDown: (e) => {
                          if (e.key === "." || e.key === "," || e.key === "e") {
                            e.preventDefault();
                          }
                        },
                      }}
                    />
                  </Grid>
                  <Grid size={{ md: 12, lg: 6 }}>
                    <CustomLabel
                      select
                      fullWidth
                      label="Sede *"
                      variant="outlined"
                      {...register("sede_pnf")}
                      error={!!errors.sede_pnf}
                      helperText={errors.sede_pnf?.message || "Seleccione una sede"}
                    >
                      {sedes.length > 0 ? (
                        sedes.map((sede) => (
                          <MenuItem key={sede.id_sede} value={sede.id_sede}>
                            {sede.nombre_sede}
                          </MenuItem>
                        ))
                      ) : (
                        <MenuItem disabled>Cargando sedes...</MenuItem>
                      )}
                    </CustomLabel>
                  </Grid>
                </Grid>
              </Box>

              <Divider />

              {/* Descripción */}
              <Box>
                <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
                  Descripción
                </Typography>
                <Grid xs={12}>
                  <CustomLabel
                    fullWidth
                    label="Descripción del PNF"
                    variant="outlined"
                    multiline
                    rows={4}
                    {...register("descripcion_pnf")}
                    error={!!errors.descripcion_pnf}
                    helperText={errors.descripcion_pnf?.message || "Describa los objetivos y características del PNF"}
                  />
                </Grid>
              </Box>

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
                  onClick={handleLimpiarFormulario}
                  disabled={isSubmitting}
                  sx={{ minWidth: 120 }}
                >
                  Limpiar
                </CustomButton>

                <CustomButton
                  tipo="primary"
                  type="submit"
                  disabled={!isValid || isSubmitting}
                  sx={{ minWidth: 200 }}
                >
                  {isSubmitting ? "Guardando..." : "Guardar PNF"}
                </CustomButton>
              </Box>
            </Stack>
          </Box>
        </Paper>
      </Box>
    </>
  );
}