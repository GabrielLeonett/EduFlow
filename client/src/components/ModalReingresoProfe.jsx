import {
  Typography,
  Box,
  Modal,
  MenuItem,
  Fade,
  Backdrop,
} from "@mui/material";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import CustomButton from "./customButton.jsx";
import CustomLabel from "./customLabel.jsx";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useApi from "../hook/useApi.jsx";
import reingresoSchema from "../schemas/reingreso.schema.js"; // Asegúrate de importar tu schema
import useSweetAlert from "../hook/useSweetAlert.jsx";

export default function ModalReingresoProfe({ open, onClose, profesor }) {
  const navigate = useNavigate();
  const axios = useApi();
  const alert = useSweetAlert();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm({
    resolver: zodResolver(reingresoSchema),
    defaultValues: {
      id_profesor: profesor?.id || "",
      tipo_reingreso: "REINGRESO",
      motivo_reingreso: "",
      observaciones: "",
      fecha_efectiva: "",
      registro_anterior_id: profesor?.registro_anterior_id || "",
    },
  });

 const onSubmit = async (data) => {
  try {
    const confirm = await alert.confirm(
      "¿Desea reingresar este profesor?",
      "El profesor volverá a estar activo en el sistema."
    );
    if (!confirm) return;

    setIsLoading(true);

    // 🧾 Preparar datos según el schema
    const formData = {
      ...data,
      fecha_efectiva: data.fecha_efectiva || null,
      observaciones: data.observaciones || null,
    };

    await axios.post("/profesores/reingresar", formData);

    alert.success(
      "Profesor reingresado con éxito",
      "El profesor ha sido reactivado correctamente."
    );

    reset();
    onClose();

    // 🔄 Redirigir después del reingreso
    navigate("/profesores");
  } catch (error) {
    console.error("❌ Error en reingreso de profesor:", error);

    // ⚠️ Validaciones desde backend
    if (error.error?.totalErrors > 0) {
      error.error.validationErrors.forEach((errVal) => {
        alert.toast(errVal.field, errVal.message);
      });
    } else {
      // ❌ Error general
      alert.error(
        error.title || "Error al reingresar profesor",
        error.message || "No se pudo procesar el reingreso del profesor."
      );
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
            width: 450,
            maxWidth: "90vw",
            maxHeight: "90vh",
            overflow: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          <Typography variant="h5" fontWeight="bold">
            Reingreso de Profesor
          </Typography>

          {/* ID del profesor (oculto o deshabilitado) */}
          <CustomLabel
            label="ID Profesor"
            name="id_profesor"
            type="number"
            required
            disabled
            {...register("id_profesor", { valueAsNumber: true })}
            error={!!errors.id_profesor}
            helperText={errors.id_profesor?.message}
          />

          {/* ID del registro anterior (oculto) */}
          <input
            type="hidden"
            {...register("registro_anterior_id", { valueAsNumber: true })}
          />

          <CustomLabel
            label="Tipo de Reingreso"
            name="tipo_reingreso"
            select
            required
            {...register("tipo_reingreso")}
            error={!!errors.tipo_reingreso}
            helperText={errors.tipo_reingreso?.message}
          >
            <MenuItem value="REINGRESO">REINGRESO</MenuItem>
            <MenuItem value="REINCORPORACION">REINCORPORACIÓN</MenuItem>
            <MenuItem value="REINTEGRO">REINTEGRO</MenuItem>
          </CustomLabel>

          <CustomLabel
            label="Motivo de Reingreso"
            name="motivo_reingreso"
            multiline
            rows={3}
            required
            {...register("motivo_reingreso")}
            error={!!errors.motivo_reingreso}
            helperText={errors.motivo_reingreso?.message}
            inputProps={{
              minLength: 10,
              maxLength: 1000,
            }}
          />

          <CustomLabel
            label="Observaciones"
            name="observaciones"
            multiline
            rows={2}
            {...register("observaciones")}
            error={!!errors.observaciones}
            helperText={errors.observaciones?.message}
            inputProps={{
              maxLength: 2000,
            }}
          />

          <CustomLabel
            label="Fecha Efectiva"
            name="fecha_efectiva"
            type="date"
            InputLabelProps={{ shrink: true }}
            {...register("fecha_efectiva")}
            error={!!errors.fecha_efectiva}
            helperText={errors.fecha_efectiva?.message}
          />

          <Box
            sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 1 }}
          >
            <CustomButton
              onClick={handleClose}
              tipo="secondary"
              disabled={isLoading}
            >
              Cancelar
            </CustomButton>
            <CustomButton
              tipo="primary"
              disabled={!isValid && isLoading}
              type="submit"
            >
              {isLoading ? "Procesando..." : "Confirmar Reingreso"}
            </CustomButton>
          </Box>
        </Box>
      </Fade>
    </Modal>
  );
}
