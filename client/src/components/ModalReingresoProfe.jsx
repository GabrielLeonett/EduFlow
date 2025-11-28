import {
  Typography,
  Box,
  Modal,
  MenuItem,
  Fade,
  Backdrop,
} from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import CustomButton from "./customButton.jsx";
import CustomLabel from "./customLabel.jsx";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useApi from "../hook/useApi.jsx";
import reingresoSchema from "../schemas/reingreso.schema.js"; // Asegúrate de importar tu schema
import useSweetAlert from "../hook/useSweetAlert.jsx";
import CustomCalendar from "./customCalendar.jsx"; // ✅ tu componente personalizado
import dayjs from "dayjs";
import { config } from "zod/v4/core";

export default function ModalReingresoProfe({ open, onClose, profesor }) {
  const navigate = useNavigate();
  const axios = useApi();
  const alert = useSweetAlert();
  const [isLoading, setIsLoading] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isValid },
  } = useForm({
    mode: "onChange",
    resolver: zodResolver(reingresoSchema),
    defaultValues: {
      id_usuario: profesor?.id || "",
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
          alert.toast({
            title: errVal.field,
            message: errVal.message,
            config: { icon: "error" },
          });
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

          {/* ✅ SOLUCIÓN: Usar inputs hidden como en el coordinador */}
          <input type="hidden" {...register("id_usuario")} />
          <input type="hidden" {...register("registro_anterior_id")} />

          {/* Mostrar info del profesor (solo lectura) */}
          {profesor && (
            <Box
              sx={{
                p: 2,
                backgroundColor: "grey.50",
                borderRadius: 1,
                border: "1px solid",
                borderColor: "grey.300",
              }}
            >
              <Typography variant="body2" fontWeight="bold">
                Profesor: {profesor.nombres} {profesor.apellidos}
              </Typography>
              <Typography variant="body2">ID: {profesor.id}</Typography>
              {profesor.registro_anterior_id && (
                <Typography variant="body2">
                  Registro Anterior: {profesor.registro_anterior_id}
                </Typography>
              )}
            </Box>
          )}

          {/* El resto de tus campos permanecen igual */}
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

          <Controller
            name="fecha_efectiva"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <CustomCalendar
                label="Fecha Efectiva"
                value={field.value ? dayjs(field.value, "DD-MM-YYYY") : null}
                onChange={(date) => {
                  console.log("Fecha seleccionada:", date);
                  field.onChange(date?.format("DD-MM-YYYY"));
                }}
                helperText={error?.message || "Seleccionar la fecha..."}
                error={!!error}
                fullWidth
              />
            )}
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
              disabled={!isValid || isLoading}
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
