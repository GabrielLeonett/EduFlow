import { useTheme } from "@emotion/react";
import CustomChip from "./CustomChip";
import ReplayIcon from "@mui/icons-material/Replay";
import {
  Typography,
  Box,
  Stack,
  Paper,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useState } from "react";
import ModalReingresoProfe from "./ModalReingresoProfe";
import CustomButton from "./customButton";

export default function CardProfesorEliminado({ prof }) {
  const theme = useTheme();
  const [modalOpen, setModalOpen] = useState(false);

  const handleOpenModal = () => setModalOpen(true);
  const handleCloseModal = () => setModalOpen(false);

  const styles = {
    paper: {
      p: 2.5,
      borderRadius: 3,
      backgroundColor: theme.palette.background.paper,
      border: "1px solid",
      borderColor:
        theme.palette.mode === "light"
          ? theme.palette.grey[300]
          : theme.palette.grey[800],
      boxShadow:
        theme.palette.mode === "light"
          ? "0 2px 10px rgba(0,0,0,0.06)"
          : "0 2px 10px rgba(0,0,0,0.35)",
      transition: "0.25s ease",
      "&:hover": {
        transform: "translateY(-4px)",
        boxShadow:
          theme.palette.mode === "light"
            ? "0 4px 14px rgba(0,0,0,0.10)"
            : "0 4px 14px rgba(0,0,0,0.45)",
      },
      width: "50%",
      maxWidth: "850px",
      margin: "0 auto",
    },
  };

  return (
    <>
      <Paper sx={styles.paper}>

        {/* HEADER */}
        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
          <Box>
            <Typography variant="h6" fontWeight={700} mb={0.3}>
              {prof.nombres} {prof.apellidos}
            </Typography>

            <CustomChip
              label="ELIMINADO"
              color="error"
              size="small"
              variant="filled"
            />
          </Box>
        </Box>

        {/* ============================
   INFORMACIÓN PERSONAL (SIN ACCORDION)
============================ */}
<Box sx={{ mt: 2 }}>
  <Typography variant="subtitle1" fontWeight={600} mb={1}>
    Información Personal
  </Typography>

  <Grid container spacing={1.5}>
    <Grid xs={12} sm={6}>
      <Typography variant="body2">
        <strong>Cédula:</strong> {prof.cedula}
      </Typography>
    </Grid>

    <Grid xs={12} sm={6}>
      <Typography variant="body2">
        <strong>Género:</strong> {prof.genero}
      </Typography>
    </Grid>

    <Grid xs={12} sm={6}>
      <Typography variant="body2">
        <strong>Email:</strong> {prof.email}
      </Typography>
    </Grid>

    <Grid xs={12} sm={6}>
      <Typography variant="body2">
        <strong>Teléfono:</strong>{" "}
        {prof.telefono_movil || "No especificado"}
      </Typography>
    </Grid>
  </Grid>
</Box>

        {/* ============================
           INFORMACIÓN ACADÉMICA (ACCORDION)
        ============================ */}
        <Accordion sx={{ mt: 2 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1" fontWeight={600}>
              Información Académica
            </Typography>
          </AccordionSummary>

          <AccordionDetails>
            <Grid container spacing={1}>
              <Grid xs={12} sm={6}>
                <Typography variant="body2">
                  <strong>Categoría:</strong>{" "}
                  {prof.ultima_categoria || "No especificada"}
                </Typography>
              </Grid>

              <Grid xs={12} sm={6}>
                <Typography variant="body2">
                  <strong>Dedicación:</strong>{" "}
                  {prof.ultima_dedicacion || "No especificada"}
                </Typography>
              </Grid>

              <Grid xs={12} sm={6}>
                <Typography variant="body2">
                  <strong>Tiempo de servicio:</strong>{" "}
                  {prof.tiempo_servicio || 0} años
                </Typography>
              </Grid>

              <Grid xs={12} sm={6}>
                <Typography variant="body2">
                  <strong>Reingreso:</strong>{" "}
                  {prof.tiene_reingreso ? "Sí" : "No"}
                </Typography>
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* ============================
           INFORMACIÓN DE ELIMINACIÓN (ACCORDION)
        ============================ */}
        <Accordion sx={{ mt: 2 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1" fontWeight={600}>
              Información de Eliminación
            </Typography>
          </AccordionSummary>

          <AccordionDetails>
            <Grid container spacing={1}>
              <Grid xs={12}>
                <Typography variant="body2">
                  <strong>Motivo:</strong> {prof.razon || "No especificado"}
                </Typography>
              </Grid>

              <Grid xs={12} sm={6}>
                <Typography variant="body2">
                  <strong>Fecha eliminación:</strong>{" "}
                  {new Date(prof.fecha_eliminacion).toLocaleDateString()}
                </Typography>
              </Grid>

              <Grid xs={12} sm={6}>
                <Typography variant="body2">
                  <strong>Eliminado por:</strong> {prof.nombre_usuario_accion}
                </Typography>
              </Grid>

              {prof.observaciones && (
                <Grid xs={12}>
                  <Typography variant="body2">
                    <strong>Observaciones:</strong> {prof.observaciones}
                  </Typography>
                </Grid>
              )}
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* BOTÓN REINGRESAR */}
        <Stack direction="row" justifyContent="flex-end" sx={{ mt: 3 }}>
          <CustomButton
            tipo="success"
            variant="outlined"
            onClick={handleOpenModal}
            startIcon={<ReplayIcon />}
          >
            Reingresar
          </CustomButton>
        </Stack>
      </Paper>

      {/* MODAL */}
      <ModalReingresoProfe
        open={modalOpen}
        onClose={handleCloseModal}
        profesor={{
          id: prof.id_profesor,
          registro_anterior_id: prof.id_destitucion || null,
        }}
      />
    </>
  );
}
