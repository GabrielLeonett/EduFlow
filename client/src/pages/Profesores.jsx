import ResponsiveAppBar from "../components/navbar";
import { PruebaProfesor } from "../components/cardProfesor";
import {
  Typography,
  Box,
  CircularProgress,
  TextField,
  IconButton,
} from "@mui/material";
import { Search } from "@mui/icons-material";
import { useState, useEffect, useCallback } from "react";
import useApi from "../hook/useApi";

export default function Profesores() {
  const axios = useApi();
  const [profesores, setProfesores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Función para buscar profesores
  const fetchProfesores = useCallback(async (search = "") => {
    setLoading(true);
    setError(null);
    try {
      const endpoint = search ? "/Profesor/search" : "/Profesor";
      const payload = search ? { busqueda: search } : {};
      const { data } = await axios.get(endpoint, { params: payload });
      setProfesores(data || []);
    } finally {
      setLoading(false);
    }
  }, []);

  // Efecto inicial
  useEffect(() => {
    fetchProfesores();
  }, [fetchProfesores]);

  const handleSearch = () => {
    fetchProfesores(searchTerm);
  };

  return (
    <>
      <ResponsiveAppBar backgroundColor />
      <Box sx={{ pt: 15, px: 5 }}>
        <Typography variant="h3" component="h1" gutterBottom sx={{ mb: 4 }}>
          Profesores
        </Typography>

        {/* Barra de búsqueda */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            mb: 4,
            maxWidth: 500,
          }}
        >
          <TextField
            fullWidth
            label="Buscar profesor"
            variant="outlined"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <IconButton color="primary" onClick={handleSearch}>
            <Search />
          </IconButton>
        </Box>

        {/* Lista de profesores */}
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
          ) : error ? (
            <Typography color="error" textAlign="center" my={4}>
              {error}
            </Typography>
          ) : profesores.length === 0 ? (
            <Typography textAlign="center" my={4}>
              No se encontraron profesores con los filtros seleccionados
            </Typography>
          ) : (
            profesores.map((profesor) => <PruebaProfesor profesor={profesor} />)
          )}
        </Box>
      </Box>
    </>
  );
}
