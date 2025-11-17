import {
    Box,
    Typography,
    Container,
    Card,
    CardContent,
    CircularProgress,
    Chip,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Tooltip,
} from "@mui/material";
import {
    Backup as BackupIcon,
    Restore as RestoreIcon,
    Delete as DeleteIcon,
    Download as DownloadIcon,
    Refresh as RefreshIcon,
    Storage as StorageIcon,
    X,
} from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import { useState, useEffect, useCallback } from "react";
import ResponsiveAppBar from "../../components/navbar";
import useApi from "../../hook/useApi";
import useSweetAlert from "../../hook/useSweetAlert";

export default function PanelRespaldos() {
    const theme = useTheme();
    const axios = useApi();
    const alert = useSweetAlert();

    // Estados para backup
    const [backups, setBackups] = useState([]);
    const [loadingBackups, setLoadingBackups] = useState(false);
    const [creatingBackup, setCreatingBackup] = useState(false);
    const [restoringBackup, setRestoringBackup] = useState(false);
    const [backupDialog, setBackupDialog] = useState(false);
    const [restoreDialog, setRestoreDialog] = useState(false);
    const [selectedBackup, setSelectedBackup] = useState(null);


    // Funciones para backup
    const loadBackups = useCallback(async () => {
        setLoadingBackups(true);
        try {
            const response = await axios.get("/system/backups",);
            console.log("Respuesta de backups:", response);
            setBackups(response.backups || []);
        } catch (error) {
            console.error("Error cargando backups:", error);
            alert.error("Error al cargar backups");
        } finally {
            setLoadingBackups(false);
        }
    }, [axios, alert]);

    useEffect(() => {
        loadBackups();
    }, []);

    const createBackup = async () => {
        setCreatingBackup(true);
        try {
            const response = await axios.post("/system/backup",);
            alert.success("Backup creado exitosamente");
            loadBackups(); // Recargar la lista
        } catch (error) {
            console.error("Error creando backup:", error);
            alert.error("Error creando el backup");
        } finally {
            setCreatingBackup(false);
        }
    };

    const restoreBackup = async (backupFileName) => {
        setRestoringBackup(true);
        try {
            await axios.post("/system/restore",
                { backupFileName: backupFileName },
            );

            setRestoreDialog(false);
            setSelectedBackup(null);
            alert.success("Restauración completada exitosamente");
        } catch (error) {
            console.error("Error restaurando backup:", error);
            alert.error("Error restaurando el backup");
        } finally {
            setRestoringBackup(false);
        }
    };

    const downloadBackup = async (backupFileName) => {
        try {
            const response = await axios.get(`/system/backups/download/${encodeURIComponent(backupFileName)}`, {
                responseType: 'blob'
            });

            // Crear URL del blob
            const url = window.URL.createObjectURL(new Blob([response.data]));

            // Crear elemento de enlace temporal
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', backupFileName);

            // Añadir al DOM, hacer click y remover
            document.body.appendChild(link);
            link.click();
            link.remove();

            // Liberar memoria
            window.URL.revokeObjectURL(url);
            alert.success("Descarga iniciada");
        } catch (error) {
            console.error("Error descargando backup:", error);
            alert.error("Error descargando el backup");
        }
    };
    const deleteBackup = async (backupFileName) => {
        try {
            await axios.delete(`/system/backups/cleanup/${encodeURIComponent(backupFileName)}`);
            alert.success("Backup eliminado exitosamente");
            loadBackups();
        } catch (error) {
            console.error("Error eliminando backup:", error);
            alert.error("Error eliminando el backup");
        }
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString();
    };


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
                </Box>

                {/* Sección de Backup & Restore */}
                <Card sx={{ mb: 4, boxShadow: 3 }}>
                    <CardContent>
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                            <Typography variant="h5" component="h2">
                                <StorageIcon sx={{ mr: 1, verticalAlign: "middle" }} />
                                Gestión de Backups
                            </Typography>
                            <Box sx={{ display: "flex", gap: 1 }}>
                                <Button
                                    variant="outlined"
                                    startIcon={<RefreshIcon />}
                                    onClick={loadBackups}
                                    disabled={loadingBackups}
                                >
                                    Actualizar
                                </Button>
                                <Button
                                    variant="contained"
                                    startIcon={<BackupIcon />}
                                    onClick={() => setBackupDialog(true)}
                                    disabled={creatingBackup}
                                >
                                    {creatingBackup ? <CircularProgress size={20} /> : "Crear Backup"}
                                </Button>
                            </Box>
                        </Box>

                        {loadingBackups ? (
                            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                                <CircularProgress />
                            </Box>
                        ) : (
                            <TableContainer component={Paper}>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Nombre del Backup</TableCell>
                                            <TableCell>Tamaño</TableCell>
                                            <TableCell>Fecha de Creación</TableCell>
                                            <TableCell align="center">Acciones</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {backups.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={4} align="center">
                                                    <Typography color="text.secondary" sx={{ py: 2 }}>
                                                        No hay backups disponibles
                                                    </Typography>
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            backups.map((backup) => (
                                                <TableRow key={backup.nombre}>
                                                    <TableCell>
                                                        <Typography variant="body2" sx={{ fontFamily: "monospace" }}>
                                                            {backup.nombre}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label={formatFileSize(backup.tamaño)}
                                                            size="small"
                                                            variant="outlined"
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2">
                                                            {formatDate(backup.fechaCreacion)}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        <Tooltip title="Descargar">
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => downloadBackup(backup.nombre)}
                                                                color="primary"
                                                            >
                                                                <DownloadIcon />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title="Restaurar">
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => {
                                                                    setSelectedBackup(backup.nombre);
                                                                    setRestoreDialog(true);
                                                                }}
                                                                color="secondary"
                                                            >
                                                                <RestoreIcon />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title="Eliminar">
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => deleteBackup(backup.nombre)}
                                                                color="error"
                                                            >
                                                                <DeleteIcon />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )}
                    </CardContent>
                </Card>

            </Container>

            {/* Diálogo para crear backup */}
            <Dialog open={backupDialog} onClose={() => setBackupDialog(false)}>
                <DialogTitle>Crear Backup del Sistema</DialogTitle>
                <DialogContent>
                    <Typography>
                        ¿Estás seguro de que deseas crear un nuevo backup de la base de datos?
                        Esta operación puede tomar varios minutos dependiendo del tamaño de la base de datos.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setBackupDialog(false)}>Cancelar</Button>
                    <Button
                        onClick={createBackup}
                        variant="contained"
                        disabled={creatingBackup}
                        startIcon={creatingBackup ? <CircularProgress size={20} /> : <BackupIcon />}
                    >
                        {creatingBackup ? "Creando..." : "Crear Backup"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Diálogo para restaurar backup */}
            <Dialog open={restoreDialog} onClose={() => setRestoreDialog(false)}>
                <DialogTitle>Restaurar desde Backup</DialogTitle>
                <DialogContent>
                    <Typography gutterBottom>
                        ¿Estás seguro de que deseas restaurar el sistema desde el backup?
                    </Typography>
                    <Typography variant="body2" color="error" sx={{ fontWeight: 'bold' }}>
                        ⚠️ ADVERTENCIA: Esta acción sobrescribirá todos los datos actuales y puede causar pérdida de información.
                    </Typography>
                    {selectedBackup && (
                        <Typography variant="body2" sx={{ mt: 2, fontFamily: 'monospace' }}>
                            Backup seleccionado: {selectedBackup}
                        </Typography>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setRestoreDialog(false)}>Cancelar</Button>
                    <Button
                        onClick={() => restoreBackup(selectedBackup)}
                        variant="contained"
                        color="secondary"
                        disabled={restoringBackup}
                        startIcon={restoringBackup ? <CircularProgress size={20} /> : <RestoreIcon />}
                    >
                        {restoringBackup ? "Restaurando..." : "Restaurar"}
                    </Button>
                </DialogActions>
            </Dialog>

        </>
    );
}