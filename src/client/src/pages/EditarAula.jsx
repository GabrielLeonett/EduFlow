// src/pages/EditarAula.jsx
import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  MenuItem,
  CircularProgress,
  Grid,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useParams, useNavigate } from "react-router-dom";
import ResponsiveAppBar from "../components/navbar";
import CustomLabel from "../components/customLabel";
import CustomButton from "../components/customButton";
import useApi from "../hook/useApi";
import AulaSchema from "../schemas/aula.schema";

export default function EditarAula() {
  const theme = useTheme();
  const axios = useApi();
  const { id } = useParams();
  const navigate = useNavigate();

  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
  } = useForm({
    resolver: zodResolver(AulaSchema),
    mode: "onChange",
  });

  const [sedes, setSedes] = useState([]);
  const [loadingSedes, setLoadingSedes] = useState(true);
  const [loadingAula, setLoadingAula] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Cargar sedes
  useEffect(() => {
    const fetchSedes = async () => {
      try {
        const response = await axios.get("/Sedes");
        setSedes(response.data.data);
      } catch (error) {
        console.error("❌ Error al cargar sedes:", error);
      } finally {
        setLoadingSedes(false);
      }
    };
    fetchSedes();
  }, []);

  // Cargar datos del aula a editar
  useEffect(() => {
    const fetchAula = async () => {
      try {
        const response = await axios.get(`/Aula/${id}`);
        const aula = response.data.data || response.data;
        reset({
          codigo: aula.codigo,
          tipo: aula.tipo,
          capacidad: aula.capacidad,
          id_sede: aula.id_sede,
        });
      } catch (error) {
        console.error("❌ Error al cargar aula:", error);
      } finally {
        setLoadingAula(false);
      }
    };
    fetchAula();
  }, [id, reset]);

  // Enviar actualización
  const onSubmit = async (data) => {
    setUpdating(true);
    try {
      const formData = {
        ...data,
        capacidad: Number(data.capacidad),
      };
      await axios.put(`/Aula/update/${id}`, formData);
      navigate("/aulas"); // Redirige a la lista
    } catch (error) {
      console.error("❌ Error al actualizar aula:", error);
    } finally {
      setUpdating(false);
    }
  };

  if (loadingAula) {
    return (
      <Box
        className="flex justify-center items-center h-screen"
        sx={{ backgroundColor: theme.palette.background.default }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <ResponsiveAppBar backgroundColor />

      <Box
        className="flex flex-col w-full min-h-screen bg-gray-100 p-4"
        sx={{
          mt: 10,
          backgroundColor: theme.palette.background.default,
          minHeight: "100vh",
        }}
      >
        <Typography
          variant="h4"
          gutterBottom
          sx={{
            mt: 4,
            textAlign: "center",
            fontWeight: "bold",
            color: theme.palette.primary.main,
            mb: 4,
          }}
        >
          Editar Aula
        </Typography>

        <Box className="flex justify-center items-start flex-grow">
          <Box
            component="form"
            noValidate
            onSubmit={handleSubmit(onSubmit)}
            sx={{
              backgroundColor: theme.palette.background.paper,
              width: "90%",
              maxWidth: "800px",
              p: 4,
              borderRadius: "16px",
              boxShadow: theme.shadows[5],
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Grid container spacing={3}>
              {/* Código */}
              <Grid xs={12} md={6}>
                <CustomLabel
                  id="codigo"
                  name="codigo"
                  label="Código del Aula"
                  type="text"
                  {...register("codigo")}
                  error={!!errors.codigo}
                  helperText={errors.codigo?.message}
                  fullWidth
                />
              </Grid>

              {/* Tipo */}
              <Grid xs={12} md={6}>
                <Controller
                  name="tipo"
                  control={control}
                  render={({ field }) => (
                    <CustomLabel
                      select
                      id="tipo"
                      label="Tipo de Aula"
                      {...field}
                      error={!!errors.tipo}
                      helperText={errors.tipo?.message}
                      fullWidth
                    >
                      <MenuItem value="Convencional">Convencional</MenuItem>
                      <MenuItem value="Interactiva">Interactiva</MenuItem>
                      <MenuItem value="Computación">Computación</MenuItem>
                      <MenuItem value="Exterior">Exterior</MenuItem>
                      <MenuItem value="Laboratorio">Laboratorio</MenuItem>
                    </CustomLabel>
                  )}
                />
              </Grid>

              {/* Capacidad */}
              <Grid xs={12} md={6}>
                <CustomLabel
                  id="capacidad"
                  label="Capacidad"
                  type="number"
                  {...register("capacidad")}
                  error={!!errors.capacidad}
                  helperText={errors.capacidad?.message}
                  fullWidth
                />
              </Grid>

              {/* Sede */}
              <Grid xs={12} md={6}>
                {loadingSedes ? (
                  <Box
                    display="flex"
                    justifyContent="center"
                    alignItems="center"
                    height="56px"
                  >
                    <CircularProgress size={24} />
                  </Box>
                ) : (
                  <Controller
                    name="id_sede"
                    control={control}
                    render={({ field }) => (
                      <CustomLabel
                        select
                        id="id_sede"
                        label="Sede"
                        {...field}
                        error={!!errors.id_sede}
                        helperText={errors.id_sede?.message}
                        fullWidth
                      >
                        {sedes.map((sede) => (
                          <MenuItem key={sede.id_sede} value={sede.id_sede}>
                            {sede.nombre_sede}
                          </MenuItem>
                        ))}
                      </CustomLabel>
                    )}
                  />
                )}
              </Grid>
            </Grid>

            {/* Botones */}
            <Box
              className="flex justify-end gap-4 mt-6 pt-4"
              sx={{ borderTop: 1, borderColor: "divider" }}
            >
              <CustomButton
                type="button"
                variant="outlined"
                color="secondary"
                onClick={() => navigate("/aulas")}
              >
                Cancelar
              </CustomButton>
              <CustomButton
                type="submit"
                variant="contained"
                color="primary"
                disabled={!isValid || updating}
              >
                {updating ? (
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <CircularProgress size={20} sx={{ mr: 1, color: "white" }} />
                    Guardando...
                  </Box>
                ) : (
                  "Guardar Cambios"
                )}
              </CustomButton>
            </Box>
          </Box>
        </Box>
      </Box>
    </>
  );
}
