import { useEffect } from "react";
import { Box, Button } from "@mui/material";
import NavBar from "../../components/navbar";
import SkeletonProfesores from "../../components/SkeletonProfesores";
import { useTour } from "../../hook/useTour"; // 👈 Importa el hook

export default function PaginaPruebas() {
  // 👇 Definimos los pasos del tour
  const { startTour, resetTour } = useTour(
    [
      {
        intro: "👋 Bienvenido al modo de prueba del tour con Intro.js",
      },
      {
        element: "#nav-bar",
        intro: "Esta es la barra de navegación del sistema.",
        position: "bottom",
      },
      {
        element: "#skeleton-uno",
        intro: "Aquí se muestra un componente de carga tipo skeleton.",
        position: "right",
      },
      {
        element: "#btn-reiniciar-tour",
        intro: "Haz clic aquí si quieres volver a ver el tutorial.",
        position: "top",
      },
    ],
    "tourPaginaPruebas" // Clave única para este módulo
  );

  // 👇 Inicia el tour automáticamente al cargar la página
  useEffect(() => {
    startTour();
  }, []);

  return (
    <>
      {/* Agrega un ID para que el tour lo reconozca */}
      <div id="nav-bar">
        <NavBar backgroundColor />
      </div>

      <Box
        sx={{
          mt: 8,
          display: "flex",
          flexDirection: "row",
          justifyContent: "center",
          alignContent: "center",
          gap: 3,
        }}
      >
        {/* IDs únicos para que intro.js pueda referenciarlos */}
        <div id="skeleton-uno">
          <SkeletonProfesores />
        </div>
        <SkeletonProfesores />
        <SkeletonProfesores />
      </Box>

      <Box sx={{ textAlign: "center", mt: 4 }}>
        <Button
          id="btn-reiniciar-tour"
          variant="contained"
          color="primary"
          onClick={resetTour}
        >
          Volver a ver el tutorial
        </Button>
      </Box>
    </>
  );
}
