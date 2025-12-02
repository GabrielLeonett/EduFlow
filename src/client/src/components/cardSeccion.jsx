import { Typography, Box } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import Brightness5Icon from "@mui/icons-material/Brightness5"; // Sol
import WbTwilightIcon from "@mui/icons-material/WbTwilight"; // Tarde
import NightsStayIcon from "@mui/icons-material/NightsStay"; // Noche
import AlertTurno from "./alertTurno";
import { useState } from "react";
import { useEffect } from "react";

export default function CardSeccion({ seccion }) {
  const theme = useTheme();
  const [openAlert, setOpenAlert] = useState(false);
  const [turno, setTurno] = useState(seccion.nombre_turno);

  // Determinar el icono según el turno
  let IconoTurno = null;
  if (turno === "Matutino")
    IconoTurno = (
      <Brightness5Icon
        sx={{
          color: "#FFD700",
          position: "absolute",
          top: -50,
          left: 250,
          fontSize: "8rem",
          opacity: 0.6,
          zIndex: 0,
        }}
      />
    );
  else if (turno === "Vespertino")
    IconoTurno = (
      <WbTwilightIcon
        sx={{
          color: "#FF8C00",
          position: "absolute",
          top: 0,
          left: 250,
          fontSize: "8rem",
          opacity: 0.6,
          zIndex: 0,
        }}
      />
    );
  else if (turno === "Nocturno")
    IconoTurno = (
      <NightsStayIcon
        sx={{
          color: "#1E90FF",
          position: "absolute",
          top: 50,
          left: 250,
          fontSize: "8rem",
          opacity: 0.6,
          zIndex: 0,
        }}
      />
    );


  // Función al seleccionar un turno
  const handleSelectTurno = (nuevoTurno) => {
    setTurno(nuevoTurno); // actualiza el estado para cambiar el icono
    setOpenAlert(false); // cierra el dialog
  };

  return (
    <>
      <Box
        onClick={() => setOpenAlert(true)}
        sx={{
          cursor: "pointer",
          position: "relative",
          border: `1px solid ${theme.palette.primary.main}`,
          borderRadius: 2,
          padding: 2,
          marginBottom: 2,
          width: "20rem",
          backgroundColor: theme.palette.background.paper,
          boxShadow: 3,
          transition: "transform 0.3s, box-shadow 0.3s",
          "&:hover": {
            transform: "scale(1.02)",
            boxShadow: 6,
            borderColor: theme.palette.primary.dark,
          },
          overflow: "hidden",
        }}
      >
        {IconoTurno}

        <Typography
          component="h2"
          variant="h6"
          color={theme.palette.primary.main}
          gutterBottom
          sx={{ fontWeight: "bold", position: "relative", zIndex: 1 }}
        >
          Sección: {seccion.valor_seccion}
        </Typography>

        <Typography
          variant="body1"
          color="text.secondary"
          paragraph
          sx={{ position: "relative", zIndex: 1 }}
        >
          Cupos disponibles: {seccion.cupos_disponibles}
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ position: "relative", zIndex: 1 }}
        >
          Turno: {turno || "Sin turno"}
        </Typography>
      </Box>

      <AlertTurno
        idSeccion={seccion.id_seccion}
        isOpen={openAlert}
        onClose={() => setOpenAlert(false)}
        onSelect={handleSelectTurno}
      />
    </>
  );
}
