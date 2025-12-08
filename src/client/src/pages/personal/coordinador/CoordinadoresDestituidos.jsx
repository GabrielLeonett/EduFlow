// ================================================
// 📌 VISTA DE COORDINADORES DESTITUIDOS (OPTIMIZADA)
// ================================================

import {
  Typography,
  Box,
  Grid,
  InputAdornment,
  Stack,
  Pagination,
  MenuItem,
  Tooltip,
} from "@mui/material";

import { Search as SearchIcon, Route as RouteIcon } from "@mui/icons-material";
import { useState, useEffect, useCallback } from "react";

import { useTheme } from "@mui/material/styles";
import useApi from "../../../hook/useApi";

import ResponsiveAppBar from "../../../components/navbar";
import CustomAutocomplete from "../../../components/CustomAutocomplete";
import CustomLabel from "../../../components/customLabel";
import CustomButton from "../../../components/customButton";
import CardCoordinadorDestituido from "../../../components/CardCoordinadorDestituido";
import { useTour } from "../../../hook/useTour";

export default function CoordinadoresDestituidos() {
  const axios = useApi();
  const theme = useTheme();

  const [coordinadores, setCoordinadores] = useState([]);
  const [coordinadorSearch, setCoordinadorSearch] = useState(null);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const [sortOrder, setSortOrder] = useState("nombres");
  const [loading, setLoading] = useState(true);

  // ========================
  // 🔍 FETCH COORDINADORES
  // ========================
  const fetchCoordinadores = useCallback(async () => {
    setLoading(true);
    try {
      const endpoint = `/coordinadores/destituidos?page=${
        pagination.page
      }&limit=${pagination.limit}&sort_order=${sortOrder}&search=${
        coordinadorSearch || ""
      }`;

      const data = await axios.get(endpoint);

      setCoordinadores(data.coordinadores || []);
      setPagination((prev) => ({ ...prev, ...data.pagination }));
    } catch (err) {
      console.error("❌ Error cargando coordinadores:", err);
      setCoordinadores([]);
    } finally {
      setLoading(false);
    }
  }, [axios, pagination.page, pagination.limit, sortOrder, coordinadorSearch]);

  useEffect(() => {
    fetchCoordinadores();
  }, [pagination.page, pagination.limit, sortOrder, coordinadorSearch]);

  // ========================
  // 📄 Paginación
  // ========================
  const handlePageChange = (_, page) => {
    setPagination((prev) => ({ ...prev, page }));
  };

  // ========================
  // ↕ Ordenamiento
  // ========================
  const handleSortChange = (e) => {
    setSortOrder(e.target.value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  // ========================
  // 🔍 Búsqueda
  // ========================
  const handleSearchChange = (_, newValue) => {
    setCoordinadorSearch(newValue?.id_coordinador);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  // ========================
  // 🧭 TOUR
  // ========================
  const { startTour, resetTour } = useTour(
    [
      { intro: "Bienvenido. Aquí visualizas los coordinadores destituidos." },
      {
        element: "#filtros-busqueda",
        intro: "Aquí puedes buscar y ordenar coordinadores.",
      },
      {
        element: "#coordinadores-container",
        intro: "Aquí se listan los coordinadores destituidos.",
      },
      {
        element: "#btn-reiniciar-tour",
        intro: "Presiona aquí para repetir el tutorial.",
      },
    ],
    "tourCoordinadoresDestituidos"
  );

  useEffect(() => {
    if (!loading && coordinadores.length > 0) startTour();
  }, [loading, coordinadores]);

  return (
    <>
      <ResponsiveAppBar backgroundColor />

      <Box mt={12} p={3}>
        <Typography variant="h3" fontWeight={600} mb={1}>
          Coordinadores Destituidos
        </Typography>

        <Typography variant="body2" color="text.secondary" mb={3}>
          Lista de coordinadores destituidos con opciones disponibles.
        </Typography>

        {/* FILTROS */}
        <Box
          id="filtros-busqueda"
          sx={{
            m: 3,
            display: "flex",
            gap: 2,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          {/* AUTOCOMPLETE */}
          <Box sx={{ flexGrow: 1, minWidth: 300 }}>
            <CustomAutocomplete
              options={coordinadores}
              getOptionLabel={(c) => `${c.nombres} ${c.apellidos}`}
              onChange={handleSearchChange}
              renderInput={(params) => (
                <CustomLabel
                  {...params}
                  label="Buscar coordinador"
                  placeholder="Nombre, apellido o cédula"
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: "text.secondary" }} />
                      </InputAdornment>
                    ),
                  }}
                />
              )}
              isOptionEqualToValue={(option, value) =>
                option.id_coordinador === value?.id_coordinador
              }
              filterOptions={(options, { inputValue }) =>
                options.filter(
                  (opt) =>
                    opt.nombres
                      ?.toLowerCase()
                      .includes(inputValue.toLowerCase()) ||
                    opt.apellidos
                      ?.toLowerCase()
                      .includes(inputValue.toLowerCase()) ||
                    opt.cedula?.toLowerCase().includes(inputValue.toLowerCase())
                )
              }
              noOptionsText="No se encontraron coordinadores"
            />
          </Box>

          {/* ORDENAR */}
          <CustomLabel
            sx={{ minWidth: 200 }}
            select
            label="Ordenar por"
            value={sortOrder}
            onChange={handleSortChange}
          >
            <MenuItem value="nombres">Nombre (A-Z)</MenuItem>
            <MenuItem value="apellidos">Apellido (A-Z)</MenuItem>
            <MenuItem value="cedula">Cédula</MenuItem>
            <MenuItem value="fecha_creacion">Más recientes</MenuItem>
          </CustomLabel>
        </Box>

        {/* LISTA */}
        {loading ? (
          <Typography textAlign="center" mt={4}>
            Cargando...
          </Typography>
        ) : (
          <Box id="coordinadores-container">
            {coordinadores.length === 0 ? (
              <Typography textAlign="center" mt={4}>
                No hay coordinadores destituidos.
              </Typography>
            ) : (
              <>
                <Grid container spacing={3}>
                  {coordinadores.map((coor) => (
                    <Grid key={coor.id_coordinador} item xs={12} sm={6} md={4}>
                      <CardCoordinadorDestituido coordinador={coor} />
                    </Grid>
                  ))}
                </Grid>

                {/* PAGINACIÓN */}
                {pagination.totalPages > 1 && (
                  <Box
                    sx={{ display: "flex", justifyContent: "center", my: 3 }}
                  >
                    <Stack>
                      <Pagination
                        count={pagination.totalPages}
                        page={pagination.page}
                        onChange={handlePageChange}
                        color="primary"
                        shape="rounded"
                        showFirstButton
                        showLastButton
                      />
                    </Stack>
                  </Box>
                )}
              </>
            )}
          </Box>
        )}

        {/* INFO PAGINACIÓN */}
        {coordinadores.length > 0 && (
          <Typography
            variant="body2"
            textAlign="center"
            color="text.secondary"
            mt={2}
          >
            Mostrando {(pagination.page - 1) * pagination.limit + 1} -{" "}
            {Math.min(pagination.page * pagination.limit, pagination.total)} de{" "}
            {pagination.total} coordinadores
          </Typography>
        )}
      </Box>

      {/* BOTÓN TOUR */}
      <Tooltip title="Tutorial" placement="left-start">
        <CustomButton
          id="btn-reiniciar-tour"
          variant="contained"
          onClick={resetTour}
          sx={{
            position: "fixed",
            bottom: 75,
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
          aria-label="Ver tutorial"
        >
          <RouteIcon />
        </CustomButton>
      </Tooltip>
    </>
  );
}
