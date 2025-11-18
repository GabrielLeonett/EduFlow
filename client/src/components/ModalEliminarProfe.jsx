import {
    Typography,
    Box,
    Modal,
    MenuItem,
    Fade,
    Backdrop,
} from "@mui/material";
import { useForm } from "react-hook-form";
import CustomButton from "./customButton.jsx";
import CustomLabel from "./customLabel.jsx"; // ✅ tu componente personalizado
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useSweetAlert from "../hook/useSweetAlert.jsx";
import useApi from "../hook/useApi.jsx";

export default function ModalEliminacionProfe({ profesor, open, onClose }) {
    const navigate = useNavigate();
    const axios = useApi();
    const [isLoading, setIsLoading] = useState(false);
    const alert = useSweetAlert();

    const { register, handleSubmit, reset } = useForm({
        defaultValues: {
            tipo_accion: "",
            razon: "",
            observaciones: "",
            fecha_efectiva: "",
        },
    });

const onSubmit = async (data) => {
  try {
    const confirm = await alert.confirm(
      "¿Está seguro de eliminar este profesor?",
      "Esta acción no se puede deshacer."
    );
    if (!confirm) return;

    setIsLoading(true);

    // ✅ Construcción del payload
    const payload = {
      id_profesor: profesor.id_profesor,
      tipo_accion: data.tipo_accion,
      razon: data.razon,
      observaciones: data.observaciones,
      fecha_efectiva: data.fecha_efectiva,
    };

    // ✅ Petición DELETE con axios
    await axios.delete(`/profesores/${profesor.id_profesor}`, {
      data: payload,
      headers: { "Content-Type": "application/json" },
      withCredentials: true,
    });

    // 🔽 Reemplazamos alert.success() por toast
    alert.toast({
      title: "Profesor eliminado",
      message: "El profesor fue eliminado correctamente del sistema.",
      config: { icon: "success" },
    });

    reset();
    onClose();
    navigate("/academico/profesores/eliminados");
  } catch (error) {
    console.error("❌ Error al eliminar profesor:", error);

    // ✅ Si hay errores de validación enviados desde el backend
    if (error.error?.totalErrors > 0) {
      error.error.validationErrors.forEach((e) => {
        // 🔽 toast para cada error de validación
        alert.toast({
          title: e.field,
          message: e.message,
          config: { icon: "warning" },
        });
      });
    } else {
      // 🔽 Reemplazamos alert.error() por toast
      alert.toast({
        title: error.title || "Error al eliminar",
        message:
          error.message ||
          "Ocurrió un error al intentar eliminar el profesor.",
        config: { icon: "error" },
      });
    }
  } finally {
    setIsLoading(false);
  }
};


    return (
        <Modal
            open={open}
            onClose={onClose}
            closeAfterTransition
            slots={{ backdrop: Backdrop }}
            slotProps={{ backdrop: { timeout: 300 } }}
        >
            <Fade in={open}>
                <Box
                    component="form"
                    onSubmit={handleSubmit(onSubmit)}
                    sx={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        bgcolor: "background.paper",
                        boxShadow: 24,
                        p: 4,
                        borderRadius: 3,
                        width: 450,
                        display: "flex",
                        flexDirection: "column",
                        gap: 2,
                    }}
                >
                    <Typography variant="h5" fontWeight="bold">
                        Motivo de eliminación
                    </Typography>

                    <CustomLabel
                        label="Tipo de acción"
                        name="tipo_accion"
                        select
                        required
                        {...register("tipo_accion", { required: true })}
                    >
                        {["DESTITUCION", "ELIMINACION", "RENUNCIA", "RETIRO", "FALLECIDO"].map(
                            (tipo) => (
                                <MenuItem key={tipo} value={tipo}>
                                    {tipo}
                                </MenuItem>
                            )
                        )}
                    </CustomLabel>

                    <CustomLabel
                        label="Razón"
                        name="razon"
                        multiline
                        rows={2}
                        required
                        {...register("razon", { required: true })}
                    />

                    <CustomLabel
                        label="Observaciones"
                        name="observaciones"
                        multiline
                        rows={2}
                        {...register("observaciones")}
                    />

                    <CustomLabel
                        label="Fecha efectiva"
                        name="fecha_efectiva"
                        type="date"
                        InputLabelProps={{ shrink: true }}
                        required
                        {...register("fecha_efectiva", { required: true })}
                    />

                    <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 1 }}>
                        <CustomButton onClick={onClose} tipo="secondary">
                            Cancelar
                        </CustomButton>
                        <CustomButton tipo="primary" disabled={isLoading} type="submit">
                            {isLoading ? "Eliminando..." : "Confirmar eliminación"}
                        </CustomButton>
                    </Box>
                </Box>
            </Fade>
        </Modal>
    );
}
