// ProtectedViews.js
import LoadingCharge from "../components/ui/LoadingCharge";
import { Navigate } from "react-router-dom";
import { useAuth } from "../hook/useAuth";

const ProtectedViews = ({ children, allowedRoles }) => {
  const { isAuthenticated, isLoading, checkUserAccess } = useAuth();

  if (isLoading) {
    return (
      <LoadingCharge charge={isLoading} />
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/iniciar-sesion" replace />;
  }

  if (!checkUserAccess(allowedRoles)) {
    return <Navigate to="/no-autorizado" replace />;
  }

  return children;
};

export default ProtectedViews;
