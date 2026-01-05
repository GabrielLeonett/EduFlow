import { createContext, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import useApi from "../hook/useApi.jsx";
import useSweetAlert from "../hook/useSweetAlert";
import useWebSocket from "../hook/useWebSocket.jsx";
import LoadingCharge from "../components/ui/LoadingCharge.jsx";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const alert = useSweetAlert();
  const axios = useApi(true);
  const { connect, on, off, emit, isConnected } = useWebSocket(); // ✅ Agregar emit

  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const navigate = useNavigate();

  const login = useCallback(
    async (userData) => {
      try {
        setIsLoggingIn(true);

        const { user } = await axios.post("/auth/login", userData);
        console.log("✅ Login exitoso:", user);

        if (user) {
          setUser(user);
          setIsAuthenticated(true);

          setTimeout(() => {
            setIsLoggingIn(false);
          }, 1000);

          if (user.primera_vez) {
            navigate("/cambiar-contraseña");
          } else {
            navigate("/");
          }
        } else {
          throw new Error("Respuesta del servidor incompleta");
        }
      } catch (error) {
        console.error("❌ Error en login:", error);
        setUser(null);
        setIsAuthenticated(false);
        setIsLoggingIn(false);

        if (error.error?.totalErrors > 0) {
          error.error.validationErrors.forEach((error_validacion) => {
            alert.toast(error_validacion.field, error_validacion.message);
          });
        } else {
          alert.error(error.title, error.message);
        }
      }
    },
    [navigate, alert, axios]
  );

  const logout = useCallback(async () => {
    try {
      console.log("🚪 Cerrando sesión...");
      await axios.get("/auth/logout");
      console.log("✅ Cierre de sesión exitoso");

      setUser(null);
      setIsAuthenticated(false);
      navigate("/cerrar-sesion");
    } catch (error) {
      console.error("❌ Error al cerrar sesión:", error);
      setUser(null);
      setIsAuthenticated(false);
      navigate("/cerrar-sesion");
    }
  }, [navigate, axios]);

  const verifyAuth = useCallback(async () => {
    setIsLoading(true);
    try {
      const verifiedData = await axios.get("/auth/verify");
      if (verifiedData) {
        console.log("✅ Usuario verificado:", verifiedData);
        setUser(verifiedData);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error("❌ Error verificando autenticación:", error);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, [axios]);

  const checkUserAccess = useCallback(
    (requiredRoles) => {
      if (!isAuthenticated || !user?.roles) return false;
      return user.roles.some((role) => requiredRoles.includes(role));
    },
    [user, isAuthenticated]
  );

  useEffect(() => {
    if (!user) return;

    console.log("🔄 Configurando WebSocket para usuario:", user.nombres);

    // Handler para ambos eventos
    const handleSessionClose = (data) => {
      console.log("📡 Evento de cierre de sesión recibido:", data);

      const message =
        data?.reason === "usuario_desactivado"
          ? "Tu cuenta ha sido desactivada por un administrador"
          : "Sesión cerrada por seguridad";

      alert.error("Sesión finalizada", message);
      logout();
    };

    // ✅ REGISTRAR AMBOS EVENTOS
    on("close_sesion", handleSessionClose);
    on("force_logout", handleSessionClose);

    // Conectar WebSocket si no está conectado
    if (!isConnected()) {
      console.log("🔌 Conectando WebSocket...");
      connect(user.id, user.roles);
    } else {
      console.log("🎯 WebSocket ya conectado - Uniéndose a salas...");
      emit("join_user_room", {
        userId: user.id,
        roles: user.roles,
      });
    }

    // ✅ Cleanup de ambos eventos
    return () => {
      console.log("🧹 Limpiando WebSocket auth");
      off("close_sesion", handleSessionClose);
      off("force_logout", handleSessionClose);
    };
  }, [user, connect, on, off, emit, isConnected, logout, alert]);

  // Verificar autenticación al cargar
  useEffect(() => {
    verifyAuth();
  }, [verifyAuth]);

  // Si está cargando la verificación inicial, mostrar LoadingCharge
  if (isLoading) {
    return <LoadingCharge charge={true} text="Verificando autenticación..." />;
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated,
        isLoading,
        isLoggingIn,
        checkUserAccess,
      }}
    >
      {/* Mostrar LoadingCharge global durante el login */}
      {isLoggingIn && (
        <LoadingCharge charge={true} text="Iniciando sesión..." />
      )}

      {/* Renderizar children solo cuando no esté haciendo login */}
      {!isLoggingIn && children}
    </AuthContext.Provider>
  );
}
