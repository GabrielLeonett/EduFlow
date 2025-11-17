import { Box, Typography, Grid, Breadcrumbs, Link } from "@mui/material";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import CardUnidadCurricular from "../../components/cardUnidadCurricular";
import CardSeccion from "../../components/cardSeccion";
import ResponsiveAppBar from "../../components/navbar";
import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import useApi from "../../hook/useApi";
import useSweetAlert from "../../hook/useSweetAlert";
import ModalRegistroSeccion from "../../components/ModalRegistroSeccion";
import CustomButton from "../../components/customButton";

export default function GestionTrayecto() {
  // Hooks y estados
  const location = useLocation();
  const { idTrayecto } = location.state;
  const { codigoPNF, valorTrayecto } = useParams();
  const [unidades, setUnidades] = useState([]);
  const [secciones, setSecciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const navigate = useNavigate();
  const axios = useApi();
  const alert = useSweetAlert();

  // Validación del trayecto
  useEffect(() => {
    if (!valorTrayecto) {
      alert.show({
        title: "Trayecto No Seleccionado",
        text: "No se ha seleccionado ningún trayecto. Por favor, regresa a la página anterior y selecciona un trayecto válido.",
        icon: "warning",
      });
    }
  }, [valorTrayecto]);

  // Funciones para obtener datos
  const fetchUnidadesCurriculares = async () => {
    const res = await axios.get(
      `/trayectos/${idTrayecto}/unidades-curriculares`
    );
    setUnidades(res.unidades_curriculares || []);
  };

  const fetchSecciones = async () => {
    const res = await axios.get(`/secciones/${codigoPNF}/${valorTrayecto}`);
    setSecciones(res.secciones || []);
  };

  // Carga inicial de datos
  useEffect(() => {
    const loadData = async () => {
      if (!valorTrayecto) return;

      setLoading(true);
      try {
        await Promise.all([fetchUnidadesCurriculares(), fetchSecciones()]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [valorTrayecto]);

  // Handlers de navegación
  const handleGoToProgramas = () => navigate("/formacion/programas");

  const handleGoToPrograma = () =>
    navigate(`/formacion/programas/${codigoPNF}`);

  // Handlers del modal
  const handleOpenModal = () => setModalOpen(true);

  const handleCloseModal = () => setModalOpen(false);

  const handleSeccionCreada = () => {
    // Recargar las secciones después de crear una nueva
    fetchSecciones();
    handleCloseModal();
  };

  // Componentes reutilizables
  const BreadcrumbNavigation = () => (
    <Breadcrumbs
      aria-label="ruta de navegación"
      separator={<NavigateNextIcon fontSize="small" />}
      sx={{ mb: 3 }}
    >
      <Link
        component="button"
        underline="hover"
        color="inherit"
        onClick={handleGoToProgramas}
      >
        PNFS
      </Link>
      <Link
        component="button"
        underline="hover"
        color="inherit"
        onClick={handleGoToPrograma}
      >
        {codigoPNF}
      </Link>
      <Link component="button" underline="hover" color="inherit" disabled>
        Trayecto {valorTrayecto}
      </Link>
    </Breadcrumbs>
  );

  return (
    <>
      <ResponsiveAppBar backgroundColor />

      <Box sx={{ mt: 18, px: 4, pb: 10 }}>
        <Box sx={{ mt: 5 }}>
          <BreadcrumbNavigation />
        </Box>

        {/* Sección de Secciones */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}
        >
          <Typography
            variant="h5"
            sx={{
              fontWeight: "bold",
              color: "primary.main",
            }}
          >
            Secciones
          </Typography>

          {secciones.length === 0 && (
            <CustomButton
              tipo="primary"
              onClick={handleOpenModal}
              sx={{ minWidth: 200 }}
            >
              + Iniciar Sección
            </CustomButton>
          )}
        </Box>

        {loading ? (
          <Typography color="text.secondary" textAlign="center">
            Cargando...
          </Typography>
        ) : secciones.length > 0 ? (
          <Grid container spacing={3} justifyContent="center">
            {secciones.map((seccion) => (
              <CardSeccion seccion={seccion} />
            ))}
          </Grid>
        ) : (
          <Box sx={{ textAlign: "center", py: 4 }}>
            <Typography
              color="text.secondary"
              fontStyle="italic"
              sx={{ mb: 2 }}
            >
              No existen secciones registradas para este trayecto
            </Typography>
          </Box>
        )}

        {/* Sección de Unidades Curriculares */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}
        >
          <Typography
            variant="h5"
            sx={{
              fontWeight: "bold",
              color: "primary.main",
            }}
          >
            Unidades Curriculares
          </Typography>

          <CustomButton
            tipo="primary"
            onClick={() => {
              navigate("/curricular/unidades/registrar", {
                state: { idTrayecto: idTrayecto },
              });
            }}
            sx={{ minWidth: 200 }}
          >
            + Unidad Curricular
          </CustomButton>

          {secciones.length < 0 && (
            <CustomButton
              tipo="primary"
              onClick={handleOpenModal}
              sx={{ minWidth: 200 }}
            >
              + Iniciar Sección
            </CustomButton>
          )}
        </Box>

        {loading ? (
          <Typography color="text.secondary" textAlign="center">
            Cargando...
          </Typography>
        ) : unidades.length > 0 ? (
          <Grid container spacing={3} justifyContent="center">
            {unidades.map((unidad, index) => (
              <Grid key={unidad.id_unidad_curricular || index}>
                <CardUnidadCurricular uc={unidad} />
              </Grid>
            ))}
          </Grid>
        ) : (
          <Box sx={{ textAlign: "center", py: 4 }}>
            <Typography
              color="text.secondary"
              fontStyle="italic"
              sx={{ mb: 2 }}
            >
              No hay unidades curriculares registradas para este trayecto
            </Typography>
          </Box>
        )}

        {/* Modal de Registro de Sección */}
        <ModalRegistroSeccion
          open={modalOpen}
          handleClose={handleCloseModal}
          idTrayecto={idTrayecto}
          onSeccionCreada={handleSeccionCreada}
        />
      </Box>
    </>
  );
}
