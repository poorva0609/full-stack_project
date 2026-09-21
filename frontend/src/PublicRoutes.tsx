import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./context/UseAuth";
import LoadingPage from "./Pages/LoadingPage";

const PublicRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingPage />;
  }

  if (user) {
    if (user.role === "ADMIN") {
      return <Navigate to="/admin/profile" replace />;
    }

    return <Navigate to="/user/profile" replace />;
  }

  return <Outlet />;
};

export default PublicRoute;