import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Box,
  Typography,
  Stack,
  Grid,
  Divider,
  Alert,
  useTheme,
} from "@mui/material";
import CustomButton from "./customButton";
import CustomLabel from "./customLabel";
import CustomAutocomplete from "./CustomAutocomplete";
import CustomChip from "./CustomChip";
import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import UnidadCurricularSchema from "../schemas/unidadcurricular.schema";
import useApi from "../hook/useApi";
import useSweetAlert from "../hook/useSweetAlert";

const getInitialValues = (unidadCurricular) => {
  console.log(unidadCurricular)
  return {
    nombre_unidad_curricular: unidadCurricular?.nombre_unidad_curricular || "",
    codigo_unidad_curricular: unidadCurricular?.codigo_unidad || "",
    descripcion_unidad_curricular: unidadCurricular?.descripcion_unidad_curricular || "",
    carga_horas_academicas: unidadCurricular?.horas_clase || "",
    areas_conocimiento: unidadCurricular?.areas_conocimiento || [],
  };
};

export default function ModalEditarUnidadCurricular({
  open,
  onClose,
  unidadCurricular,
  onGuardar,
}) {
  const theme = useTheme();
  const axios = useApi();
  const alert = useSweetAlert();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [areasDisponibles, setAreasDisponibles] = useState([]);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(UnidadCurricularSchema),
    mode: "onChange",
    defaultValues: getInitialValues(unidadCurricular),
  });

  // 🔄 Cargar datos iniciales y áreas disponibles
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Cargar áreas de conocimiento
        const areasRes = await axios.get("/catalogos/areas-conocimiento");
        setAreasDisponibles(areasRes.areas_conocimiento || []);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    if (open) {
      fetchData();
    }
  }, [open, unidadCurricular, reset, axios]);

  // 💾 Guardar cambios
  const onSubmit = async (data) => {
    console.log("📝 Datos del formulario:", data);

    setIsSubmitting(true);
    try {
      // ✅ Confirmar antes de guardar
      const confirm = await alert.confirm(
        "¿Desea guardar los cambios?",
        "La información de la unidad curricular será actualizada."
      );
      if (!confirm) {
        setIsSubmitting(false);
        return;
      }

      // ✅ Preparar solo los campos que cambiaron
      const datosCambiados = {};

      // 🔄 CORREGIDO: Usar los mismos nombres que en la card
      if (data.nombre_unidad_curricular !== unidadCurricular.nombre_unidad) {
        datosCambiados.nombre_unidad_curricular = data.nombre_unidad_curricular;
      }

      if (data.codigo_unidad_curricular !== unidadCurricular.codigo_unidad) {
        datosCambiados.codigo_unidad_curricular = data.codigo_unidad_curricular;
      }

      if (
        data.descripcion_unidad_curricular !==
        unidadCurricular.descripcion_unidad
      ) {
        datosCambiados.descripcion_unidad_curricular =
          data.descripcion_unidad_curricular;
      }

      if (
        Number(data.carga_horas_academicas) !==
        Number(unidadCurricular.horas_clase)
      ) {
        datosCambiados.carga_horas_academicas = Number(
          data.carga_horas_academicas
        );
      }

      // ✅ Manejar áreas de conocimiento (comparación mejorada)
      const areasActualesIds = (unidadCurricular.areas_conocimiento || [])
        .map((area) => area.id_area_conocimiento)
        .sort();

      const areasNuevasIds = (data.areas_conocimiento || [])
        .map((area) => area.id_area_conocimiento)
        .sort();

      // Comparar arrays ordenados
      const areasCambiaron =
        JSON.stringify(areasActualesIds) !== JSON.stringify(areasNuevasIds);

      if (areasCambiaron) {
        datosCambiados.areas_conocimiento = data.areas_conocimiento;
      }

      console.log("🔄 Campos que cambiaron:", datosCambiados);

      // ✅ Si no hay cambios, mostrar mensaje y salir
      if (Object.keys(datosCambiados).length === 0) {
        alert.info("Sin cambios", "No se detectaron cambios para guardar.", {
          icon: "info",
        });
        setIsSubmitting(false);
        return;
      }

      // ✅ Enviar solo los campos que cambiaron
      const response = await axios.put(
        `/unidades-curriculares/${unidadCurricular.id_unidad_curricular}`,
        datosCambiados
      );

      console.log("✅ Respuesta del servidor:", response);

      alert.success(
        "Unidad Curricular actualizada",
        "Los cambios se guardaron correctamente.",
        { icon: "success" }
      );

      // ✅ CORREGIDO: Actualizar con la estructura correcta para la card
      const unidadActualizada = {
        ...unidadCurricular,
        // Mapear los nombres del formulario a los nombres de la card
        nombre_unidad:
          data.nombre_unidad_curricular || unidadCurricular.nombre_unidad,
        codigo_unidad:
          data.codigo_unidad_curricular || unidadCurricular.codigo_unidad,
        descripcion_unidad:
          data.descripcion_unidad_curricular ||
          unidadCurricular.descripcion_unidad,
        horas_clase:
          data.carga_horas_academicas || unidadCurricular.horas_clase,
        areas_conocimiento:
          data.areas_conocimiento || unidadCurricular.areas_conocimiento,
      };

      onGuardar(unidadActualizada);
      onClose();
    } catch (error) {
      console.error("❌ Error al actualizar unidad curricular:", error);

      if (error.error?.totalErrors > 0) {
        error.error.validationErrors.forEach((error_validacion) => {
          alert.toast({
            title: "Validación",
            message: error_validacion.message,
            config: { icon: "warning" },
          });
        });
      } else {
        alert.error(error.title, error.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Manejo de áreas de conocimiento
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
      if (nuevaArea.nombre_area_conocimiento === "➕ Registrar nueva área") {
        alert.toast({
          title: "Función no disponible",
          message:
            "El registro de nuevas áreas debe hacerse desde el catálogo principal.",
          config: { icon: "info" },
        });
      } else {
        handleAgregarArea(field, nuevaArea);
      }
    }
  };

  const handleLimpiarFormulario = () => {
    if (unidadCurricular) {
      reset({
        nombre_unidad_curricular: unidadCurricular.nombre_unidad || "",
        codigo_unidad_curricular: unidadCurricular.codigo_unidad || "",
        descripcion_unidad_curricular:
          unidadCurricular.descripcion_unidad || "",
        carga_horas_academicas: unidadCurricular.horas_clase || 1,
        areas_conocimiento: unidadCurricular.areas_conocimiento || [],
      });
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      scroll="paper"
    >
      <Box component="form" onSubmit={handleSubmit(onSubmit)}>
        <DialogTitle>
          <Typography variant="h5" component="div" fontWeight="bold">
            Editar Unidad Curricular: {unidadCurricular?.nombre_unidad}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Modifique los datos de la unidad curricular
          </Typography>
        </DialogTitle>

        <DialogContent>
          <Stack spacing={4} sx={{ pt: 2 }}>
            {/* Información Básica */}
            <Box>
              <Typography
                variant="h6"
                gutterBottom
                sx={{ mb: 3, color: "primary.main" }}
              >
                Información Básica
              </Typography>
              <Grid container spacing={3}>
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
                <Controller
                  name="carga_horas_academicas"
                  control={control}
                  render={({ field, fieldState: { error } }) => (
                    <CustomLabel
                      select
                      label="Horas Académicas *"
                      variant="outlined"
                      fullWidth
                      {...field}
                      error={!!error}
                      helperText={
                        error?.message || "Seleccione la duración de la clase"
                      }
                    >
                      <MenuItem value={1}>45min</MenuItem>
                      <MenuItem value={2}>1h 30min</MenuItem>
                      <MenuItem value={3}>2h 15min</MenuItem>
                      <MenuItem value={4}>3h</MenuItem>
                    </CustomLabel>
                  )}
                />
              </Grid>
            </Box>

            {/* Descripción */}
            <Box>
              <Typography
                variant="h6"
                gutterBottom
                sx={{ mb: 3, color: "primary.main" }}
              >
                Detalles Adicionales
              </Typography>
              <Grid container spacing={3}>
                <CustomLabel
                  fullWidth
                  label="Descripción *"
                  variant="outlined"
                  multiline
                  rows={5}
                  {...register("descripcion_unidad_curricular")}
                  error={!!errors.descripcion_unidad_curricular}
                  helperText={
                    errors.descripcion_unidad_curricular?.message ||
                    "Describa los objetivos y contenido de la unidad curricular"
                  }
                />
              </Grid>
            </Box>

            {/* Áreas de Conocimiento */}
            <Box>
              <Typography
                variant="h6"
                gutterBottom
                sx={{ mb: 3, color: "primary.main" }}
              >
                Áreas de Conocimiento
              </Typography>

              <Controller
                name="areas_conocimiento"
                control={control}
                defaultValue={unidadCurricular.areas_conocimiento}
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
                              key={area.id_area_conocimiento || index}
                              label={area.nombre_area_conocimiento}
                              color="primary"
                              size="medium"
                              deletable
                              onDelete={() => handleEliminarArea(field, index)}
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
                obligatorios. Asegúrese de que la información sea correcta antes
                de guardar.
              </Typography>
            </Alert>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ padding: "16px 24px", gap: 2 }}>
          <CustomButton
            type="button"
            onClick={handleLimpiarFormulario}
            tipo="secondary"
            disabled={isSubmitting}
          >
            Restablecer
          </CustomButton>
          <Box sx={{ flex: 1 }} />
          <CustomButton
            type="button"
            onClick={onClose}
            tipo="secondary"
            disabled={isSubmitting}
          >
            Cancelar
          </CustomButton>
          <CustomButton
            type="submit"
            tipo="primary"
            disabled={!isDirty || isSubmitting}
          >
            {isSubmitting ? "Guardando..." : "Guardar Cambios"}
          </CustomButton>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
