import ResponsiveAppBar from "../../../components/navbar";
import CardCoordinador from "../../../components/CardCoordinador";
import { Typography, Box, CircularProgress, TextField, Tooltip } from "@mui/material";
import { useState, useEffect, useCallback } from "react";
import useApi from "../../../hook/useApi";
import CustomButton from "../../../components/customButton";
import AddIcon from "@mui/icons-material/Add";
import { useNavigate } from "react-router-dom";

export default function Coordinadores() {
  const navigate = useNavigate();
  const axios = useApi();
  const [coordinadores, setCoordinadores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");

  // Función para buscar coordinadores
  const fetchCoordinadores = useCallback(async () => {
    setLoading(true);
    try {
      const endpoint = "/coordinadores";
      const respuesta = await axios.get(endpoint);
      console.log("Respuesta de coordinadores:", respuesta);
      setCoordinadores(respuesta.coordinadores || []);
    } finally {
      setLoading(false);
    }
  }, [axios]);

  // Efecto inicial
  useEffect(() => {
    fetchCoordinadores();
  }, [fetchCoordinadores]);

  // ✅ Filtrado de coordinadores según búsqueda
  const coordinadoresFiltrados = coordinadores.filter(
    (coord) =>
      coord.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
      coord.apellido?.toLowerCase().includes(busqueda.toLowerCase()) ||
      coord.cedula?.toString().includes(busqueda)
  );

  return (
    <>
      <ResponsiveAppBar backgroundColor />
      <Box sx={{ pt: 15, px: 5 }}>
        <Typography variant="h3" component="h1" gutterBottom sx={{ mb: 4 }}>
          Coordinadores
        </Typography>

        {/* 🔍 Campo de búsqueda */}
        <Box sx={{ maxWidth: 400, mb: 3 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Buscar por nombre, apellido o cédula..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </Box>

        {/* Lista de coordinadores */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          {loading ? (
            <Box display="flex" justifyContent="center" my={4}>
              <CircularProgress />
            </Box>
          ) : coordinadoresFiltrados.length === 0 ? (
            <Typography textAlign="center" my={4}>
              No se encontraron coordinadores con los filtros seleccionados
            </Typography>
          ) : (
            coordinadoresFiltrados.map((coordinador) => (
              <CardCoordinador key={coordinador.cedula} coordinador={coordinador} />
            ))
          )}
        </Box>
        <Tooltip title={"Registrar Coodinador"} placement="left-start">
          <CustomButton
            onClick={() => {
              navigate('/coordinacion/coordinadores/asignar');
            }}
            sx={{
              position: "fixed",
              bottom: 78,
              right: 24,
              minWidth: "auto",
              width: 48,
              height: 48,
              borderRadius: "50%",
              zIndex: 9999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            aria-label={"Registrar Coodinador"}
          >
            <AddIcon />
          </CustomButton>
        </Tooltip>
      </Box>
    </>
  );
}
