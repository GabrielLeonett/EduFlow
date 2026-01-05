import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import ContraseñaSchema from "../schemas/contrasenia.schema";
import CustomLabel from "../components/customLabel";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import ResponsiveAppBar from "../components/navbar";
import CircularProgress from "@mui/material/CircularProgress";
import CustomButton from "../components/customButton";
import { useTheme } from "@mui/material";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useApi from "../hook/useApi"; // Added import for axios
import useSweetAlert from "../hook/useSweetAlert";

export default function CambiarContraseña() {
  const axios = useApi();
  const theme = useTheme();
  const alert = useSweetAlert();
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    trigger,
  } = useForm({
    resolver: zodResolver(ContraseñaSchema),
    mode: "onChange",
    shouldFocusError: true,
  });

  const onSubmit = async (formData) => {
    try {
      setProcessing(true);
      await axios.put("/auth/cambiar-contrasena", formData);
      alert.success(
        "Cambio de contraseña Exitoso",
        "Se ha realizado el cambio de contraseña"
      );
      navigate("/");
    } finally {
      setProcessing(false);
    }
  };

  const handleCancelar = () => {
    navigate(-1); // Volver a la página anterior
  };

  return (
    <>
      <ResponsiveAppBar backgroundColor />

      <Box className="my-10 flex min-h-[calc(100vh-64px)] items-center justify-center">
        <Box
          component="form"
          noValidate
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col justify-around gap-6 rounded-2xl p-12 shadow-2xl sm:w-full md:w-140"
          sx={{
            backgroundColor: theme.palette.background.paper,
            boxShadow: 3,
            borderRadius: 2,
          }}
          autoComplete="on"
        >
          <Typography
            variant="h4"
            component="h1"
            className="text-center font-bold"
            sx={{ fontWeight: 600, color: theme.palette.primary.main }}
          >
            Cambiar Contraseña
          </Typography>

          <Typography
            variant="body1"
            className="text-center"
            sx={{ color: theme.palette.text.secondary, marginBottom: 3 }}
          >
            Ingresa tu nueva contraseña
          </Typography>

          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 3,
              marginBottom: 2,
            }}
          >
            <CustomLabel
              fullWidth
              id="antigua_password"
              label="Antigua Contraseña"
              type="password"
              variant="outlined"
              {...register("antigua_password")}
              error={!!errors.antigua_password}
              helperText={
                errors.antigua_password?.message ||
                "Mínimo 8 caracteres alfanuméricos"
              }
            />

            <CustomLabel
              fullWidth
              id="password"
              label="Nueva Contraseña"
              type="password"
              variant="outlined"
              {...register("password")}
              error={!!errors.password}
              helperText={
                errors.password?.message || "Mínimo 8 caracteres alfanuméricos"
              }
            />

            <CustomLabel
              fullWidth
              id="repetir_password"
              label="Repetir Contraseña"
              type="password"
              variant="outlined"
              {...register("repetir_password")}
              error={!!errors.repetir_password}
              helperText={
                errors.repetir_password?.message ||
                "Confirma tu nueva contraseña"
              }
            />
          </Box>

          {errors.root && (
            <Typography color="error" className="mb-4 text-center">
              {errors.root.message}
            </Typography>
          )}

          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              gap: 2,
              marginTop: 2,
            }}
          >
            <CustomButton
              type="button"
              variant="outlined"
              className="h-12 flex-1 rounded-xl font-medium"
              onClick={handleCancelar}
              disabled={processing}
              tipo="secondary"
            >
              Cancelar
            </CustomButton>

            <CustomButton
              type="submit"
              variant="contained"
              className="h-12 flex-1 rounded-xl font-medium"
              disabled={processing || !isValid}
              onClick={async () => {
                await trigger(); // Forzar validación
              }}
            >
              {processing ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                "Cambiar Contraseña"
              )}
            </CustomButton>
          </Box>

          <Typography
            variant="caption"
            className="text-center"
            sx={{
              color: theme.palette.text.disabled,
              marginTop: 2,
              display: "block",
            }}
          >
            La contraseña debe contener letras, números y tener al menos 8
            caracteres.
          </Typography>
        </Box>
      </Box>
    </>
  );
}
