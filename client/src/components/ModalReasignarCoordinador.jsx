import { useState, useEffect } from "react";
import {
  Box,
  Grid,
  Typography,
  Dialog,
  DialogContent,
  DialogActions,
  Chip,
  Avatar,
} from "@mui/material";
import CustomButton from "./customButton";
import useApi from "../hook/useApi";
import {
  School,
  Person,
  SwapHoriz,
  Warning,
} from "@mui/icons-material";
import useSweetAlert from "../hook/useSweetAlert";

export default function ModalReasignarCoordinador({
  open,
  onClose,
  coordinador,
  onReasignar,
}) {
  const axios = useApi();
  const alert = useSweetAlert();
  const [pnfs, setPnfs] = useState([]);
  const [pnfSeleccionado, setPnfSeleccionado] = useState(null);
  const [pnfActual, setPnfActual] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [cargandoPnfs, setCargandoPnfs] = useState(false);
  const [error, setError] = useState("");

  // Cargar PNFs disponibles al abrir el modal
  useEffect(() => {
    if (open && coordinador) {
      cargarPnfsDisponibles();
      // Establecer PNF actual del coordinador
      setPnfActual(coordinador.pnf_actual);
      setPnfSeleccionado(null);
    }
  }, [open, coordinador]);

  const cargarPnfsDisponibles = async () => {
    setCargandoPnfs(true);
    try {
      const response = await axios.get("/pnf");
        console.log(response)
      if (response) {
        // Filtrar PNFs que no tienen coordinador activo (excepto el actual)
        const pnfsDisponibles = response.pnfs.filter(
          pnf => !pnf.tiene_coordinador || pnf.id_pnf === coordinador.pnf_actual?.id_pnf
        );
        setPnfs(pnfsDisponibles);
      }
    } catch (error) {
      console.error("Error al cargar PNFs:", error);
      alert.toast({
        title: "Error",
        message: "No se pudieron cargar los PNFs disponibles",
        config: { icon: "error" },
      });
    } finally {
      setCargandoPnfs(false);
    }
  };

  const handlePnfSelect = (pnf) => {
    setError("");
    
    // No permitir seleccionar el mismo PNF actual
    if (pnf.id_pnf === pnfActual?.id_pnf) {
      setError("No puede seleccionar el mismo PNF actual");
      return;
    }

    // Si ya está seleccionado, deseleccionar
    if (pnfSeleccionado?.id_pnf === pnf.id_pnf) {
      setPnfSeleccionado(null);
    } else {
      setPnfSeleccionado(pnf);
    }
  };

  const isPnfSeleccionado = (pnf) => {
    return pnfSeleccionado?.id_pnf === pnf.id_pnf;
  };

  const isPnfActual = (pnf) => {
    return pnfActual?.id_pnf === pnf.id_pnf;
  };

  const handleReasignar = async () => {
    if (!pnfSeleccionado) {
      setError("Debe seleccionar un PNF destino");
      return;
    }

    setCargando(true);
    setError("");

    try {
      // Confirmar reasignación
      const confirm = await alert.confirm(
        "¿Reasignar coordinador?",
        `¿Está seguro de reasignar a ${coordinador.nombre_completo} del PNF "${pnfActual?.nombre_pnf}" al PNF "${pnfSeleccionado.nombre_pnf}"?`,
        "warning"
      );

      if (!confirm) {
        setCargando(false);
        return;
      }

      // Preparar datos para reasignación
      const datosReasignacion = {
        id_profesor: coordinador.cedula,
        id_pnf: pnfSeleccionado.id_pnf,
      };

      // Enviar request de reasignación
      const response = await axios.put(`/coordinadores/${coordinador.cedula}/reasignar-pnf`, datosReasignacion);
      
      if (response.success) {
        alert.toast({
          title: "Coordinador reasignado",
          message: `El coordinador ha sido reasignado exitosamente al PNF ${pnfSeleccionado.nombre_pnf}`,
          config: { icon: "success" },
        });

        onReasignar(response.data);
        onClose();
      }
    } catch (error) {
      console.error("Error al reasignar coordinador:", error);

      if (error?.error?.totalErrors > 0) {
        error.error.validationErrors.forEach((error_validacion) => {
          alert.toast({
            title: error_validacion.field,
            message: error_validacion.message,
            config: { icon: "warning" },
          });
        });
      } else {
        alert.toast({
          title: error.title || "Error al reasignar coordinador",
          message: error.message || "No se pudo completar la reasignación.",
          config: { icon: "error" },
        });
      }

      setError("Error al reasignar el coordinador. Intente nuevamente.");
    } finally {
      setCargando(false);
    }
  };

  const handleCancelar = () => {
    setPnfSeleccionado(null);
    setError("");
    onClose();
  };

  // Función para obtener el estado del PNF
  const getEstadoPnf = (pnf) => {
    if (isPnfActual(pnf)) {
      return { texto: "Actual", color: "primary" };
    }
    if (pnf.tiene_coordinador) {
      return { texto: "Ocupado", color: "error" };
    }
    return { texto: "Disponible", color: "success" };
  };

  if (!coordinador) return null;

  return (
    <Dialog open={open} onClose={handleCancelar} maxWidth="lg" fullWidth>
      <DialogContent>
        {/* Header con información del coordinador */}
        <Box display="flex" alignItems="center" gap={2} mb={3}>
          <Avatar
            sx={{ width: 60, height: 60, bgcolor: "primary.main" }}
          >
            <Person sx={{ fontSize: 30 }} />
          </Avatar>
          <Box>
            <Typography variant="h5" fontWeight="bold">
              {coordinador.nombre_completo}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Cédula: {coordinador.cedula}
            </Typography>
            {pnfActual && (
              <Chip
                label={`PNF Actual: ${pnfActual.nombre_pnf}`}
                color="primary"
                variant="filled"
                size="small"
                sx={{ mt: 1 }}
              />
            )}
          </Box>
        </Box>

        {/* Información de reasignación */}
        <Box 
          display="flex" 
          alignItems="center" 
          gap={1} 
          p={2} 
          bgcolor="info.light" 
          borderRadius={1}
          mb={3}
        >
          <SwapHoriz color="info" />
          <Typography variant="body2" color="info.dark">
            <strong>Reasignación de PNF:</strong> Seleccione el PNF al que desea reasignar al coordinador.
          </Typography>
        </Box>

        {/* Mensaje de error */}
        {error && (
          <Typography color="error" variant="body2" mb={2}>
            {error}
          </Typography>
        )}

        {/* Grid de PNFs disponibles */}
        <Typography variant="h6" gutterBottom>
          PNFs Disponibles para Reasignación
        </Typography>

        {cargandoPnfs ? (
          <Box textAlign="center" py={4}>
            <Typography>Cargando PNFs disponibles...</Typography>
          </Box>
        ) : (
          <Grid container spacing={2}>
            {pnfs.map((pnf) => {
              const seleccionado = isPnfSeleccionado(pnf);
              const estado = getEstadoPnf(pnf);
              const disponible = !pnf.tiene_coordinador || isPnfActual(pnf);

              return (
                <Grid item xs={12} sm={6} md={4} key={pnf.id_pnf}>
                  <CustomButton
                    tipo={seleccionado ? "primary" : "outlined"}
                    onClick={() => disponible && handlePnfSelect(pnf)}
                    disabled={!disponible}
                    sx={{
                      width: "100%",
                      height: 120,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 1,
                      p: 2,
                      position: "relative",
                      opacity: disponible ? 1 : 0.6,
                    }}
                  >
                    <School sx={{ fontSize: 30 }} />
                    
                    <Box textAlign="center">
                      <Typography variant="subtitle1" fontWeight="medium">
                        {pnf.nombre_pnf}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Código: {pnf.codigo_pnf}
                      </Typography>
                    </Box>

                    {/* Badge de estado */}
                    <Chip
                      label={estado.texto}
                      color={estado.color}
                      size="small"
                      sx={{ 
                        position: "absolute", 
                        top: 8, 
                        right: 8,
                        fontSize: '0.6rem',
                        height: 20
                      }}
                    />

                    {/* Indicador de selección */}
                    {seleccionado && (
                      <Box
                        sx={{
                          position: "absolute",
                          top: 8,
                          left: 8,
                          width: 12,
                          height: 12,
                          borderRadius: "50%",
                          bgcolor: "success.main",
                        }}
                      />
                    )}

                    {/* Advertencia si está ocupado */}
                    {pnf.tiene_coordinador && !isPnfActual(pnf) && (
                      <Box
                        sx={{
                          position: "absolute",
                          bottom: 8,
                          left: 8,
                        }}
                      >
                        <Warning color="warning" sx={{ fontSize: 16 }} />
                      </Box>
                    )}
                  </CustomButton>
                </Grid>
              );
            })}
          </Grid>
        )}

        {/* Información adicional */}
        <Box mt={3} p={2} bgcolor="grey.50" borderRadius={1}>
          <Typography variant="caption" color="text.secondary">
            💡 <strong>Nota:</strong> Solo se muestran PNFs disponibles. Los PNFs marcados como "Ocupado" 
            ya tienen un coordinador asignado y no están disponibles para reasignación.
          </Typography>
        </Box>

        {/* Resumen de selección */}
        {pnfSeleccionado && (
          <Box mt={3} p={2} bgcolor="success.light" borderRadius={1}>
            <Typography variant="body2" color="success.dark">
              <strong>Reasignación seleccionada:</strong> {coordinador.nombre_completo} será reasignado del PNF "{pnfActual?.nombre_pnf}" al PNF "{pnfSeleccionado.nombre_pnf}".
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, gap: 2 }}>
        <CustomButton
          tipo="outlined"
          onClick={handleCancelar}
          disabled={cargando}
        >
          Cancelar
        </CustomButton>
        <CustomButton
          tipo="primary"
          onClick={handleReasignar}
          disabled={cargando || !pnfSeleccionado}
          loading={cargando}
          startIcon={<SwapHoriz />}
        >
          Reasignar Coordinador
        </CustomButton>
      </DialogActions>
    </Dialog>
  );
}