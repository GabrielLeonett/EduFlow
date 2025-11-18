import { useState } from "react";
import { useTheme } from "@mui/material/styles";
import {
  Avatar,
  Box,
  Grid,
  Paper,
  Typography,
  IconButton,
} from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import CustomCalendar from "../../../components/customCalendar";
import { Controller, useForm } from "react-hook-form";
import CustomLabel from "../../../components/customLabel";
import CustomButton from "../../../components/customButton";
import ResponsiveAppBar from "../../../components/navbar";
import MenuItem from "@mui/material/MenuItem";
import { zodResolver } from "@hookform/resolvers/zod";
import adminSchema from "../../../schemas/admin.schema";
import dayjs from "dayjs";
import useApi from "../../../hook/useApi";
import useSweetAlert from "../../../hook/useSweetAlert";
import ClearIcon from "@mui/icons-material/Clear";
import {
  Cloud as CloudUploadIcon,
  Person as PersonIcon,
  School, // Director Curricular
  Groups, // Gestión Docente
  AssignmentInd, // Secretaria
} from "@mui/icons-material";


export default function RegistraAdministrador() {
  const axios = useApi(false);
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
    resolver: zodResolver(adminSchema),
    defaultValues: {
      telefono_local: "",
      genero: "masculino",
      municipio: "Guaicaipuro",
    },
  });
  const [direction, setDirection] = useState(1);
  const [step, setStep] = useState(1);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

    // DEBUG: Ver qué contiene el formulario
    console.log("📋 Datos del formulario:", formData);
    console.log("❌ Errores:", errors);
    console.log("✅ Es válido:", isValid);
    console.log("🎯 Rol seleccionado:", formData.roles);

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

      // 2. Rol - VERIFICA QUE NO SEA NULL
      if (formData.roles) {
        dataToSend.append("roles", JSON.stringify(formData.roles));
      } else {
        console.log("⚠️ No hay rol seleccionado");
      }

      // 3. Imagen
      if (selectedImage) {
        dataToSend.append("imagen", selectedImage);
      }

      // DEBUG: Ver qué se va a enviar
      for (let [key, value] of dataToSend.entries()) {
        console.log(`📤 ${key}:`, value);
      }

      await axios.post("/admins", dataToSend);
      alert.success(
        "Administrador registrado con éxito",
        "Ya puede verlo en la lista."
      );
    } catch (error) {
      console.log("❌ Error completo:", error);
      if (error.error?.totalErrors > 0) {
        error.error.validationErrors.forEach((error_validacion) => {
          alert.toast(error_validacion.field, error_validacion.message);
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
        "telefono_movil",
        "direccion",
        "email",
        "cedula",
        "genero",
        "fecha_nacimiento",
      ],
      2: ["roles"],
    };

    const isValid = await trigger(fieldSets[step]);
    console.log(`🔍 Paso ${step} válido:`, isValid);
    console.log(`🔍 Errores en paso ${step}:`, errors);

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
            <CustomLabel
              id="telefono_local"
              label="Teléfono Local"
              type="tel"
              variant="outlined"
              fullWidth
              {...register("telefono_local")}
              error={!!errors.telefono_local}
              helperText={
                errors.telefono_local?.message ||
                "Opcional - Ejemplo: 02121234567"
              }
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

  const Step2PersonalData = () => {
    const rolSeleccionado = watch("roles"); // Ahora es un objeto simple

    // Opciones de roles con iconos
    const opcionesRoles = [
      {
        id_rol: 7,
        nombre_rol: "Director/a de gestión Curricular",
        icon: <School sx={{ fontSize: 40 }} />,
        descripcion: "Gestiona planes de estudio",
      },
      {
        id_rol: 8,
        nombre_rol: "Director/a de Gestión Permanente y Docente",
        icon: <Groups sx={{ fontSize: 40 }} />,
        descripcion: "Administra cuerpo docente",
      },
      {
        id_rol: 9,
        nombre_rol: "Secretari@ Vicerrect@r",
        icon: <AssignmentInd sx={{ fontSize: 40 }} />,
        descripcion: "Apoyo administrativo",
      },
    ];

    const handleRoleSelect = (rol) => {
      if (rolSeleccionado && rolSeleccionado.id_rol === rol.id_rol) {
        // Si ya está seleccionado, lo deseleccionamos
        setValue("roles", null);
      } else {
        // Seleccionamos el nuevo rol
        setValue("roles", rol);
      }
    };

    const isRoleSelected = (rol) => {
      return rolSeleccionado && rolSeleccionado.id_rol === rol.id_rol;
    };

    return (
      <>
        <Typography component="h3" variant="h4" fontWeight="bold" gutterBottom>
          Roles de Administrador
        </Typography>
        <Typography variant="body1" color="text.secondary" mb={2}>
          Selecciona un rol administrativo para este usuario
        </Typography>

        <Controller
          name="roles"
          control={control}
          render={() => (
            <Grid
              container
              spacing={3}
              justifyContent={"center"}
              alignContent={"center"}
            >
              {opcionesRoles.map((rol) => (
                <Grid lg={6} md={6} xs={6} sm={12} key={rol.id_rol}>
                  <CustomButton
                    tipo={isRoleSelected(rol) ? "primary" : "outlined"}
                    onClick={() => handleRoleSelect(rol)}
                    sx={{
                      width: { xs: "100%", sm: 350 },
                      height: { xs: "100%", sm: 150 },
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 1,
                      p: 3,
                    }}
                  >
                    {rol.icon}
                    <Box textAlign="center">
                      <Typography variant="subtitle1" fontWeight="medium">
                        {rol.nombre_rol}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          color: isRoleSelected(rol)
                            ? "primary.contrastText"
                            : "text.secondary",
                        }}
                      >
                        {rol.descripcion}
                      </Typography>
                    </Box>
                  </CustomButton>
                </Grid>
              ))}
            </Grid>
          )}
        />
      </>
    );
  };

  const Step3ImageUpload = () => (
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
          {/* Información de formatos */}

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
        return <Step2PersonalData />;
      case 3:
        return <Step3ImageUpload />;
      default:
        return <Step1PersonalData />;
    }
  };

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
          Registrar Administrador
        </Typography>

        <Paper
          onSubmit={handleSubmit(onSubmit)}
          encType="multipart/form-data"
          component="form"
          elevation={4}
          sx={{
            m: 3,
            p: 5,
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
                  {step < 3 ? (
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
