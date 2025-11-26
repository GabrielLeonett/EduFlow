import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  MenuItem,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  Container,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import ResponsiveAppBar from "../../../components/navbar";
import CustomLabel from "../../../components/customLabel";
import CustomButton from "../../../components/customButton";
import CustomAutocomplete from "../../../components/CustomAutocomplete";
import useApi from "../../../hook/useApi";
import { asignarCoordinadorSchema } from "../../../schemas/coordinador.schema";
import useSweetAlert from "../../../hook/useSweetAlert";

export default function AsignarCoordinador() {
  const axios = useApi();
  const alert = useSweetAlert();
  const theme = useTheme();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
    reset,
    setValue,
  } = useForm({
    resolver: zodResolver(asignarCoordinadorSchema),
    mode: "onChange",
    defaultValues: {
      id_profesor: "",
      id_pnf: "",
    },
  });

  const [profesores, setProfesores] = useState([]);
  const [pnfs, setPnfs] = useState([]);
  const [loadingPnfs, setLoadingPnfs] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // 👉 Cargar solo PNFs al inicio
  useEffect(() => {
    const fetchPnfs = async () => {
      try {
        const resPnfs = await axios.get("/pnf");
        console.log("Respuesta PNFs:", resPnfs);

        let datosPnfs = [];

        if (resPnfs.pnfs) {
          if (Array.isArray(resPnfs.pnfs)) datosPnfs = resPnfs.pnfs;
        } else if (resPnfs.data?.pnfs) {
          datosPnfs = resPnfs.data.pnfs;
        }

        setPnfs(datosPnfs);
      } catch (error) {
        console.error("Error al cargar PNFs:", error);
        alert.error("Error", "No se pudieron cargar los PNFs");
      } finally {
        setLoadingPnfs(false);
      }
    };
    fetchPnfs();
  }, []);

  // 👉 Buscar profesores en tiempo real cuando el usuario escribe
  const handleSearchChange = async (event, value) => {
    setSearchQuery(value);

    if (value && value.length >= 2) {
      setSearchLoading(true);
      try {
        const resProfesores = await axios.get(
          `/profesores?search=${encodeURIComponent(value)}`
        );
        console.log("Respuesta búsqueda profesores:", resProfesores);

        let datosProfesores = [];

        if (resProfesores.profesores) {
          datosProfesores = resProfesores.profesores;
        } else if (resProfesores.data?.profesores) {
          datosProfesores = resProfesores.data.profesores;
        }

        // ✅ ELIMINAR DUPLICADOS por cedula
        const profesoresUnicos = datosProfesores.filter((profesor, index, self) =>
          index === self.findIndex(p => p.cedula === profesor.cedula)
        );

        setProfesores(profesoresUnicos);
      } catch (error) {
        console.error("Error al buscar profesores:", error);
        setProfesores([]);
      } finally {
        setSearchLoading(false);
      }
    } else {
      setProfesores([]);
    }
  };

  // 👉 Manejar selección de profesor - CORREGIDO
  const handleProfesorChange = (event, newValue) => {
    // ✅ Guardar la cédula (que es lo que necesita el backend)
    setValue("id_profesor", parseInt(newValue?.cedula) || "", {
      shouldValidate: true,
    });
  };

  // ✅ Obtener el profesor seleccionado actualmente
  const getSelectedProfesor = (fieldValue, profesoresList) => {
    return profesoresList.find(prof => prof.cedula === fieldValue) || null;
  };

  const onSubmit = async (data) => {
    try {
      console.log("Datos enviados:", data);

      const confirm = await alert.confirm(
        "¿Desea asignar este profesor como coordinador?",
        "Esta acción actualizará la lista de coordinadores."
      );
      if (!confirm) return;

      const payload = {
        id_profesor: data.id_profesor, // Esto debería ser la cédula
        id_pnf: data.id_pnf,
      };

      console.log("Payload:", payload);

      await axios.post("/coordinadores", payload);

      alert.success(
        "¡Asignación exitosa!",
        "El profesor ha sido asignado como coordinador del PNF."
      );

      reset();
      setProfesores([]);
      setSearchQuery("");
    } catch (error) {
      console.error("Error al asignar coordinador:", error);

      if (error?.error?.totalErrors > 0) {
        error.error.validationErrors.forEach((error_validacion) => {
          alert.toast(error_validacion.field, error_validacion.message);
        });
      } else {
        const message =
          error.response?.data?.message ||
          error.response?.data?.error ||
          error.message ||
          "Hubo un problema en la asignación. Intente nuevamente.";

        alert.error("Error al asignar coordinador", message);
      }
    }
  };

  const handleReset = () => {
    reset();
    setProfesores([]);
    setSearchQuery("");
  };

  if (loadingPnfs) {
    return (
      <>
        <ResponsiveAppBar backgroundColor />
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "80vh",
            mt: 8,
          }}
        >
          <CircularProgress size={60} />
        </Box>
      </>
    );
  }

  return (
    <>
      <ResponsiveAppBar backgroundColor />

      <Container maxWidth="lg" sx={{ mt: 15, mb: 4 }}>
        {/* Título */}
        <Box sx={{ mb: 4, textAlign: "center" }}>
          <Typography variant="h3" fontWeight={600} gutterBottom>
            Asignar Coordinador
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Seleccione un profesor y el PNF para asignarlo como coordinador
          </Typography>
        </Box>

        {/* Formulario */}
        <Card
          component="form"
          noValidate
          onSubmit={handleSubmit(onSubmit)}
          sx={{
            borderRadius: 3,
            boxShadow: theme.shadows[8],
            overflow: "visible",
          }}
        >
          <CardContent sx={{ p: { xs: 3, md: 5 } }}>
            <Grid container spacing={4}>
              {/* Búsqueda de Profesor en Tiempo Real - CORREGIDO */}
              <Grid size={{md: 12, lg: 6}}>
                <Controller
                  name="id_profesor"
                  control={control}
                  render={({ field }) => (
                    <CustomAutocomplete
                      options={profesores}
                      loading={searchLoading}
                      onInputChange={handleSearchChange}
                      getOptionLabel={(profesor) =>
                        profesor
                          ? `${profesor.nombres} ${profesor.apellidos} - ${profesor.cedula}`
                          : ""
                      }
                      // ✅ CORREGIDO: Buscar por cédula (que es lo que guardamos)
                      value={getSelectedProfesor(field.value, profesores)}
                      onChange={handleProfesorChange}
                      renderInput={(params) => (
                        <CustomLabel
                          {...params}
                          label="Buscar profesor"
                          placeholder="Escriba nombre, apellido o cédula..."
                          error={!!errors.id_profesor}
                          helperText={
                            errors.id_profesor?.message ||
                            "Escriba al menos 2 caracteres para buscar"
                          }
                        />
                      )}
                      // ✅ CORREGIDO: Comparar por cédula
                      isOptionEqualToValue={(option, value) =>
                        option.cedula === value?.cedula
                      }
                      filterOptions={(x) => x}
                      noOptionsText={
                        searchQuery.length < 2
                          ? "Escriba al menos 2 caracteres..."
                          : "No se encontraron profesores"
                      }
                    />
                  )}
                />
              </Grid>

              {/* Select PNF */}
              <Grid size={{md: 12, lg: 6}}>
                <Controller
                  name="id_pnf"
                  control={control}
                  render={({ field }) => (
                    <CustomLabel
                      select
                      fullWidth
                      id="id_pnf"
                      label="Programa Nacional de Formación (PNF)"
                      {...field}
                      error={!!errors.id_pnf}
                      helperText={errors.id_pnf?.message || "Seleccione un PNF"}
                      size="small"
                    >
                      {pnfs.length > 0 ? (
                        pnfs.map((pnf) => (
                          <MenuItem
                            key={pnf.id_pnf || pnf.id}
                            value={pnf.id_pnf || pnf.id}
                          >
                            {pnf.nombre_pnf || pnf.nombre}
                            {pnf.codigo_pnf && ` (${pnf.codigo_pnf})`}
                          </MenuItem>
                        ))
                      ) : (
                        <MenuItem disabled value="">
                          No hay PNFs disponibles
                        </MenuItem>
                      )}
                    </CustomLabel>
                  )}
                />
              </Grid>
            </Grid>

            {/* Botones */}
            <Box
              sx={{
                mt: 4,
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                gap: 2,
                justifyContent: "flex-end",
              }}
            >
              <CustomButton
                type="button"
                variant="outlined"
                tipo="secondary"
                onClick={handleReset}
                fullWidth={{ xs: true, sm: false }}
                disabled={isSubmitting}
              >
                Limpiar Formulario
              </CustomButton>
              <CustomButton
                type="submit"
                variant="contained"
                tipo="primary"
                fullWidth={{ xs: true, sm: false }}
                disabled={isSubmitting || !isValid}
                loading={isSubmitting}
              >
                {isSubmitting ? "Asignando..." : "Asignar Coordinador"}
              </CustomButton>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </>
  );
}