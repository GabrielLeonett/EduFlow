import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  MenuItem,
  Divider,
  useTheme,
  Stack,
  InputAdornment,
} from "@mui/material";
import {
  School as SchoolIcon,
  Person as PersonIcon,
  Room as RoomIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Logout as LogoutIcon,
  Search as SearchIcon,
} from "@mui/icons-material";
import CustomButton from "../../customButton";
import CustomAutocomplete from "../../CustomAutocomplete";
import CustomLabel from "../../customLabel";

// Formulario para crear nueva clase
const ClassForm = ({
  unidadCurricularSelected,
  unidadesCurriculares,
  profesores,
  profesorSelected,
  aulas,
  aulaSelected,
  onUnidadChange,
  onProfesorChange,
  onAulaChange,
  Custom = true,
  loading = false,
  errors = {},
  ButtonSave,
  ButtonCancel,
  ButtonExitModeCustom,
  HayCambios,
}) => {
  const theme = useTheme();

  if (!Custom) {
    return null;
  }

  return (
    <Card
      elevation={3}
      sx={{
        mb: 3,
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 2,
      }}
    >
      <CardContent>
        {/* Header */}
        <Typography
          variant="h6"
          gutterBottom
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            color: theme.palette.primary.main,
          }}
        >
          <SchoolIcon />
          Crear Nueva Clase
        </Typography>

        <Divider sx={{ mb: 3 }} />

        {/* Campos del formulario */}
        <Grid container spacing={3}>
          {/* Unidad Curricular */}
          <Grid size={{ xs: 12, lg: 6 }}>
            <CustomLabel
              select
              fullWidth
              value={unidadCurricularSelected?.id_unidad_curricular || ""}
              label="Seleccionar la unidad curricular"
              onChange={(e) => {
                onUnidadChange(e.target.value);
              }}
              disabled={loading}
              error={!!errors.unidad}
              helperText={errors.unidad || "Seleccione la unidad curricular"}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SchoolIcon sx={{ color: "text.secondary" }} />
                  </InputAdornment>
                ),
              }}
            >
              {unidadesCurriculares.length > 0 ? (
                unidadesCurriculares
                  .filter((unidad) => unidad.esVista !== true)
                  .map((unidad) => (
                    <MenuItem
                      key={unidad.id_unidad_curricular}
                      value={unidad.id_unidad_curricular}
                    >
                      <Grid container direction={"column"}>
                        <Typography variant="caption" fontWeight="medium">
                          {unidad.nombre_unidad_curricular}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {unidad.horas_clase} horas • {unidad.codigo_unidad}
                        </Typography>
                      </Grid>
                    </MenuItem>
                  ))
              ) : (
                <MenuItem disabled>
                  <Typography variant="body2" color="text.secondary">
                    {loading
                      ? "Cargando unidades..."
                      : "No hay unidades disponibles"}
                  </Typography>
                </MenuItem>
              )}
            </CustomLabel>
          </Grid>

          {/* Profesor - Solo se muestra si hay unidad seleccionada */}
          {unidadCurricularSelected && (
            <Grid size={{ xs: 12, lg: 6 }}>
              <CustomAutocomplete
                freeSolo
                options={profesores || []} // ← Asegurar que siempre sea un array
                getOptionLabel={(profesor) =>
                  typeof profesor === "string"
                    ? profesor
                    : profesor
                    ? `${profesor.nombres || ""} ${
                        profesor.apellidos || ""
                      } - ${profesor.cedula || ""}`
                    : ""
                }
                value={profesorSelected}
                onChange={(event, newValue) => {
                  onProfesorChange(newValue);
                }}
                onInputChange={(event, newInputValue, reason) => {
                  // Búsqueda en tiempo real opcional
                  if (reason === "input" && newInputValue.length >= 3) {
                    // Puedes implementar debounced search aquí si necesitas
                  }
                }}
                disabled={loading}
                renderInput={(params) => (
                  <CustomLabel
                    {...params}
                    label="Seleccionar Profesor"
                    placeholder="Buscar por nombre, apellido, cédula o escribir manualmente"
                    error={!!errors.profesor}
                    helperText={
                      errors.profesor ||
                      "Busque, seleccione un profesor o escriba manualmente"
                    }
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <InputAdornment position="start">
                          <PersonIcon sx={{ color: "text.secondary" }} />
                        </InputAdornment>
                      ),
                    }}
                  />
                )}
                isOptionEqualToValue={(option, value) =>
                  option?.id_profesor === value?.id_profesor
                }
                noOptionsText={
                  loading
                    ? "Cargando profesores..."
                    : "No se encontraron profesores - Escriba para buscar manualmente"
                }
                loading={loading}
                loadingText="Cargando profesores..."
                clearOnBlur={false}
                clearOnEscape={true}
                disableClearable={false}
                filterOptions={(options, state) => {
                  // Asegurar que options sea un array
                  const safeOptions = options || [];
                  const inputValue = state.inputValue.trim().toLowerCase();

                  if (!inputValue) return safeOptions;

                  const filtered = safeOptions.filter((option) => {
                    // Validar que option sea un objeto válido
                    if (typeof option === "string") return false;
                    if (!option) return false;

                    const nombres = option.nombres || "";
                    const apellidos = option.apellidos || "";
                    const cedula = option.cedula || "";

                    const searchString = `${nombres} ${apellidos} ${cedula}`
                      .toLowerCase()
                      .replace(/\s+/g, " ")
                      .trim();

                    return searchString.includes(inputValue);
                  });

                  // Agregar opción de búsqueda libre si no hay coincidencia exacta
                  if (
                    inputValue &&
                    !filtered.some((opt) => {
                      if (typeof opt === "string") return false;
                      const label = `${opt.nombres || ""} ${
                        opt.apellidos || ""
                      } - ${opt.cedula || ""}`
                        .toLowerCase()
                        .trim();
                      return label === inputValue;
                    })
                  ) {
                    return [inputValue, ...filtered];
                  }

                  return filtered;
                }}
                renderOption={(props, option) => {
                  if (typeof option === "string") {
                    return (
                      <li {...props}>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            color: "primary.main",
                          }}
                        >
                          <SearchIcon fontSize="small" />
                          <Typography variant="body2">
                            <strong>Buscar:</strong> "{option}"
                          </Typography>
                        </Box>
                      </li>
                    );
                  }

                  // Validar que option sea un objeto válido
                  if (!option) {
                    return (
                      <li {...props}>
                        <Typography variant="body2" color="text.secondary">
                          Opción inválida
                        </Typography>
                      </li>
                    );
                  }

                  return (
                    <li {...props}>
                      <Typography variant="body2">
                        {option.nombres || ""} {option.apellidos || ""} -{" "}
                        {option.cedula || ""}
                      </Typography>
                    </li>
                  );
                }}
              />
            </Grid>
          )}

          {/* Aula - Solo se muestra si hay profesor seleccionado */}
          {profesorSelected && (
            <Grid size={12}>
              <CustomLabel
                select
                fullWidth
                value={aulaSelected?.id_aula || ""}
                label="Seleccionar Aula"
                onChange={(e) => onAulaChange(e.target.value)}
                disabled={loading}
                error={!!errors.aula}
                helperText={errors.aula || "Seleccione el aula para la clase"}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <RoomIcon sx={{ color: "text.secondary" }} />
                    </InputAdornment>
                  ),
                }}
              >
                {aulas.length > 0 ? (
                  aulas.map((aula) => (
                    <MenuItem key={aula.id_aula} value={aula.id_aula}>
                      <Grid container direction={"column"}>
                        <Typography variant="caption" fontWeight="medium">
                          {aula.codigo_aula}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Capacidad: {aula.capacidad_aula} • {aula.tipo_aula}
                        </Typography>
                      </Grid>
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem disabled>
                    <Typography variant="body2" color="text.secondary">
                      {loading
                        ? "Cargando aulas..."
                        : "No hay aulas disponibles"}
                    </Typography>
                  </MenuItem>
                )}
              </CustomLabel>
            </Grid>
          )}
        </Grid>

        {/* Botones de acción */}
        <Box sx={{ mt: 3 }}>
          <Stack
            direction="row"
            spacing={2}
            alignItems="center"
            flexWrap="wrap"
          >
            {/* Botones de Guardar/Cancelar - Solo se muestran si hay cambios */}
            {HayCambios && (
              <>
                <CustomButton
                  tipo="success"
                  onClick={ButtonSave}
                  startIcon={<SaveIcon />}
                  disabled={loading}
                >
                  {loading ? "Guardando..." : "Guardar Cambios"}
                </CustomButton>
                <CustomButton
                  tipo="error"
                  onClick={ButtonCancel}
                  startIcon={<CancelIcon />}
                  disabled={loading}
                >
                  Cancelar Cambios
                </CustomButton>
              </>
            )}

            {/* Botón para salir del modo custom - Siempre visible */}
            <CustomButton
              tipo="secondary"
              onClick={ButtonExitModeCustom}
              startIcon={<LogoutIcon />}
              variant="outlined"
              disabled={loading}
            >
              Salir del Modo Custom
            </CustomButton>
          </Stack>
        </Box>

        {/* Mensajes de error general */}
        {errors.general && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="error">
              {errors.general}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default ClassForm;
