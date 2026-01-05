import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
} from "@mui/material";
import useApi from "../hook/useApi";
import Brightness5Icon from "@mui/icons-material/Brightness5";
import WbTwilightIcon from "@mui/icons-material/WbTwilight";
import NightsStayIcon from "@mui/icons-material/NightsStay";
import Swal from "sweetalert2";

export default function AlertTurno({ idSeccion, isOpen, onClose }) {
  const axios = useApi(true);

  const handleSelect = async (turnoId, turnoNombre) => {
    try {
      await axios.put(`/secciones/${idSeccion}/turno`, {
        idTurno: turnoId,
      });

      // Cerrar el diálogo primero
      onClose();

      // Mostrar SweetAlert de éxito
      Swal.fire({
        title: "¡Turno asignado!",
        text: `El turno ${turnoNombre} se ha asignado correctamente.`,
        icon: "success",
        confirmButtonText: "Aceptar",
        confirmButtonColor: "#3085d6",
      }).then(() => {
        // Recargar la página después de que el usuario haga clic en Aceptar
        window.location.reload();
      });
    } catch (error) {
      console.error("Error al asignar el turno:", error);

      // Mostrar SweetAlert de error
      Swal.fire({
        title: "Error",
        text: "Ocurrió un error al asignar el turno.",
        icon: "error",
        confirmButtonText: "Aceptar",
        confirmButtonColor: "#d33",
      });
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ textAlign: "center", pb: 1 }}>
        Selecciona el turno
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" textAlign="center">
          Elige el turno correspondiente para esta sección:
        </Typography>
      </DialogContent>
      <DialogActions sx={{ justifyContent: "center", px: 3, pb: 2 }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            width: "100%",
          }}
        >
          <Button
            variant="contained"
            sx={{
              py: 2,
              fontSize: "18px",
              backgroundColor: "#FFD700",
              color: "rgba(0, 0, 0, 0.87)",
              "&:hover": {
                backgroundColor: "#FFC400",
              },
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
            onClick={() => handleSelect(1, "Matutino")}
          >
            Matutino
            <Brightness5Icon sx={{ fontSize: "2.5rem" }} />
          </Button>
          <Button
            variant="contained"
            sx={{
              py: 2,
              fontSize: "18px",
              backgroundColor: "#FF8C00",
              "&:hover": {
                backgroundColor: "#F57C00",
              },
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
            onClick={() => handleSelect(2, "Vespertino")}
          >
            Vespertino
            <WbTwilightIcon sx={{ fontSize: "2.5rem" }} />
          </Button>
          <Button
            variant="contained"
            sx={{
              py: 2,
              fontSize: "18px",
              backgroundColor: "#1E90FF",
              "&:hover": {
                backgroundColor: "#1565C0",
              },
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
            onClick={() => handleSelect(3, "Nocturno")}
          >
            Nocturno
            <NightsStayIcon sx={{ fontSize: "2.5rem" }} />
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
}
