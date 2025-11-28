import { Typography, Box, Dialog, MenuItem, Fade } from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import CustomButton from "./customButton.jsx";
import CustomLabel from "./customLabel.jsx";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useApi from "../hook/useApi.jsx";
import reingresoSchema from "../schemas/reingreso.schema.js";
import useSweetAlert from "../hook/useSweetAlert.jsx";
import CustomCalendar from "./customCalendar.jsx";
import dayjs from "dayjs";

export default function ModalReingresoCoordinador({
  open,
  onClose,
  coordinador,
}) {
  const navigate = useNavigate();
  const axios = useApi();
  const alert = useSweetAlert();
  const [isLoading, setIsLoading] = useState(false);

  const {
    handleSubmit,
    reset,
    control,
    register,
    formState: { errors, isValid },
  } = useForm({
    resolver: zodResolver(reingresoSchema),
    mode: "onChange",
    defaultValues: {
      id_usuario: parseInt(coordinador?.id_coordinador) || "",
      tipo_reingreso: "REINGRESO",
      motivo_reingreso: "",
      observaciones: "",
      fecha_efectiva: "",
      registro_anterior_id: parseInt(coordinador?.id_registro) || "",
    },
  });


  const onSubmit = async (data) => {
    try {
      const confirm = await alert.confirm(
        "¿Desea reingresar este coordinador?",
        "El coordinador volverá a estar activo en el sistema."
      );
      if (!confirm) return;

      setIsLoading(true);

      // Usar el endpoint correcto con el ID en la URL
      await axios.post(`/coordinadores/${coordinador.id}/restitur`, data);

      alert.success(
        "Coordinador reingresado con éxito",
        "El coordinador ha sido reactivado correctamente."
      );

      reset();
      onClose();

      // 🔄 Redirigir después del reingreso
      setTimeout(() => {
        navigate("/coordinadores");
      }, 1000);
    } catch (error) {
      console.error("❌ Error en reingreso de coordinador:", error);

      // ⚠️ Validaciones desde backend
      if (error?.error?.totalErrors > 0) {
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
          error.title || "Error al reingresar coordinador",
          error.message || "No se pudo procesar el reingreso del coordinador."
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
    <Dialog
      open={open}
      onClose={handleClose}
      closeAfterTransition
      maxWidth="sm"
      fullWidth
    >
      <Fade in={open}>
        <Box
          component="form"
          onSubmit={handleSubmit(onSubmit)}
          sx={{
            p: 4,
            display: "flex",
            flexDirection: "column",
            gap: 3,
          }}
        >
          <Typography variant="h5" fontWeight="bold">
            Reingreso de Coordinador
          </Typography>

          {/* Mostrar información del coordinador */}
          {coordinador && (
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
                Coordinador: {coordinador.nombres} {coordinador.apellidos}
              </Typography>
              <Typography variant="body2">
                Cédula: {coordinador.id_coordinador || coordinador.id}
              </Typography>
              {coordinador.nombre_pnf && (
                <Typography variant="body2">
                  PNF: {coordinador.nombre_pnf}
                </Typography>
              )}
              {coordinador.id_registro && (
                <Typography variant="body2">
                  ID Registro: {coordinador.id_registro}
                </Typography>
              )}
            </Box>
          )}

          {/* ✅ Ya están correctos estos inputs hidden */}
          <input type="hidden" {...register("id_usuario")} />
          <input type="hidden" {...register("registro_anterior_id")} />

          {/* Tipo de Reingreso */}
          <CustomLabel
            select
            label="Tipo de Reingreso *"
            fullWidth
            {...register("tipo_reingreso")}
            error={!!errors.tipo_reingreso}
            helperText={
              errors.tipo_reingreso?.message ||
              "Seleccione el tipo de reingreso"
            }
          >
            <MenuItem value="REINGRESO">REINGRESO</MenuItem>
            <MenuItem value="REINCORPORACION">REINCORPORACIÓN</MenuItem>
            <MenuItem value="REINTEGRO">REINTEGRO</MenuItem>
          </CustomLabel>

          {/* Motivo de Reingreso */}
          <CustomLabel
            label="Motivo de Reingreso *"
            multiline
            rows={3}
            fullWidth
            {...register("motivo_reingreso")}
            error={!!errors.motivo_reingreso}
            helperText={
              errors.motivo_reingreso?.message || "Mínimo 10 caracteres"
            }
            placeholder="Describa el motivo del reingreso..."
          />

          {/* Observaciones */}
          <CustomLabel
            label="Observaciones"
            multiline
            rows={2}
            fullWidth
            {...register("observaciones")}
            error={!!errors.observaciones}
            helperText={
              errors.observaciones?.message ||
              "Opcional - máximo 2000 caracteres"
            }
            placeholder="Observaciones adicionales..."
          />

          {/* Fecha Efectiva - Solo este campo usa Controller */}
          <Controller
            name="fecha_efectiva"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <CustomCalendar
                label="Fecha Efectiva"
                value={field.value ? dayjs(field.value, "DD-MM-YYYY") : null}
                onChange={(date) => {
                  const formattedDate = date ? date.format("DD-MM-YYYY") : "";
                  console.log("📅 Fecha seleccionada:", formattedDate);
                  field.onChange(formattedDate);
                }}
                helperText={
                  error?.message ||
                  "Seleccionar la fecha en la que será efectivo este cambio."
                }
                error={!!error}
                fullWidth
              />
            )}
          />

          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 2,
              mt: 2,
              pt: 2,
              borderTop: "1px solid",
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
    </Dialog>
  );
}