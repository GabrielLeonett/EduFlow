import {
    Typography,
    Container,
    Stack,
    Box,
    Card,
    CardContent,
    Grid,
    Alert,
    CircularProgress,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper
} from "@mui/material";
import ResponsiveAppBar from "../../components/navbar";
import { useCallback, useEffect, useState } from "react";
import useApi from "../../hook/useApi";
import useSweetAlert from "../../hook/useSweetAlert";

// Días de la semana académicos
const diasSemana = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];

// Horarios académicos de 45 minutos (7:00 a 19:45)
const horariosAcademicos = [
    '07:00', '07:45', '08:30', '09:15', '10:00', '10:45',
    '11:30', '12:15', '13:00', '13:45', '14:30', '15:15',
    '16:00', '16:45', '17:30', '18:15', '19:00', '19:45'
];

// Función para generar color basado en la densidad (0 a 1)
const getColorForDensity = (densidad) => {
    if (densidad === 0) return '#ffffff'; // Blanco para 0%

    // Verde para baja ocupación (0% - 30%)
    if (densidad <= 0.3) {
        const intensity = Math.floor(200 + (55 * (densidad / 0.3)));
        return `rgb(76, ${intensity}, 80)`;
    }

    // Amarillo para media ocupación (30% - 70%)
    if (densidad <= 0.7) {
        const intensity = Math.floor(255 - (55 * ((densidad - 0.3) / 0.4)));
        return `rgb(255, ${intensity}, 0)`;
    }

    // Rojo para alta ocupación (70% - 100%)
    const intensity = Math.floor(200 - (100 * ((densidad - 0.7) / 0.3)));
    return `rgb(255, ${intensity}, ${intensity})`;
};

// Función para obtener el color del texto (blanco o negro) basado en el fondo
const getTextColor = (backgroundColor) => {
    // Convertir hex a RGB
    const hex = backgroundColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);

    // Calcular luminosidad
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#000000' : '#ffffff';
};

// Componente de celda personalizada para el mapa de calor
const HeatmapCell = ({ densidad, porcentaje, tooltip }) => {
    const backgroundColor = getColorForDensity(densidad);
    const textColor = getTextColor(backgroundColor);

    return (
        <TableCell
            sx={{
                backgroundColor,
                color: textColor,
                border: '1px solid #ddd',
                textAlign: 'center',
                padding: '8px 4px',
                fontSize: '0.75rem',
                fontWeight: 'bold',
                minWidth: '60px',
                height: '40px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                '&:hover': {
                    transform: 'scale(1.05)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                    zIndex: 1,
                    position: 'relative'
                }
            }}
            title={tooltip}
        >
            {porcentaje}%
        </TableCell>
    );
};

export default function ReportesEstadisticas() {
    const axios = useApi();
    const alert = useSweetAlert();
    const [mapaCalorData, setMapaCalorData] = useState([]);
    const [estadisticas, setEstadisticas] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Crear matriz de datos para la tabla
    const crearMatrizDatos = (datosBackend) => {
        if (!datosBackend || !Array.isArray(datosBackend)) {
            // Crear matriz vacía
            return horariosAcademicos.map(hora => {
                const fila = { hora };
                diasSemana.forEach(dia => {
                    fila[dia] = 0;
                });
                return fila;
            });
        }

        // Crear matriz con datos reales
        return horariosAcademicos.map(hora => {
            const fila = { hora };
            diasSemana.forEach(dia => {
                const dato = datosBackend.find(item =>
                    item.dia === dia && item.hora_inicio === hora
                );
                fila[dia] = dato ? dato.densidad : 0;
            });
            return fila;
        });
    };

    // Calcular estadísticas generales
    const calcularEstadisticas = (datos) => {
        if (!datos.length) return {};

        const totalBloques = datos.length;
        const bloquesOcupados = datos.filter(item => item.densidad > 0).length;
        const ocupacionPromedio = datos.reduce((sum, item) => sum + item.densidad, 0) / totalBloques;
        const ocupacionMaxima = Math.max(...datos.map(item => item.densidad));

        // Encontrar horas pico
        const horasPico = datos
            .filter(item => item.densidad >= 0.7)
            .sort((a, b) => b.densidad - a.densidad)
            .slice(0, 5);

        return {
            totalBloques,
            bloquesOcupados,
            ocupacionPromedio: (ocupacionPromedio * 100).toFixed(1),
            ocupacionMaxima: (ocupacionMaxima * 100).toFixed(1),
            porcentajeOcupacion: ((bloquesOcupados / totalBloques) * 100).toFixed(1),
            horasPico
        };
    };

    const fetchMapaCalor = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await axios.get('/system/mapa-calor/horarios');
            console.log(response.mapaCalor)
            const matrizDatos = crearMatrizDatos(response.mapaCalor);
            const stats = calcularEstadisticas(response.mapaCalor || []);
            setMapaCalorData(matrizDatos);
            setEstadisticas(stats);
        } catch (error) {
            console.error('Error al traer el mapa de calor:', error);
            setError(error.response?.data?.message || 'Error al cargar el mapa de calor');
            alert.error('Error al cargar los datos del mapa de calor');
        } finally {
            setLoading(false);
        }
    }, [axios, alert]);

    useEffect(() => {
        fetchMapaCalor();
    }, []);

    if (loading) {
        return (
            <>
                <ResponsiveAppBar backgroundColor />
                <Container sx={{ mt: 12, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
                    <Stack alignItems="center" spacing={2}>
                        <CircularProgress size={60} />
                        <Typography variant="h6" color="text.secondary">
                            Cargando mapa de calor...
                        </Typography>
                    </Stack>
                </Container>
            </>
        );
    }

    if (error) {
        return (
            <>
                <ResponsiveAppBar backgroundColor />
                <Container sx={{ mt: 12 }}>
                    <Alert severity="error" sx={{ mb: 3 }}>
                        {error}
                    </Alert>
                    <Typography variant="h6" align="center" color="text.secondary">
                        No se pudieron cargar los datos del mapa de calor
                    </Typography>
                </Container>
            </>
        );
    }

    return (
        <>
            <ResponsiveAppBar backgroundColor />

            <Container sx={{ mt: 12, mb: 4 }}>
                {/* Header */}
                <Typography variant="h3" fontWeight={600} mb={1}>
                    Reportes y Estadísticas
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={3}>
                    Mapa de calor de ocupación de horarios académicos
                </Typography>

                {/* Estadísticas rápidas */}
                {estadisticas.totalBloques > 0 && (
                    <Grid container spacing={3} sx={{ mb: 4 }}>
                        <Grid item xs={12} sm={6} md={3}>
                            <Card sx={{ bgcolor: '#e3f2fd' }}>
                                <CardContent>
                                    <Typography color="text.secondary" gutterBottom>
                                        Total de Bloques
                                    </Typography>
                                    <Typography variant="h4" component="div" sx={{ fontWeight: "bold" }}>
                                        {estadisticas.totalBloques}
                                    </Typography>
                                    <Typography variant="body2">
                                        Horarios académicos
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <Card sx={{ bgcolor: '#e8f5e8' }}>
                                <CardContent>
                                    <Typography color="text.secondary" gutterBottom>
                                        Ocupación Promedio
                                    </Typography>
                                    <Typography variant="h4" component="div" sx={{ fontWeight: "bold" }}>
                                        {estadisticas.ocupacionPromedio}%
                                    </Typography>
                                    <Typography variant="body2">
                                        Del total disponible
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <Card sx={{ bgcolor: '#fff3e0' }}>
                                <CardContent>
                                    <Typography color="text.secondary" gutterBottom>
                                        Máxima Ocupación
                                    </Typography>
                                    <Typography variant="h4" component="div" sx={{ fontWeight: "bold" }}>
                                        {estadisticas.ocupacionMaxima}%
                                    </Typography>
                                    <Typography variant="body2">
                                        En horas pico
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <Card sx={{ bgcolor: '#fce4ec' }}>
                                <CardContent>
                                    <Typography color="text.secondary" gutterBottom>
                                        Bloques Ocupados
                                    </Typography>
                                    <Typography variant="h4" component="div" sx={{ fontWeight: "bold" }}>
                                        {estadisticas.bloquesOcupados}
                                    </Typography>
                                    <Typography variant="body2">
                                        {estadisticas.porcentajeOcupacion}% del total
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                )}

                {/* Mapa de calor personalizado */}
                <Stack width="100%" spacing={3}>
                    <Typography variant="h5" align="center" sx={{ width: '100%' }}>
                        Mapa de Calor - Ocupación de Aulas por Horario
                    </Typography>

                    <Box sx={{
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 2,
                        p: 2,
                        bgcolor: 'background.paper',
                        overflow: 'auto'
                    }}>
                        {mapaCalorData.length > 0 ? (
                            <TableContainer component={Paper} sx={{ maxHeight: 600 }}>
                                <Table stickyHeader size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell
                                                sx={{
                                                    backgroundColor: 'primary.main',
                                                    color: 'white',
                                                    fontWeight: 'bold',
                                                    position: 'sticky',
                                                    left: 0,
                                                    zIndex: 3
                                                }}
                                            >
                                                Horario
                                            </TableCell>
                                            {diasSemana.map(dia => (
                                                <TableCell
                                                    key={dia}
                                                    sx={{
                                                        backgroundColor: 'primary.main',
                                                        color: 'white',
                                                        fontWeight: 'bold',
                                                        textAlign: 'center'
                                                    }}
                                                >
                                                    {dia}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {mapaCalorData.map((fila, index) => (
                                            <TableRow key={fila.hora}>
                                                <TableCell
                                                    sx={{
                                                        backgroundColor: 'grey.100',
                                                        fontWeight: 'bold',
                                                        position: 'sticky',
                                                        left: 0,
                                                        zIndex: 2
                                                    }}
                                                >
                                                    {fila.hora} - {horariosAcademicos[index + 1] || '20:30'}
                                                </TableCell>
                                                {diasSemana.map(dia => (
                                                    <HeatmapCell
                                                        key={`${fila.hora}-${dia}`}
                                                        densidad={fila[dia]}
                                                        porcentaje={Math.round(fila[dia] * 100)}
                                                        tooltip={`${dia} ${fila.hora}: ${Math.round(fila[dia] * 100)}% ocupación`}
                                                    />
                                                ))}
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        ) : (
                            <Box sx={{
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                height: 400,
                                flexDirection: 'column',
                                gap: 2
                            }}>
                                <Typography variant="h6" color="text.secondary">
                                    No hay datos disponibles para el mapa de calor
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    No se encontraron horarios activos en el sistema
                                </Typography>
                            </Box>
                        )}
                    </Box>

                    {/* Leyenda de colores */}
                    <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                        <Typography variant="subtitle2" gutterBottom>
                            Leyenda de Ocupación:
                        </Typography>
                        <Stack direction="row" spacing={3} flexWrap="wrap">
                            <Stack direction="row" alignItems="center" spacing={1}>
                                <Box sx={{ width: 20, height: 20, bgcolor: getColorForDensity(0), borderRadius: 1, border: '1px solid #ddd' }} />
                                <Typography variant="body2">0% (Libre)</Typography>
                            </Stack>
                            <Stack direction="row" alignItems="center" spacing={1}>
                                <Box sx={{ width: 20, height: 20, bgcolor: getColorForDensity(0.15), borderRadius: 1 }} />
                                <Typography variant="body2">15% (Muy Baja)</Typography>
                            </Stack>
                            <Stack direction="row" alignItems="center" spacing={1}>
                                <Box sx={{ width: 20, height: 20, bgcolor: getColorForDensity(0.3), borderRadius: 1 }} />
                                <Typography variant="body2">30% (Baja)</Typography>
                            </Stack>
                            <Stack direction="row" alignItems="center" spacing={1}>
                                <Box sx={{ width: 20, height: 20, bgcolor: getColorForDensity(0.5), borderRadius: 1 }} />
                                <Typography variant="body2">50% (Media)</Typography>
                            </Stack>
                            <Stack direction="row" alignItems="center" spacing={1}>
                                <Box sx={{ width: 20, height: 20, bgcolor: getColorForDensity(0.7), borderRadius: 1 }} />
                                <Typography variant="body2">70% (Alta)</Typography>
                            </Stack>
                            <Stack direction="row" alignItems="center" spacing={1}>
                                <Box sx={{ width: 20, height: 20, bgcolor: getColorForDensity(0.9), borderRadius: 1 }} />
                                <Typography variant="body2">90% (Muy Alta)</Typography>
                            </Stack>
                        </Stack>
                    </Box>

                    {/* Información adicional */}
                    <Box sx={{ p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
                        <Typography variant="subtitle2" gutterBottom>
                            💡 Cómo interpretar el mapa:
                        </Typography>
                        <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                            • <strong>Blanco</strong>: Aulas completamente disponibles<br />
                            • <strong>Verde</strong>: Baja ocupación (ideal para nuevas clases)<br />
                            • <strong>Amarillo</strong>: Ocupación media<br />
                            • <strong>Rojo</strong>: Alta ocupación (horas pico)
                        </Typography>
                    </Box>
                </Stack>
            </Container>
        </>
    );
}