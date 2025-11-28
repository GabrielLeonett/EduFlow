// =============================================
// 📌 CARD DE COORDINADOR DESTITUIDO (OPTIMIZADA)
// =============================================
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Box,
  Divider,
  Grid,
  Paper,
  Typography,
} from "@mui/material";

import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import PersonIcon from "@mui/icons-material/Person";
import RestoreIcon from "@mui/icons-material/Restore";
import { useTheme } from "@mui/material/styles";
import { useState } from "react";
import useApi from "../hook/useApi";
import CustomButton from "./customButton";
import ModalReingresoCoordinador from '../components/ModalReingresoCoordinador'; // Asegúrate de que la ruta sea correcta

export default function CardCoordinadorDestituido({ coordinador }) {
  const theme = useTheme();

  const [openModal, setOpenModal] = useState(false);

  // Función para manejar el cierre del modal
  const handleCloseModal = () => {
    setOpenModal(false);
  };

  // Función para manejar el éxito del reingreso
  const handleReingresoExitoso = () => {
    // Puedes agregar lógica adicional aquí si necesitas
    // Por ejemplo, recargar la lista de coordinadores
    window.location.reload(); // O usar un callback prop si prefieres
  };

  return (
    <>
      <Paper
        elevation={3}
        sx={{
          p: 3,
          borderRadius: 3,
          borderTop: `5px solid ${theme.palette.primary.main}`,
          display: "flex",
          flexDirection: "column",
          height: "100%",
        }}
      >
        {/* ENCABEZADO */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="h5" fontWeight={700}>
            {coordinador.nombres} {coordinador.apellidos}
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Cédula: {coordinador.id_coordinador || coordinador.cedula}
          </Typography>
        </Box>

        <Divider />

        {/* INFORMACIÓN PERSONAL */}
        <Box sx={{ mt: 2 }}>
          <Typography
            variant="h6"
            sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}
          >
            <PersonIcon /> Datos Personales
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2">
                <strong>Correo:</strong> {coordinador.email || coordinador.correo}
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography variant="body2">
                <strong>Teléfono:</strong> {coordinador.telefono || "—"}
              </Typography>
            </Grid>
          </Grid>
        </Box>

        {/* INFORMACIÓN ADMINISTRATIVA */}
        <Accordion sx={{ mt: 2 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">Información Administrativa</Typography>
          </AccordionSummary>

          <AccordionDetails>
            <Typography variant="body2">
              <strong>Cargo:</strong> Coordinador
            </Typography>

            {coordinador.nombre_pnf && (
              <Typography variant="body2">
                <strong>PNF:</strong> {coordinador.nombre_pnf}
              </Typography>
            )}

            <Typography variant="body2">
              <strong>Estatus:</strong>{" "}
              <span style={{ color: theme.palette.error.main, fontWeight: 600 }}>
                Destituido
              </span>
            </Typography>

            <Typography variant="body2">
              <strong>Fecha de destitución:</strong>{" "}
              {coordinador.fecha_desasignacion || coordinador.fecha_destitucion
                ? new Date(coordinador.fecha_desasignacion || coordinador.fecha_destitucion).toLocaleDateString()
                : "—"}
            </Typography>

            <Typography variant="body2">
              <strong>Motivo:</strong> {coordinador.motivo_destitucion || "—"}
            </Typography>

            {coordinador.registro_anterior_id && (
              <Typography variant="body2">
                <strong>ID Registro Anterior:</strong> {coordinador.registro_anterior_id}
              </Typography>
            )}
          </AccordionDetails>
        </Accordion>

        {/* BOTÓN REINGRESAR */}
        <Box sx={{ mt: "auto", pt: 2 }}>
          <CustomButton
            fullWidth
            variant="contained"
            startIcon={<RestoreIcon />}
            onClick={() => setOpenModal(true)}
            sx={{
              backgroundColor: theme.palette.success.main,
              "&:hover": { backgroundColor: theme.palette.success.dark },
            }}
          >
            Reingresar Coordinador
          </CustomButton>
        </Box>
      </Paper>

      {/* MODAL DE REINGRESO COMPLETO */}
      <ModalReingresoCoordinador
        open={openModal}
        onClose={handleCloseModal}
        coordinador={coordinador}
      />
    </>
  );
}