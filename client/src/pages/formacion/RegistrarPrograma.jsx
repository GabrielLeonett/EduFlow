import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Box, Typography, Stack, MenuItem } from "@mui/material";
import CustomButton from "../../components/customButton";
import CustomLabel from "../../components/customLabel";
import ResponsiveAppBar from "../../components/navbar";
import pnfSchema from "../../schemas/pnf.schema";
import useApi from "../../hook/useApi"; // Added import for axios
import { Watch } from "@mui/icons-material";
import useSweetAlert from "../../hook/useSweetAlert";

export default function PnfForm() {
  const axios = useApi();
  const alert = useSweetAlert();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sedes, setSedes] = useState([]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid },
    watch,
  } = useForm({
    resolver: zodResolver(pnfSchema),
    mode: "onChange",
    defaultValues: {
      nombre_pnf: "",
      codigo_pnf: "",
      descripcion_pnf: "",
      sede_pnf: "", // debe ser string vacío, no undefined
    },
  });

  console.log(errors, isValid, watch());

  // Added useEffect to fetch sedes (campuses)
  useEffect(() => {
    const fetchSedes = async () => {
      const response = await axios.get("/sedes");
      setSedes(response.sedes || []);
    };

    fetchSedes();
  }, [axios]);

const onSubmit = async (data) => {
  setIsSubmitting(true);
  console.log(data);

  try {
    await axios.post("/pnf", data);

    alert.success(
      "PNF creado con éxito",
      "Se ha registrado el PNF exitosamente."
    );

    reset();
  } catch (error) {
    // ✅ Manejo estandarizado de errores
    if (error?.error?.totalErrors > 0) {
      error.error.validationErrors.forEach((error_validacion) => {
        alert.toast(error_validacion.field, error_validacion.message);
      });
    } else {
      alert.error(
        error.title || "Error al registrar el PNF",
        error.message || "No se pudo registrar el PNF. Intente nuevamente."
      );
    }

    console.error("Error al registrar el PNF:", error);
  } finally {
    setIsSubmitting(false);
  }
};


  return (
    <>
      <ResponsiveAppBar backgroundColor />

      <Box sx={{ pt: 12, px: 4, pb: 10 }}>
        <Typography
          variant="h2"
          component="h1"
          gutterBottom
          sx={{ mt: 6, ml: 6 }}
        >
          Registrar PNF
        </Typography>

        <Box
          sx={{
            maxWidth: 1000,
            mx: "auto",
            p: 5,
            bgcolor: "background.paper",
            borderRadius: 4,
            boxShadow: 4,
            border: (theme) => `1px solid ${theme.palette.divider}`,
          }}
        >
          <Box
            component="form"
            onSubmit={handleSubmit(onSubmit)}
            aria-labelledby="pnf-form-title"
          >
            <Stack spacing={5}>
              {/* Fila 1: Nombre y Código */}
              <Stack direction={{ xs: "column", md: "row" }} spacing={4}>
                <CustomLabel
                  fullWidth
                  label="Nombre del PNF"
                  variant="outlined"
                  {...register("nombre_pnf")}
                  error={!!errors.nombre_pnf}
                  helperText={
                    errors.nombre_pnf?.message || "Colocar el nombre del PNF"
                  }
                  inputProps={{ "aria-required": "true" }}
                />

                <CustomLabel
                  fullWidth
                  type="number"
                  label="Número de trayectos"
                  variant="outlined"
                  {...register("duracion_trayectos_pnf", {
                    valueAsNumber: true, // convierte el valor automáticamente a número
                  })}
                  error={!!errors.duracion_trayectos_pnf}
                  helperText={
                    errors.duracion_trayectos_pnf?.message ||
                    "Colocar el número de trayectos"
                  }
                  inputProps={{
                    "aria-required": "true",
                    min: 1,
                    step: 1, // evita decimales
                    onKeyDown: (e) => {
                      if (e.key === "." || e.key === "," || e.key === "e") {
                        e.preventDefault(); // bloquea puntos, comas y notación científica
                      }
                    },
                  }}
                />

                <CustomLabel
                  fullWidth
                  label="Codigo de PNF"
                  variant="outlined"
                  {...register("codigo_pnf")}
                  error={!!errors.codigo_pnf}
                  helperText={
                    errors.codigo_pnf?.message || "Código único del PNF"
                  }
                  inputProps={{ "aria-required": "true" }}
                />
              </Stack>
              {/* Fila 2: Población y Descripción */}
              <Stack direction={{ xs: "column", md: "row" }} spacing={4}>
                <CustomLabel
                  fullWidth
                  label="Descripcion de PNF"
                  variant="outlined"
                  multiline
                  rows={3}
                  {...register("descripcion_pnf")}
                  error={!!errors.descripcion_pnf}
                  helperText={errors.descripcion_pnf?.message}
                />

                <CustomLabel
                  select
                  fullWidth
                  label="Sede"
                  variant="outlined"
                  {...register("sede_pnf")}
                  error={!!errors.sede_pnf}
                  helperText={errors.sede_pnf?.message || "Seleccione una sede"}
                >
                  {sedes.length > 0 ? (
                    sedes.map((sede) => (
                      <MenuItem key={sede.id_sede} value={sede.id_sede}>
                        {sede.nombre_sede}
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem disabled>Cargando sedes...</MenuItem>
                  )}
                </CustomLabel>
              </Stack>{" "}
              {/* Fixed: Added closing tag for this Stack */}
              {/* Fila 3: Botones */}
              <Stack direction="row" spacing={3} justifyContent="flex-end">
                <CustomButton
                  tipo="secondary"
                  onClick={() => reset()}
                  disabled={isSubmitting}
                >
                  Limpiar
                </CustomButton>

                <CustomButton
                  tipo="primary"
                  type="submit"
                  disabled={!isValid || isSubmitting}
                >
                  {isSubmitting ? "Guardando..." : "Guardar PNF"}
                </CustomButton>
              </Stack>
            </Stack>
          </Box>
        </Box>
      </Box>
    </>
  );
}
