import {
  Typography,
  Box,
  Modal,
  Fade,
  Backdrop,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import { useForm } from "react-hook-form";
import { useState } from "react";
import useApi from "../hook/useApi.jsx";
import CustomButton from "./customButton.jsx";
import CustomLabel from "./customLabel.jsx";
import { zodResolver } from "@hookform/resolvers/zod";
import { lineaInvestigacionSchema } from "../schemas/lineasInves.schema.js"; // Ajusta la ruta según tu estructura
import useSweetAlert from "../hook/useSweetAlert.jsx";

export default function ModalRegisterLineaInvestigacion({
  id_trayecto,
  open,
  onClose,
  setState,
}) {
  const [isLoading, setIsLoading] = useState(false);
  const axios = useApi();
  const alert = useSweetAlert();

  if (!id_trayecto) {
    alert.error(
      "Error","Es necesario el id del trayecto para crear la area investigacion"
    );
    onClose();
  }

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(lineaInvestigacionSchema),
    defaultValues: {
      nombre_linea_investigacion: "",
      descripcion: "",
      activo: true,
    },
  });

  const onSubmit = async (data) => {
    try {
      const confirm = await alert.confirm(
        "¿Desea registrar la línea de investigación?",
        "Se agregará una nueva línea al catálogo."
      );
      if (!confirm) return;

      setIsLoading(true);

      const payload = {
        nombre_linea_investigacion: data.nombre_linea_investigacion,
        descripcion: data.descripcion
      };

      await axios.post(
        `/catalogo/${id_trayecto}/linea-investigacion`,
        payload
      );

      // ✅ Éxito con toast
      alert.toast({
        title: "Línea registrada",
        message: "La línea de investigación se agregó exitosamente.",
        config: { icon: "success" },
      });

      // 🔄 Recargar lista actualizada
      const lineasRes = await axios.get(
        `/catalogo/trayectos/${id_trayecto}/lineas-investigacion`
      );
      
      setState(lineasRes);

      reset();
      onClose();
    } catch (error) {
      console.error("❌ Error al registrar línea de investigación:", error);

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
            "No se pudo registrar la línea de investigación. Intente nuevamente.",
          config: { icon: "error" },
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
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
            width: 600, // Más ancho para el formulario más grande
            maxHeight: "90vh",
            overflow: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 3,
          }}
        >
          <Typography variant="h5" fontWeight="bold" textAlign="center">
            Nueva Línea de Investigación
          </Typography>

          {/* Nombre de la Línea de Investigación */}
          <CustomLabel
            label="Nombre de la Línea de Investigación *"
            name="nombre_linea_investigacion"
            required
            multiline
            rows={2}
            {...register("nombre_linea_investigacion")}
            error={!!errors.nombre_linea_investigacion}
            helperText={
              errors.nombre_linea_investigacion?.message ||
              "Mínimo 10 caracteres, máximo 150"
            }
          />

          {/* Descripción */}
          <CustomLabel
            label="Descripción"
            name="descripcion"
            multiline
            rows={4}
            {...register("descripcion")}
            error={!!errors.descripcion}
            helperText={
              errors.descripcion?.message ||
              "Opcional - Mínimo 20 caracteres, máximo 500"
            }
          />

          {/* Información adicional */}
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
            * Campos obligatorios
          </Typography>

          {/* Botones de acción */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 2,
              mt: 3,
              pt: 2,
              borderTop: 1,
              borderColor: "divider",
            }}
          >
            <CustomButton
              onClick={handleClose}
              tipo="secondary"
              disabled={isLoading}
            >
              Cancelar
            </CustomButton>
            <CustomButton tipo="primary" disabled={isLoading} type="submit">
              {isLoading ? "Guardando..." : "Guardar Línea"}
            </CustomButton>
          </Box>
        </Box>
      </Fade>
    </Modal>
  );
}
