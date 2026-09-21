import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./context/UseAuth";
import LoadingPage from "./Pages/LoadingPage";

interface ProtectedRouteProps {
  allowedRole?: "USER" | "ADMIN";
}

const ProtectedRoute = ({
  allowedRole,
}: ProtectedRouteProps) => {
  const { user, loading } = useAuth();

  // Wait until AuthContext finishes checking authentication
  if (loading) {
    return <LoadingPage />;
  }

  // No logged-in user
  if (!user) {
    return <Navigate to={`/${allowedRole?.toLowerCase()}/Login`} replace />;
  }

  // User is logged in but doesn't have permission
  if (allowedRole && user.role !== allowedRole) {
    if (user.role === "ADMIN") {
      return <Navigate to="/admin/dashboard" replace />;
    }

    return <Navigate to="/user/profile" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;