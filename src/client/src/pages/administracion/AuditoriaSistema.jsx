import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Chip,
  Card,
  CardContent,
  Button,
  Stack,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  Search,
  FilterList,
  Refresh,
  Download,
  Clear,
  DateRange,
  Person,
  Category,
  Storage,
} from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";
import useApi from "../../hook/useApi";
import useSweetAlert from "../../hook/useSweetAlert";
import AuditoriaCard from "../../components/CardAuditoria";
import Navbar from "../../components/navbar";

const AuditoriaPage = () => {
  const axios = useApi();
  const alert = useSweetAlert();

  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [estadisticas, setEstadisticas] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // Estado de filtros
  const [filtros, setFiltros] = useState({
    page: 1,
    limit: 20,
    search: "",
    categoria: "",
    estado: "",
    entidad: "",
    tipoEvento: "",
    fechaDesde: "",
    fechaHasta: "",
    usuarioId: "",
  });

  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });

  // Obtener eventos de auditoría
  const obtenerAuditoria = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();

      // Agregar todos los filtros no vacíos
      Object.keys(filtros).forEach((key) => {
        if (filtros[key] && filtros[key] !== "") {
          params.append(key, filtros[key]);
        }
      });

      const response = await axios.get(`/auditory/system?${params.toString()}`);
      console.log(response);
      if (response) {
        setEventos(response.eventos || []);
        setPagination(response.pagination || {});
      } else {
        throw new Error(response.message || "Error al cargar auditoría");
      }
    } catch (err) {
      console.error("❌ Error cargando auditoría:", err);
      setError(err.message || "Error al cargar los registros de auditoría");
      alert.error(
        "Error",
        err.message || "No se pudieron cargar los registros"
      );
    } finally {
      setLoading(false);
    }
  }, [axios, alert, filtros]);

  // Obtener estadísticas
  const obtenerEstadisticas = useCallback(async () => {
    setStatsLoading(true);
    try {
      const response = await axios.get("/system/metricas/sistema");
      console.log(response)
      if (response) {
        setEstadisticas(response.cambiosSistema);
      }
    } catch (err) {
      console.error("❌ Error cargando estadísticas:", err);
    } finally {
      setStatsLoading(false);
    }
  }, [axios]);

  // Cargar datos iniciales
  useEffect(() => {
    obtenerAuditoria();
    obtenerEstadisticas();
  }, []);

  // Manejar cambio de página
  const handlePageChange = (newPage) => {
    setFiltros((prev) => ({ ...prev, page: newPage }));
  };

  // Manejar cambio de filtros
  const handleFilterChange = (key, value) => {
    setFiltros((prev) => ({ ...prev, [key]: value, page: 1 })); // Reset a página 1
  };

  // Limpiar todos los filtros
  const handleClearFilters = () => {
    setFiltros({
      page: 1,
      limit: 20,
      search: "",
      categoria: "",
      estado: "",
      entidad: "",
      tipoEvento: "",
      fechaDesde: "",
      fechaHasta: "",
      usuarioId: "",
    });
  };

  // Descargar reporte
  const handleDownloadReport = async () => {
    try {
      const params = new URLSearchParams();
      Object.keys(filtros).forEach((key) => {
        if (filtros[key] && filtros[key] !== "") {
          params.append(key, filtros[key]);
        }
      });

      // Aquí iría la lógica para descargar el reporte
      alert.success("Reporte", "Funcionalidad de descarga en desarrollo");
    } catch (err) {
      alert.error("Error", "No se pudo generar el reporte");
    }
  };

  // Opciones para filtros
  const opcionesCategoria = [
    "Autenticación",
    "Creación",
    "Actualización",
    "Eliminación",
    "Consulta",
    "Error",
    "Otro",
  ];

  const opcionesEstado = ["éxito", "error", "info"];

  const opcionesEntidad = [
    "usuarios",
    "profesores",
    "aulas",
    "sedes",
    "horarios",
    "administradores",
    "coordinadores",
  ];

  return (
    <>
      <Navbar backgroundColor />

      <Box sx={{ mt: 12, p: 3 }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Paper
            sx={{
              p: 4,
              mb: 4,
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "white",
              borderRadius: 3,
            }}
          >
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              flexWrap="wrap"
              gap={3}
            >
              <Box>
                <Typography variant="h3" fontWeight="700" gutterBottom>
                  📊 Auditoría del Sistema
                </Typography>
                <Typography variant="h6" sx={{ opacity: 0.9 }}>
                  Monitoreo y seguimiento de todas las actividades del sistema
                </Typography>
              </Box>

              <Stack direction="row" spacing={2}>
                <Tooltip title="Actualizar">
                  <IconButton
                    onClick={obtenerAuditoria}
                    sx={{ color: "white", bgcolor: "rgba(255,255,255,0.2)" }}
                  >
                    <Refresh />
                  </IconButton>
                </Tooltip>

                <Tooltip title="Descargar Reporte">
                  <IconButton
                    onClick={handleDownloadReport}
                    sx={{ color: "white", bgcolor: "rgba(255,255,255,0.2)" }}
                  >
                    <Download />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Box>
          </Paper>
        </motion.div>

        <Grid container spacing={4}>
          {/* Columna izquierda - Filtros y Estadísticas */}
          <Grid size={{ xs: 12, lg: 4 }}>
            <Stack spacing={4}>
              {/* Panel de Filtros */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center" gap={1} mb={3}>
                      <FilterList color="primary" />
                      <Typography variant="h6" fontWeight="600">
                        Filtros de Búsqueda
                      </Typography>
                    </Box>

                    <Stack spacing={2}>
                      {/* Búsqueda general */}
                      <TextField
                        fullWidth
                        size="small"
                        placeholder="Buscar en mensajes, usuarios..."
                        value={filtros.search}
                        onChange={(e) =>
                          handleFilterChange("search", e.target.value)
                        }
                        InputProps={{
                          startAdornment: (
                            <Search color="action" sx={{ mr: 1 }} />
                          ),
                        }}
                      />

                      {/* Filtros por categoría */}
                      <FormControl fullWidth size="small">
                        <InputLabel>Categoría</InputLabel>
                        <Select
                          value={filtros.categoria}
                          label="Categoría"
                          onChange={(e) =>
                            handleFilterChange("categoria", e.target.value)
                          }
                        >
                          <MenuItem value="">Todas las categorías</MenuItem>
                          {opcionesCategoria.map((cat) => (
                            <MenuItem key={cat} value={cat}>
                              {cat}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>

                      {/* Filtros por estado */}
                      <FormControl fullWidth size="small">
                        <InputLabel>Estado</InputLabel>
                        <Select
                          value={filtros.estado}
                          label="Estado"
                          onChange={(e) =>
                            handleFilterChange("estado", e.target.value)
                          }
                        >
                          <MenuItem value="">Todos los estados</MenuItem>
                          {opcionesEstado.map((estado) => (
                            <MenuItem key={estado} value={estado}>
                              {estado}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>

                      {/* Filtros por entidad */}
                      <FormControl fullWidth size="small">
                        <InputLabel>Entidad</InputLabel>
                        <Select
                          value={filtros.entidad}
                          label="Entidad"
                          onChange={(e) =>
                            handleFilterChange("entidad", e.target.value)
                          }
                        >
                          <MenuItem value="">Todas las entidades</MenuItem>
                          {opcionesEntidad.map((entidad) => (
                            <MenuItem key={entidad} value={entidad}>
                              {entidad}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>

                      {/* Fechas */}
                      <Box display="flex" gap={1}>
                        <TextField
                          fullWidth
                          size="small"
                          type="date"
                          label="Desde"
                          value={filtros.fechaDesde}
                          onChange={(e) =>
                            handleFilterChange("fechaDesde", e.target.value)
                          }
                          InputLabelProps={{ shrink: true }}
                        />
                        <TextField
                          fullWidth
                          size="small"
                          type="date"
                          label="Hasta"
                          value={filtros.fechaHasta}
                          onChange={(e) =>
                            handleFilterChange("fechaHasta", e.target.value)
                          }
                          InputLabelProps={{ shrink: true }}
                        />
                      </Box>

                      {/* Botones de acción */}
                      <Box display="flex" gap={1}>
                        <Button
                          fullWidth
                          variant="outlined"
                          onClick={handleClearFilters}
                          startIcon={<Clear />}
                        >
                          Limpiar
                        </Button>
                        <Button
                          fullWidth
                          variant="contained"
                          onClick={obtenerAuditoria}
                          startIcon={<Search />}
                        >
                          Buscar
                        </Button>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Panel de Estadísticas */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center" gap={1} mb={3}>
                      <Storage color="primary" />
                      <Typography variant="h6" fontWeight="600">
                        Estadísticas del Mes
                      </Typography>
                    </Box>

                    {statsLoading ? (
                      <Box display="flex" justifyContent="center" py={3}>
                        <CircularProgress size={30} />
                      </Box>
                    ) : estadisticas ? (
                      <Stack spacing={2}>
                        {console.log(estadisticas)}
                        <Box display="flex" justifyContent="space-between">
                          <Typography variant="body2">
                            Total Eventos:
                          </Typography>
                          <Chip
                            label={estadisticas.totalEventos}
                            size="small"
                            color="primary"
                          />
                        </Box>

                      </Stack>
                    ) : (
                      <Typography color="text.secondary" textAlign="center">
                        No hay estadísticas disponibles
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </Stack>
          </Grid>

          {/* Columna derecha - Lista de Eventos */}
          <Grid size={{ xs: 12, lg: 8 }}>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card>
                <CardContent>
                  {/* Header de resultados */}
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    mb={3}
                    flexWrap="wrap"
                    gap={2}
                  >
                    <Box>
                      <Typography variant="h6" fontWeight="600">
                        Registros de Auditoría
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {pagination.total} eventos encontrados
                      </Typography>
                    </Box>

                    {/* Paginación */}
                    {pagination.totalPages > 1 && (
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Button
                          size="small"
                          disabled={!pagination.hasPrev || loading}
                          onClick={() => handlePageChange(filtros.page - 1)}
                        >
                          Anterior
                        </Button>

                        <Typography variant="body2">
                          Página {filtros.page} de {pagination.totalPages}
                        </Typography>

                        <Button
                          size="small"
                          disabled={!pagination.hasNext || loading}
                          onClick={() => handlePageChange(filtros.page + 1)}
                        >
                          Siguiente
                        </Button>
                      </Stack>
                    )}
                  </Box>

                  {/* Estado de carga */}
                  {loading && (
                    <Box display="flex" justifyContent="center" py={4}>
                      <CircularProgress />
                    </Box>
                  )}

                  {/* Error */}
                  {error && !loading && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                      {error}
                    </Alert>
                  )}

                  {/* Lista de eventos */}
                  <AnimatePresence>
                    {!loading && eventos.length === 0 ? (
                      <Box textAlign="center" py={4}>
                        <Typography
                          variant="h6"
                          color="text.secondary"
                          gutterBottom
                        >
                          📭 No se encontraron registros
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          No hay eventos de auditoría que coincidan con los
                          filtros aplicados.
                        </Typography>
                      </Box>
                    ) : (
                      eventos.map((evento) => (
                        <AuditoriaCard key={evento.log_id} evento={evento} />
                      ))
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        </Grid>
      </Box>
    </>
  );
};

export default AuditoriaPage;
