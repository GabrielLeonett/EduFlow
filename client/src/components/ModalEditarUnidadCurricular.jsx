import {
  Dialog,
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
import ModalRegisterAreaConocimiento from "./ModalRegisterAreaConocimiento";
import ModalRegisterLineaInvestigacion from "./ModalRegisterLineaInves"; 
import { zodResolver } from "@hookform/resolvers/zod";
import UnidadCurricularSchema from "../schemas/unidadcurricular.schema";
import useApi from "../hook/useApi";
import useSweetAlert from "../hook/useSweetAlert";

const getInitialValues = (unidadCurricular) => {
  return {
    id_trayecto: parseInt(unidadCurricular.id_trayecto),
    nombre_unidad_curricular: unidadCurricular?.nombre_unidad_curricular || "",
    codigo_unidad_curricular: unidadCurricular?.codigo_unidad || "",
    descripcion_unidad_curricular:
      unidadCurricular?.descripcion_unidad_curricular || "",
    carga_horas_academicas: unidadCurricular?.horas_clase || "",
    areas_conocimiento: unidadCurricular?.areas_conocimiento || [],
    tipo_unidad: unidadCurricular?.tipo_unidad || "Taller",
    creditos: unidadCurricular?.creditos || 1,
    semanas: unidadCurricular?.semanas || 0,
    hte: parseFloat(unidadCurricular?.hte) || 0,
    hse: parseFloat(unidadCurricular?.hse) || 0,
    hta: parseFloat(unidadCurricular?.hta) || 0,
    hsa: parseFloat(unidadCurricular?.hsa) || 0,
    hti: parseFloat(unidadCurricular?.hti) || 0,
    hsi: parseFloat(unidadCurricular?.hsi) || 0,
    lineas_investigacion: unidadCurricular?.lineas_investigacion || [],
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
  const [lineasDisponibles, setLineasDisponibles] = useState([]);
  const [openModalArea, setOpenModalArea] = useState(false);
  const [openModalLinea, setOpenModalLinea] = useState(false);

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

        // Cargar líneas de investigación
        const lineasRes = await axios.get(`/catalogo/trayectos/${unidadCurricular.id_trayecto}/lineas-investigacion`)
        console.log(lineasRes)
        setLineasDisponibles(lineasRes || []);

        // Resetear formulario con datos actuales
        if (unidadCurricular) {
          reset(getInitialValues(unidadCurricular));
        }
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
      if (
        data.nombre_unidad_curricular !==
        unidadCurricular.nombre_unidad_curricular
      ) {
        datosCambiados.nombre_unidad_curricular = data.nombre_unidad_curricular;
      }

      if (data.codigo_unidad_curricular !== unidadCurricular.codigo_unidad) {
        datosCambiados.codigo_unidad_curricular = data.codigo_unidad_curricular;
      }

      if (
        data.descripcion_unidad_curricular !==
        unidadCurricular.descripcion_unidad_curricular
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

      // Campos adicionales
      if (data.tipo_unidad !== unidadCurricular.tipo_unidad) {
        datosCambiados.tipo_unidad = data.tipo_unidad;
      }

      if (Number(data.creditos) !== Number(unidadCurricular.creditos)) {
        datosCambiados.creditos = Number(data.creditos);
      }

      if (Number(data.semanas) !== Number(unidadCurricular.semanas)) {
        datosCambiados.semanas = Number(data.semanas);
      }

      // Campos de horas
      const camposHoras = ["hte", "hse", "hta", "hsa", "hti", "hsi"];
      camposHoras.forEach((campo) => {
        if (Number(data[campo]) !== Number(unidadCurricular[campo] || 0)) {
          datosCambiados[campo] = Number(data[campo]);
        }
      });

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

      // ✅ Manejar líneas de investigación
      const lineasActualesIds = (unidadCurricular.lineas_investigacion || [])
        .map((linea) => linea.id_linea_investigacion)
        .sort();

      const lineasNuevasIds = (data.lineas_investigacion || [])
        .map((linea) => linea.id_linea_investigacion)
        .sort();

      const lineasCambiaron =
        JSON.stringify(lineasActualesIds) !== JSON.stringify(lineasNuevasIds);

      if (lineasCambiaron) {
        datosCambiados.lineas_investigacion = data.lineas_investigacion;
      }

      console.log("🔄 Campos que cambiaron:", datosCambiados);

      // ✅ Si no hay cambios, mostrar mensaje y salir
      if (Object.keys(datosCambiados).length === 0) {
        alert.info("Sin cambios", "No se detectaron cambios para guardar.");
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
        "Los cambios se guardaron correctamente."
      );

      // ✅ CORREGIDO: Actualizar con la estructura correcta para la card
      const unidadActualizada = {
        ...unidadCurricular,
        // Mapear los nombres del formulario a los nombres de la card
        nombre_unidad_curricular:
          data.nombre_unidad_curricular ||
          unidadCurricular.nombre_unidad_curricular,
        codigo_unidad:
          data.codigo_unidad_curricular || unidadCurricular.codigo_unidad,
        descripcion_unidad_curricular:
          data.descripcion_unidad_curricular ||
          unidadCurricular.descripcion_unidad_curricular,
        horas_clase:
          data.carga_horas_academicas || unidadCurricular.horas_clase,
        tipo_unidad: data.tipo_unidad || unidadCurricular.tipo_unidad,
        creditos: data.creditos || unidadCurricular.creditos,
        semanas: data.semanas || unidadCurricular.semanas,
        hte: data.hte || unidadCurricular.hte,
        hse: data.hse || unidadCurricular.hse,
        hta: data.hta || unidadCurricular.hta,
        hsa: data.hsa || unidadCurricular.hsa,
        hti: data.hti || unidadCurricular.hti,
        hsi: data.hsi || unidadCurricular.hsi,
        areas_conocimiento:
          data.areas_conocimiento || unidadCurricular.areas_conocimiento,
        lineas_investigacion:
          data.lineas_investigacion || unidadCurricular.lineas_investigacion,
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

  const handleSeleccionArea = (field, nuevaArea) => {
    if (nuevaArea) {
      console.log(nuevaArea);
      if (nuevaArea.id_area_conocimiento === "otro") {
        setOpenModalArea(true);
      } else {
        handleAgregarArea(field, nuevaArea);
      }
    }
  };

  // Funciones para Líneas de Investigación
  const handleAgregarLinea = (field, nuevaLinea) => {
    const lineasActuales = field.value || [];
    const existe = lineasActuales.some(
      (linea) =>
        linea.id_linea_investigacion === nuevaLinea.id_linea_investigacion
    );

    if (!existe) {
      const nuevasLineas = [...lineasActuales, nuevaLinea];
      field.onChange(nuevasLineas);
    }
  };

  const handleEliminarLinea = (field, index) => {
    const lineasActuales = field.value || [];
    const nuevasLineas = lineasActuales.filter((_, i) => i !== index);
    field.onChange(nuevasLineas);
  };

  const handleSeleccionLinea = (field, nuevaLinea) => {
    if (nuevaLinea) {
      console.log(nuevaLinea);
      if (nuevaLinea.id_linea_investigacion === "otro") {
        setOpenModalLinea(true);
      } else {
        handleAgregarLinea(field, nuevaLinea);
      }
    }
  };

  // Manejo de cierre de modales
  const handleCerrarModalArea = (nuevaArea) => {
    setOpenModalArea(false);
    if (nuevaArea) {
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

  const handleCerrarModalLinea = (nuevaLinea) => {
    setOpenModalLinea(false);
    if (nuevaLinea) {
      const fetchLineas = async () => {
        try {
          const lineasRes = await axios.get("/catalogos/lineas-investigacion");
          setLineasDisponibles(lineasRes.lineas_investigacion || []);
        } catch (error) {
          console.error("Error actualizando líneas:", error);
        }
      };
      fetchLineas();
    }
  };

  const handleLimpiarFormulario = () => {
    if (unidadCurricular) {
      reset(getInitialValues(unidadCurricular));
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        scroll="paper"
      >
        <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ p: 4 }}>
          <Stack spacing={4}>
            {/* Información Básica */}
            <Box>
              <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
                Información Básica
              </Typography>
              <Grid container spacing={3}>
                <Grid xs={12} md={6}>
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
                <Grid xs={12} md={6}>
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
                <Grid xs={12} md={6}>
                  <Controller
                    name="carga_horas_academicas"
                    control={control}
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
                        <MenuItem value={1}>45min</MenuItem>
                        <MenuItem value={2}>1h 30min</MenuItem>
                        <MenuItem value={3}>2h 15min</MenuItem>
                        <MenuItem value={4}>3h</MenuItem>
                        <MenuItem value={5}>3h 45min</MenuItem>
                        <MenuItem value={6}>4h 30min</MenuItem>
                      </CustomLabel>
                    )}
                  />
                </Grid>
                <Grid xs={12} md={6}>
                  <Controller
                    name="tipo_unidad"
                    control={control}
                    render={({ field, fieldState: { error } }) => (
                      <CustomLabel
                        select
                        id="tipo_unidad"
                        label="Tipo Unidad Curricular *"
                        variant="outlined"
                        fullWidth
                        {...field}
                        error={!!error}
                        helperText={
                          error?.message ||
                          "Seleccione el tipo de unidad curricular"
                        }
                      >
                        <MenuItem value={"Taller"}>{"Taller"}</MenuItem>
                        <MenuItem value={"Proyecto"}>{"Proyecto"}</MenuItem>
                        <MenuItem value={"Asignatura"}>{"Asignatura"}</MenuItem>
                        <MenuItem value={"Seminario"}>{"Seminario"}</MenuItem>
                        <MenuItem value={"Curso"}>{"Curso"}</MenuItem>
                      </CustomLabel>
                    )}
                  />
                </Grid>
              </Grid>
            </Box>

            <Divider />

            <Box>
              <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
                Distribución de Horas y Créditos
              </Typography>
              <Grid container spacing={3}>
                {/* Créditos y Semanas */}
                <Grid container sm={12} lg={4}>
                  <Grid xs={6}>
                    <Controller
                      name="creditos"
                      control={control}
                      render={({ field, fieldState: { error } }) => (
                        <CustomLabel
                          {...field}
                          fullWidth
                          label="Créditos *"
                          variant="outlined"
                          type="number"
                          inputProps={{
                            min: 0,
                            max: 10,
                            step: 0.5,
                          }}
                          onChange={(e) => {
                            const value =
                              e.target.value === ""
                                ? ""
                                : Number(e.target.value);
                            field.onChange(value);
                          }}
                          value={field.value || ""}
                          error={!!error}
                          helperText={
                            error?.message || "Número de créditos (1-10)"
                          }
                        />
                      )}
                    />
                  </Grid>
                  <Grid xs={6}>
                    <Controller
                      name="semanas"
                      control={control}
                      render={({ field, fieldState: { error } }) => (
                        <CustomLabel
                          {...field}
                          fullWidth
                          label="Semanas *"
                          variant="outlined"
                          type="number"
                          inputProps={{
                            min: 0,
                            max: 16,
                            step: 0.5,
                          }}
                          onChange={(e) => {
                            const value =
                              e.target.value === ""
                                ? ""
                                : Number(e.target.value);
                            field.onChange(value);
                          }}
                          value={field.value || ""}
                          error={!!error}
                          helperText={
                            error?.message || "Duración en semanas (1-16)"
                          }
                        />
                      )}
                    />
                  </Grid>
                </Grid>

                {/* HTE y HSE */}
                <Grid container sm={12} lg={4}>
                  <Grid xs={6}>
                    <Controller
                      name="hte"
                      control={control}
                      render={({ field, fieldState: { error } }) => (
                        <CustomLabel
                          {...field}
                          fullWidth
                          label="HTE *"
                          variant="outlined"
                          type="number"
                          inputProps={{
                            min: 0,
                            step: 0.5,
                          }}
                          onChange={(e) => {
                            const value =
                              e.target.value === ""
                                ? ""
                                : Number(e.target.value);
                            field.onChange(value);
                          }}
                          value={field.value || ""}
                          error={!!error}
                          helperText={
                            error?.message || "Horas Teóricas Presenciales"
                          }
                        />
                      )}
                    />
                  </Grid>
                  <Grid xs={6}>
                    <Controller
                      name="hse"
                      control={control}
                      render={({ field, fieldState: { error } }) => (
                        <CustomLabel
                          {...field}
                          fullWidth
                          label="HSE *"
                          variant="outlined"
                          type="number"
                          inputProps={{
                            min: 0,
                            step: 0.5,
                          }}
                          onChange={(e) => {
                            const value =
                              e.target.value === ""
                                ? ""
                                : Number(e.target.value);
                            field.onChange(value);
                          }}
                          value={field.value || ""}
                          error={!!error}
                          helperText={
                            error?.message || "Horas Semipresenciales"
                          }
                        />
                      )}
                    />
                  </Grid>
                </Grid>

                {/* HTA y HSA */}
                <Grid container sm={12} lg={4}>
                  <Grid xs={6}>
                    <Controller
                      name="hta"
                      control={control}
                      render={({ field, fieldState: { error } }) => (
                        <CustomLabel
                          {...field}
                          fullWidth
                          label="HTA *"
                          variant="outlined"
                          type="number"
                          inputProps={{
                            min: 0,
                            step: 0.5,
                          }}
                          onChange={(e) => {
                            const value =
                              e.target.value === ""
                                ? ""
                                : Number(e.target.value);
                            field.onChange(value);
                          }}
                          value={field.value || ""}
                          error={!!error}
                          helperText={
                            error?.message || "Horas Trabajo Autónomo"
                          }
                        />
                      )}
                    />
                  </Grid>
                  <Grid xs={6}>
                    <Controller
                      name="hsa"
                      control={control}
                      render={({ field, fieldState: { error } }) => (
                        <CustomLabel
                          {...field}
                          fullWidth
                          label="HSA *"
                          variant="outlined"
                          type="number"
                          inputProps={{
                            min: 0,
                            step: 0.5,
                          }}
                          onChange={(e) => {
                            const value =
                              e.target.value === ""
                                ? ""
                                : Number(e.target.value);
                            field.onChange(value);
                          }}
                          value={field.value || ""}
                          error={!!error}
                          helperText={
                            error?.message || "Horas Servicio/Seminario"
                          }
                        />
                      )}
                    />
                  </Grid>
                </Grid>

                {/* HTI y HSI */}
                <Grid container sm={12} lg={4}>
                  <Grid xs={6}>
                    <Controller
                      name="hti"
                      control={control}
                      render={({ field, fieldState: { error } }) => (
                        <CustomLabel
                          {...field}
                          fullWidth
                          label="HTI *"
                          variant="outlined"
                          type="number"
                          inputProps={{
                            min: 0,
                            step: 0.5,
                          }}
                          onChange={(e) => {
                            const value =
                              e.target.value === ""
                                ? ""
                                : Number(e.target.value);
                            field.onChange(value);
                          }}
                          value={field.value || ""}
                          error={!!error}
                          helperText={error?.message || "Horas Tutoría/Taller"}
                        />
                      )}
                    />
                  </Grid>
                  <Grid xs={6}>
                    <Controller
                      name="hsi"
                      control={control}
                      render={({ field, fieldState: { error } }) => (
                        <CustomLabel
                          {...field}
                          fullWidth
                          label="HSI *"
                          variant="outlined"
                          type="number"
                          inputProps={{
                            min: 0,
                            step: 0.5,
                          }}
                          onChange={(e) => {
                            const value =
                              e.target.value === ""
                                ? ""
                                : Number(e.target.value);
                            field.onChange(value);
                          }}
                          value={field.value || ""}
                          error={!!error}
                          helperText={
                            error?.message || "Horas Seminario Investigación"
                          }
                        />
                      )}
                    />
                  </Grid>
                </Grid>
              </Grid>

              {/* Información adicional sobre las horas */}
              <Alert severity="info" sx={{ mt: 2, borderRadius: 2 }}>
                <Typography variant="body2">
                  <strong>Nota:</strong> La suma total de todas las horas (HTE,
                  HSE, HTA, HSA, HTI, HSI) debe ser mayor a 0.
                </Typography>
              </Alert>
            </Box>

            <Divider />

            {/* Descripción y Carga Horaria */}
            <Box>
              <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
                Detalles Adicionales
              </Typography>
              <Grid xs={12}>
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
                        handleSeleccionArea(field, nuevaArea)
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

            <Divider />

            {/* Líneas de Investigación */}
            <Box>
              <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
                Líneas de Investigación
              </Typography>

              <Controller
                name="lineas_investigacion"
                control={control}
                render={({ field }) => (
                  <Stack spacing={2}>
                    <CustomAutocomplete
                      options={[
                        ...lineasDisponibles,
                        {
                          id_linea_investigacion: "otro",
                          nombre_linea_investigacion:
                            "➕ Registrar nueva línea",
                        },
                      ]}
                      getOptionLabel={(option) =>
                        option.nombre_linea_investigacion || ""
                      }
                      value={null}
                      onChange={(event, nuevaLinea) =>
                        handleSeleccionLinea(field, nuevaLinea)
                      }
                      renderInput={(params) => (
                        <CustomLabel
                          {...params}
                          label="Seleccionar Líneas de Investigación *"
                          placeholder="Busque y seleccione las líneas..."
                          error={!!errors.lineas_investigacion}
                          helperText={
                            errors.lineas_investigacion?.message ||
                            "Seleccione al menos una línea de investigación"
                          }
                        />
                      )}
                      isOptionEqualToValue={(option, value) =>
                        option.id_linea_investigacion ===
                        value?.id_linea_investigacion
                      }
                    />

                    {/* Líneas seleccionadas */}
                    {field.value && field.value.length > 0 && (
                      <Box>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          gutterBottom
                        >
                          Líneas seleccionadas ({field.value.length}):
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
                          {field.value.map((linea, index) => (
                            <CustomChip
                              key={linea.id_linea_investigacion}
                              label={linea.nombre_linea_investigacion}
                              color="secondary"
                              size="medium"
                              deletable
                              onDelete={() => handleEliminarLinea(field, index)}
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
                tipo="secondary"
                onClick={()=>{
                  console.log('Errors: ', errors)
                }}
                disabled={isSubmitting}
                sx={{ minWidth: 120 }}
              >
                Debug
              </CustomButton>
              <CustomButton
                tipo="primary"
                type="submit"
                disabled={!isDirty || isSubmitting}
                sx={{ minWidth: 200 }}
              >
                {isSubmitting ? "Guardando..." : "Guardar Unidad Curricular"}
              </CustomButton>
            </Box>
          </Stack>
        </Box>
      </Dialog>
      <ModalRegisterAreaConocimiento
        setState={setAreasDisponibles}
        open={openModalArea}
        onClose={handleCerrarModalArea}
      />

      <ModalRegisterLineaInvestigacion
        setState={setLineasDisponibles}
        id_trayecto={unidadCurricular.id_trayecto}
        open={openModalLinea}
        onClose={handleCerrarModalLinea}
      />
    </>
  );
}
