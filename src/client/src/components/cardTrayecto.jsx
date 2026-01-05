import {
  Typography,
  Tooltip,
  IconButton,
  Snackbar,
  Alert,
  Box,
  Card,
  CardHeader,
  CardContent,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import VisibilityIcon from "@mui/icons-material/Visibility"; // Icono de ojo
import { useTheme } from "@mui/material/styles";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // Importar useNavigate
import useApi from "../hook/useApi";
import CustomButton from "./customButton";
import ModalEditarCampoTrayecto from "./ModalEditarCampoTrayecto";

export default function CardTrayecto({ Trayecto, codigoPNF, onActualizar }) {
  const theme = useTheme();
  const axios = useApi(false);
  const navigate = useNavigate(); // Hook para navegación

  // Estados
  const [trayectoActual, setTrayectoActual] = useState(Trayecto);
  const [trayectoEditado, setTrayectoEditado] = useState(false);
  const [openModalEditar, setOpenModalEditar] = useState(false);
  const [campoEditando, setCampoEditando] = useState(null);
  const [valorEditando, setValorEditando] = useState("");
  const [mensaje, setMensaje] = useState(null);

  useEffect(() => {
    setTrayectoActual(Trayecto);
  }, [Trayecto]);

  // Función para navegar al detalle del trayecto
  const handleVerDetalle = () => {
    if (codigoPNF && trayectoActual?.valor_trayecto) {
      navigate(`/formacion/programas/${codigoPNF}/trayecto/${trayectoActual.valor_trayecto}`, {state: {idTrayecto: trayectoActual.id_trayecto}});
    } else {
      console.warn("Faltan datos para navegar:", { codigoPNF, valorTrayecto: trayectoActual?.valor_trayecto });
    }
  };

  // Abrir modal de edición
  const handleOpenModalEditar = (campo, valorActual) => {
    setCampoEditando(campo);
    setValorEditando(valorActual || "");
    setOpenModalEditar(true);
  };

  // Guardar el campo en memoria
  const handleGuardarCampo = (campo, nuevoValor) => {
    const actualizado = { ...trayectoActual, [campo]: nuevoValor };
    setTrayectoActual(actualizado);
    setTrayectoEditado(true);
    setMensaje(`Campo "${campo}" actualizado localmente`);
    setOpenModalEditar(false);
  };

  // Guardar los cambios en el servidor
  const handleGuardarCambiosServidor = async () => {
    try {
      console.log(trayectoEditado, trayectoActual)
      await axios.put(
        `/trayectos/${trayectoActual.id_trayecto}/descripcion`,
        trayectoActual
      );
      setTrayectoEditado(false);
      setMensaje("Cambios guardados correctamente");

      if (onActualizar) onActualizar(); // Actualizar lista si el padre lo pasa
    } catch (error) {
      console.error("Error al guardar cambios:", error);
      setMensaje("Error al guardar los cambios");
    }
  };

  return (
    <Card
      sx={{
        maxWidth: "1100px",
        width: "100%",
        mx: "auto",
        mt: 5,
        borderRadius: 3,
        backgroundColor: theme.palette.background.paper,
        boxShadow: 4,
        border: `1px solid ${theme.palette.divider}`,
      }}
    >
      {/* Header con título y botón de ver detalle */}
      <CardHeader
        title={
          <Typography
            component="h2"
            variant="h5"
            sx={{
              fontWeight: "bold",
              color: theme.palette.primary.main,
            }}
          >
            Trayecto: {trayectoActual?.valor_trayecto || "No definido"}
          </Typography>
        }
        action={
          <Tooltip title="Ver detalles del trayecto" arrow>
            <IconButton 
              onClick={handleVerDetalle}
              sx={{
                color: theme.palette.primary.main,
                '&:hover': {
                  backgroundColor: theme.palette.primary.light,
                  color: 'white',
                }
              }}
            >
              <VisibilityIcon />
            </IconButton>
          </Tooltip>
        }
        sx={{
          pb: 1,
          borderBottom: `1px solid ${theme.palette.divider}`
        }}
      />

      {/* Contenido de la card */}
      <CardContent sx={{ pt: 2 }}>
        {/* Información general */}
        <Box sx={{ mt: 1 }}>
          <Typography sx={{ display: "flex", alignItems: "center" }}>
            <strong>Población estudiantil:</strong>{" "}
            {trayectoActual?.poblacion_estudiantil || "0"}
          </Typography>

          <Typography sx={{ display: "flex", alignItems: "center", mt: 1 }}>
            <strong>Descripción:</strong>{" "}
            {trayectoActual?.descripcion_trayecto || "Sin descripción"}
            <Tooltip title="Editar descripción del trayecto" arrow>
              <IconButton
                size="small"
                sx={{ ml: 1 }}
                onClick={() =>
                  handleOpenModalEditar(
                    "descripcion_trayecto",
                    trayectoActual.descripcion_trayecto
                  )
                }
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Typography>

          {/* Acciones */}
          {trayectoEditado && (
            <CustomButton
              tipo="success"
              variant="contained"
              sx={{ mt: 2 }}
              onClick={handleGuardarCambiosServidor}
            >
              Guardar Cambios
            </CustomButton>
          )}
        </Box>
      </CardContent>

      {/* Modal para editar campos */}
      <ModalEditarCampoTrayecto
        open={openModalEditar}
        onClose={() => setOpenModalEditar(false)}
        campo={campoEditando}
        valorActual={valorEditando}
        onGuardar={handleGuardarCampo}
      />

      {/* Snackbar de notificaciones */}
      <Snackbar
        open={!!mensaje}
        autoHideDuration={2500}
        onClose={() => setMensaje(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={
            mensaje?.toLowerCase().includes("error") ? "error" : "success"
          }
          variant="filled"
          sx={{ width: "100%" }}
        >
          {mensaje}
        </Alert>
      </Snackbar>
    </Card>
  );
}