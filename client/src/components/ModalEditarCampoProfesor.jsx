import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Box,
  TextField,
} from "@mui/material";
import CustomButton from "./customButton";
import CustomLabel from "./customLabel";
import CustomChip from "./CustomChip";
import CustomAutocomplete from "./CustomAutocomplete";
import ModalRegisterAreaConocimiento from "./ModalRegisterAreaConocimiento";
import ModalRegisterPreGrado from "./ModalRegisterPreGrado";
import ModalRegisterPosgrado from "./ModalRegisterPosgrado";
import { useState, useEffect } from "react";
import { profesorSchema } from "../schemas/profesor.schema";
import useApi from "../hook/useApi";
import useSweetAlert from "../hook/useSweetAlert";

export default function ModalEditarCampoProfesor({
  open,
  onClose,
  campo,
  valorActual,
  onGuardar,
}) {
  const axios = useApi();
  const alert = useSweetAlert();
  const [valor, setValor] = useState(valorActual || []);
  const [error, setError] = useState("");
  const [preGrado, setPreGrado] = useState([]);
  const [posGrado, setPosGrado] = useState([]);
  const [areaConocimiento, setAreaConocimiento] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [openModalRegister, setOpenModalRegister] = useState(false);

  // Resetear el valor al abrir
  useEffect(() => {
    const initialValue = Array.isArray(valorActual) ? valorActual : [];
    setValor(initialValue);
    setError("");
  }, [valorActual, open]);

  // Cargar catálogos SOLO cuando sea necesario según el campo
  useEffect(() => {
    const fetchCatalogosNecesarios = async () => {
      if (!open) return;

      setCargando(true);
      try {
        if (campo === "pre_grados") {
          const pre = await axios.get("/catalogos/pregrados");
          setPreGrado(pre || []);
        } else if (campo === "pos_grados") {
          const pos = await axios.get("/catalogos/posgrados");
          setPosGrado(pos || []);
        } else if (campo === "areas_de_conocimiento") {
          const area = await axios.get("/catalogos/areas-conocimiento");
          setAreaConocimiento(area?.areas_conocimiento || []);
        }
        // Para otros campos no cargamos nada
      } catch (err) {
        console.error("Error cargando catálogos:", err);
      } finally {
        setCargando(false);
      }
    };

    fetchCatalogosNecesarios();
  }, [campo, open, axios]);

  const handleGuardar = async () => {
    try {
      // ✅ Confirmar antes de guardar cambios
      const confirm = await alert.confirm(
        "¿Desea guardar los cambios?",
        "El valor actual del campo será reemplazado por el nuevo."
      );
      if (!confirm) return;

      // ✅ Validar campo con esquema de Zod
      const campoSchema = profesorSchema.pick({ [campo]: true });
      campoSchema.parse({ [campo]: valor });

      // ✅ Si pasa validación → guardar cambios
      onGuardar(campo, valor);
      setError("");

      alert.success("Campo actualizado", "El valor se guardó correctamente.");

      onClose();
    } catch (err) {
      console.error("❌ ERROR en handleGuardar:", err);

      // ✅ Si hay errores de validación de Zod → mostrar con toast
      if (err.errors && Array.isArray(err.errors)) {
        err.errors.forEach((e) => {
          alert.toast("Validación", e.message);
        });
        setError(err.errors?.[0]?.message || "Error validando campo.");
      } else {
        // ✅ Si no hay errores de validación (otro tipo de error)
        alert.error(
          "Error al guardar",
          err.message || "El valor ingresado no es válido."
        );
        setError("Error validando campo.");
      }
    }
  };


  // Función para eliminar un item
  const handleDeleteItem = (indexToDelete) => {
    if (Array.isArray(valor)) {
      const newValue = valor.filter((_, index) => index !== indexToDelete);
      setValor(newValue);
    }
  };

  // Render dinámico según el campo
  const renderCampo = () => {
    if (campo === "pre_grados") {
      return (
        <>
          <CustomAutocomplete
            options={[
              ...preGrado,
              {
                id_pre_grado: "otro",
                nombre_pre_grado: "Otro",
                tipo_pre_grado: "",
              },
            ]}
            getOptionLabel={(option) =>
              option.tipo_pre_grado && option.nombre_pre_grado !== "Otro"
                ? `${option.tipo_pre_grado} ${option.nombre_pre_grado}`
                : option.nombre_pre_grado
            }
            groupBy={(option) => {
              // Si es la opción "Otro", la ponemos en grupo "Otros"
              if (option.nombre_pre_grado === "Otro") {
                return "Otros";
              }
              // Para los demás, usamos su tipo_pre_grado (corregí el nombre)
              return option.tipo_pre_grado || "Sin categoría";
            }}
            value={null}
            disabled={cargando}
            onChange={(event, newValue) => {
              if (newValue) {
                if (newValue.nombre_pre_grado === "Otro") {
                  setOpenModalRegister(true); // ← CORREGIDO: usar el estado correcto
                } else {
                  const exists = valor.some(
                    (item) => item.id_pre_grado === newValue.id_pre_grado
                  );
                  // ← ELIMINADO: esta condición estaba mal
                  if (!exists) {
                    setValor([...valor, newValue]);
                  }
                }
              }
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Pre Grados"
                placeholder={
                  cargando ? "Cargando..." : "Seleccione un pregrado"
                }
                error={!!error}
                helperText={error}
              />
            )}
            isOptionEqualToValue={(option, value) =>
              option.id_pre_grado === value?.id_pre_grado
            }
            filterOptions={(options, { inputValue }) => {
              return options.filter(
                (option) =>
                  option.nombre_pre_grado
                    .toLowerCase()
                    .includes(inputValue.toLowerCase()) ||
                  (option.tipo_pre_grado &&
                    option.tipo_pre_grado
                      .toLowerCase()
                      .includes(inputValue.toLowerCase()))
              );
            }}
          />

          {/* CustomChips para mostrar seleccionados */}
          {Array.isArray(valor) && valor.length > 0 && (
            <Box sx={{ mt: 2, display: "flex", flexWrap: "wrap", gap: 1 }}>
              {valor.map((pregrado, index) => (
                <CustomChip
                  key={pregrado.id_pre_grado || index}
                  label={`${pregrado.tipo_pre_grado} ${pregrado.nombre_pre_grado}`}
                  color="primary"
                  deletable
                  variant="outlined"
                  onDelete={() => handleDeleteItem(index)}
                  size="small"
                />
              ))}
            </Box>
          )}

          <ModalRegisterPreGrado
            open={openModalRegister}
            onClose={() => {
              setOpenModalRegister(false);
            }}
            setState={setPreGrado} // ← Actualizar el estado de preGrado
            onPregradoCreado={(nuevoPregrado) => {
              // Agregar el nuevo pregrado a la lista de seleccionados
              setValor([...valor, nuevoPregrado]);
            }}
          />
        </>
      );
    }

    if (campo === "pos_grados") {
      return (
        <>
          <CustomAutocomplete
            options={[
              ...posGrado,
              {
                id_pos_grado: "otro",
                nombre_pos_grado: "Otro",
                tipo_pos_grado: "",
              },
            ]}
            getOptionLabel={(option) =>
              option.tipo_pos_grado && option.nombre_pos_grado !== "Otro"
                ? `${option.tipo_pos_grado} ${option.nombre_pos_grado}`
                : option.nombre_pos_grado
            }
            groupBy={(option) => {
              // Si es la opción "Otro", la ponemos en grupo "Otros"
              if (option.nombre_pos_grado === "Otro") {
                return "Otros";
              }
              // Para los demás, usamos su tipo_pos_grado
              return option.tipo_pos_grado || "Sin categoría";
            }}
            value={null}
            disabled={cargando}
            onChange={(event, newValue) => {
              if (newValue) {
                if (newValue.nombre_pos_grado === "Otro") {
                  setOpenModalRegister(true);
                } else {
                  const exists = valor.some(
                    (item) => item.id_pos_grado === newValue.id_pos_grado
                  );
                  if (!exists) {
                    setValor([...valor, newValue]);
                  }
                }
              }
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Pos Grados"
                placeholder={
                  cargando ? "Cargando..." : "Seleccione un posgrado"
                }
                error={!!error}
                helperText={error}
              />
            )}
            isOptionEqualToValue={(option, value) =>
              option.id_pos_grado === value?.id_pos_grado
            }
            filterOptions={(options, { inputValue }) => {
              return options.filter(
                (option) =>
                  option.nombre_pos_grado
                    .toLowerCase()
                    .includes(inputValue.toLowerCase()) ||
                  (option.tipo_pos_grado &&
                    option.tipo_pos_grado
                      .toLowerCase()
                      .includes(inputValue.toLowerCase()))
              );
            }}
          />

          {/* CustomChips para posgrados seleccionados */}
          {Array.isArray(valor) && valor.length > 0 && (
            <Box sx={{ mt: 2, display: "flex", flexWrap: "wrap", gap: 1 }}>
              {valor.map((posgrado, index) => (
                <CustomChip
                  variant="outlined"
                  key={posgrado.id_pos_grado || index}
                  label={`${posgrado.tipo_pos_grado} ${posgrado.nombre_pos_grado}`}
                  color="primary"
                  deletable
                  onDelete={() => handleDeleteItem(index)}
                  size="small"
                />
              ))}
            </Box>
          )}
          <ModalRegisterPosgrado
            open={openModalRegister}
            onClose={() => {
              setOpenModalRegister(false);
            }}
            setState={posGrado} // ← Actualizar el estado de preGrado
            onPregradoCreado={(nuevoPosGrado) => {
              // Agregar el nuevo pregrado a la lista de seleccionados
              setValor([...valor, nuevoPosGrado]);
            }}
          />
        </>
      );
    }

    if (campo === "areas_de_conocimiento") {
      return (
        <>
          <CustomAutocomplete
            options={[
              ...areaConocimiento,
              {
                id_area_conocimiento: "otro",
                nombre_area_conocimiento: "Otro",
              },
            ]}
            getOptionLabel={(option) => option.nombre_area_conocimiento || ""}
            value={null}
            disabled={cargando}
            onChange={(event, newValue) => {
              if (newValue) {
                if (newValue.nombre_area_conocimiento === "Otro") {
                  setOpenModalRegister;
                } else {
                  const exists = valor.some(
                    (item) =>
                      item.id_area_conocimiento ===
                      newValue.id_area_conocimiento
                  );
                  if (!exists) {
                    setValor([...valor, newValue]);
                  }
                }
              }
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Áreas de Conocimiento"
                placeholder={cargando ? "Cargando..." : "Seleccione un área"}
                error={!!error}
                helperText={error}
              />
            )}
            isOptionEqualToValue={(option, value) =>
              option.id_area_conocimiento === value?.id_area_conocimiento
            }
            filterOptions={(options, { inputValue }) => {
              return options.filter((option) =>
                option.nombre_area_conocimiento
                  .toLowerCase()
                  .includes(inputValue.toLowerCase())
              );
            }}
          />

          {/* CustomChips para áreas seleccionadas */}
          {Array.isArray(valor) && valor.length > 0 && (
            <Box sx={{ mt: 2, display: "flex", flexWrap: "wrap", gap: 1 }}>
              {valor.map((area, index) => (
                <CustomChip
                  variant="outlined"
                  key={area.id_area_conocimiento || index}
                  label={area.nombre_area_conocimiento}
                  color="primary"
                  size="small"
                  deletable
                  onDelete={() => handleDeleteItem(index)}
                />
              ))}
            </Box>
          )}

          <ModalRegisterAreaConocimiento
            open={openModalRegister}
            onClose={() => {
              setOpenModalRegister(false);
            }}
            setState={setAreaConocimiento} // ← Actualizar el estado de preGrado
            onPregradoCreado={(nuevaAreaConocimiento) => {
              // Agregar el nuevo pregrado a la lista de seleccionados
              setValor([...valor, nuevaAreaConocimiento]);
            }}
          />
        </>
      );
    }

    if (campo === "categoria") {
      return (
        <CustomLabel
          select
          id="categoria"
          label="Categoría"
          variant="outlined"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          error={!!error}
          helperText={error}
          fullWidth
        >
          <MenuItem value="Instructor">Instructor</MenuItem>
          <MenuItem value="Asistente">Asistente</MenuItem>
          <MenuItem value="Asociado">Asociado</MenuItem>
          <MenuItem value="Agregado">Agregado</MenuItem>
          <MenuItem value="Titular">Titular</MenuItem>
        </CustomLabel>
      );
    }

    if (campo === "dedicacion") {
      return (
        <CustomLabel
          select
          id="dedicacion"
          label="Dedicación"
          variant="outlined"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          error={!!error}
          helperText={error}
          fullWidth
        >
          <MenuItem value="Convencional">Convencional</MenuItem>
          <MenuItem value="Medio Tiempo">Medio Tiempo</MenuItem>
          <MenuItem value="Tiempo Completo">Tiempo Completo</MenuItem>
          <MenuItem value="Exclusivo">Exclusivo</MenuItem>
        </CustomLabel>
      );
    }

    // Default: campo de texto normal (no carga ningún catálogo)
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
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ textTransform: "capitalize" }}>
        Editar {String(campo).replace(/_/g, " ")}
      </DialogTitle>
      <DialogContent>{renderCampo()}</DialogContent>

      <DialogActions sx={{ padding: "16px" }}>
        <CustomButton onClick={onClose} tipo="secondary">
          Cancelar
        </CustomButton>
        <CustomButton onClick={handleGuardar} disabled={cargando}>
          {cargando ? "Cargando..." : "Guardar"}
        </CustomButton>
      </DialogActions>
    </Dialog>
  );
}
