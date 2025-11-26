import {
  Typography,
  Box,
  Grid,
  InputAdornment,
  Stack,
  Pagination,
  MenuItem,
} from "@mui/material";
import { Search as SearchIcon, Route as RouteIcon } from "@mui/icons-material";
import { useState, useEffect, useCallback } from "react";
import useApi from "../../../hook/useApi";
import ResponsiveAppBar from "../../../components/navbar";
import CardProfesorEliminado from "../../../components/CardProfesorEliminado";
import CustomAutocomplete from "../../../components/CustomAutocomplete";
import CustomLabel from "../../../components/customLabel";
import { useTour } from "../../../hook/useTour";
import { Tooltip } from "@mui/material";
import CustomButton from "../../../components/customButton";

export default function GestionProfesores() {
  const axios = useApi(false);

  const [profesores, setProfesores] = useState([]);
  const [profesorSearch, setProfesorSearch] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [sortOrder, setSortOrder] = useState("nombres");
  const [loading, setLoading] = useState(true);

  // Función para buscar profesores
  const fetchProfesores = useCallback(async () => {
    setLoading(true);
    try {
      const endpoint = `/profesores/eliminados?page=${pagination.page}&limit=${
        pagination.limit
      }&sort_order=${sortOrder}&search=${profesorSearch || ""}`;
      const data = await axios.get(endpoint);

      let profesoresData = data.profesores || [];
      let paginationData = data.pagination || {};

      setProfesores(profesoresData);
      setPagination((prev) => ({
        ...prev,
        ...paginationData,
      }));
    } catch (err) {
      console.error("❌ Error cargando profesores:", err);
      setProfesores([]);
    } finally {
      setLoading(false);
    }
  }, [axios, pagination.page, pagination.limit, sortOrder, profesorSearch]);

  // Efecto para cargar profesores cuando cambian los parámetros
  useEffect(() => {
    fetchProfesores();
  }, [pagination.page, pagination.limit, sortOrder, profesorSearch]);

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

  // Manejar cambio en el autocomplete de búsqueda
  const handleSearchChange = (event, newValue) => {
    setProfesorSearch(newValue?.id_profesor);
    // Resetear a página 1 cuando se realiza una búsqueda
    setPagination((prev) => ({
      ...prev,
      page: 1,
    }));
  };

  const { startTour, resetTour } = useTour(
      [
    {
      intro: "👋 Bienvenido. Aquí puedes ver los profesores eliminados.",
    },
    {
      element: "#filtros-busqueda",
      intro: "Aquí puedes buscar y filtrar los profesores eliminados.",
      position: "bottom",
    },
    {
      element: "#profesores-container",
      intro:
        "En esta sección se listan los profesores eliminados. Puedes restaurarlos.",
      position: "right",
    },
    {
      element: "#btn-reiniciar-tour",
      intro: "Haz clic aquí si deseas volver a ver este tutorial.",
      position: "left",
    },
  ],
  "tourProfesoresEliminados"
);
    useEffect(() => {
      if (!loading && profesores.length > 0) {
        startTour();
      }
    }, [loading, profesores, startTour]);

  return (
    <>
      <ResponsiveAppBar backgroundColor />

      <Box mt={12} p={3}>
        <Typography variant="h3" fontWeight={600} mb={1}>
          Control de Estatus Docente
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>
          Lista de profesores eliminados y opciones de restauración
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
          {/* Búsqueda por nombre */}
          <Box sx={{ flexGrow: 1, minWidth: 300 }}>
            <CustomAutocomplete
              options={profesores}
              getOptionLabel={(profesor) =>
                `${profesor.nombres} ${profesor.apellidos}`
              }
              value={null}
              onChange={handleSearchChange}
              renderInput={(params) => (
                <CustomLabel
                  {...params}
                  label="Buscar profesor"
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
                option.id_profesor === value?.id_profesor
              }
              filterOptions={(options, { inputValue }) => {
                return options.filter(
                  (option) =>
                    option.nombres
                      ?.toLowerCase()
                      .includes(inputValue.toLowerCase()) ||
                    option.apellidos
                      ?.toLowerCase()
                      .includes(inputValue.toLowerCase()) ||
                    option.cedula
                      ?.toLowerCase()
                      .includes(inputValue.toLowerCase())
                );
              }}
              noOptionsText="No se encontraron profesores"
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
            <MenuItem value="nombres">Nombre (A-Z)</MenuItem>
            <MenuItem value="apellidos">Apellido (A-Z)</MenuItem>
            <MenuItem value="cedula">Cédula</MenuItem>
            <MenuItem value="fecha_creacion">Más recientes</MenuItem>
            <MenuItem value="categoria">Categoría</MenuItem>
            <MenuItem value="dedicacion">Dedicación</MenuItem>
          </CustomLabel>
        </Box>

        {loading ? (
          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "center",
              alignContent: "center",
              flexWrap: "wrap",
            }}
          >
            cargando...
          </Box>
        ) : (
          <Box id="profesores-container">
            {profesores.length === 0 ? (
              <Typography textAlign="center" my={4}>
                No hay más profesores registrados
              </Typography>
            ) : (
              <>
                <Grid container spacing={3} sx={{ width: "100%", margin: 0 }}>
                  {profesores.map((profesor) => (
                    <Grid key={profesor.cedula || profesor.id}>
                      <CardProfesorEliminado prof={profesor} />
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
        {profesores.length > 0 && (
          <Typography
            variant="body2"
            color="text.secondary"
            textAlign="center"
            mt={2}
          >
            Mostrando {(pagination.page - 1) * pagination.limit + 1} -{" "}
            {Math.min(pagination.page * pagination.limit, pagination.total)} de{" "}
            {pagination.total} profesores
          </Typography>
        )}
      </Box>
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
    </>
  );
}
