import { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Alert,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
} from "@mui/material";
import { ExpandMore, FilterList } from "@mui/icons-material";
import NavBar from "../../components/navbar";
import useApi from "../../hook/useApi";

// Función para formatear la fecha
const formatDate = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleString("es-ES", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

// Función para obtener el color según el estado
const getStateColor = (state) => {
  switch (state) {
    case "error":
      return "error";
    case "critical":
      return "error";
    case "warning":
      return "warning";
    case "info":
      return "info";
    case "success":
      return "success";
    default:
      return "default";
  }
};

// Función para obtener el color según el status HTTP
const getStatusColor = (status) => {
  if (status >= 200 && status < 300) return "success";
  if (status >= 300 && status < 400) return "warning";
  if (status >= 400 && status < 500) return "error";
  if (status >= 500) return "error";
  return "default";
};

// Componente individual de Acordeón de Log
const LogAccordion = ({ log }) => (
  <Accordion defaultExpanded sx={{ mb: 1 }}>
    <AccordionSummary expandIcon={<ExpandMore />}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          width: "100%",
        }}
      >
        <Chip
          label={log.state}
          color={getStateColor(log.state)}
          size="small"
        />
        <Typography variant="body2" sx={{ flex: 1 }}>
          {formatDate(log.timestamp)}
        </Typography>
        <Typography
          variant="body2"
          fontWeight="medium"
          sx={{ flex: 2 }}
        >
          {log.title}
        </Typography>
        <Typography
          variant="body2"
          noWrap
          sx={{ flex: 3, color: "text.secondary" }}
        >
          {log.message}
        </Typography>
      </Box>
    </AccordionSummary>
    <AccordionDetails>
      <Grid container spacing={2}>
        <Grid xs={12} md={6}>
          <Typography variant="subtitle2" gutterBottom>
            Información General
          </Typography>
          <Box sx={{ pl: 1 }}>
            <Typography variant="body2">
              <strong>Timestamp:</strong> {formatDate(log.timestamp)}
            </Typography>
            <Typography variant="body2">
              <strong>Estado:</strong> {log.state}
            </Typography>
            <Typography variant="body2">
              <strong>Status HTTP:</strong> {log.status}
            </Typography>
            <Typography variant="body2">
              <strong>Título:</strong> {log.title}
            </Typography>
            {log.code && (
              <Typography variant="body2">
                <strong>Código:</strong> {log.code}
              </Typography>
            )}
          </Box>
        </Grid>

        <Grid xs={12} md={6}>
          <Typography variant="subtitle2" gutterBottom>
            Detalles
          </Typography>
          <Box sx={{ pl: 1 }}>
            <Typography variant="body2">
              <strong>Mensaje:</strong> {log.message}
            </Typography>
            {log.details && (
              <Typography variant="body2">
                <strong>Ruta:</strong> {log.details.path || "N/A"}
              </Typography>
            )}
          </Box>
        </Grid>

        {log.stack && (
          <Grid xs={12}>
            <Typography variant="subtitle2" gutterBottom>
              Stack Trace
            </Typography>
            <Paper
              variant="outlined"
              sx={{
                p: 1,
                backgroundColor: "grey.50",
                fontFamily: "monospace",
                fontSize: "0.75rem",
                whiteSpace: "pre-wrap",
                overflow: "auto",
                maxHeight: 200,
              }}
            >
              {log.stack}
            </Paper>
          </Grid>
        )}
      </Grid>
    </AccordionDetails>
  </Accordion>
);

export default function PaginaReportes() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    state: "",
    status: "",
    search: "",
  });
  const axios = useApi();

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const response = await axios("/report");

      const data = await response;
      setLogs(data);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error("Error fetching logs:", err);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar logs según los filtros aplicados
  const filteredLogs = logs.filter((log) => {
    const matchesState = !filters.state || log.state === filters.state;
    const matchesStatus =
      !filters.status || log.status.toString() === filters.status;
    const matchesSearch =
      !filters.search ||
      log.title.toLowerCase().includes(filters.search.toLowerCase()) ||
      log.message.toLowerCase().includes(filters.search.toLowerCase()) ||
      (log.details?.path &&
        log.details.path.toLowerCase().includes(filters.search.toLowerCase()));

    return matchesState && matchesStatus && matchesSearch;
  });

  const handleFilterChange = (filterType, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterType]: value,
    }));
  };


  if (loading) {
    return (
      <>
        <NavBar backgroundColor />
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "50vh",
          }}
        >
          <CircularProgress />
        </Box>
      </>
    );
  }

  return (
    <>
      <NavBar backgroundColor />

      <Box sx={{ p: 3, mt: 8 }}>
        <Typography
          variant="h4"
          component="h1"
          gutterBottom
          sx={{ fontWeight: "bold", color: "primary.main" }}
        >
          Reportes de Logs del Sistema
        </Typography>

        <Typography variant="body1" color="text.secondary" paragraph>
          Monitorea y analiza los errores y eventos del sistema en tiempo real.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Error al cargar los logs: {error}
          </Alert>
        )}

        {/* Filtros */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
            <FilterList sx={{ mr: 1 }} />
            <Typography variant="h6">Filtros</Typography>
          </Box>

          <Grid container spacing={2}>
            <Grid xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Estado</InputLabel>
                <Select
                  value={filters.state}
                  label="Estado"
                  onChange={(e) => handleFilterChange("state", e.target.value)}
                >
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value="error">Error</MenuItem>
                  <MenuItem value="critical">Crítico</MenuItem>
                  <MenuItem value="warning">Advertencia</MenuItem>
                  <MenuItem value="info">Info</MenuItem>
                  <MenuItem value="success">Éxito</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Status HTTP</InputLabel>
                <Select
                  value={filters.status}
                  label="Status HTTP"
                  onChange={(e) => handleFilterChange("status", e.target.value)}
                >
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value="200">200 - OK</MenuItem>
                  <MenuItem value="400">400 - Bad Request</MenuItem>
                  <MenuItem value="401">401 - Unauthorized</MenuItem>
                  <MenuItem value="403">403 - Forbidden</MenuItem>
                  <MenuItem value="404">404 - Not Found</MenuItem>
                  <MenuItem value="500">500 - Server Error</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                label="Buscar..."
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                placeholder="Título, mensaje o ruta..."
              />
            </Grid>
          </Grid>
        </Paper>

        {/* Estadísticas */}
        <Box sx={{ mb: 3 }}>
          <Grid container spacing={2}>
            <Grid xs={12} sm={3}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Total de Logs
                  </Typography>
                  <Typography variant="h4" component="div">
                    {logs.length}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid xs={12} sm={3}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Errores
                  </Typography>
                  <Typography variant="h4" component="div" color="error">
                    {logs.filter((log) => log.state === "error").length}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid xs={12} sm={3}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Críticos
                  </Typography>
                  <Typography variant="h4" component="div" color="error">
                    {logs.filter((log) => log.state === "critical").length}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid xs={12} sm={3}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Filtrados
                  </Typography>
                  <Typography variant="h4" component="div" color="primary">
                    {filteredLogs.length}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>

        {/* Lista de Logs */}
        <Box
          sx={{
            mb: 2,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="h6">Logs ({filteredLogs.length})</Typography>
          <Chip
            label={`${filteredLogs.length} de ${logs.length}`}
            variant="outlined"
            size="small"
          />
        </Box>

        {filteredLogs.length === 0 ? (
          <Alert severity="info">
            No se encontraron logs que coincidan con los filtros aplicados.
          </Alert>
        ) : (
          <TableContainer component={Paper}>
            <Table sx={{ minWidth: 650 }} aria-label="tabla de logs">
              <TableHead>
                <TableRow>
                  <TableCell>Timestamp</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Título</TableCell>
                  <TableCell>Mensaje</TableCell>
                  <TableCell>Ruta</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredLogs.map((log, index) => (
                  <TableRow
                    key={index}
                    sx={{
                      "&:last-child td, &:last-child th": { border: 0 },
                      backgroundColor:
                        log.state === "critical"
                          ? "error.light"
                          : "transparent",
                    }}
                  >
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{ fontFamily: "monospace" }}
                      >
                        {formatDate(log.timestamp)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={log.state}
                        color={getStateColor(log.state)}
                        size="small"
                        variant={
                          log.state === "critical" ? "filled" : "outlined"
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={log.status}
                        color={getStatusColor(log.status)}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {log.title}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                        {log.message}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{ fontFamily: "monospace", fontSize: "0.75rem" }}
                      >
                        {log.details?.path || "N/A"}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Detalles expandibles para cada log - TODOS DESPLEGADOS */}
        <Box sx={{ mt: 3 }}>
          {filteredLogs.map((log, index) => (
            <LogAccordion key={index} log={log} index={index} />
          ))}
        </Box>
      </Box>
    </>
  );
}