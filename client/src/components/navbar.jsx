import FacebookIcon from "@mui/icons-material/Facebook";
import MenuIcon from "@mui/icons-material/Menu";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import LogoSimple from "./ui/logoSimple";
import LogoTexto from "./ui/logoTexto";
import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";
import { useTheme } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hook/useAuth";
import Notification from "./Notification/index";
import { useEffect, useState } from "react";

function ResponsiveAppBar({ backgroundColor }) {
  const theme = useTheme();
  const [userRoles, setUserRoles] = useState(["publico"]);
  const navigate = useNavigate();
  const [anchorElUser, setAnchorElUser] = useState(null);
  const { user, isAuthenticated, logout } = useAuth();
  const [anchorElNav, setAnchorElNav] = useState(null);
  const [anchorElSubmenu, setAnchorElSubmenu] = useState({});
  const [menuKey, setMenuKey] = useState(0); // Clave para forzar re-render

  const handleOpenNavMenu = (event) => {
    setAnchorElNav(event.currentTarget);
  };

  useEffect(() => {
    if (user && user.roles) {
      setUserRoles(user.roles);
    } else {
      setUserRoles(["publico"]);
    }
    // Forzar re-render del menú cuando cambia la autenticación
    setMenuKey((prev) => prev + 1);
  }, [user, isAuthenticated]);

  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };

  const handleOpenSubmenu = (event, menuName) => {
    setAnchorElSubmenu({ ...anchorElSubmenu, [menuName]: event.currentTarget });
  };

  const handleCloseSubmenu = (menuName) => {
    setAnchorElSubmenu({ ...anchorElSubmenu, [menuName]: null });
  };

  const handleRedirect = (url) => {
    window.open(url, "_blank");
  };

  const handleNavigation = (url) => {
    navigate(url);
    handleCloseNavMenu();
    setAnchorElSubmenu({});
    handleCloseUserMenu();
  };

  // Verificar si el usuario tiene acceso a una página/subpágina
  const hasAccess = (requiredRoles) => {
    if (!userRoles || userRoles.length === 0) return false;
    return requiredRoles.some((role) => userRoles.includes(role));
  };

  const handleOpenUserMenu = (event) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleLogout = () => {
    logout();
    setUserRoles(["publico"]);
    setMenuKey((prev) => prev + 1);
    handleCloseUserMenu();
    navigate("/");
  };

  // Menú reorganizado en tres columnas principales
  const pages = [
    {
      name: "Inicio",
      url: "/",
      roles: [
        "publico",
        "Vicerrector",
        "Profesor",
        "Coordinador",
        "Director General de Gestión Curricular",
        "SuperAdmin",
      ],
    },
    {
      name: "Núcleos",
      url: "/infraestructura/sedes",
      roles: [
        "Vicerrector",
        "Coordinador",
        "Director General de Gestión Curricular",
        "SuperAdmin",
      ],
    },
    {
      name: "Personal",
      roles: [
        "Vicerrector",
        "Profesor",
        "Coordinador",
        "Director General de Gestión Curricular",
        "SuperAdmin",
      ],
      submenu: [
        {
          name: "Gestión de Profesores",
          url: "/academico/profesores",
          roles: [
            "Vicerrector",
            "Profesor",
            "Coordinador",
            "Director General de Gestión Curricular",
            "SuperAdmin",
          ],
        },
        {
          name: "Control de Estatus Docente",
          url: "/academico/profesores/eliminados",
          roles: [
            "Vicerrector",
            "Profesor",
            "Coordinador",
            "Director General de Gestión Curricular",
            "SuperAdmin",
          ],
        },
        {
          name: "Gestión de Coordinadores",
          url: "/coordinacion/coordinadores",
          roles: [
            "Vicerrector",
            "Coordinador",
            "Director General de Gestión Curricular",
            "SuperAdmin",
          ],
        },
        {
          name: "Gestión de Usuarios",
          url: "/administradores",
          roles: ["Vicerrector", "SuperAdmin"],
        },
      ],
    },
    {
      name: "Programas Nacional de Formación",
      url: "/formacion/programas",
      roles: [
        "Vicerrector",
        "Profesor",
        "Coordinador",
        "Director General de Gestión Curricular",
        "SuperAdmin",
      ],
    },
    {
      name: "Planificación de Horarios Académicos",
      url: "/horarios/secciones",
      roles: [
        "Vicerrector",
        "Profesor",
        "Coordinador",
        "Director General de Gestión Curricular",
        "SuperAdmin",
      ],
    },
    {
      name: "Administración",
      roles: ["SuperAdmin"],
      submenu: [
        {
          name: "Panel de Administración",
          url: "/administracion",
          roles: ["SuperAdmin"],
        },
        {
          name: "Panel de Respaldos",
          url: "/administracion/respaldos", // Esta ruta no existe en tus Route, puedes agregarla o removerla
          roles: ["SuperAdmin"],
        },
        {
          name: "Reportes y Estadísticas",
          url: "/administracion/reportes-estadisticas", // Esta ruta no existe en tus Route, puedes agregarla o removerla
          roles: ["SuperAdmin"],
        },
      ],
    },
  ];

  // Filtrar páginas según los roles del usuario - se recalcula en cada render
  const filteredPages = pages.filter(
    (page) =>
      hasAccess(page.roles) ||
      (page.submenu && page.submenu.some((subItem) => hasAccess(subItem.roles)))
  );

  return (
    <AppBar
      key={menuKey} // Forzar re-render cuando cambie esta clave
      position="fixed"
      color={backgroundColor ? "primary" : "transparent"}
      enableColorOnDark
      elevation={backgroundColor ? 4 : 0}
    >
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          {/* LogoTexto: Visible en pantallas grandes (md y arriba) */}
          <Box
            sx={{
              display: { xs: "none", md: "flex" },
              alignItems: "center",
              height: "100px",
              cursor: "pointer",
            }}
            onClick={() => navigate("/")}
          >
            <LogoTexto />
          </Box>

          {/* LogoSimple: Visible en pantallas pequeñas y medianas (xs, sm) */}
          <Box
            sx={{
              display: { xs: "flex", md: "none" },
              alignItems: "center",
              height: "100px",
              cursor: "pointer",
            }}
            onClick={() => navigate("/")}
          >
            <LogoSimple />
          </Box>

          {/* Menú para pantallas pequeñas */}
          <Box
            sx={{
              flexGrow: 1,
              display: { xs: "flex", md: "none" },
              fontFamily: "Poppins",
            }}
          >
            <IconButton
              size="large"
              aria-label="menu principal"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleOpenNavMenu}
              sx={{ color: theme.palette.primary.contrastText }}
            >
              <MenuIcon />
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorElNav}
              anchorOrigin={{
                vertical: "bottom",
                horizontal: "left",
              }}
              keepMounted
              transformOrigin={{
                vertical: "top",
                horizontal: "left",
              }}
              open={Boolean(anchorElNav)}
              onClose={handleCloseNavMenu}
              sx={{ display: { xs: "block", md: "none" } }}
            >
              {filteredPages.map((page) => (
                <div key={page.name}>
                  {page.submenu ? (
                    <div>
                      <MenuItem
                        onClick={(e) => handleOpenSubmenu(e, page.name)}
                        aria-haspopup="true"
                        aria-controls={`${page.name}-menu`}
                      >
                        <Typography textAlign="center">{page.name}</Typography>
                      </MenuItem>
                      <Menu
                        id={`${page.name}-menu`}
                        anchorEl={anchorElSubmenu[page.name]}
                        open={Boolean(anchorElSubmenu[page.name])}
                        onClose={() => handleCloseSubmenu(page.name)}
                        MenuListProps={{
                          "aria-labelledby": `${page.name}-button`,
                        }}
                      >
                        {page.submenu
                          .filter((subItem) => hasAccess(subItem.roles))
                          .map((subItem) => (
                            <MenuItem
                              key={subItem.name}
                              onClick={() => handleNavigation(subItem.url)}
                            >
                              <Typography textAlign="center">
                                {subItem.name}
                              </Typography>
                            </MenuItem>
                          ))}
                      </Menu>
                    </div>
                  ) : (
                    <MenuItem onClick={() => handleNavigation(page.url)}>
                      <Typography textAlign="center">{page.name}</Typography>
                    </MenuItem>
                  )}
                </div>
              ))}
            </Menu>
          </Box>

          {/* Menú para pantallas grandes */}
          <Box
            sx={{
              flexGrow: 1,
              display: { xs: "none", md: "flex" },
              justifyContent: "start",
              alignItems: "center",
            }}
          >
            {filteredPages.map((page) => (
              <div key={page.name}>
                {page.submenu ? (
                  <div>
                    <Button
                      id={`${page.name}-button`}
                      aria-haspopup="true"
                      onClick={(e) => handleOpenSubmenu(e, page.name)}
                      sx={{
                        my: 2,
                        color: "white",
                        display: "block",
                        mx: 0.5,
                        fontSize: "0.9rem",
                        padding: "6px 12px",
                      }}
                    >
                      {page.name}
                    </Button>
                    <Menu
                      id={`${page.name}-menu`}
                      anchorEl={anchorElSubmenu[page.name]}
                      open={Boolean(anchorElSubmenu[page.name])}
                      onClose={() => handleCloseSubmenu(page.name)}
                      MenuListProps={{
                        "aria-labelledby": `${page.name}-button`,
                      }}
                      PaperProps={{
                        sx: {
                          minWidth: 200,
                        },
                      }}
                    >
                      {page.submenu
                        .filter((subItem) => hasAccess(subItem.roles))
                        .map((subItem) => (
                          <MenuItem
                            key={subItem.name}
                            onClick={() => handleNavigation(subItem.url)}
                            sx={{ fontSize: "0.9rem" }}
                          >
                            <Typography textAlign="center">
                              {subItem.name}
                            </Typography>
                          </MenuItem>
                        ))}
                    </Menu>
                  </div>
                ) : (
                  <Button
                    onClick={() => handleNavigation(page.url)}
                    sx={{
                      my: 2,
                      color: "white",
                      display: "block",
                      mx: 1,
                      fontSize: "0.9rem",
                      padding: "6px 12px",
                    }}
                  >
                    {page.name}
                  </Button>
                )}
              </div>
            ))}
          </Box>

          {/* Iconos de Facebook y cuenta */}
          <Box sx={{ flexGrow: 0, display: "flex", alignItems: "center" }}>
            <IconButton
              onClick={() => handleRedirect("https://www.facebook.com")}
              sx={{ color: theme.palette.primary.contrastText }}
              aria-label="Facebook"
            >
              <FacebookIcon sx={{ color: "inherit" }} />
            </IconButton>

            {isAuthenticated && user && (
              <Notification userRoles={user.roles} userID={user.id} />
            )}

            <IconButton
              sx={{ color: "white" }}
              onClick={handleOpenUserMenu}
              aria-label="cuenta de usuario"
              aria-controls="user-menu"
              aria-haspopup="true"
            >
              <AccountCircleOutlinedIcon />
            </IconButton>
            <Menu
              id="user-menu"
              anchorEl={anchorElUser}
              open={Boolean(anchorElUser)}
              onClose={handleCloseUserMenu}
              slotProps={{
                paper: {
                  elevation: 0,
                  sx: {
                    overflow: "visible",
                    filter: "drop-shadow(0px 2px 8px rgba(0,0,0,0.32))",
                    mt: 1.5,
                    "& .MuiAvatar-root": {
                      width: 32,
                      height: 32,
                      ml: -0.5,
                      mr: 1,
                    },
                    "&::before": {
                      content: '""',
                      display: "block",
                      position: "absolute",
                      top: 0,
                      right: 14,
                      width: 10,
                      height: 10,
                      bgcolor: "background.paper",
                      transform: "translateY(-50%) rotate(45deg)",
                      zIndex: 0,
                    },
                  },
                },
              }}
              transformOrigin={{ horizontal: "right", vertical: "top" }}
              anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
            >
              {!isAuthenticated ? (
                <MenuItem onClick={() => handleNavigation("/iniciar-sesion")}>
                  Iniciar sesión
                </MenuItem>
              ) : (
                [
                  <MenuItem
                    key="mi-cuenta"
                    onClick={() => {
                      navigate("/perfil");
                    }}
                  >
                    Mi cuenta
                  </MenuItem>,
                  <MenuItem key="cerrar-sesion" onClick={handleLogout}>
                    Cerrar sesión
                  </MenuItem>,
                ]
              )}
            </Menu>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}

export default ResponsiveAppBar;
