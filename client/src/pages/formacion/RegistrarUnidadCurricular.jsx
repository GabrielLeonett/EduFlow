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
import ModalRegisterLineaInvestigacion from "../../components/ModalRegisterLineaInves"; // Importa el nuevo modal
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
  const [lineasDisponibles, setLineasDisponibles] = useState([]);
  const [openModalArea, setOpenModalArea] = useState(false);
  const [openModalLinea, setOpenModalLinea] = useState(false);
  const location = useLocation();
  const { idTrayecto } = location.state;
  const axios = useApi(true);
  const alert = useSweetAlert();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [areasRes, lineasRes] = await Promise.all([
          axios.get("/catalogos/areas-conocimiento"),
          axios.get(`/catalogo/trayectos/${idTrayecto}/lineas-investigacion`),
        ]);

        console.log("Áreas de Conocimiento:", areasRes);
        console.log("Líneas de Investigación:", lineasRes);

        setAreasDisponibles(areasRes.areas_conocimiento || []);
        setLineasDisponibles(lineasRes.lineas_investigacion || lineasRes || []);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [axios, idTrayecto]); // 👈 Agregar idTrayecto como dependencia

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isValid },
  } = useForm({
    resolver: zodResolver(UnidadCurricularSchema),
    mode: "onChange",
    defaultValues: {
      id_trayecto: idTrayecto,
    },
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

  // Funciones para Áreas de Conocimiento
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
                  <Grid size={{ xs: 12, md: 6 }}>
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
                  <Grid size={{ xs: 12, md: 6 }}>
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
                  <Grid size={{ xs: 12, md: 6 }}>
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
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Controller
                      name="tipo_unidad"
                      control={control}
                      defaultValue={"Taller"}
                      rules={{
                        required: "Se requiere el tipo de unidad curricular.",
                      }}
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
                            error?.message || "Seleccione las horas academicas"
                          }
                        >
                          <MenuItem value={"Taller"}>{"Taller"}</MenuItem>
                          <MenuItem value={"Proyecto"}>{"Proyecto"}</MenuItem>
                          <MenuItem value={"Asignatura"}>
                            {"Asignatura"}
                          </MenuItem>
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
                  <Grid container size={{ sm: 12, lg: 4 }}>
                    <Grid size={6}>
                      <Controller
                        name="creditos"
                        control={control}
                        defaultValue={1}
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
                    <Grid size={6}>
                      <Controller
                        name="semanas"
                        control={control}
                        defaultValue={0}
                        render={({ field, fieldState: { error } }) => (
                          <CustomLabel
                            {...field}
                            fullWidth
                            label="Semanas *"
                            variant="outlined"
                            type="number"
                            inputProps={{
                              min: 0,
                              max: 50,
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
                              error?.message || "Duración en semanas (1-50)"
                            }
                          />
                        )}
                      />
                    </Grid>
                  </Grid>

                  {/* HTE y HSE */}
                  <Grid container size={{ sm: 12, lg: 4 }}>
                    <Grid size={6}>
                      <Controller
                        name="hte"
                        control={control}
                        defaultValue={0}
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
                    <Grid size={6}>
                      <Controller
                        name="hse"
                        control={control}
                        defaultValue={0}
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
                  <Grid container size={{ sm: 12, lg: 4 }}>
                    <Grid size={6}>
                      <Controller
                        name="hta"
                        control={control}
                        defaultValue={0}
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
                    <Grid size={6}>
                      <Controller
                        name="hsa"
                        control={control}
                        defaultValue={0}
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
                  <Grid container size={{ sm: 12, lg: 4 }}>
                    <Grid size={6}>
                      <Controller
                        name="hti"
                        control={control}
                        defaultValue={0}
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
                            helperText={
                              error?.message || "Horas Tutoría/Taller"
                            }
                          />
                        )}
                      />
                    </Grid>
                    <Grid size={6}>
                      <Controller
                        name="hsi"
                        control={control}
                        defaultValue={0}
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
                    <strong>Nota:</strong> La suma total de todas las horas
                    (HTE, HSE, HTA, HSA, HTI, HSI) debe ser mayor a 0.
                  </Typography>
                </Alert>
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

              <Divider />

              {/* Líneas de Investigación */}
              <Box>
                <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
                  Líneas de Investigación
                </Typography>

                <Controller
                  name="lineas_investigacion"
                  control={control}
                  defaultValue={[]}
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
                                onDelete={() =>
                                  handleEliminarLinea(field, index)
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
        setState={setAreasDisponibles}
        open={openModalArea}
        onClose={handleCerrarModalArea}
      />

      <ModalRegisterLineaInvestigacion
        setState={setLineasDisponibles}
        id_trayecto={idTrayecto}
        open={openModalLinea}
        onClose={handleCerrarModalLinea}
      />
    </>
  );
}
