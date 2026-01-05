import { Typography, Box, Modal, Fade, Backdrop } from "@mui/material";
import { useForm } from "react-hook-form";
import { useState } from "react";
import useApi from "../hook/useApi.jsx";
import CustomButton from "./customButton.jsx";
import CustomLabel from "./customLabel.jsx";
import { zodResolver } from "@hookform/resolvers/zod";
import { nuevaAreaConocimientoSchema } from "../schemas/profesor.schema.js";
import useSweetAlert from "../hook/useSweetAlert.jsx";

export default function ModalRegisterAreaConocimiento({
  open,
  onClose,
  setState,
}) {
  const [isLoading, setIsLoading] = useState(false);
  const axios = useApi(true);
  const alert = useSweetAlert();

  const { register, handleSubmit, reset } = useForm({
    resolver: zodResolver(nuevaAreaConocimientoSchema),
    defaultValues: {
      area_conocimiento: "",
    },
  });

const onSubmit = async (data) => {
    try {
      const confirm = await alert.confirm(
        "¿Desea registrar el área de conocimiento?",
        "Se agregará una nueva área al catálogo."
      );
      if (!confirm) return;

      setIsLoading(true);

      const payload = { area_conocimiento: data.area_conocimiento };

      await axios.post("/catalogos/areas-conocimiento", payload);

      // ✅ Éxito con toast
      alert.toast({
        title: "Área registrada",
        message: "El área de conocimiento se agregó exitosamente.",
        config: { icon: "success" },
      });

      // 🔄 Recargar lista actualizada
      const { areas_conocimiento } = await axios.get(
        "/catalogos/areas-conocimiento"
      );
      setState(areas_conocimiento);

      reset();
    } catch (error) {
      console.error("❌ Error al registrar área de conocimiento:", error);

      // ⚠️ Errores de validación desde backend
      if (error.error?.totalErrors > 0) {
        error.error.validationErrors.forEach((e) => {
          alert.toast({
            title: e.field,
            message: e.message,
            config: { icon: "warning" },
          });
        });
      } else {
        // ❌ Error general con toast
        alert.toast({
          title: error.title || "Error al registrar",
          message:
            error.message ||
            "No se pudo registrar el área de conocimiento. Intente nuevamente.",
          config: { icon: "error" },
        });
      }
    } finally {
      onClose();
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
            width: 480,
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          <Typography variant="h5" fontWeight="bold" textAlign="center">
            Nueva Área de Conocimiento
          </Typography>

          <CustomLabel
            label="Nombre del Área de Conocimiento"
            name="area_conocimiento"
            required
            multiline
            rows={2}
            {...register("area_conocimiento", { required: true })}
          />

          <Box
            sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 2 }}
          >
            <CustomButton onClick={onClose} tipo="secondary">
              Cancelar
            </CustomButton>
            <CustomButton tipo="primary" disabled={isLoading} type="submit">
              {isLoading ? "Guardando..." : "Guardar"}
            </CustomButton>
          </Box>
        </Box>
      </Fade>
    </Modal>
  );
}
