import {
  Box,
  Typography,
  Container,
  Grid,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Chip,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useState, useEffect } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";
import ResponsiveAppBar from "../../components/navbar";
import useWebSocket from "../../hook/useWebSocket"; // ✅ USAR EL HOOK

// Registrar componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function PanelAdministracion() {
  const theme = useTheme();
  const [performanceData, setPerformanceData] = useState(null);
  const [systemCpuHistory, setSystemCpuHistory] = useState([]);
  const [nodeCpuHistory, setNodeCpuHistory] = useState([]);
  const [systemMemoryHistory, setSystemMemoryHistory] = useState([]);
  const [nodeMemoryHistory, setNodeMemoryHistory] = useState([]);
  const [connectionHistory, setConnectionHistory] = useState([]);
  
  // ✅ USAR EL HOOK WEBSOCKET
  const { 
    connect, 
    disconnect, 
    on, 
    off, 
    emit, 
    isConnected, 
    getCurrentUser,
    hasActiveConnection 
  } = useWebSocket();

  // Configurar Socket.IO usando el hook singleton
  useEffect(() => {
    // Obtener usuario y roles (ajusta según tu autenticación)
    const userID = "admin_panel"; // Identificador único para este panel
    const userRoles = ["SuperAdmin"]; // Roles necesarios

    // Conectar usando la instancia singleton
    connect(userID, userRoles)
      .then(() => {
        console.log("✅ PanelAdmin conectado via singleton");

        // Unirse a la sala de SuperAdmin
        emit("join_role_room", "SuperAdmin");

        // Escuchar eventos de performance
        on("system-performance", handlePerformanceData);
      })
      .catch((error) => {
        console.error("❌ Error conectando panel admin:", error);
      });

    // Handler para datos de performance
    const handlePerformanceData = (data) => {
      console.log("📊 Datos recibidos:", data);
      setPerformanceData(data);

      const timestamp = new Date(data.timestamp).toLocaleTimeString();

      // CPU - Sistema vs Node.js
      setSystemCpuHistory((prev) => {
        const newHistory = [
          ...prev,
          {
            time: timestamp,
            usage: parseFloat(data.cpu.systemUsage),
          },
        ];
        return newHistory.slice(-15);
      });

      setNodeCpuHistory((prev) => {
        const newHistory = [
          ...prev,
          {
            time: timestamp,
            usage: parseFloat(data.cpu.nodejsUsage),
          },
        ];
        return newHistory.slice(-15);
      });

      // Memoria - Sistema vs Node.js
      setSystemMemoryHistory((prev) => {
        const newHistory = [
          ...prev,
          {
            time: timestamp,
            usage: parseFloat(data.memory.system.usagePercent),
          },
        ];
        return newHistory.slice(-15);
      });

      setNodeMemoryHistory((prev) => {
        const newHistory = [
          ...prev,
          {
            time: timestamp,
            usage: parseFloat(data.memory.nodejs.usagePercent),
          },
        ];
        return newHistory.slice(-15);
      });

      setConnectionHistory((prev) => {
        const newHistory = [
          ...prev,
          {
            time: timestamp,
            connections: data.activeConnections,
          },
        ];
        return newHistory.slice(-15);
      });
    };

    // Cleanup
    return () => {
      off("system-performance", handlePerformanceData);
      // NO desconectamos aquí - el hook maneja el cleanup automáticamente
    };
  }, [connect, disconnect, on, off, emit]);

  // Configuración de gráficos Chart.js
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
      },
    },
  };

  const cpuChartData = {
    labels: systemCpuHistory.map((item) => item.time),
    datasets: [
      {
        label: "CPU Sistema %",
        data: systemCpuHistory.map((item) => item.usage),
        borderColor: theme.palette.primary.main,
        backgroundColor: theme.palette.primary.light,
        tension: 0.4,
      },
      {
        label: "CPU Node.js %",
        data: nodeCpuHistory.map((item) => item.usage),
        borderColor: theme.palette.secondary.main,
        backgroundColor: theme.palette.secondary.light,
        tension: 0.4,
      },
    ],
  };

  const memoryChartData = {
    labels: systemMemoryHistory.map((item) => item.time),
    datasets: [
      {
        label: "Memoria Sistema %",
        data: systemMemoryHistory.map((item) => item.usage),
        borderColor: theme.palette.warning.main,
        backgroundColor: theme.palette.warning.light,
        tension: 0.4,
      },
      {
        label: "Memoria Node.js %",
        data: nodeMemoryHistory.map((item) => item.usage),
        borderColor: theme.palette.info.main,
        backgroundColor: theme.palette.info.light,
        tension: 0.4,
      },
    ],
  };

  const connectionsChartData = {
    labels: connectionHistory.map((item) => item.time),
    datasets: [
      {
        label: "Conexiones Activas",
        data: connectionHistory.map((item) => item.connections),
        borderColor: theme.palette.success.main,
        backgroundColor: theme.palette.success.light,
        tension: 0.4,
      },
    ],
  };

  // ✅ DEBUG: Información de conexión
  const debugInfo = `Usuario: ${getCurrentUser() || "N/A"} | Conectado: ${isConnected()} | Activa: ${hasActiveConnection()}`;

  return (
    <>
      <ResponsiveAppBar backgroundColor />

      <Container maxWidth="xl" sx={{ mt: 15, mb: 4 }}>
        {/* Header */}
        <Box sx={{ textAlign: "center", mb: 6 }}>
          <Typography
            variant="h3"
            component="h1"
            gutterBottom
            sx={{
              fontWeight: 700,
              color: theme.palette.primary.main,
            }}
          >
            Panel de Administración
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Monitoreo en tiempo real - Sistema vs Node.js
          </Typography>
          
          {/* ✅ DEBUG INFO */}
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            {debugInfo}
          </Typography>
        </Box>

        <Alert severity={isConnected() ? "success" : "error"} sx={{ mb: 4 }}>
          {isConnected()
            ? `✅ Conectado al servidor${
                performanceData
                  ? ` - ${performanceData.activeConnections} conexiones activas`
                  : ""
              }`
            : "❌ Desconectado del servidor"}
        </Alert>

        {!performanceData ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "200px",
              flexDirection: "column",
              gap: 2,
            }}
          >
            <CircularProgress />
            <Typography variant="h6">
              {isConnected()
                ? "Esperando datos del sistema..."
                : "Conectando al servidor..."}
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {/* Información de Node.js */}
            <Grid xs={12}>
              <Card sx={{ bgcolor: "#f3e5f5", boxShadow: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    🟢 Información de Node.js
                  </Typography>
                  <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                    <Chip 
                      label={`Versión: ${performanceData.nodejs?.version}`} 
                      variant="outlined" 
                    />
                    <Chip 
                      label={`PID: ${performanceData.nodejs?.pid}`} 
                      variant="outlined" 
                    />
                    <Chip 
                      label={`Plataforma: ${performanceData.nodejs?.platform}`} 
                      variant="outlined" 
                    />
                    <Chip 
                      label={`Arquitectura: ${performanceData.nodejs?.arch}`} 
                      variant="outlined" 
                    />
                    <Chip 
                      label={`Tiempo activo: ${Math.floor(performanceData.uptime?.nodejs / 60)}min`} 
                      variant="outlined" 
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Tarjetas de métricas rápidas - SISTEMA */}
            <Grid xs={12} md={6} lg={3}>
              <Card sx={{ bgcolor: "#e3f2fd", height: "100%", boxShadow: 3 }}>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    💾 CPU Sistema
                  </Typography>
                  <Typography variant="h4" component="div" sx={{ fontWeight: "bold" }}>
                    {performanceData.cpu?.systemUsage}%
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    {performanceData.cpu?.cores} núcleos
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {performanceData.cpu?.model}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid xs={12} md={6} lg={3}>
              <Card sx={{ bgcolor: "#e8f5e8", height: "100%", boxShadow: 3 }}>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    🧠 Memoria Sistema
                  </Typography>
                  <Typography variant="h4" component="div" sx={{ fontWeight: "bold" }}>
                    {performanceData.memory?.system?.usagePercent}%
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    {performanceData.memory?.system?.used}GB / {performanceData.memory?.system?.total}GB
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Tarjetas de métricas rápidas - NODE.JS */}
            <Grid xs={12} md={6} lg={3}>
              <Card sx={{ bgcolor: "#fff3e0", height: "100%", boxShadow: 3 }}>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    ⚡ CPU Node.js
                  </Typography>
                  <Typography variant="h4" component="div" sx={{ fontWeight: "bold" }}>
                    {performanceData.cpu?.nodejsUsage}%
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Memoria: {performanceData.nodejs?.memory?.total}MB
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid xs={12} md={6} lg={3}>
              <Card sx={{ bgcolor: "#fce4ec", height: "100%", boxShadow: 3 }}>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    📦 Memoria Node.js
                  </Typography>
                  <Typography variant="h4" component="div" sx={{ fontWeight: "bold" }}>
                    {performanceData.memory?.nodejs?.usagePercent}%
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Heap: {performanceData.memory?.nodejs?.heapUsed}MB
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Memoria Detallada de Node.js */}
            <Grid xs={12}>
              <Card sx={{ boxShadow: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    📋 Memoria Detallada de Node.js
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid xs={12} sm={6} md={2}>
                      <Typography variant="body2" color="text.secondary">
                        RSS
                      </Typography>
                      <Typography variant="h6">
                        {performanceData.memory?.nodejs?.rss} MB
                      </Typography>
                    </Grid>
                    <Grid xs={12} sm={6} md={2}>
                      <Typography variant="body2" color="text.secondary">
                        Heap Total
                      </Typography>
                      <Typography variant="h6">
                        {performanceData.memory?.nodejs?.heapTotal} MB
                      </Typography>
                    </Grid>
                    <Grid xs={12} sm={6} md={2}>
                      <Typography variant="body2" color="text.secondary">
                        Heap Usado
                      </Typography>
                      <Typography variant="h6">
                        {performanceData.memory?.nodejs?.heapUsed} MB
                      </Typography>
                    </Grid>
                    <Grid xs={12} sm={6} md={2}>
                      <Typography variant="body2" color="text.secondary">
                        External
                      </Typography>
                      <Typography variant="h6">
                        {performanceData.memory?.nodejs?.external} MB
                      </Typography>
                    </Grid>
                    <Grid xs={12} sm={6} md={2}>
                      <Typography variant="body2" color="text.secondary">
                        ArrayBuffers
                      </Typography>
                      <Typography variant="h6">
                        {performanceData.memory?.nodejs?.arrayBuffers} MB
                      </Typography>
                    </Grid>
                    <Grid xs={12} sm={6} md={2}>
                      <Typography variant="body2" color="text.secondary">
                        % del Sistema
                      </Typography>
                      <Typography variant="h6">
                        {performanceData.memory?.nodejs?.usagePercent}%
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Gráficos con Chart.js */}
            <Grid xs={12} lg={6}>
              <Card sx={{ boxShadow: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    📈 Uso de CPU - Sistema vs Node.js
                  </Typography>
                  <Box sx={{ height: 300 }}>
                    {systemCpuHistory.length > 0 ? (
                      <Line data={cpuChartData} options={chartOptions} />
                    ) : (
                      <Box sx={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Typography color="text.secondary">
                          Recopilando datos...
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid xs={12} lg={6}>
              <Card sx={{ boxShadow: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    📊 Uso de Memoria - Sistema vs Node.js
                  </Typography>
                  <Box sx={{ height: 300 }}>
                    {systemMemoryHistory.length > 0 ? (
                      <Line data={memoryChartData} options={chartOptions} />
                    ) : (
                      <Box sx={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Typography color="text.secondary">
                          Recopilando datos...
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid xs={12}>
              <Card sx={{ boxShadow: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    🔗 Conexiones Activas
                  </Typography>
                  <Box sx={{ height: 300 }}>
                    {connectionHistory.length > 0 ? (
                      <Line
                        data={connectionsChartData}
                        options={{
                          ...chartOptions,
                          scales: {
                            y: {
                              beginAtZero: true,
                            },
                          },
                        }}
                      />
                    ) : (
                      <Box sx={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Typography color="text.secondary">
                          Recopilando datos...
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </Container>
    </>
  );
}