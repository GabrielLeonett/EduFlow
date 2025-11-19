import {
  Typography,
  Box,
  Modal,
  MenuItem,
  Fade,
  Backdrop,
} from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import CustomButton from "./customButton.jsx";
import CustomLabel from "./customLabel.jsx"; // ✅ tu componente personalizado
import CustomCalendar from "./customCalendar.jsx"; // ✅ tu componente personalizado
import dayjs from "dayjs";

export default function ModalDestitucion({open, onClose, onSubmit, isLoading}) {

  const { register, handleSubmit, control } = useForm({
    defaultValues: {
      tipo_accion: "DESTITUCION",
      razon: "",
      observaciones: "",
      fecha_efectiva: "",
    },
  });

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
            defaultValues='DESTITUCION'
            required
            {...register("tipo_accion", { required: true })}
          >
            {[
              "DESTITUCION",
              "ELIMINACION",
              "RENUNCIA",
              "RETIRO",
              "FALLECIDO",
            ].map((tipo) => (
              <MenuItem key={tipo} value={tipo}>
                {tipo}
              </MenuItem>
            ))}
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

          <Controller
            name="fecha_efectiva"
            control={control}
            rules={{ required: "Seleccione su fecha efectiva" }}
            render={({ field, fieldState: { error } }) => (
              <CustomCalendar
                label="Fecha Efectiva"
                value={field.value ? dayjs(field.value, "DD-MM-YYYY") : null}
                onChange={(date) => field.onChange(date?.format("DD-MM-YYYY"))}
                helperText={
                  error?.message || "Seleccionar la fecha en la que sera efectivo este cambio."
                }
                error={!!error}
                fullWidth
              />
            )}
          />

          <Box
            sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 1 }}
          >
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
