import { useEffect, useState } from "react";
import { useTheme } from "@mui/material/styles";
import {
  Box,
  Typography,
  Grid,
  Paper,
  MenuItem,
  IconButton,
  Avatar,
  Step,
  Stepper,
  StepLabel,
  LinearProgress,
} from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import PersonIcon from "@mui/icons-material/Person";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import ClearIcon from "@mui/icons-material/Clear";
import dayjs from "dayjs";
import CustomCalendar from "../../../components/customCalendar";
import { profesorSchema } from "../../../schemas/profesor.schema";
import ModalRegisterAreaConocimiento from "../../../components/ModalRegisterAreaConocimiento";
import ModalRegisterPreGrado from "../../../components/ModalRegisterPreGrado";
import ModalRegisterPosGrado from "../../../components/ModalRegisterPosgrado";
import CustomChip from "../../../components/CustomChip";
import useApi from "../../../hook/useApi";
import useSweetAlert from "../../../hook/useSweetAlert";
import CustomLabel from "../../../components/customLabel";
import CustomAutocomplete from "../../../components/CustomAutocomplete";
import CustomButton from "../../../components/customButton";
import ResponsiveAppBar from "../../../components/navbar";

export default function FormRegister() {
  const axios = useApi();
  const theme = useTheme();
  const alert = useSweetAlert();
  
  const {
    register,
    formState: { errors, isValid },
    control,
    handleSubmit,
    trigger,
    watch,
    setValue,
  } = useForm({
    resolver: zodResolver(profesorSchema),
    defaultValues: {
      telefono_local: undefined,
      genero: "masculino",
      dedicacion: "Convencional",
      categoria: "Agregado",
      municipio: "Guaicaipuro",
      areas_de_conocimiento: [],
      pre_grado: [],
      pos_grado: [],
    },
  });

  const [pregrados, setPregrados] = useState([]);
  const [areas, setAreas] = useState([]);
  const [postgrados, setPostgrados] = useState([]);
  const [direction, setDirection] = useState(1);
  const [step, setStep] = useState(1);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Agregamos los estados independientes para cada Modal
  const [openModalArea, setOpenModalArea] = useState(false);
  const [openModalPregrado, setOpenModalPregrado] = useState(false);
  const [openModalPosgrado, setOpenModalPosgrado] = useState(false);

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [areasRes, pregradoRes, postgradoRes] = await Promise.all([
          axios.get("/catalogos/areas-conocimiento"),
          axios.get("/catalogos/pregrados"),
          axios.get("/catalogos/posgrados"),
        ]);
        console.log("Áreas de Conocimiento:", areasRes);
        console.log("Pre-Grados:", pregradoRes);
        console.log("Pos-Grados:", postgradoRes);

        setAreas(areasRes.areas_conocimiento);
        setPregrados(pregradoRes);
        setPostgrados(postgradoRes);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [axios]);
  // Observar campos individuales
  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      return;
    }

    setSelectedImage(file); // ← Guardar el archivo en estado

    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  const onSubmit = async (formData) => {
    setIsSubmitting(true);

    try {
      const dataToSend = new FormData();

      // 1. Agregar campos básicos
      const camposBasicos = [
        "nombres",
        "apellidos",
        "email",
        "cedula",
        "genero",
        "fecha_nacimiento",
        "telefono_movil",
        "telefono_local",
        "direccion",
        "municipio",
        "categoria",
        "dedicacion",
        "fecha_ingreso",
      ];

      camposBasicos.forEach((campo) => {
        if (
          formData[campo] !== null &&
          formData[campo] !== undefined &&
          formData[campo] !== ""
        ) {
          dataToSend.append(campo, formData[campo]);
        }
      });

      // 2. 🔥 CORRECCIÓN: Enviar arrays como JSON stringificado
      if (
        formData.areas_de_conocimiento &&
        formData.areas_de_conocimiento.length > 0
      ) {
        dataToSend.append(
          "areas_de_conocimiento",
          JSON.stringify(formData.areas_de_conocimiento)
        );
      }

      if (formData.pre_grado && formData.pre_grado.length > 0) {
        dataToSend.append("pre_grado", JSON.stringify(formData.pre_grado));
      }

      if (formData.pos_grado && formData.pos_grado.length > 0) {
        dataToSend.append("pos_grado", JSON.stringify(formData.pos_grado));
      }

      // 3. Imagen
      if (selectedImage) {
        dataToSend.append("imagen", selectedImage);
      }
      await axios.post("/profesores", dataToSend);
      alert.success(
        "Profesor registrado con éxito",
        "Ya puede verlo en la lista."
      );
    } catch (error) {
      if (error.error.totalErrors > 0) {
        error.error.validationErrors.map((error_validacion) => {
          alert.toast({
            title: error_validacion.field,
            message: error_validacion.message,
            config: { icon: "error" },
          });
        });
      } else {
        alert.error(error.title, error.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Navigation functions
  const handleNext = async () => {
    const fieldSets = {
      1: [
        "nombres",
        "apellidos",
        "email",
        "cedula",
        "genero",
        "fecha_nacimiento",
      ],
      2: ["areas_de_conocimiento", "pre_grado", "pos_grado"],
      3: ["categoria", "fecha_ingreso", "dedicacion"],
    };
    const isValid = await trigger(fieldSets[step] || []);
    if (isValid) {
      setDirection(1);
      setStep((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    setDirection(-1);
    setStep((prev) => prev - 1);
  };

  // Step components
  const Step1PersonalData = () => (
    <>
      <Typography component="h3" variant="h4" fontWeight="bold" gutterBottom>
        Datos Personales
      </Typography>
      <Typography variant="body1" color="text.secondary" mb={2}>
        Ingresar datos Personales
      </Typography>

      <Grid container rowSpacing={2} columnSpacing={3} p={2}>
        {/* Nombres y Apellidos - En una fila en desktop, en columnas en mobile */}
        <Grid container spacing={2} size={12}>
          <Grid size={{ lg: 6, md: 6, sm: 12 }}>
            <CustomLabel
              id="nombres"
              label="Nombres"
              type="text"
              variant="outlined"
              fullWidth
              {...register("nombres")}
              error={!!errors.nombres}
              helperText={
                errors.nombres?.message || "Ingrese sus nombres completos"
              }
            />
          </Grid>

          <Grid size={{ lg: 6, md: 6, sm: 12 }}>
            <CustomLabel
              id="apellidos"
              label="Apellidos"
              type="text"
              variant="outlined"
              fullWidth
              {...register("apellidos")}
              error={!!errors.apellidos}
              helperText={
                errors.apellidos?.message || "Ingrese sus apellidos completos"
              }
            />
          </Grid>
        </Grid>

        {/* Email y Cédula */}
        <Grid container spacing={2} size={12}>
          <Grid size={{ lg: 6, md: 6, sm: 12 }}>
            <CustomLabel
              id="email"
              label="Email"
              type="email"
              variant="outlined"
              fullWidth
              {...register("email")}
              error={!!errors.email}
              helperText={
                errors.email?.message || "Ejemplo: usuario@dominio.com"
              }
            />
          </Grid>

          <Grid size={{ lg: 6, md: 6, sm: 12 }}>
            <CustomLabel
              id="cedula"
              name="cedula"
              label="Cédula"
              type="text"
              variant="outlined"
              fullWidth
              {...register("cedula", {
                setValueAs: (value) => {
                  if (value === "" || value === undefined) return "";
                  const numericValue = value.toString().replace(/\D/g, "");
                  if (numericValue === "") return "";
                  const num = parseInt(numericValue, 10);
                  return isNaN(num) ? "" : num;
                },
              })}
              error={!!errors.cedula}
              helperText={
                errors.cedula?.message || "Solo números, sin guiones ni puntos"
              }
              inputProps={{
                inputMode: "numeric",
                pattern: "[0-9]*",
                maxLength: 8,
              }}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "");
                e.target.value = value;
              }}
            />
          </Grid>
        </Grid>

        {/* Teléfonos */}
        <Grid container spacing={2} size={12}>
          <Grid size={{ lg: 6, md: 6, sm: 12 }}>
            <CustomLabel
              id="telefono_movil"
              label="Teléfono Móvil"
              type="tel"
              variant="outlined"
              fullWidth
              {...register("telefono_movil")}
              error={!!errors.telefono_movil}
              helperText={
                errors.telefono_movil?.message || "Ejemplo: 04121234567"
              }
            />
          </Grid>

          <Grid size={{ lg: 6, md: 6, sm: 12 }}>
            <Controller
              control={control}
              name="telefono_local"
              defaultValue={undefined}
              render={({ field, fieldState: { error } }) => (
                <CustomLabel
                  {...field}
                  id="telefono_local"
                  label="Teléfono Local"
                  type="tel"
                  variant="outlined"
                  fullWidth
                  value={field.value ?? ""} // 👈 Nullish coalescing
                  onChange={(e) => {
                    field.onChange(e.target.value || undefined); // 👈 Convierte "" a undefined
                  }}
                  error={!!error}
                  helperText={
                    error?.message || "Opcional - Ejemplo: 02121234567"
                  }
                />
              )}
            />
          </Grid>
        </Grid>

        {/* Dirección y Municipio */}
        <Grid container spacing={2} size={12}>
          <Grid size={{ lg: 6, md: 6, sm: 12 }}>
            <CustomLabel
              id="direccion"
              label="Dirección de habitación"
              type="text"
              variant="outlined"
              fullWidth
              {...register("direccion")}
              error={!!errors.direccion}
              helperText={
                errors.direccion?.message || "Dirección completa de residencia"
              }
            />
          </Grid>

          <Grid size={{ lg: 6, md: 6, sm: 12 }}>
            <Controller
              name="municipio"
              control={control}
              defaultValue=""
              rules={{ required: "Seleccione su municipio" }}
              render={({ field, fieldState: { error } }) => (
                <CustomLabel
                  select
                  id="municipio"
                  label="Municipio"
                  variant="outlined"
                  fullWidth
                  {...field}
                  error={!!error}
                  helperText={error?.message || "Seleccione su municipio"}
                >
                  <MenuItem value="">Seleccione</MenuItem>
                  <MenuItem value="Guaicaipuro">Guaicaipuro</MenuItem>
                  <MenuItem value="Los Salias">Los Salias</MenuItem>
                  <MenuItem value="Carrizal">Carrizal</MenuItem>
                </CustomLabel>
              )}
            />
          </Grid>
        </Grid>

        {/* Género y Fecha de Nacimiento */}
        <Grid container spacing={2} size={12}>
          <Grid size={{ lg: 6, md: 6, sm: 12 }}>
            <Controller
              name="genero"
              control={control}
              defaultValue="masculino"
              rules={{ required: "Seleccione su género" }}
              render={({ field, fieldState: { error } }) => (
                <CustomLabel
                  select
                  id="genero"
                  label="Género"
                  variant="outlined"
                  fullWidth
                  {...field}
                  error={!!error}
                  helperText={error?.message || "Seleccione su género"}
                >
                  <MenuItem value="masculino">Masculino</MenuItem>
                  <MenuItem value="femenino">Femenino</MenuItem>
                </CustomLabel>
              )}
            />
          </Grid>

          <Grid size={{ lg: 6, md: 6, sm: 12 }}>
            <Controller
              name="fecha_nacimiento"
              control={control}
              rules={{ required: "Seleccione su fecha de nacimiento" }}
              render={({ field, fieldState: { error } }) => (
                <CustomCalendar
                  label="Fecha de Nacimiento"
                  value={field.value ? dayjs(field.value, "DD-MM-YYYY") : null}
                  onChange={(date) =>
                    field.onChange(date?.format("DD-MM-YYYY"))
                  }
                  maxDate={dayjs().subtract(18, "year")}
                  helperText={
                    error?.message || "Selecciona tu fecha de nacimiento"
                  }
                  error={!!error}
                  fullWidth
                />
              )}
            />
          </Grid>
        </Grid>
      </Grid>
    </>
  );

  const Step2EducationalInfo = () => {
    // Estados locales para manejar los valores de cada campo
    const [areasValor, setAreasValor] = useState(
      watch("areas_de_conocimiento")
    );
    const [pregradosValor, setPregradosValor] = useState(watch("pre_grado"));
    const [posgradosValor, setPosgradosValor] = useState(watch("pos_grado"));

    const handleDeleteArea = (index) => {
      const newAreas = areasValor.filter((_, i) => i !== index);
      setAreasValor(newAreas);
      setValue("areas_de_conocimiento", newAreas); // ✅ Usar setValue
    };

    const handleDeletePregrado = (index) => {
      const newPregrados = pregradosValor.filter((_, i) => i !== index);
      setPregradosValor(newPregrados);
      setValue("pre_grado", newPregrados); // ✅ Usar setValue
    };

    const handleDeletePosgrado = (index) => {
      const newPosgrados = posgradosValor.filter((_, i) => i !== index);
      setPosgradosValor(newPosgrados);
      setValue("pos_grado", newPosgrados); // ✅ Usar setValue
    };

    return (
      <>
        <Typography component="h3" variant="h4" fontWeight="bold" gutterBottom>
          Datos Educativos
        </Typography>
        <Typography variant="body1" color="text.secondary" mb={2}>
          Seleccionar Areas de Conocimiento, Pre-Grados, Pos-Grados(Opcional)
        </Typography>

        <Grid container rowSpacing={2} columnSpacing={3} p={2}>
          {/* Área de Conocimiento */}
          <Grid spacing={2} size={12}>
            <Controller
              name="areas_de_conocimiento"
              control={control}
              render={({ field }) => (
                <>
                  <CustomAutocomplete
                    options={[
                      ...areas,
                      {
                        id_area_conocimiento: "otro",
                        nombre_area_conocimiento: "Otro",
                      },
                    ]}
                    getOptionLabel={(option) =>
                      option.nombre_area_conocimiento || ""
                    }
                    value={null} // Siempre null para que no muestre valor seleccionado
                    onChange={(event, newValue) => {
                      if (newValue) {
                        if (newValue.nombre_area_conocimiento === "Otro") {
                          setOpenModalArea(true);
                        } else {
                          const exists = areasValor.some(
                            (item) =>
                              item.id_area_conocimiento ===
                              newValue.id_area_conocimiento
                          );
                          if (!exists) {
                            const newAreas = [...areasValor, newValue];
                            setAreasValor(newAreas);
                            field.onChange(newAreas);
                          }
                        }
                      }
                    }}
                    renderInput={(params) => (
                      <CustomLabel
                        {...params}
                        label="Áreas de Conocimiento"
                        placeholder="Seleccione un área"
                      />
                    )}
                    isOptionEqualToValue={(option, value) =>
                      option.id_area_conocimiento ===
                      value?.id_area_conocimiento
                    }
                  />

                  {/* CustomChips para áreas seleccionadas */}
                  {areasValor.length > 0 && (
                    <Box
                      sx={{ mt: 2, display: "flex", flexWrap: "wrap", gap: 1 }}
                    >
                      {areasValor.map((area, index) => (
                        <CustomChip
                          variant="outlined"
                          key={area.id_area_conocimiento || index}
                          label={area.nombre_area_conocimiento}
                          color="primary"
                          size="small"
                          deletable
                          onDelete={() => handleDeleteArea(index)}
                        />
                      ))}
                    </Box>
                  )}
                </>
              )}
            />
          </Grid>

          {/* Pregrado */}
          <Grid size={12}>
            <Controller
              name="pre_grado"
              control={control}
              render={({ field }) => (
                <>
                  <CustomAutocomplete
                    options={[
                      ...pregrados,
                      {
                        id_pre_grado: "otro",
                        nombre_pre_grado: "Otro",
                        tipo_pre_grado: "",
                      },
                    ]}
                    getOptionLabel={(option) =>
                      option.tipo_pre_grado &&
                      option.nombre_pre_grado !== "Otro"
                        ? `${option.tipo_pre_grado} ${option.nombre_pre_grado}`
                        : option.nombre_pre_grado
                    }
                    groupBy={(option) => {
                      // Si es la opción "Otro", la ponemos en grupo "Otros"
                      if (option.tipo_pre_grado === "Otro") {
                        return "Otros";
                      }
                      // Para los demás, usamos su tipo_pos_grado
                      return option.tipo_pre_grado || "Sin categoría";
                    }}
                    value={null}
                    onChange={(event, newValue) => {
                      if (newValue) {
                        if (newValue.nombre_pre_grado === "Otro") {
                          setOpenModalPregrado(true);
                        } else {
                          const exists = pregradosValor.some(
                            (item) =>
                              item.id_pre_grado === newValue.id_pre_grado
                          );
                          if (!exists) {
                            const newPregrados = [...pregradosValor, newValue];
                            setPregradosValor(newPregrados);
                            field.onChange(newPregrados);
                          }
                        }
                      }
                    }}
                    renderInput={(params) => (
                      <CustomLabel
                        {...params}
                        label="Pre Grados"
                        placeholder="Seleccione un pregrado"
                      />
                    )}
                    isOptionEqualToValue={(option, value) =>
                      option.id_pre_grado === value?.id_pre_grado
                    }
                    filterOptions={(options, { inputValue }) => {
                      return options.filter(
                        (option) =>
                          option.nombre_pre_grado
                            .toLowerCase()
                            .includes(inputValue.toLowerCase()) ||
                          (option.tipo_pre_grado &&
                            option.tipo_pre_grado
                              .toLowerCase()
                              .includes(inputValue.toLowerCase()))
                      );
                    }}
                  />

                  {/* CustomChips para mostrar seleccionados */}
                  {pregradosValor.length > 0 && (
                    <Box
                      sx={{
                        mt: 2,
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 1,
                      }}
                    >
                      {pregradosValor.map((pregrado, index) => (
                        <CustomChip
                          key={pregrado.id_pre_grado || index}
                          label={`${pregrado.tipo_pre_grado} ${pregrado.nombre_pre_grado}`}
                          color="primary"
                          deletable
                          variant="outlined"
                          onDelete={() => handleDeletePregrado(index)}
                          size="small"
                        />
                      ))}
                    </Box>
                  )}
                </>
              )}
            />
          </Grid>

          {/* Posgrado */}
          <Grid size={12}>
            <Controller
              name="pos_grado"
              control={control}
              render={({ field }) => (
                <>
                  <CustomAutocomplete
                    options={[
                      ...postgrados,
                      {
                        id_pos_grado: "otro",
                        nombre_pos_grado: "Otro",
                        tipo_pos_grado: "Otros", // Agrupar "Otro" en una categoría
                      },
                    ]}
                    getOptionLabel={(option) =>
                      option.tipo_pos_grado &&
                      option.nombre_pos_grado !== "Otro"
                        ? `${option.tipo_pos_grado} ${option.nombre_pos_grado}`
                        : option.nombre_pos_grado
                    }
                    groupBy={(option) => {
                      // Si es la opción "Otro", la ponemos en grupo "Otros"
                      if (option.nombre_pos_grado === "Otro") {
                        return "Otros";
                      }
                      // Para los demás, usamos su tipo_pos_grado
                      return option.tipo_pos_grado || "Sin categoría";
                    }}
                    value={null}
                    onChange={(event, newValue) => {
                      if (newValue) {
                        if (newValue.nombre_pos_grado === "Otro") {
                          setOpenModalPosgrado(true);
                        } else {
                          const exists = posgradosValor.some(
                            (item) =>
                              item.id_pos_grado === newValue.id_pos_grado
                          );
                          if (!exists) {
                            const newPosgrados = [...posgradosValor, newValue];
                            setPosgradosValor(newPosgrados);
                            field.onChange(newPosgrados);
                          }
                        }
                      }
                    }}
                    renderInput={(params) => (
                      <CustomLabel
                        {...params}
                        label="Pos Grados"
                        placeholder="Seleccione un posgrado"
                      />
                    )}
                    isOptionEqualToValue={(option, value) =>
                      option.id_pos_grado === value?.id_pos_grado
                    }
                    filterOptions={(options, { inputValue }) => {
                      return options.filter(
                        (option) =>
                          option.nombre_pos_grado
                            .toLowerCase()
                            .includes(inputValue.toLowerCase()) ||
                          (option.tipo_pos_grado &&
                            option.tipo_pos_grado
                              .toLowerCase()
                              .includes(inputValue.toLowerCase()))
                      );
                    }}
                  />

                  {/* CustomChips para posgrados seleccionados */}
                  {posgradosValor.length > 0 && (
                    <Box
                      sx={{
                        mt: 2,
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 1,
                      }}
                    >
                      {posgradosValor.map((posgrado, index) => (
                        <CustomChip
                          variant="outlined"
                          key={posgrado.id_pos_grado || index}
                          label={`${posgrado.tipo_pos_grado} ${posgrado.nombre_pos_grado}`}
                          color="primary"
                          deletable
                          onDelete={() => handleDeletePosgrado(index)}
                          size="small"
                        />
                      ))}
                    </Box>
                  )}
                </>
              )}
            />
          </Grid>
        </Grid>
        {/* Modal Área */}
        <ModalRegisterAreaConocimiento
          open={openModalArea}
          onClose={() => setOpenModalArea(false)}
          setState={setAreas}
        />

        {/* Modal Pregrado */}
        <ModalRegisterPreGrado
          open={openModalPregrado}
          onClose={() => setOpenModalPregrado(false)}
          setState={setPregrados}
        />

        {/* Modal Posgrado */}
        <ModalRegisterPosGrado
          open={openModalPosgrado}
          onClose={() => setOpenModalPosgrado(false)}
          setState={setPostgrados}
        />
      </>
    );
  };

  const Step3ProfessionalInfo = () => (
    <>
      <Typography component="h3" variant="h4" fontWeight="bold" gutterBottom>
        Datos Profesional
      </Typography>
      <Typography variant="body1" color="text.secondary" mb={2}>
        Seleccionar Fecha de ingreso a la institucion, Dedicación y Categoria
      </Typography>

      <Grid container rowSpacing={2} columnSpacing={3} p={2}>
        <CustomLabel
          select
          id="categoria"
          label="Categoría"
          variant="outlined"
          {...register("categoria")}
          error={!!errors.categoria}
          helperText={
            errors.categoria?.message || "Seleccione la categoría del profesor"
          }
          value={watch("categoria")}
          fullWidth
        >
          <MenuItem value="Instructor">Instructor</MenuItem>
          <MenuItem value="Asistente">Asistente</MenuItem>
          <MenuItem value="Asociado">Asociado</MenuItem>
          <MenuItem value="Agregado">Agregado</MenuItem>
          <MenuItem value="Titular">Titular</MenuItem>
        </CustomLabel>

        <Controller
          name="fecha_ingreso"
          control={control}
          rules={{ required: "Seleccione su fecha de ingreso" }}
          render={({ field, fieldState: { error } }) => (
            <CustomCalendar
              label="Fecha de Ingreso"
              value={field.value ? dayjs(field.value, "DD-MM-YYYY") : null}
              onChange={(date) => field.onChange(date?.format("DD-MM-YYYY"))}
              helperText={error?.message || "Selecciona tu fecha de ingreso"}
              error={!!error}
              fullWidth
            />
          )}
        />

        <CustomLabel
          select
          id="dedicacion"
          label="Dedicación"
          variant="outlined"
          value={watch("dedicacion")}
          {...register("dedicacion")}
          error={!!errors.dedicacion}
          helperText={errors.dedicacion?.message || "Seleccionar la dedicación"}
          fullWidth
        >
          <MenuItem value="Convencional">Convencional</MenuItem>
          <MenuItem value="Medio Tiempo">Medio Tiempo</MenuItem>
          <MenuItem value="Tiempo Completo">Tiempo Completo</MenuItem>
          <MenuItem value="Exclusivo">Exclusivo</MenuItem>
        </CustomLabel>
      </Grid>
    </>
  );

  const Step4ImageUpload = () => (
    <>
      <Typography component="h3" variant="h4" fontWeight="bold" gutterBottom>
        Imagen del Profesor
      </Typography>
      <Typography variant="body1" color="text.secondary" mb={3}>
        Agrega una foto profesional para el perfil del profesor
      </Typography>

      {/* Vista previa de la imagen */}
      <Grid
        container
        sx={{
          display: "flex",
          flexDirection: "column", // ← Dirección columna
          justifyContent: "center",
          alignItems: "center", // ← En lugar de alignContent
          gap: 2,
          height: "100%",
        }}
      >
        {imagePreview ? (
          <Box sx={{ position: "relative", display: "inline-block" }}>
            <Avatar
              src={imagePreview}
              alt="Vista previa de la imagen"
              sx={{
                width: 200,
                height: 200,
                boxShadow: 3,
              }}
            />
            <IconButton
              onClick={handleRemoveImage}
              sx={{
                position: "absolute",
                top: -8,
                right: -8,
                "&:hover": {
                  backgroundColor: "error.dark",
                },
                width: 32,
                height: 32,
              }}
            >
              <ClearIcon />
            </IconButton>
          </Box>
        ) : (
          <Box
            sx={{
              width: 200,
              height: 200,
              border: `2px dashed ${theme.palette.grey[400]}`,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: theme.palette.grey[50],
              flexDirection: "column",
              gap: 1,
            }}
          >
            <PersonIcon sx={{ fontSize: 60, color: "grey.400" }} />
            <Typography variant="body2" color="text.secondary" align="center">
              Sin imagen
            </Typography>
          </Box>
        )}
        {/* Controles de carga */}
        <Grid spacing={2}>
          {/* Datos de formatos */}

          {/* Input de archivo oculto */}
          <input
            type="file"
            id="imagen"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleImageChange}
            style={{ display: "none" }}
          />
          {/* Botón para seleccionar imagen */}
          <label htmlFor="imagen" style={{ width: "100%" }}>
            <CustomButton
              tipo="outlined"
              component="span"
              fullWidth
              startIcon={<CloudUploadIcon />}
              sx={{
                py: 1.5,
                borderStyle: "dashed",
                borderWidth: 2,
                backgroundColor: "background.paper",
                "&:hover": {
                  backgroundColor: "action.hover",
                  borderStyle: "solid",
                },
              }}
            >
              {imagePreview ? "Cambiar Imagen" : "Seleccionar Imagen"}
            </CustomButton>
          </label>
          <Box display={"flex"} flexDirection={"column"} gap={1} mt={3}>
            <Typography variant="subtitle2" gutterBottom>
              Requisitos de la imagen:
            </Typography>
            <Box
              component="ul"
              sx={{
                pl: 2,
                m: 0,
                display: "flex",
                flexDirection: "row",
                gap: 4,
              }}
            >
              <Typography
                component="li"
                variant="caption"
                color="text.secondary"
              >
                Formatos: JPEG, PNG, WebP
              </Typography>
              <Typography
                component="li"
                variant="caption"
                color="text.secondary"
              >
                Tamaño máximo: 5MB
              </Typography>
              <Typography
                component="li"
                variant="caption"
                color="text.secondary"
              >
                Relación aspecto: 1:1 (cuadrada)
              </Typography>
            </Box>
          </Box>
        </Grid>
      </Grid>
    </>
  );

  // Render steps based on current step
  const renderStep = () => {
    switch (step) {
      case 1:
        return <Step1PersonalData />;
      case 2:
        return <Step2EducationalInfo />;
      case 3:
        return <Step3ProfessionalInfo />;
      case 4:
        return <Step4ImageUpload />;
      default:
        return <Step1PersonalData />;
    }
  };

  const steps = [
    { title: "Datos Personal", description: "Datos Basicos del Profesor" },
    {
      title: "Datos Educativa",
      description: "Areas de Conocimiento y Titulos",
    },
    {
      title: "Datos Profesional",
      description: "Categoria, Dedicacion y Fecha de Ingreso",
    },
    {
      title: "Imagen del Profesor",
      description: "Foto de Perfil del Profesor",
    },
  ];

  return (
    <>
      <ResponsiveAppBar backgroundColor />
      <Box
        sx={{
          mt: 12,
          display: "flex",
          flexDirection: "column",
          width: "100%",
          minHeight: "screen",
          backgroundColor: theme.palette.background.default,
        }}
      >
        <Typography variant="h2" component="h1" sx={{ ml: 3 }}>
          Registrar Profesor
        </Typography>
        <Grid
          sx={{
            width: "100%",
            mr: { xs: 2, sm: 2, md: 4 },
            my: 2,
            display: { xs: "none", sm: "block" }, // Ocultar solo en móvil muy pequeño
          }}
        >
          <Stepper activeStep={step - 1} alternativeLabel>
            {steps.map((label, index) => {
              return (
                <Step key={index}>
                  <StepLabel>
                    <Typography variant="subtitle2" component={"p"}>
                      {label.title}
                    </Typography>
                    <Typography variant="caption" component={"p"}>
                      {label.description}
                    </Typography>
                  </StepLabel>
                </Step>
              );
            })}
          </Stepper>
        </Grid>

        <Box sx={{ display: { xs: "block", sm: "none" } }}>
          <Typography variant="body2" color="primary">
            Paso {step} de {steps.length}: {steps[step - 1]?.title}
          </Typography>
          <LinearProgress
            variant="determinate"
            value={(step / steps.length) * 100}
            sx={{ mt: 1 }}
          />
        </Box>
        <Paper
          onSubmit={handleSubmit(onSubmit)}
          encType="multipart/form-data"
          component="form"
          elevation={4}
          sx={{
            m: 3,
            p: 3,
            borderRadius: 5,
          }}
        >
          <AnimatePresence custom={direction} initial={false} mode="wait">
            <motion.div
              key={step}
              layout
              initial={{ opacity: 0, x: 50 * direction }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 * direction }}
              transition={{ type: "tween", duration: 0.3 }}
              style={{
                display: "flex",
                flexDirection: "column",
              }}
            >
              {renderStep()}

              {/* Navigation Buttons */}
              <Grid
                container
                spacing={2}
                sx={{ margin: 3 }}
                justifyContent={"end"}
              >
                {/* Botón Cancelar/Anterior */}
                <Grid size={{ xs: 12, md: 1.8 }}>
                  {step === 1 ? (
                    <CustomButton tipo="secondary" sx={{ width: "100%" }}>
                      Cancelar
                    </CustomButton>
                  ) : (
                    <CustomButton
                      tipo="secondary"
                      onClick={handlePrevious}
                      sx={{ width: "100%" }}
                    >
                      Anterior
                    </CustomButton>
                  )}
                </Grid>

                {/* Botón Siguiente/Registrar */}
                <Grid size={{ xs: 12, md: 1.8 }}>
                  {step < 4 ? (
                    <CustomButton
                      tipo="primary"
                      onClick={handleNext}
                      sx={{ width: "100%" }}
                    >
                      Siguiente
                    </CustomButton>
                  ) : (
                    <CustomButton
                      tipo="primary"
                      type="submit"
                      disabled={!isValid || isSubmitting}
                      sx={{ width: "100%" }}
                    >
                      {isSubmitting ? "Registrando..." : "Registrar"}
                    </CustomButton>
                  )}
                </Grid>
              </Grid>
            </motion.div>
          </AnimatePresence>
        </Paper>
      </Box>
    </>
  );
}
