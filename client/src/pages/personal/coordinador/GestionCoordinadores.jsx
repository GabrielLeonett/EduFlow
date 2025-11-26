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
  PersonAdd as PersonAddIcon,
  Route as RouteIcon,
  Search as SearchIcon,
} from "@mui/icons-material";
import { useState, useEffect, useCallback } from "react";
import useApi from "../../../hook/useApi";
import { useNavigate, useParams } from "react-router-dom";
import ResponsiveAppBar from "../../../components/navbar";
import CardCoordinador from "../../../components/CardCoordinador";
import CustomButton from "../../../components/customButton";
import { useTour } from "../../../hook/useTour";
import CustomAutocomplete from "../../../components/CustomAutocomplete";
import CustomLabel from "../../../components/customLabel";

export default function Coordinadores() {
  const axios = useApi();
  const navigate = useNavigate();
  const { id_coordinador } = useParams();

  const [coordinadores, setCoordinadores] = useState([]);
  const [coordinadoresFiltrados, setCoordinadoresFiltrados] = useState([]);
  const [coordinadorSearch, setCoordinadorSearch] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [sortOrder, setSortOrder] = useState("nombre");
  const [loading, setLoading] = useState(true);

  // Función para cargar coordinadores
  const fetchCoordinadores = useCallback(async () => {
    setLoading(true);
    try {
      const endpoint = "/coordinadores";
      const respuesta = await axios.get(endpoint);
      console.log("Respuesta de coordinadores:", respuesta);
      const coordinadoresData = respuesta.coordinadores || [];
      setCoordinadores(coordinadoresData);
      setCoordinadoresFiltrados(coordinadoresData);
      setPagination(prev => ({
        ...prev,
        total: coordinadoresData.length,
        totalPages: Math.ceil(coordinadoresData.length / prev.limit)
      }));
    } catch (err) {
      console.error("❌ Error cargando coordinadores:", err);
      setCoordinadores([]);
      setCoordinadoresFiltrados([]);
    } finally {
      setLoading(false);
    }
  }, [axios]);

  // Efecto inicial
  useEffect(() => {
    fetchCoordinadores();
  }, [fetchCoordinadores]);

  // Efecto para filtrar coordinadores cuando cambia la búsqueda
  useEffect(() => {
    if (coordinadorSearch) {
      const filtered = coordinadores.filter(
        (coord) =>
          coord.id_coordinador === coordinadorSearch ||
          coord.cedula === coordinadorSearch
      );
      setCoordinadoresFiltrados(filtered);
    } else {
      setCoordinadoresFiltrados(coordinadores);
    }
    
    // Resetear a página 1 cuando se realiza una búsqueda
    setPagination(prev => ({
      ...prev,
      page: 1
    }));
  }, [coordinadorSearch, coordinadores]);

  // Obtener coordinadores paginados
  const coordinadoresPaginados = coordinadoresFiltrados.slice(
    (pagination.page - 1) * pagination.limit,
    pagination.page * pagination.limit
  );

  // Ordenar coordinadores
  const coordinadoresOrdenados = [...coordinadoresPaginados].sort((a, b) => {
    switch (sortOrder) {
      case "nombre":
        return (a.nombre || a.nombres || "").localeCompare(b.nombre || b.nombres || "");
      case "apellido":
        return (a.apellido || a.apellidos || "").localeCompare(b.apellido || b.apellidos || "");
      case "cedula":
        return (a.cedula || "").toString().localeCompare((b.cedula || "").toString());
      case "fecha_creacion":
        return new Date(b.fecha_creacion || 0) - new Date(a.fecha_creacion || 0);
      default:
        return 0;
    }
  });

  const { startTour, resetTour } = useTour(
    [
      {
        intro: "👋 Bienvenido al módulo de gestión de coordinadores.",
      },
      {
        element: "#coordinadores-container",
        intro: "Aquí se muestran todos los coordinadores registrados.",
        position: "right",
      },
      {
        element: "#filtros-busqueda",
        intro: "Puedes ordenar y filtrar los coordinadores aquí.",
        position: "bottom",
      },
      {
        element: "#btn-registrar-coordinador",
        intro: "Haz clic aquí para registrar un nuevo coordinador.",
        position: "left",
      },
      {
        element: "#btn-reiniciar-tour",
        intro: "Puedes volver a ver este recorrido cuando quieras.",
        position: "top",
      },
    ],
    "tourGestionCoordinadores"
  );

  useEffect(() => {
    if (!loading && coordinadores.length > 0) {
      startTour();
    }
  }, [loading, coordinadores, startTour]);

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
    setCoordinadorSearch(newValue?.id_coordinador || newValue?.cedula);
  };

  return (
    <>
      <ResponsiveAppBar backgroundColor />

      <Box mt={12} p={3}>
        <Typography variant="h3" fontWeight={600} mb={1}>
          Gestión de Coordinadores
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>
          Visualizar, Editar y Crear Coordinadores
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
              options={coordinadores}
              getOptionLabel={(coordinador) =>
                `${coordinador.nombre || coordinador.nombres || ''} ${coordinador.apellido || coordinador.apellidos || ''}`.trim() || 'Coordinador sin nombre'
              }
              value={null}
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
                option.id_coordinador === value?.id_coordinador || 
                option.cedula === value?.cedula
              }
              filterOptions={(options, { inputValue }) => {
                if (!inputValue) return options;
                
                return options.filter(
                  (option) =>
                    (option.nombre || option.nombres || '')
                      .toLowerCase()
                      .includes(inputValue.toLowerCase()) ||
                    (option.apellido || option.apellidos || '')
                      .toLowerCase()
                      .includes(inputValue.toLowerCase()) ||
                    (option.cedula || '')
                      .toString()
                      .toLowerCase()
                      .includes(inputValue.toLowerCase())
                );
              }}
              noOptionsText="No se encontraron coordinadores"
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
            <MenuItem value="nombre">Nombre (A-Z)</MenuItem>
            <MenuItem value="apellido">Apellido (A-Z)</MenuItem>
            <MenuItem value="cedula">Cédula</MenuItem>
            <MenuItem value="fecha_creacion">Más recientes</MenuItem>
          </CustomLabel>
        </Box>

        {loading ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              minHeight: 200,
            }}
          >
            <CircularProgress />
          </Box>
        ) : (
          <Box id="coordinadores-container">
            {coordinadoresOrdenados.length === 0 ? (
              <Typography textAlign="center" my={4}>
                {coordinadores.length === 0 
                  ? "No hay coordinadores registrados" 
                  : "No se encontraron coordinadores con los filtros seleccionados"
                }
              </Typography>
            ) : (
              <>
                <Grid container spacing={3} sx={{ width: "100%", margin: 0 }}>
                  {coordinadoresOrdenados.map((coordinador) => (
                    <Grid item key={coordinador.cedula || coordinador.id_coordinador}>
                      <CardCoordinador
                        coordinador={coordinador}
                        isSearch={!!id_coordinador}
                      />
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
        {coordinadoresOrdenados.length > 0 && (
          <Typography
            variant="body2"
            color="text.secondary"
            textAlign="center"
            mt={2}
          >
            Mostrando {(pagination.page - 1) * pagination.limit + 1} -{" "}
            {Math.min(pagination.page * pagination.limit, coordinadoresFiltrados.length)} de{" "}
            {coordinadoresFiltrados.length} coordinadores
          </Typography>
        )}

        <Tooltip title="Registrar Coordinador" placement="left-start">
          <CustomButton
            id="btn-registrar-coordinador"
            onClick={() => navigate("/coordinacion/coordinadores/asignar")}
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
            aria-label="Registrar Coordinador"
          >
            <PersonAddIcon />
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