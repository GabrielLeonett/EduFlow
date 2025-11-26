// src/pages/GestionAulas.jsx
import { useCallback, useEffect, useState } from "react";
import {
  Typography,
  Box,
  Grid,
  Tooltip,
  InputAdornment,
  Stack,
  Pagination,
  MenuItem,
  CircularProgress,
} from "@mui/material";
import {
  AddHome as AddHomeIcon,
  Search as SearchIcon,
  Route as RouteIcon,
} from "@mui/icons-material";
import { useNavigate, useParams } from "react-router-dom";
import ResponsiveAppBar from "../../components/navbar";
import CustomButton from "../../components/customButton";
import CustomAutocomplete from "../../components/CustomAutocomplete";
import CustomLabel from "../../components/customLabel";
import CardAula from "../../components/CardAula";
import useApi from "../../hook/useApi";
import { useTour } from "../../hook/useTour";

export default function GestionAulas() {
  const axios = useApi();
  const navigate = useNavigate();
  const parametros = useParams();
  const { id_sede } = parametros;

  const [aulas, setAulas] = useState([]);
  const [aulaSearch, setAulaSearch] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [sortOrder, setSortOrder] = useState("codigo");
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [searchTimeout, setSearchTimeout] = useState(null);

  // Función para buscar aulas
  const fetchAulas = useCallback(async () => {
    setLoading(true);
    try {
      const endpoint = `/aulas/sede/${id_sede}?page=${pagination.page}&limit=${
        pagination.limit
      }&sort_order=${sortOrder}&search=${aulaSearch || ""}`;
      const response = await axios.get(endpoint);

      console.log("Aulas cargadas:", response);
      const aulasData = response.aulas || [];
      const paginationData = response.pagination || {};

      setAulas(aulasData);
      setPagination((prev) => ({
        ...prev,
        ...paginationData,
      }));
    } catch (error) {
      console.error("❌ Error al obtener aulas:", error);
      setAulas([]);
    } finally {
      setLoading(false);
    }
  }, [
    axios,
    id_sede,
    pagination.page,
    pagination.limit,
    sortOrder,
    aulaSearch,
  ]);

  // Cargar aulas
  useEffect(() => {
    fetchAulas();
  }, [fetchAulas]);

  const { startTour, resetTour } = useTour(
    [
      {
        intro: "👋 Bienvenido al módulo de gestión de aulas.",
      },
      {
        element: "#aulas-container",
        intro: "Aquí se muestran todas las aulas registradas en este núcleo.",
        position: "right",
      },
      {
        element: "#filtros-busqueda",
        intro: "Puedes ordenar y filtrar las aulas aquí.",
        position: "bottom",
      },
      {
        element: "#btn-registrar-aula",
        intro: "Haz clic aquí para registrar una nueva aula.",
        position: "left",
      },
      {
        element: "#btn-reiniciar-tour",
        intro: "Puedes volver a ver este recorrido cuando quieras.",
        position: "top",
      },
    ],
    "tourGestionAulas"
  );

  useEffect(() => {
    if (!loading && aulas.length > 0) {
      startTour();
    }
  }, [loading, aulas, startTour]);

  // Manejar cambio de página
  const handlePageChange = (event, page) => {
    setPagination((prev) => ({
      ...prev,
      page: page,
    }));
  };

  // Manejar cambio de ordenamiento
  const handleSortChange = (event) => {
    setSortOrder(event.target.value);
    // Resetear a página 1 cuando cambia el ordenamiento
    setPagination((prev) => ({
      ...prev,
      page: 1,
    }));
  };

  return (
    <>
      <ResponsiveAppBar backgroundColor />

      <Box mt={12} p={3}>
        <Typography variant="h3" fontWeight={600} mb={1}>
          Gestión de Aulas
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>
          Visualizar, Editar y Crear Aulas
        </Typography>

        {/* Filtros y Búsqueda */}
        <Box
          id="filtros-busqueda"
          sx={{
            m: 3,
            display: "flex",
            gap: 2,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          {/* Búsqueda por código o tipo */}
          <Box sx={{ flexGrow: 1, minWidth: 300 }}>
            <CustomAutocomplete
              freeSolo
              options={aulas}
              inputValue={searchInput}
              onInputChange={(event, newValue) => {
                setSearchInput(newValue);

                // Clear previous timeout
                if (searchTimeout) clearTimeout(searchTimeout);

                // Set new timeout for debounced search
                const timeout = setTimeout(() => {
                  if (newValue.length > 2 || newValue.length === 0) {
                    setAulaSearch(newValue);
                  }
                }, 1000);

                setSearchTimeout(timeout);
              }}
              onChange={(event, newValue) => {
                if (newValue && typeof newValue !== "string") {
                  // User selected an option
                  console.log("Aula seleccionada:", newValue);
                  // Puedes hacer algo con el aula seleccionada
                }
              }}
              getOptionLabel={(option) => {
                if (typeof option === "string") {
                  return option;
                }
                return `${option.codigo_aula} - ${option.tipo_aula} (${option.nombre_sede})`;
              }}
              renderInput={(params) => (
                <CustomLabel
                  {...params}
                  label="Buscar aula"
                  placeholder="Escribe código, tipo o núcleo..."
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
              filterOptions={(options, { inputValue }) => {
                // Si el input está vacío, mostrar opciones recientes o populares
                if (!inputValue) {
                  return options.slice(0, 5); // Mostrar solo las primeras 5
                }

                // Filtrar opciones locales
                return options.filter(
                  (option) =>
                    option.codigo_aula
                      ?.toLowerCase()
                      .includes(inputValue.toLowerCase()) ||
                    option.tipo_aula
                      ?.toLowerCase()
                      .includes(inputValue.toLowerCase()) ||
                    option.nombre_sede
                      ?.toLowerCase()
                      .includes(inputValue.toLowerCase())
                );
              }}
              noOptionsText={
                searchInput.length > 2
                  ? "Presiona Enter para buscar"
                  : "Escribe al menos 3 caracteres"
              }
            />
          </Box>

          {/* Ordenamiento */}
          <CustomLabel
            sx={{ minWidth: 200 }}
            size="small"
            select
            labelId="sort-order-label"
            value={sortOrder}
            label="Ordenar por"
            onChange={handleSortChange}
          >
            <MenuItem value="codigo">Código (A-Z)</MenuItem>
            <MenuItem value="tipo">Tipo (A-Z)</MenuItem>
            <MenuItem value="capacidad">Capacidad</MenuItem>
            <MenuItem value="fecha_creacion">Más recientes</MenuItem>
            <MenuItem value="sede">Sede</MenuItem>
          </CustomLabel>
        </Box>

        {loading ? (
          <Box className="flex justify-center items-center h-64">
            <CircularProgress />
          </Box>
        ) : (
          <Box id="aulas-container">
            {aulas.length === 0 ? (
              <Typography align="center" variant="h6" sx={{ mt: 4 }}>
                No se encontraron aulas registradas.
              </Typography>
            ) : (
              <>
                <Grid
                  container
                  spacing={3}
                  justifyContent="center"
                  alignItems="center"
                  sx={{ width: "100%", margin: 0 }}
                >
                  {aulas.map((aula) => (
                    <Grid key={aula.id_aula} xs={12} sm={6} md={4} lg={3}>
                      <CardAula aula={aula} />
                    </Grid>
                  ))}
                </Grid>

                {/* Paginación */}
                {pagination.totalPages > 1 && (
                  <Box
                    sx={{
                      width: "100%",
                      display: "flex",
                      alignContent: "center",
                      justifyContent: "center",
                      my: 3,
                    }}
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
                        size="large"
                      />
                    </Stack>
                  </Box>
                )}
              </>
            )}
          </Box>
        )}

        {/* Información de paginación */}
        {aulas.length > 0 && (
          <Typography
            variant="body2"
            color="text.secondary"
            textAlign="center"
            mt={2}
          >
            Mostrando {(pagination.page - 1) * pagination.limit + 1} -{" "}
            {Math.min(pagination.page * pagination.limit, pagination.total)} de{" "}
            {pagination.total} aulas
          </Typography>
        )}

        <Tooltip title="Crear nueva aula" placement="left-start">
          <CustomButton
            id="btn-registrar-aula"
            onClick={() => navigate("/infraestructura/aulas/registrar")}
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
            aria-label="Registrar Aula"
          >
            <AddHomeIcon />
          </CustomButton>
        </Tooltip>

        <Tooltip title="Tutorial" placement="left-start">
          <CustomButton
            id="btn-reiniciar-tour"
            variant="contained"
            onClick={resetTour}
            sx={{
              position: "fixed",
              bottom: 128,
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
      </Box>
    </>
  );
}
