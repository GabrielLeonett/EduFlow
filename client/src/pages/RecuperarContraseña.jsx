import { useState, useEffect } from "react";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import ResponsiveAppBar from "../components/navbar";
import CustomLabel from "../components/customLabel";
import CustomButton from "../components/customButton";
import CircularProgress from "@mui/material/CircularProgress";
import { useTheme } from "@mui/material";
import useApi from "../hook/useApi";
import useSweetAlert from "../hook/useSweetAlert";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import loginSchema from "../schemas/login.schema";
import { useNavigate } from "react-router-dom";

export default function RecuperarContraseña() {
  const theme = useTheme();
  const axios = useApi();
  const alert = useSweetAlert();
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1: Email, 2: Token, 3: Nueva contraseña
  const [processing, setProcessing] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  // Form para email
  const emailForm = useForm({
    resolver: zodResolver(loginSchema.pick({ email: true })),
    mode: "onChange",
    shouldFocusError: true,
  });

  // Form para token y nueva contraseña
  const resetForm = useForm({
    mode: "onChange",
    shouldFocusError: true,
  });

  // Verificar si hay token en la URL (para acceso directo)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");
    const email = urlParams.get("email");

    if (token && email) {
      setUserEmail(decodeURIComponent(email));
      resetForm.setValue("token", token);
      setStep(2);
    }
  }, [resetForm]);

  // Paso 1: Solicitar token
  const onSubmitEmail = async (data) => {
    setProcessing(true);
    try {
      await axios.post("/auth/recuperar-contrasena", { ...data });
      setUserEmail(data.email);
      setStep(2);

      alert.success(
        "Token enviado",
        "Se ha enviado un token de recuperación a tu correo electrónico."
      );
    } catch (error) {
      console.error("Error al solicitar recuperación:", error);
      alert.info(
        "Solicitud procesada",
        "Si el correo existe, recibirás las instrucciones de recuperación."
      );
    } finally {
      setProcessing(false);
    }
  };

  // Paso 2: Verificar token
  const onSubmitToken = async (data) => {
    setProcessing(true);
    try {
      const response = await axios.post("/auth/verificar-token", {
        email: userEmail,
        token: data.token,
      });

      if (response.tokenValido) {
        setStep(3);
        alert.success(
          "Token válido",
          "Ahora puedes crear tu nueva contraseña."
        );
      }
    } catch (error) {
      console.error("Error al verificar token:", error);
      alert.error(
        "Token inválido",
        error.response?.data?.message || "El token es incorrecto o ha expirado."
      );
    } finally {
      setProcessing(false);
    }
  };

  // Paso 3: Cambiar contraseña
  const onSubmitNewPassword = async (data) => {
    setProcessing(true);
    try {
      await axios.put("/auth/cambiar-contrasena", {
        email: userEmail,
        token: resetForm.getValues("token"),
        password: data.nuevaPassword,
      });

      alert.success(
        "Contraseña actualizada",
        "Tu contraseña ha sido cambiada exitosamente. Ahora puedes iniciar sesión."
      );

      // Redirigir al login después de 2 segundos
      setTimeout(() => {
        navigate("/iniciar-sesion");
      }, 2000);
    } catch (error) {
      console.error("Error al cambiar contraseña:", error);
      alert.error(
        "Error",
        error.response?.data?.message || "No se pudo cambiar la contraseña."
      );
    } finally {
      setProcessing(false);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <Box
            component="form"
            onSubmit={emailForm.handleSubmit(onSubmitEmail)}
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 3,
            }}
          >
            <Typography
              variant="body1"
              sx={{
                textAlign: "center",
                color: theme.palette.text.secondary,
                mb: 2,
              }}
            >
              Ingresa tu correo institucional para enviarte un token de
              recuperación.
            </Typography>

            <CustomLabel
              fullWidth
              id="email"
              label="Correo Institucional"
              type="email"
              {...emailForm.register("email")}
              variant="outlined"
              required
              error={!!emailForm.formState.errors.email}
              helperText={
                emailForm.formState.errors.email?.message ||
                "Ejemplo: nombre.apellido@uptamca.edu.ve"
              }
            />

            <CustomButton
              type="submit"
              variant="contained"
              disabled={processing || !emailForm.formState.isValid}
              sx={{
                height: 48,
                borderRadius: 2,
                fontWeight: 500,
              }}
            >
              {processing ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                "Enviar token de recuperación"
              )}
            </CustomButton>
          </Box>
        );

      case 2:
        return (
          <Box
            component="form"
            onSubmit={resetForm.handleSubmit(onSubmitToken)}
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 3,
            }}
          >
            <Typography
              variant="body1"
              sx={{
                textAlign: "center",
                color: theme.palette.text.secondary,
                mb: 2,
              }}
            >
              Se envió un token al correo: <strong>{userEmail}</strong>
            </Typography>

            <CustomLabel
              fullWidth
              id="token"
              label="Token de Verificación"
              type="text"
              {...resetForm.register("token", {
                required: "El token es requerido",
                minLength: {
                  value: 6,
                  message: "El token debe tener al menos 6 caracteres",
                },
              })}
              variant="outlined"
              required
              error={!!resetForm.formState.errors.token}
              helperText={resetForm.formState.errors.token?.message}
              placeholder="Ingresa el token recibido"
            />

            <Box sx={{ display: "flex", gap: 2 }}>
              <CustomButton
                type="button"
                variant="outlined"
                onClick={handleBack}
                disabled={processing}
                sx={{
                  height: 48,
                  borderRadius: 2,
                  fontWeight: 500,
                  flex: 1,
                }}
              >
                Volver
              </CustomButton>

              <CustomButton
                type="submit"
                variant="contained"
                disabled={processing || !resetForm.formState.isValid}
                sx={{
                  height: 48,
                  borderRadius: 2,
                  fontWeight: 500,
                  flex: 2,
                }}
              >
                {processing ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  "Verificar Token"
                )}
              </CustomButton>
            </Box>

            <Typography
              variant="caption"
              sx={{
                textAlign: "center",
                color: theme.palette.text.disabled,
                mt: 1,
              }}
            >
              El token tiene una validez limitada. Revisa tu bandeja de entrada
              o spam.
            </Typography>
          </Box>
        );

      case 3:
        return (
          <Box
            component="form"
            onSubmit={resetForm.handleSubmit(onSubmitNewPassword)}
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 3,
            }}
          >
            <Typography
              variant="body1"
              sx={{
                textAlign: "center",
                color: theme.palette.text.secondary,
                mb: 2,
              }}
            >
              Crea una nueva contraseña para tu cuenta.
            </Typography>

            <CustomLabel
              fullWidth
              id="nuevaPassword"
              label="Nueva Contraseña"
              type="password"
              {...resetForm.register("nuevaPassword", {
                required: "La nueva contraseña es requerida",
                minLength: {
                  value: 8,
                  message: "La contraseña debe tener al menos 8 caracteres",
                },
              })}
              variant="outlined"
              required
              error={!!resetForm.formState.errors.nuevaPassword}
              helperText={resetForm.formState.errors.nuevaPassword?.message}
            />

            <CustomLabel
              fullWidth
              id="confirmarPassword"
              label="Confirmar Contraseña"
              type="password"
              {...resetForm.register("confirmarPassword", {
                required: "Confirma tu contraseña",
                validate: (value) =>
                  value === resetForm.getValues("nuevaPassword") ||
                  "Las contraseñas no coinciden",
              })}
              variant="outlined"
              required
              error={!!resetForm.formState.errors.confirmarPassword}
              helperText={resetForm.formState.errors.confirmarPassword?.message}
            />

            <Box sx={{ display: "flex", gap: 2 }}>
              <CustomButton
                type="button"
                variant="outlined"
                onClick={handleBack}
                disabled={processing}
                sx={{
                  height: 48,
                  borderRadius: 2,
                  fontWeight: 500,
                  flex: 1,
                }}
              >
                Volver
              </CustomButton>

              <CustomButton
                type="submit"
                variant="contained"
                disabled={processing || !resetForm.formState.isValid}
                sx={{
                  height: 48,
                  borderRadius: 2,
                  fontWeight: 500,
                  flex: 2,
                }}
              >
                {processing ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  "Cambiar Contraseña"
                )}
              </CustomButton>
            </Box>
          </Box>
        );

      default:
        return null;
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case 1:
        return "Recuperar Contraseña";
      case 2:
        return "Verificar Token";
      case 3:
        return "Nueva Contraseña";
      default:
        return "Recuperar Contraseña";
    }
  };

  const getStepDescription = () => {
    switch (step) {
      case 1:
        return "Ingresa tu correo para comenzar el proceso";
      case 2:
        return "Ingresa el token que recibiste en tu correo";
      case 3:
        return "Crea una nueva contraseña segura";
      default:
        return "";
    }
  };

  return (
    <>
      <ResponsiveAppBar backgroundColor />

      <Box
        sx={{
          my: 10,
          display: "flex",
          minHeight: "calc(100vh - 64px)",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 3,
            p: 6,
            borderRadius: 2,
            boxShadow: 3,
            backgroundColor: theme.palette.background.paper,
            width: { xs: "100%", md: 480 },
          }}
        >
          {/* Header */}
          <Box sx={{ textAlign: "center", mb: 2 }}>
            <Typography
              variant="h4"
              component="h1"
              sx={{
                fontWeight: 600,
                color: theme.palette.primary.main,
                mb: 1,
              }}
            >
              {getStepTitle()}
            </Typography>

            <Typography
              variant="body2"
              sx={{
                color: theme.palette.text.secondary,
              }}
            >
              {getStepDescription()}
            </Typography>
          </Box>

          {/* Progress Stepper */}
          <Box sx={{ display: "flex", justifyContent: "center", mb: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              {[1, 2, 3].map((stepNumber) => (
                <Box
                  key={stepNumber}
                  sx={{ display: "flex", alignItems: "center" }}
                >
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor:
                        step >= stepNumber
                          ? theme.palette.primary.main
                          : theme.palette.action.disabled,
                      color: theme.palette.common.white,
                      fontWeight: "bold",
                      fontSize: "0.875rem",
                    }}
                  >
                    {stepNumber}
                  </Box>
                  {stepNumber < 3 && (
                    <Box
                      sx={{
                        width: 40,
                        height: 2,
                        backgroundColor:
                          step > stepNumber
                            ? theme.palette.primary.main
                            : theme.palette.action.disabled,
                        mx: 1,
                      }}
                    />
                  )}
                </Box>
              ))}
            </Box>
          </Box>

          {/* Step Content */}
          {renderStepContent()}
        </Box>
      </Box>
    </>
  );
}
