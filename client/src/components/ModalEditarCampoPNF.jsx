import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
} from "@mui/material";
import CustomButton from "./customButton";
import CustomLabel from "./customLabel";
import { useState, useEffect } from "react";
import pnfSchema from "../schemas/pnf.schema";
import useApi from "../hook/useApi";
import useSweetAlert from "../hook/useSweetAlert";

export default function ModalEditarCampoPNF({
  open,
  onClose,
  campo,
  valorActual,
  onGuardar,
}) {
  const axios = useApi();
  const alert = useSweetAlert();
  const [valor, setValor] = useState(valorActual || "");
  const [error, setError] = useState("");
  const [pnfs, setPnfs] = useState([]);

  // 🔄 Resetear el valor al abrir el modal
  useEffect(() => {
    setValor(valorActual || "");
    setError("");
    console.log("🟡 [DEBUG] Modal abierto:", { campo, valorActual });
  }, [valorActual, open]);

  // 📥 Cargar catálogos (por ejemplo, PNF si el trayecto tiene relación)
  useEffect(() => {
    const fetchPnfs = async () => {
      try {
        const data = await axios.get("/pnf");
        setPnfs(data || []);
        console.log("✅ [DEBUG] PNF cargados:", data);
      } catch (err) {
        console.error("❌ [DEBUG] Error cargando PNF:", err);
      }
    };

    fetchPnfs();
  }, []);

const handleGuardar = async () => {
  console.log("🟢 [DEBUG] Guardando campo:", { campo, valor });

  try {
    // ✅ Confirmar antes de guardar
    const confirm = await alert.confirm(
      "¿Desea guardar los cambios?",
      "El valor actual será reemplazado por el nuevo."
    );
    if (!confirm) return;

    // ✅ Validar el campo individual con Zod
    const campoSchema = pnfSchema.pick({ [campo]: true });
    campoSchema.parse({ [campo]: valor });

    // ✅ Si pasa validación, guardar
    onGuardar(campo, valor);
    setError("");

    // 🔽 Aquí debes poner el toast de éxito
    alert.toast({
      title: "Campo actualizado",
      message: "El valor se guardó correctamente.",
      config: { icon: "success" },
    });

    onClose();
  } catch (err) {
    console.error("❌ [DEBUG] Error validando campo:", err);

    // ⚠️ Manejo detallado de errores de validación Zod
    if (err.errors && Array.isArray(err.errors)) {
      err.errors.forEach((e) => {
        // 🔽 Aquí debes poner el toast de advertencia por cada validación
        alert.toast({
          title: "Validación",
          message: e.message,
          config: { icon: "warning" },
        });
      });
      setError(err.errors?.[0]?.message || "Error validando campo.");
    } else {
      // 🔽 Aquí debes poner el toast de error general
      alert.toast({
        title: "Error al guardar",
        message: err.message || "El valor ingresado no es válido.",
        config: { icon: "error" },
      });

      setError("Error validando campo.");
    }
  }
};

  // 🧠 Render dinámico según el campo
  const renderCampo = () => {
    // Si el campo es una relación con PNF
    if (campo === "id_pnf") {
      return (
        <TextField
          select
          fullWidth
          label="Seleccione el PNF"
          variant="outlined"
          value={valor || ""}
          onChange={(e) => setValor(e.target.value)}
          error={!!error}
          helperText={error || " "}
        >
          {pnfs.map((p) => (
            <MenuItem key={p.id_pnf} value={p.id_pnf}>
              {p.nombre_pnf}
            </MenuItem>
          ))}
        </TextField>
      );
    }

    // Si el campo es numérico (por ejemplo duración o número)
    if (["numero_trayecto", "duracion"].includes(campo)) {
      return (
        <CustomLabel
          fullWidth
          type="number"
          margin="normal"
          label={`Nuevo valor de ${String(campo).replace(/_/g, " ")}`}
          variant="outlined"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          error={!!error}
          helperText={error || " "}
        />
      );
    }

    // Si el campo es de texto (nombre, descripción, etc.)
    return (
      <CustomLabel
        fullWidth
        margin="normal"
        label={`Nuevo valor de ${String(campo).replace(/_/g, " ")}`}
        variant="outlined"
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        error={!!error}
        helperText={error || " "}
      />
    );
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ textTransform: "capitalize" }}>
        Editar {String(campo).replace(/_/g, " ")}
      </DialogTitle>

      <DialogContent>{renderCampo()}</DialogContent>

      <DialogActions sx={{ padding: "16px" }}>
        <CustomButton onClick={onClose} tipo="secondary">
          Cancelar
        </CustomButton>
        <CustomButton onClick={handleGuardar}>Guardar</CustomButton>
      </DialogActions>
    </Dialog>
  );
}
