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
  Chip,
  ListSubheader,
} from "@mui/material";
import {
  School as SchoolIcon,
  Person as PersonIcon,
  Room as RoomIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Logout as LogoutIcon,
  Search as SearchIcon,
  Block as BlockIcon,
  
  CheckCircle as CheckCircleIcon,
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

  // Componentes para agrupamiento
  const GroupHeader = ({ children, sx, ...props }) => (
    <Box
      {...props}
      sx={{
        position: "sticky",
        top: "-8px",
        padding: "8px 16px",
        backgroundColor: theme.palette.background.paper,
        borderBottom: `1px solid ${theme.palette.divider}`,
        zIndex: 1,
        ...sx,
      }}
    >
      {children}
    </Box>
  );

  const GroupItems = ({ children }) => (
    <Box component="ul" sx={{ padding: 0 }}>
      {children}
    </Box>
  );

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
              {unidadesCurriculares.length === 0 ? (
                <MenuItem disabled>
                  <Typography variant="body2" color="text.secondary">
                    {loading
                      ? "Cargando unidades..."
                      : "No hay unidades disponibles"}
                  </Typography>
                </MenuItem>
              ) : (
                // Mostrar todas las unidades sin agrupar (pero con chips para incompletas)
                unidadesCurriculares
                  .filter(
                    (unidad) => !unidad.esVista || unidad.faltan_horas_clase > 0
                  )
                  .map((unidad) => (
                    <MenuItem
                      key={unidad.id_unidad_curricular}
                      value={unidad.id_unidad_curricular}
                    >
                      <Grid
                        container
                        direction={"column"}
                        sx={{ width: "100%" }}
                      >
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <Typography variant="caption" fontWeight="medium">
                            {unidad.nombre_unidad_curricular}
                          </Typography>
                          {unidad.faltan_horas_clase > 0 && (
                            <Chip
                              size="small"
                              label={`Faltan ${unidad.faltan_horas_clase}h`}
                              color="warning"
                              variant="outlined"
                              sx={{ height: 20, fontSize: "0.6rem" }}
                            />
                          )}
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          {unidad.horas_clase} horas • {unidad.codigo_unidad}
                          {unidad.horas_asignadas > 0 &&
                            ` • ${unidad.horas_asignadas}h asignadas`}
                        </Typography>
                      </Grid>
                    </MenuItem>
                  ))
              )}
            </CustomLabel>
          </Grid>

          {/* Profesor - Solo se muestra si hay unidad seleccionada */}
          {unidadCurricularSelected && (
            <Grid size={{ xs: 12, lg: 6 }}>
              {/* Definir componentes de grupo localmente */}
              <Box sx={{ position: "relative" }}>
                <CustomAutocomplete
                  freeSolo // ← Esta propiedad es crucial para búsqueda libre
                  options={profesores || []}
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
                    console.log("Profesor seleccionado:", newValue);
                    // Solo permitir seleccionar profesores válidos o búsqueda libre
                    if (typeof newValue === "string" || newValue?.es_valido) {
                      onProfesorChange(newValue);
                    }
                  }}
                  onInputChange={(event, newInputValue, reason) => {
                    console.log("Input change:", newInputValue, reason);
                    if (reason === "input" && newInputValue.length >= 3) {
                      // Búsqueda en tiempo real opcional
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
                  groupBy={(option) => {
                    if (typeof option === "string") return "Búsqueda libre";
                    if (!option) return "Sin información";

                    return option.es_valido
                      ? "Profesores disponibles"
                      : "Profesores no disponibles";
                  }}
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

                    // Determinar estilos según validez
                    const isDisabled = !option.es_valido;

                    return (
                      <li
                        {...props}
                        style={{
                          ...props.style,
                          opacity: isDisabled ? 0.6 : 1,
                          cursor: isDisabled ? "not-allowed" : "pointer",
                        }}
                      >
                        <Box sx={{ width: "100%" }}>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            {isDisabled ? (
                              <BlockIcon fontSize="small" color="disabled" />
                            ) : (
                              <CheckCircleIcon
                                fontSize="small"
                                color="success"
                              />
                            )}
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: isDisabled ? "normal" : "medium",
                                color: isDisabled
                                  ? "text.secondary"
                                  : "text.primary",
                              }}
                            >
                              {option.nombres || ""} {option.apellidos || ""} -{" "}
                              {option.cedula || ""}
                            </Typography>
                          </Box>

                          {isDisabled && option.razon_invalidez && (
                            <Typography
                              variant="caption"
                              color="error"
                              sx={{
                                display: "block",
                                mt: 0.5,
                                ml: 3,
                                fontStyle: "italic",
                              }}
                            >
                              {option.razon_invalidez}
                            </Typography>
                          )}

                          {!isDisabled && option.dedicacion_actual && (
                            <Typography
                              variant="caption"
                              color="success.main"
                              sx={{
                                display: "block",
                                mt: 0.5,
                                ml: 3,
                                fontWeight: "medium",
                              }}
                            >
                              {option.dedicacion_actual} •{" "}
                              {option.horas_disponibles_semanales} disponibles
                            </Typography>
                          )}
                        </Box>
                      </li>
                    );
                  }}
                  renderGroup={(params) => {
                    // Definir GroupHeader localmente
                    const GroupHeader = ({ children, sx, ...props }) => (
                      <Box
                        {...props}
                        sx={{
                          position: "sticky",
                          top: "-8px",
                          padding: "8px 16px",
                          backgroundColor: "background.paper",
                          borderBottom: `1px solid divider`,
                          zIndex: 1,
                          fontWeight: "bold",
                          fontSize: "0.875rem",
                          ...sx,
                        }}
                      >
                        {children}
                      </Box>
                    );

                    const GroupItems = ({ children }) => (
                      <Box component="ul" sx={{ padding: 0, margin: 0 }}>
                        {children}
                      </Box>
                    );

                    return (
                      <li key={params.key}>
                        <GroupHeader
                          sx={{
                            backgroundColor:
                              params.group === "Profesores disponibles"
                                ? "success.light"
                                : params.group === "Profesores no disponibles"
                                ? "grey.100"
                                : "primary.light",
                            color:
                              params.group === "Profesores disponibles"
                                ? "success.dark"
                                : params.group === "Profesores no disponibles"
                                ? "grey.600"
                                : "primary.dark",
                          }}
                        >
                          {params.group}
                          {params.group === "Profesores disponibles" && (
                            <Chip
                              size="small"
                              label="Recomendados"
                              color="success"
                              variant="filled"
                              sx={{ ml: 1, height: 20, fontSize: "0.7rem" }}
                            />
                          )}
                        </GroupHeader>
                        <GroupItems>{params.children}</GroupItems>
                      </li>
                    );
                  }}
                  getOptionDisabled={(option) => {
                    // Deshabilitar solo los profesores no válidos (no las búsquedas libres)
                    if (typeof option === "string") return false;
                    return !option?.es_valido;
                  }}
                />
              </Box>
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
        <Stack
          marginTop={3}
          direction={{ xs: "column", md: "row" }}
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
