import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
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
import CustomAutocomplete from "../../components/CustomAutocomplete";
import ModalRegisterAreaConocimiento from "../../components/ModalRegisterAreaConocimiento";
import CustomChip from "../../components/CustomChip";
import ResponsiveAppBar from "../../components/navbar";
import UnidadCurricularSchema from "../../schemas/unidadcurricular.schema";
import useApi from "../../hook/useApi";
import { useLocation } from "react-router-dom";
import useSweetAlert from "../../hook/useSweetAlert";

export default function RegistrarUnidadCurricular() {
  const theme = useTheme();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [areasDisponibles, setAreasDisponibles] = useState([]);
  const [openModalArea, setOpenModalArea] = useState(false);
  const location = useLocation();
  const { idTrayecto } = location.state;
  const axios = useApi(true);
  const alert = useSweetAlert();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const areasRes = await axios.get("/catalogos/areas-conocimiento");
        console.log("Áreas de Conocimiento:", areasRes);
        setAreasDisponibles(areasRes.areas_conocimiento || []);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [axios]);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isValid },
  } = useForm({
    resolver: zodResolver(UnidadCurricularSchema),
    mode: "onChange",
  });

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      await axios.post(`/trayectos/${idTrayecto}/unidades-curriculares`, data);

      alert.success(
        "Unidad Curricular registrada con éxito",
        "Ya puede verla en la lista de unidades."
      );

      reset();
    } catch (error) {
      if (error.error?.totalErrors > 0) {
        error.error.validationErrors.map((error_validacion) => {
          alert.toast({
            title: error_validacion.field,
            message: error_validacion.message,
            config: { icon: "error" },
          });
        });
      } else {
        alert.error(
          error.title || "Error al registrar",
          error.message || "No se pudo registrar la unidad curricular"
        );
      }
      console.error("Error al registrar la unidad curricular:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAgregarArea = (field, nuevaArea) => {
    const areasActuales = field.value || [];
    const existe = areasActuales.some(
      (area) => area.id_area_conocimiento === nuevaArea.id_area_conocimiento
    );

    if (!existe) {
      const nuevasAreas = [...areasActuales, nuevaArea];
      field.onChange(nuevasAreas);
    }
  };

  const handleEliminarArea = (field, index) => {
    const areasActuales = field.value || [];
    const nuevasAreas = areasActuales.filter((_, i) => i !== index);
    field.onChange(nuevasAreas);
  };

  const handleSeleccionAutocomplete = (field, nuevaArea) => {
    if (nuevaArea) {
      console.log(nuevaArea);
      if (nuevaArea.id_area_conocimiento === "otro") {
        setOpenModalArea(true);
      } else {
        handleAgregarArea(field, nuevaArea);
      }
    }
  };

  const handleCerrarModalArea = (nuevaArea) => {
    setOpenModalArea(false);
    if (nuevaArea) {
      // Actualizar áreas disponibles después de registrar una nueva
      const fetchAreas = async () => {
        try {
          const areasRes = await axios.get("/catalogos/areas-conocimiento");
          setAreasDisponibles(areasRes.areas_conocimiento || []);
        } catch (error) {
          console.error("Error actualizando áreas:", error);
        }
      };
      fetchAreas();
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
              Información de la Unidad Curricular
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Ingrese los datos básicos de la unidad curricular
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
                  <Grid size={{ xs: 12, md: 4 }}>
                    <CustomLabel
                      fullWidth
                      label="Nombre de la Unidad Curricular *"
                      variant="outlined"
                      {...register("nombre_unidad_curricular")}
                      error={!!errors.nombre_unidad_curricular}
                      helperText={
                        errors.nombre_unidad_curricular?.message ||
                        "Ej: Matemáticas Básicas, Programación I, etc."
                      }
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <CustomLabel
                      fullWidth
                      label="Código de la Unidad *"
                      variant="outlined"
                      {...register("codigo_unidad_curricular")}
                      error={!!errors.codigo_unidad_curricular}
                      helperText={
                        errors.codigo_unidad_curricular?.message ||
                        "Código único identificador"
                      }
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <Controller
                      name="carga_horas_academicas"
                      control={control}
                      defaultValue={1}
                      rules={{ required: "Se requiere las horas academicas." }}
                      render={({ field, fieldState: { error } }) => (
                        <CustomLabel
                          select
                          id="carga_horas_academicas"
                          label="Horas Academicas"
                          variant="outlined"
                          fullWidth
                          {...field}
                          error={!!error}
                          helperText={
                            error?.message || "Seleccione las horas academicas"
                          }
                        >
                          <MenuItem value={1}>"{"45min"}"</MenuItem>
                          <MenuItem value={2}>"{"1h 30min"}"</MenuItem>
                          <MenuItem value={3}>"{"2h 15min"}"</MenuItem>
                          <MenuItem value={4}>"{"3h"}"</MenuItem>
                        </CustomLabel>
                      )}
                    />
                  </Grid>
                </Grid>
              </Box>

              <Divider />

              {/* Descripción y Carga Horaria */}
              <Box>
                <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
                  Detalles Adicionales
                </Typography>
                <Grid>
                  <CustomLabel
                    fullWidth
                    label="Descripción *"
                    variant="outlined"
                    multiline
                    rows={4}
                    {...register("descripcion_unidad_curricular")}
                    error={!!errors.descripcion_unidad_curricular}
                    helperText={
                      errors.descripcion_unidad_curricular?.message ||
                      "Describa los objetivos y contenido de la unidad curricular"
                    }
                  />
                </Grid>
              </Box>

              <Divider />

              {/* Áreas de Conocimiento */}
              <Box>
                <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
                  Áreas de Conocimiento
                </Typography>

                <Controller
                  name="areas_conocimiento"
                  control={control}
                  defaultValue={[]}
                  render={({ field }) => (
                    <Stack spacing={2}>
                      <CustomAutocomplete
                        options={[
                          ...areasDisponibles,
                          {
                            id_area_conocimiento: "otro",
                            nombre_area_conocimiento: "➕ Registrar nueva área",
                          },
                        ]}
                        getOptionLabel={(option) =>
                          option.nombre_area_conocimiento || ""
                        }
                        value={null}
                        onChange={(event, nuevaArea) =>
                          handleSeleccionAutocomplete(field, nuevaArea)
                        }
                        renderInput={(params) => (
                          <CustomLabel
                            {...params}
                            label="Seleccionar Áreas de Conocimiento *"
                            placeholder="Busque y seleccione las áreas..."
                            error={!!errors.areas_conocimiento}
                            helperText={
                              errors.areas_conocimiento?.message ||
                              "Seleccione al menos un área de conocimiento"
                            }
                          />
                        )}
                        isOptionEqualToValue={(option, value) =>
                          option.id_area_conocimiento ===
                          value?.id_area_conocimiento
                        }
                      />

                      {/* Áreas seleccionadas */}
                      {field.value && field.value.length > 0 && (
                        <Box>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            gutterBottom
                          >
                            Áreas seleccionadas ({field.value.length}):
                          </Typography>
                          <Box
                            sx={{
                              display: "flex",
                              flexWrap: "wrap",
                              gap: 1,
                              p: 2,
                              borderRadius: 2,
                              backgroundColor: theme.palette.background.default,
                              border: `1px solid ${theme.palette.divider}`,
                            }}
                          >
                            {field.value.map((area, index) => (
                              <CustomChip
                                key={area.id_area_conocimiento}
                                label={area.nombre_area_conocimiento}
                                color="primary"
                                size="medium"
                                deletable
                                onDelete={() =>
                                  handleEliminarArea(field, index)
                                }
                              />
                            ))}
                          </Box>
                        </Box>
                      )}
                    </Stack>
                  )}
                />
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
                  {isSubmitting ? "Guardando..." : "Guardar Unidad Curricular"}
                </CustomButton>
              </Box>
            </Stack>
          </Box>
        </Paper>
      </Box>

      <ModalRegisterAreaConocimiento
        open={openModalArea}
        onClose={handleCerrarModalArea}
      />
    </>
  );
}
