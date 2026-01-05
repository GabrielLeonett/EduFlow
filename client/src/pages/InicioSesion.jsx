import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import loginSchema from "../schemas/login.schema";
import CustomLabel from "../components/customLabel";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import ResponsiveAppBar from "../components/navbar";
import CircularProgress from "@mui/material/CircularProgress";
import CustomButton from "../components/customButton";
import { useState } from "react";
import { useAuth } from "../hook/useAuth";
import { useTheme } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";
import {
  InputAdornment,
  IconButton,
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
} from "@mui/icons-material";

export default function InicioSesion() {
  const theme = useTheme();
  const [processing, setProcessing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    trigger,
  } = useForm({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
    shouldFocusError: true,
  });

  const { login } = useAuth();

  const handleClickShowPassword = () => {
    setShowPassword((show) => !show);
  };

  const handleMouseDownPassword = (event) => {
    event.preventDefault();
  };

  const onSubmit = async (formData) => {
    setProcessing(true);
    try {
      await login(formData);
    } catch (error) {
      console.error("Error en login:", error);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <>
      <ResponsiveAppBar backgroundColor />

      <Box className="my-10 flex min-h-[calc(100vh-64px)] items-center justify-center ">
        <Box
          component="form"
          noValidate
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col justify-around gap-4 rounded-2xl p-20 shadow-2xl sm:w-full md:w-140"
          sx={{
            backgroundColor: theme.palette.background.paper,
            boxShadow: 3,
            borderRadius: 2,
          }}
          autoComplete="off"
        >
          <Typography
            variant="h5"
            component="h1"
            className="my-10 text-center font-bold"
            sx={{ fontWeight: 600 }}
          >
            Inicio de sesión
          </Typography>

          {/* Campo Email */}
          <Box className="mb-5 w-full">
            <CustomLabel
              fullWidth
              id="email"
              label="Email"
              type="email"
              variant="outlined"
              {...register("email")}
              error={!!errors.email}
              helperText={errors.email?.message || "Ej: usuario@dominio.com"}
            />
          </Box>

          {/* ✅ Campo Contraseña CORREGIDO - solo CustomLabel */}
          <Box className="mb-6 w-full">
            <CustomLabel
              fullWidth
              id="password"
              label="Contraseña"
              type={showPassword ? "text" : "password"}
              variant="outlined"
              {...register("password")}
              error={!!errors.password}
              helperText={errors.password?.message || "Ingresa tu contraseña"}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label={
                        showPassword
                          ? "Ocultar contraseña"
                          : "Mostrar contraseña"
                      }
                      onClick={handleClickShowPassword}
                      onMouseDown={handleMouseDownPassword}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          {errors.root && (
            <Typography color="error" className="mb-4 text-center">
              {errors.root.message}
            </Typography>
          )}

          <CustomButton
            type="submit"
            variant="contained"
            className="h-15 w-full rounded-xl py-3 font-medium"
            disabled={processing || !isValid}
            onClick={async () => {
              await trigger();
            }}
          >
            {processing ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              "Ingresar"
            )}
          </CustomButton>

          <Typography
            onClick={() => {
              navigate("/recuperar-contrasena");
            }}
            sx={{ 
              cursor: "pointer", 
              color: theme.palette.primary.main,
              '&:hover': {
                textDecoration: 'underline'
              }
            }}
            variant="body2"
            className="mt-6 text-center"
          >
            ¿Olvidaste tu contraseña?
          </Typography>
        </Box>
      </Box>
    </>
  );
}