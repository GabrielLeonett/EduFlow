//Importaciones de los componentes para rutas y navegacion
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

//Importacion del componente que se encargara de permitir la entrada a vistas dependiendo de el rol de usuario
import { AuthProvider } from "./context/AuthContext";

//Importaciones para la creación de Modo oscuro y claro
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { lightTheme, darkTheme } from "./components/ui/theme";

//importaciones de las paginas para su renderizado
// Vistas Públicas
import Inicio from "./pages/Inicio";
import InicioSesion from "./pages/InicioSesion";
import CerrarSesion from "./pages/CerrarSesion";
import TerminosCondiciones from "./pages/TerminosCondiciones";
import PoliticaPrivacidad from "./pages/PoliticaPrivacidad";
import DeclaracionAccesibilidad from "./pages/DeclaracionAccesibilidad";

// Gestión de Personal Académico
import GestionProfesores from "./pages/personal/profesores/GestionProfesores.jsx";
import DisponibilidadProfesor from "./pages/personal/profesores/DisponibilidadProfesor.jsx";
import ProfesoresEliminados from "./pages/personal/profesores/ProfesoresEliminados.jsx";
import RegistrarProfesor from "./pages/personal/profesores/RegistrarProfesor.jsx";

// Gestión de Coordinación
import GestionCoordinadores from "./pages/personal/coordinador/GestionCoordinadores";
import AsignarCoordinador from "./pages/personal/coordinador/AsignarCoordinador";

// Gestión de Administradores
import GestionAdministradores from "./pages/personal/administradores/GestionAdministradores.jsx";
import RegistrarAdministrador from "./pages/personal/administradores/RegistrarAdministrador.jsx";

// Gestión de Programas de Formación
import ProgramasFormacion from "./pages/formacion/ProgramasFormacion";
import RegistrarPrograma from "./pages/formacion/RegistrarPrograma";
import GestionTrayectos from "./pages/formacion/GestionTrayectos";
import GestionTrayecto from "./pages/formacion/GestionTrayecto";
import RegistrarUnidadCurricular from "./pages/formacion/RegistrarUnidadCurricular";

// Gestión de Secciones y Horarios
import GestionHorariosSecciones from "./pages/horarios/GestionHorariosSecciones.jsx";
import GestionHorariosAulas from "./pages/horarios/GestionHorariosAulas.jsx";
import GestionHorariosProfesores from "./pages/horarios/GestionHorariosProfesores.jsx";

// Gestión de Infraestructura
import GestionSedes from "./pages/infraestructura/GestionSedes";
import RegistrarSede from "./pages/infraestructura/RegistrarSede";
import GestionAulas from "./pages/infraestructura/GestionAulas";
import RegistrarAula from "./pages/infraestructura/RegistrarAula";

// Administración del Sistema
import PanelAdministracion from "./pages/administracion/PanelAdministracion";
import PanelRespaldos from "./pages/administracion/PanelRespaldos.jsx";
import ReportesEstadisticas from "./pages/administracion/ReportesEstadisticas.jsx";
import AuditoriaPage from "./pages/administracion/AuditoriaSistema.jsx";

// Desarrollo y Pruebas
import PaginaPruebas from "./pages/desarrollo/PaginaPruebas";
import PaginaReportes from "./pages/desarrollo/PaginaReportes";

//Importacion para la pagina 404 o notFound
import PaginaNoEncontrada from "./pages/PaginaNoEncontrada";

//Importacion de useState
import { useState } from "react";

//Importacion de los estilos CSS
import "./App.css";

//Importacion para el Boton que cambia entre los temas claros y oscuros
import BotonCambiarTema from "./components/BotonCambiarTema";

//Imporatacion de Componente que Protege las vistas
import ProtectedViews from "./security/ProtectedViews";

import MiPerfil from "./pages/MiPerfil";
import CambiarContraseña from "./pages/cambiarContraseña";
import EditarAula from "./pages/EditarAula";
import RecuperarContraseña from "./pages/RecuperarContraseña.jsx";
import CoordinadoresDestituidos from "./pages/personal/coordinador/CoordinadoresDestituidosView.jsx";

// Roles comunes para reutilización
const ROLES = {
  TODOS_AUTENTICADOS: [
    "Vicerrector",
    "Profesor",
    "Coordinador",
    "Director General de Gestión Curricular",
    "SuperAdmin",
  ],
  ADMINISTRADORES: [
    "Vicerrector",
    "Director General de Gestión Curricular",
    "SuperAdmin",
  ],
  COORDINADORES: [
    "Vicerrector",
    "Coordinador",
    "Director General de Gestión Curricular",
    "SuperAdmin",
  ],
  PERSONAL_ACADEMICO: [
    "Vicerrector",
    "Profesor",
    "Coordinador",
    "Director General de Gestión Curricular",
    "SuperAdmin",
  ],
};

export default function App() {
  const [darkMode, setDarkMode] = useState(true);

  return (
    <ThemeProvider theme={darkMode ? darkTheme : lightTheme}>
      <CssBaseline>
        <Router>
          <AuthProvider>
            <Routes>
              {/* === VISTAS PÚBLICAS === */}
              <Route path="/" element={<Inicio />} />
              <Route path="/iniciar-sesion" element={<InicioSesion />} />
              <Route path="/cerrar-sesion" element={<CerrarSesion />} />
              <Route
                path="/terminos-condiciones"
                element={<TerminosCondiciones />}
              />
              <Route
                path="/politica-privacidad"
                element={<PoliticaPrivacidad />}
              />
              <Route
                path="/accesibilidad"
                element={<DeclaracionAccesibilidad />}
              />
              {/* === GESTIÓN DE PERSONAL ACADÉMICO === */}
              <Route
                path="/academico/profesores/:id_profesor?"
                element={
                  <ProtectedViews allowedRoles={ROLES.TODOS_AUTENTICADOS}>
                    <GestionProfesores />
                  </ProtectedViews>
                }
              />
              <Route
                path="/academico/profesores/registrar"
                element={
                  <ProtectedViews allowedRoles={ROLES.ADMINISTRADORES}>
                    <RegistrarProfesor />
                  </ProtectedViews>
                }
              />
              <Route
                path="/academico/profesores/disponibilidad/:id_profesor"
                element={
                  <ProtectedViews allowedRoles={ROLES.PERSONAL_ACADEMICO}>
                    <DisponibilidadProfesor />
                  </ProtectedViews>
                }
              />
              <Route
                path="/academico/profesores/eliminados"
                element={
                  <ProtectedViews allowedRoles={ROLES.ADMINISTRADORES}>
                    <ProfesoresEliminados />
                  </ProtectedViews>
                }
              />
              {/* === GESTIÓN DE COORDINACIÓN === */}
              <Route
                path="/coordinacion/coordinadores"
                element={
                  <ProtectedViews allowedRoles={ROLES.TODOS_AUTENTICADOS}>
                    <GestionCoordinadores />
                  </ProtectedViews>
                }
              />
              <Route
                path="/coordinacion/coordinadores/asignar"
                element={
                  <ProtectedViews allowedRoles={ROLES.ADMINISTRADORES}>
                    <AsignarCoordinador />
                  </ProtectedViews>
                }
              />
              {/* === PROGRAMAS NACIONALES DE FORMACIÓN === */}
              <Route
                path="/formacion/programas"
                element={
                  <ProtectedViews allowedRoles={ROLES.TODOS_AUTENTICADOS}>
                    <ProgramasFormacion />
                  </ProtectedViews>
                }
              />
              <Route
                path="/formacion/programas/registrar"
                element={
                  <ProtectedViews allowedRoles={ROLES.ADMINISTRADORES}>
                    <RegistrarPrograma />
                  </ProtectedViews>
                }
              />
              <Route
                path="/formacion/programas/:codigo"
                element={
                  <ProtectedViews allowedRoles={ROLES.TODOS_AUTENTICADOS}>
                    <GestionTrayectos />
                  </ProtectedViews>
                }
              />
              <Route
                path="/formacion/programas/:codigoPNF/trayecto/:valorTrayecto"
                element={
                  <ProtectedViews allowedRoles={ROLES.TODOS_AUTENTICADOS}>
                    <GestionTrayecto />
                  </ProtectedViews>
                }
              />
              {/* === GESTIÓN CURRICULAR === */}
              <Route
                path="/curricular/unidades/registrar"
                element={
                  <ProtectedViews allowedRoles={ROLES.TODOS_AUTENTICADOS}>
                    <RegistrarUnidadCurricular />
                  </ProtectedViews>
                }
              />
              <Route
                path="/horarios/secciones"
                element={
                  <ProtectedViews allowedRoles={ROLES.TODOS_AUTENTICADOS}>
                    <GestionHorariosSecciones />
                  </ProtectedViews>
                }
              />
              <Route
                path="/horarios/aulas/:id_aula"
                element={
                  <ProtectedViews allowedRoles={ROLES.TODOS_AUTENTICADOS}>
                    <GestionHorariosAulas />
                  </ProtectedViews>
                }
              />
              <Route
                path="/horarios/profesores/:id_profesor"
                element={
                  <ProtectedViews allowedRoles={ROLES.TODOS_AUTENTICADOS}>
                    <GestionHorariosProfesores />
                  </ProtectedViews>
                }
              />
              {/* === GESTIÓN DE INFRAESTRUCTURA === */}
              <Route
                path="/infraestructura/sedes"
                element={
                  <ProtectedViews allowedRoles={ROLES.TODOS_AUTENTICADOS}>
                    <GestionSedes />
                  </ProtectedViews>
                }
              />
              <Route
                path="/infraestructura/sedes/registrar"
                element={
                  <ProtectedViews allowedRoles={ROLES.TODOS_AUTENTICADOS}>
                    <RegistrarSede />
                  </ProtectedViews>
                }
              />
              <Route
                path="/infraestructura/sedes/:id_sede/aulas"
                element={
                  <ProtectedViews allowedRoles={ROLES.TODOS_AUTENTICADOS}>
                    <GestionAulas />
                  </ProtectedViews>
                }
              />
              <Route
                path="/infraestructura/aulas/registrar"
                element={
                  <ProtectedViews allowedRoles={ROLES.TODOS_AUTENTICADOS}>
                    <RegistrarAula />
                  </ProtectedViews>
                }
              />
              {/* === ADMINISTRACIÓN DEL SISTEMA === */}
              <Route
                path="/administracion"
                element={
                  <ProtectedViews allowedRoles={ROLES.ADMINISTRADORES}>
                    <PanelAdministracion />
                  </ProtectedViews>
                }
              />
              {/* === RUTAS DE DESARROLLO === */}
              <Route path="/desarrollo/pruebas" element={<PaginaPruebas />} />
              {/* === RUTAS DE DESARROLLO === */}
              <Route path="/desarrollo/reportes" element={<PaginaReportes />} />
              {/* === RUTA PARA PÁGINA NO ENCONTRADA === */}
              <Route path="*" element={<PaginaNoEncontrada />} />
              <Route
                path="/perfil"
                element={
                  <ProtectedViews allowedRoles={ROLES.TODOS_AUTENTICADOS}>
                    <MiPerfil />
                  </ProtectedViews>
                }
              />
              <Route
                path="/cambiar-contraseña"
                element={
                  <ProtectedViews allowedRoles={ROLES.TODOS_AUTENTICADOS}>
                    <CambiarContraseña />
                  </ProtectedViews>
                }
              />
              <Route path="/aulas/editar/:id" element={<EditarAula />} />
              <Route
                path="/administracion/respaldos"
                element={
                  <ProtectedViews allowedRoles={ROLES.TODOS_AUTENTICADOS}>
                    <PanelRespaldos />
                  </ProtectedViews>
                }
              />
              <Route
                path="/administracion/reportes-estadisticas"
                element={
                  <ProtectedViews allowedRoles={ROLES.TODOS_AUTENTICADOS}>
                    <ReportesEstadisticas />
                  </ProtectedViews>
                }
              />
              <Route
                path="/administradores"
                element={
                  <ProtectedViews allowedRoles={ROLES.TODOS_AUTENTICADOS}>
                    <GestionAdministradores />
                  </ProtectedViews>
                }
              />
              <Route
                path="/auditoria"
                element={
                  <ProtectedViews allowedRoles={ROLES.TODOS_AUTENTICADOS}>
                    <AuditoriaPage />
                  </ProtectedViews>
                }
              />
              <Route
                path="/administradores/crear"
                element={
                  <ProtectedViews allowedRoles={ROLES.TODOS_AUTENTICADOS}>
                    <RegistrarAdministrador />
                  </ProtectedViews>
                }
              />
              <Route
                path="/recuperar-contrasena"
                element={<RecuperarContraseña />}
              />
              <Route
                path="/personal/coordinadores/destituidos"
                element={
                  <ProtectedViews allowedRoles={ROLES.TODOS_AUTENTICADOS}>
                    <CoordinadoresDestituidos />
                  </ProtectedViews>
                }
              />
              CoordinadoresDestituidos
            </Routes>
          </AuthProvider>
        </Router>
        <BotonCambiarTema setMode={setDarkMode} mode={darkMode} />
      </CssBaseline>
    </ThemeProvider>
  );
}
