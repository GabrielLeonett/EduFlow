import {
  Box,
  Modal,
  Fade,
  Backdrop,
  Typography,
  TextField,
} from "@mui/material";
import { useForm } from "react-hook-form";
import CustomButton from "./customButton";
import useApi from "../hook/useApi";
import useSweetAlert from "../hook/useSweetAlert";

export default function ModalRegistroSeccion({
  open,
  handleClose,
  idTrayecto,
}) {
  const { register, handleSubmit, reset } = useForm();
  const axios = useApi(true);
  const alert = useSweetAlert();

const onSubmit = async (data) => {
  try {
    const confirm = await alert.confirm(
      "¿Desea registrar esta sección?",
      "Se agregará una nueva sección al trayecto seleccionado."
    );
    if (!confirm) return;

    const payload = {
      poblacionEstudiantil: parseInt(data.poblacion_estudiantil, 10),
    };

    await axios.post(`/trayectos/${idTrayecto}/secciones`, payload);

    alert.success(
      "Sección registrada con éxito",
      "La sección se agregó correctamente al trayecto."
    );

    reset();
    handleClose();
  } catch (error) {
    console.error("❌ Error al registrar sección:", error);

    // ⚠️ Manejo de errores del backend
    if (error.error?.totalErrors > 0) {
      error.error.validationErrors.forEach((errVal) => {
        console.warn("⚠️ Error de validación:", errVal);
        alert.toast({title: errVal.field, message: errVal.message, config:{icon: "warning"}});
      });
    } else {
      // ❌ Error general
      alert.error(
        error.title || "Error al registrar sección",
        error.message || "No se pudo registrar la sección. Intente nuevamente."
      );
    }

    handleClose();
  }
};

  return (
    <Modal
      open={open}
      onClose={handleClose}
      closeAfterTransition
      slots={{ backdrop: Backdrop }}
      slotProps={{ backdrop: { timeout: 500 } }}
    >
      <Fade in={open}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            bgcolor: "background.paper",
            borderRadius: 3,
            boxShadow: 24,
            p: 4,
            width: 400,
          }}
        >
          <Typography variant="h6" textAlign="center" sx={{ mb: 2 }}>
            Registrar Nueva Sección
          </Typography>

          <form onSubmit={handleSubmit(onSubmit)}>
            <TextField
              fullWidth
              label="Población Estudiantil"
              type="number"
              {...register("poblacion_estudiantil", { required: true })}
              sx={{ mb: 3 }}
            />

            <Box display="flex" justifyContent="center" gap={2}>
              <CustomButton tipo="secondary" onClick={handleClose}>
                Cancelar
              </CustomButton>
              <CustomButton tipo="primary" type="submit">
                Registrar
              </CustomButton>
            </Box>
          </form>
        </Box>
      </Fade>
    </Modal>
  );
}
