import { useCallback, useEffect, useState } from "react";
import {
  Box,
  Grid,
  Typography,
  MenuItem,
  InputAdornment,
  Tooltip,
  CircularProgress,
  Stack,
  Pagination,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import Navbar from "../../../components/navbar";
import CustomLabel from "../../../components/customLabel";
import CardAdmin from "../../../components/CardAdmin";
import { useNavigate } from "react-router-dom";
import CustomButton from "../../../components/customButton";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import useApi from "../../../hook/useApi";
import useSweetAlert from "../../../hook/useSweetAlert";
import { Route as RouteIcon } from "@mui/icons-material";
import { useTour } from "../../../hook/useTour";
import CustomAutocomplete from "../../../components/CustomAutocomplete";

export default function GestionAdministradores() {
  const axios = useApi();
  const navigate = useNavigate();
  const alert = useSweetAlert();
  
  const [usuarios, setUsuarios] = useState([]);
  const [adminSearch, setAdminSearch] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [filtroRol, setFiltroRol] = useState("todos");
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [searchTimeout, setSearchTimeout] = useState(null);

  const pedirUsuario = useCallback(async () => {
    setLoading(true);
    try {
      const endpoint = `/admins?page=${pagination.page}&limit=${
        pagination.limit
      }&search=${adminSearch || ""}&rol=${filtroRol !== "todos" ? filtroRol : ""}`;
      
      const response = await axios.get(endpoint);
      console.log("Administradores cargados:", response);
      
      const usuariosData = response.administradores || [];
      const paginationData = response.pagination || {};

      setUsuarios(usuariosData);
      setPagination((prev) => ({
        ...prev,
        ...paginationData,
      }));
    } catch (error) {
      console.log("❌ Error completo:", error);
      if (error.error?.totalErrors > 0) {
        error.error.validationErrors.forEach((error_validacion) => {
          alert.toast(error_validacion.field, error_validacion.message);
        });
      } else {
        alert.error(error.title, error.message);
      }
      setUsuarios([]);
    } finally {
      setLoading(false);
    }
  }, [axios, alert, pagination.page, pagination.limit, adminSearch, filtroRol]);

  useEffect(() => {
    pedirUsuario();
  }, []);

  // Manejar cambio de página
  const handlePageChange = (event, page) => {
    setPagination((prev) => ({
      ...prev,
      page: page,
    }));
  };

  // Manejar cambio de rol
  const handleRolChange = (event) => {
    setFiltroRol(event.target.value);
    // Resetear a página 1 cuando cambia el filtro
    setPagination((prev) => ({
      ...prev,
      page: 1,
    }));
  };

  // 🔹 Definición del tour con Intro.js
  const { startTour, resetTour } = useTour(
    [
      {
        intro:
          "👋 Bienvenido al módulo de gestión de administradores. Te mostraré dónde está todo.",
      },
      {
        element: "#filtros-busqueda",
        intro: "Aquí puedes buscar y filtrar los administradores.",
        position: "bottom",
      },
      {
        element: "#admin-container",
        intro: "Aquí verás la lista de todos los administradores registrados.",
        position: "right",
      },
      {
        element: "#admin-card-ejemplo",
        intro:
          "Cada tarjeta muestra la información de un administrador y sus permisos.",
        position: "bottom",
      },
      {
        element: "#btn-registrar-admin",
        intro: "Desde este botón puedes registrar un nuevo administrador.",
        position: "left",
      },
      {
        element: "#btn-reiniciar-tour",
        intro:
          "Puedes repetir el tutorial en cualquier momento desde este botón.",
        position: "top",
      },
    ],
    "tourGestionAdministradores" // clave única para este módulo
  );

  // ✅ Ejecutar el tour solo cuando ya cargaron los administradores
  useEffect(() => {
    if (!loading && usuarios.length > 0) {
      startTour();
    }
  }, [loading, usuarios]);

  return (
    <>
      <Navbar backgroundColor={true} />
      <Box mt={12} p={3}>
        <Typography variant="h3" fontWeight={600} mb={1}>
          Gestión de Administradores
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>
          Asigna, edita o elimina privilegios administrativos de los usuarios
          del sistema.
        </Typography>

        {/* Filtros y Búsqueda */}
        <Box
          id="filtros-busqueda"
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          flexWrap="wrap"
          gap={2}
          mb={3}
        >
          {/* Búsqueda por nombre o correo */}
          <Box sx={{ flexGrow: 1, minWidth: 300 }}>
            <CustomAutocomplete
              freeSolo
              options={usuarios}
              inputValue={searchInput}
              onInputChange={(event, newValue) => {
                setSearchInput(newValue);

                // Clear previous timeout
                if (searchTimeout) clearTimeout(searchTimeout);

                // Set new timeout for debounced search
                const timeout = setTimeout(() => {
                  if (newValue.length > 2 || newValue.length === 0) {
                    setAdminSearch(newValue);
                    // Resetear a página 1 cuando se realiza una búsqueda
                    setPagination((prev) => ({
                      ...prev,
                      page: 1,
                    }));
                  }
                }, 1000);

                setSearchTimeout(timeout);
              }}
              onChange={(event, newValue) => {
                if (newValue && typeof newValue !== "string") {
                  // User selected an option
                  console.log("Administrador seleccionado:", newValue);
                  // Puedes hacer algo con el administrador seleccionado
                }
              }}
              getOptionLabel={(option) => {
                if (typeof option === "string") {
                  return option;
                }
                // Manejar array de roles: [{id_rol, nombre_rol}]
                const rolesNombres = option.roles && Array.isArray(option.roles) 
                  ? option.roles.map(rol => rol.nombre_rol).join(", ")
                  : "Sin roles";
                return `${option.nombres} ${option.apellidos} - ${rolesNombres}`;
              }}
              renderInput={(params) => (
                <CustomLabel
                  {...params}
                  label="Buscar administrador"
                  placeholder="Nombre, apellido o correo electrónico..."
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: "text.secondary" }} />
                      </InputAdornment>
                    ),
                  }}
                />
              )}
              filterOptions={(options, { inputValue }) => {
                // Si el input está vacío, mostrar opciones recientes o populares
                if (!inputValue) {
                  return options.slice(0, 5); // Mostrar solo las primeras 5
                }

                // Filtrar opciones locales
                return options.filter(
                  (option) =>
                    option.nombres
                      ?.toLowerCase()
                      .includes(inputValue.toLowerCase()) ||
                    option.apellidos
                      ?.toLowerCase()
                      .includes(inputValue.toLowerCase()) ||
                    option.email
                      ?.toLowerCase()
                      .includes(inputValue.toLowerCase()) ||
                    // Buscar también en nombres de roles
                    (option.roles && Array.isArray(option.roles) && 
                      option.roles.some(rol => 
                        rol.nombre_rol
                          ?.toLowerCase()
                          .includes(inputValue.toLowerCase())
                      ))
                );
              }}
              noOptionsText={
                searchInput.length > 2
                  ? "Presiona Enter para buscar"
                  : "Escribe al menos 3 caracteres"
              }
            />
          </Box>

          {/* Filtro por rol */}
          <CustomLabel
            sx={{ minWidth: 200 }}
            select
            size="small"
            value={filtroRol}
            onChange={handleRolChange}
            label="Filtrar por rol"
          >
            <MenuItem value="todos">Todos los roles</MenuItem>
            <MenuItem value="1">Profesor</MenuItem>
            <MenuItem value="2">Coordinador</MenuItem>
            <MenuItem value="7">Director/a de Gestión Curricular</MenuItem>
            <MenuItem value="8">Director/a de Gestión Permanente y Docente</MenuItem>
            <MenuItem value="9">Secretari@ Vicerrect@r</MenuItem>
            <MenuItem value="10">Vicerrector</MenuItem>
            <MenuItem value="20">SuperAdmin</MenuItem>
          </CustomLabel>
        </Box>

        {loading ? (
          <Box className="flex justify-center items-center h-64">
            <CircularProgress />
          </Box>
        ) : (
          <Box id="admin-container">
            {usuarios.length === 0 ? (
              <Typography align="center" variant="h6" sx={{ mt: 4 }}>
                {adminSearch || filtroRol !== "todos"
                  ? "No se encontraron administradores que coincidan con los filtros"
                  : "No hay administradores registrados"}
              </Typography>
            ) : (
              <>
                {/* Tarjetas de usuario */}
                <Grid container spacing={3}>
                  {usuarios.map((usuario, index) => (
                    <Grid
                      item
                      xs={12}
                      sm={6}
                      md={4}
                      key={usuario.cedula || usuario.id}
                      {...(index === 0 ? { id: "admin-card-ejemplo" } : {})}
                    >
                      <CardAdmin usuario={usuario} />
                    </Grid>
                  ))}
                </Grid>

                {/* Paginación */}
                {pagination.totalPages > 1 && (
                  <Box
                    sx={{
                      width: "100%",
                      display: "flex",
                      alignContent: "center",
                      justifyContent: "center",
                      my: 3,
                    }}
                  >
                    <Stack>
                      <Pagination
                        count={pagination.totalPages}
                        page={pagination.page}
                        onChange={handlePageChange}
                        color="primary"
                        shape="rounded"
                        showFirstButton
                        showLastButton
                        size="large"
                      />
                    </Stack>
                  </Box>
                )}
              </>
            )}
          </Box>
        )}

        {/* Información de paginación */}
        {usuarios.length > 0 && (
          <Typography
            variant="body2"
            color="text.secondary"
            textAlign="center"
            mt={2}
          >
            Mostrando {(pagination.page - 1) * pagination.limit + 1} -{" "}
            {Math.min(pagination.page * pagination.limit, pagination.total)} de{" "}
            {pagination.total} administradores
          </Typography>
        )}
      </Box>

      <Tooltip title={"Registrar Administrador"} placement="left-start">
        <CustomButton
          id="btn-registrar-admin"
          onClick={() => {
            navigate("/administradores/crear");
          }}
          sx={{
            position: "fixed",
            bottom: 78,
            right: 24,
            minWidth: "auto",
            width: 48,
            height: 48,
            borderRadius: "50%",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          aria-label={"Registrar Administrador"}
        >
          <PersonAddIcon />
        </CustomButton>
      </Tooltip>

      <Tooltip title={"Tutorial"} placement="left-start">
        <CustomButton
          id="btn-reiniciar-tour"
          variant="contained"
          onClick={resetTour}
          sx={{
            position: "fixed",
            bottom: 128,
            right: 24,
            minWidth: "auto",
            width: 48,
            height: 48,
            borderRadius: "50%",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          aria-label={"Ver tutorial"}
        >
          <RouteIcon />
        </CustomButton>
      </Tooltip>
    </>
  );
}