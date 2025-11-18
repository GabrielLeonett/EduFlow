import { useTheme } from "@mui/material/styles";
import { Box, Typography, MenuItem } from "@mui/material";
import { useForm } from "react-hook-form";
import CustomLabel from "../../components/customLabel";
import ResponsiveAppBar from "../../components/navbar";
import sedeSchema from "../../schemas/sede.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import CustomButton from "../../components/customButton"; // 👈 Importamos tu botón
import useApi from "../../hook/useApi"; // Added import for axios
import useSweetAlert from "../../hook/useSweetAlert";
import { useState } from "react";

export default function RegisterSede() {
  const theme = useTheme();
  const {
    register,
    formState: { errors, isValid },
    handleSubmit,
    reset, // 👈 aquí está el reset de react-hook-form
    watch,
  } = useForm({
    resolver: zodResolver(sedeSchema),
    mode: "onChange",
    shouldFocusError: true,
  });
  const axios = useApi();
  const alert = useSweetAlert();
  const [isSubiting, setIsSubiting] = useState(false);

 const onSubmit = async (data) => {
  setIsSubiting(true);

  try {
    // ✅ Confirmación antes de registrar
    const confirm = await alert.confirm(
      "¿Desea registrar esta sede?",
      "Verifique que los datos sean correctos antes de continuar."
    );
    if (!confirm) {
      setIsSubiting(false);
      return; // 👈 Cancela si el usuario no confirma
    }

    // ✅ Envío al servidor
    await axios.post("/sedes", data);

    alert.success(
      "Sede creada con éxito",
      "Se ha registrado la sede exitosamente."
    );

    reset(); // 👈 Limpia el formulario después de registrar
  } catch (error) {
    // ✅ Manejo estandarizado de errores y validaciones
    if (error?.error?.totalErrors > 0) {
      error.error.validationErrors.forEach((error_validacion) => {
        alert.toast(error_validacion.field, error_validacion.message);
      });
    } else {
      alert.error(
        error.title || "Error al registrar la sede",
        error.message || "No se pudo completar el registro. Intente nuevamente."
      );
    }

    console.error("Error al registrar la sede:", error);
  } finally {
    setIsSubiting(false);
  }
};

  return (
    <>
      <ResponsiveAppBar backgroundColor />

      <Box
        className="flex flex-col w-full min-h-screen bg-gray-100 p-4"
        sx={{
          mt: 10,
          display: "flex",
          flexDirection: "column",
          width: "100%",
          minHeight: "screen",
          backgroundColor: theme.palette.background.default,
        }}
      >
        <Typography
          variant="h2"
          component="h1"
          gutterBottom
          sx={{ mt: 4, ml: 6 }} // 👈 Lo subimos un poco
        >
          Registrar Sedes
        </Typography>

        <Box className="flex justify-center items-center flex-grow p-3">
          <Box
            component="form"
            noValidate
            onSubmit={handleSubmit(onSubmit)}
            sx={{
              backgroundColor: theme.palette.background.paper,
              width: "80%",
              padding: "40px", // 👈 menos padding para subirlo
              borderRadius: "25px",
              boxShadow: theme.shadows[10],
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Box className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full px-10 py-6">
              <CustomLabel
                id="nombre de la sede"
                name="nombre_sede"
                label="Nombre de la Sede"
                type="text"
                variant="outlined"
                {...register("nombre_sede")}
                error={!!errors.nombre_sede}
                helperText={
                  errors.nombre_sede?.message ||
                  "Ingrese el nombre de la sede completos"
                }
              />

              <CustomLabel
                select
                id="ciudad de la sede"
                name="ciudad_sede"
                label="Ciudad de la Sede"
                type="text"
                variant="outlined"
                {...register("ciudad_sede")}
                error={!!errors.ciudad_sede}
                helperText={
                  errors.ciudad_sede?.message ||
                  "Seleccione la ciudad donde estara la sede"
                }
              >
                <MenuItem value='Los Teques'>Los Teques</MenuItem>
                <MenuItem value='San antonio'>San Antonio</MenuItem>
                <MenuItem value='Carrizal'>Carrizal</MenuItem>
                <MenuItem value='San Diego'>San Diego</MenuItem>
              </CustomLabel>

              <CustomLabel
                id="ubicacion de la sede"
                name="ubicacion_sede"
                label="Ubicación de la Sede"
                type="text"
                variant="outlined"
                {...register("ubicacion_sede")}
                error={!!errors.ubicacion_sede}
                helperText={
                  errors.ubicacion_sede?.message ||
                  "Ingrese la ubicación de la sede completas"
                }
              />

              <CustomLabel
                id="enlace google maps"
                name="google_sede"
                label="Google Sede"
                type="text"
                variant="outlined"
                {...register("google_sede")}
                error={!!errors.google_sede}
                helperText={
                  errors.google_sede?.message ||
                  "Ingrese el enlace de Google Maps"
                }
              />
            </Box>

            {/* 👇 Botones añadidos */}
            <Box className="flex justify-end gap-4 mt-6 px-10">
              <CustomButton
                type="button"
                variant="outlined"
                color="secondary"
                onClick={() => reset()} // 👈 esto sí limpia el formulario
              >
                Limpiar
              </CustomButton>

              <CustomButton
                type="submit"
                variant="contained"
                color="primary"
                disabled={!isValid && isSubiting}
                onClick={handleSubmit(onSubmit)}
              >
                Registrar
              </CustomButton>
            </Box>
          </Box>
        </Box>
      </Box>
    </>
  );
}
