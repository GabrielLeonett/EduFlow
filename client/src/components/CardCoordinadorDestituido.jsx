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
  Modal,
} from "@mui/material";

import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import PersonIcon from "@mui/icons-material/Person";
import RestoreIcon from "@mui/icons-material/Restore";

import { useTheme } from "@mui/material/styles";
import { useState } from "react";
import useApi from "../hook/useApi";
import CustomButton from "./customButton";

export default function CardCoordinadorDestituido({ coordinador }) {
  const axios = useApi(false);
  const theme = useTheme();

  const [openModal, setOpenModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // ==========================
  // 🔄 REINGRESAR COORDINADOR
  // ==========================
  const handleReingresar = async () => {
    setLoading(true);
    try {
      await axios.put(`/coordinadores/reingresar/${coordinador.id_coordinador}`);
      window.location.reload();
    } catch (err) {
      console.error("Error al reingresar coordinador:", err);
    } finally {
      setLoading(false);
      setOpenModal(false);
    }
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
            Cédula: {coordinador.cedula}
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
                <strong>Correo:</strong> {coordinador.correo}
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

            <Typography variant="body2">
              <strong>Estatus:</strong>{" "}
              <span style={{ color: theme.palette.error.main, fontWeight: 600 }}>
                Destituido
              </span>
            </Typography>

            <Typography variant="body2">
              <strong>Fecha de destitución:</strong>{" "}
              {coordinador.fecha_destitucion
                ? new Date(coordinador.fecha_destitucion).toLocaleDateString()
                : "—"}
            </Typography>

            <Typography variant="body2">
              <strong>Motivo:</strong> {coordinador.motivo_destitucion || "—"}
            </Typography>
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

      {/* MODAL CONFIRMACIÓN */}
      <Modal open={openModal} onClose={() => setOpenModal(false)}>
        <Box
          sx={{
            p: 4,
            background: "white",
            borderRadius: 2,
            width: "90%",
            maxWidth: 420,
            mx: "auto",
            mt: "20vh",
          }}
        >
          <Typography variant="h6" fontWeight={700} mb={2}>
            Confirmar Reingreso
          </Typography>

          <Typography variant="body1" mb={3}>
            ¿Seguro que deseas reingresar al coordinador{" "}
            <strong>
              {coordinador.nombres} {coordinador.apellidos}
            </strong>
            ?
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={6}>
              <CustomButton
                fullWidth
                variant="outlined"
                onClick={() => setOpenModal(false)}
              >
                Cancelar
              </CustomButton>
            </Grid>

            <Grid item xs={6}>
              <CustomButton
                fullWidth
                variant="contained"
                disabled={loading}
                onClick={handleReingresar}
              >
                {loading ? "Procesando..." : "Confirmar"}
              </CustomButton>
            </Grid>
          </Grid>
        </Box>
      </Modal>
    </>
  );
}
