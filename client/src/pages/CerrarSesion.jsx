import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import ResponsiveAppBar from "../components/navbar";
import CustomButton from "../components/customButton";
import { useTheme } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";

export default function CerrarSesion() {
  const theme = useTheme();
  const navigate = useNavigate();

  return (
    <>
      <ResponsiveAppBar backgroundColor />

      <Box className="my-10 flex min-h-[calc(100vh-64px)] items-center justify-center">
        <Box
          className="flex flex-col items-center gap-6 rounded-2xl p-12 shadow-2xl sm:w-full md:w-120"
          sx={{
            backgroundColor: theme.palette.background.paper,
            boxShadow: 3,
            borderRadius: 2,
          }}
        >
          <Typography
            variant="h4"
            component="h1"
            className="text-center font-bold"
            sx={{ fontWeight: 600 }}
          >
            Sesión Cerrada
          </Typography>

          <Typography
            variant="body1"
            className="text-center"
            sx={{ color: theme.palette.text.secondary }}
          >
            Has salido de tu cuenta exitosamente.
          </Typography>

          <CustomButton
            variant="contained"
            className="h-12 w-full rounded-xl py-3 font-medium"
            onClick={() => navigate("/")}
          >
            Ir al Inicio
          </CustomButton>
        </Box>
      </Box>
    </>
  );
}
