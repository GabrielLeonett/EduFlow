import {
  Typography,
  Box,
  Modal,
  Fade,
  Backdrop,
  MenuItem,
} from "@mui/material";
import { useForm } from "react-hook-form";
import { useState } from "react";
import useApi from "../hook/useApi.jsx";
import CustomButton from "./customButton.jsx";
import CustomLabel from "./customLabel.jsx";
import { zodResolver } from "@hookform/resolvers/zod";
import { nuevoPosgradoSchema } from "../schemas/profesor.schema.js";
import useSweetAlert from "../hook/useSweetAlert.jsx";

const TIPOS_POSGRADO = [
  "Especialización",
  "Maestría",
  "Doctorado",
  "Diplomado",
  "Posdoctorado",
  "Certificación",
  "Curso Avanzado",
  "Residencia Médica",
  "Fellowship",
];

export default function ModalRegisterPosgrado({ open, onClose, setState }) {
  const [isLoading, setIsLoading] = useState(false);
  const axios = useApi(true);
  const alert = useSweetAlert();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm({
    resolver: zodResolver(nuevoPosgradoSchema),
    defaultValues: {
      tipo: "",
      nombre: "",
    },
  });

const onSubmit = async (data) => {
  try {
    const confirm = await alert.confirm(
      "¿Desea registrar este posgrado?",
      "Se agregará un nuevo tipo de posgrado al catálogo."
    );
    if (!confirm) return;

    setIsLoading(true);

    // 🧾 Construcción del payload
    const payload = {
      tipo_pos_grado: data.tipo,
      nombre_pos_grado: data.nombre,
    };

    await axios.post("/catalogos/posgrados", payload);

    // 🔄 Actualizar lista de posgrados
    const res = await axios.get("/catalogos/posgrados");
    setState(res.data || res);

    alert.success(
      "Posgrado registrado con éxito",
      "Ya puede seleccionarlo en el formulario."
    );

    handleClose();
  } catch (error) {
    console.error("❌ Error al registrar posgrado:", error);

    // ⚠️ Validaciones desde backend
    if (error.error?.totalErrors > 0) {
      error.error.validationErrors.forEach((errVal) => {
        alert.toast(errVal.field, errVal.message);
      });
    } else {
      // ❌ Error general
      alert.error(
        error.title || "Error al registrar posgrado",
        error.message || "No se pudo registrar el posgrado, intente nuevamente."
      );
    }

    handleClose();
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
            width: 480,
            maxWidth: "90vw",
            display: "flex",
            flexDirection: "column",
            gap: 3,
          }}
        >
          <Typography variant="h5" fontWeight="bold" textAlign="center">
            Nuevo Posgrado
          </Typography>

          <CustomLabel
            select
            label="Tipo de Posgrado"
            required
            {...register("tipo")}
            error={!!errors.tipo}
            helperText={
              errors.tipo?.message || "Seleccione el tipo de posgrado"
            }
          >
            <MenuItem value="">Seleccione un tipo</MenuItem>
            {TIPOS_POSGRADO.map((tipo) => (
              <MenuItem key={tipo} value={tipo}>
                {tipo}
              </MenuItem>
            ))}
          </CustomLabel>

          <CustomLabel
            label="Nombre del Posgrado"
            required
            multiline
            rows={2}
            {...register("nombre")}
            error={!!errors.nombre}
            helperText={
              errors.nombre?.message || "Ingrese el nombre del posgrado"
            }
            placeholder="Ej: Maestría en Ingeniería de Software"
          />

          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 2,
              mt: 2,
            }}
          >
            <CustomButton
              type="button"
              onClick={handleClose}
              tipo="secondary"
              disabled={isLoading}
            >
              Cancelar
            </CustomButton>
            <CustomButton
              tipo="primary"
              disabled={isLoading || !isValid}
              type="submit"
            >
              {isLoading ? "Guardando..." : "Guardar"}
            </CustomButton>
          </Box>
        </Box>
      </Fade>
    </Modal>
  );
}
