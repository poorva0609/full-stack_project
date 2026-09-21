import { Routes, Route } from "react-router-dom";

import UserLogin from "./Pages/UserLogin";
import Dashboard from "./Pages/Dashboard";
import Profile from "./Pages/Profile";
import UserForm from "./Pages/UserRegister";
import Error from "./Pages/Error";

import { Box } from "@mui/material";

import AdminRegisterForm from "./Pages/AdminRegister";
import AdminLogin from "./Pages/AdminLogin";
import PublicRoute from "./PublicRoutes";
import ProtectedRoute from "./ProtectedRoute";
import ForgotPass from "./Pages/ChangePass";
import ChangePass from "./Pages/ChangePass";
import Home from "./Pages/Home";
 

const AppRoutes = () => {
  return (
    <Box>
      <Routes>
        <Route path="/" element={<Home />} />
        {/* ================= PUBLIC ROUTES ================= */}

        <Route element={<PublicRoute />}>
          <Route
            path="/User/Login"
            element={<UserLogin />}
          />

          <Route
            path="/User/Register"
            element={<UserForm />}
          />

          <Route
            path="/Admin/Login"
            element={<AdminLogin />}
          />

          <Route
            path="/Admin/Register"
            element={<AdminRegisterForm />}
          />
        </Route>


        {/* ================= USER ROUTES ================= */}

        <Route element={<ProtectedRoute allowedRole="USER" />}>

          <Route
            path="/User/Profile"
            element={<Profile />}
          />
           <Route path="/User/change-password" element={<ChangePass />} />

        </Route>

        {/* ================= ADMIN ROUTES ================= */}

        <Route element={<ProtectedRoute allowedRole="ADMIN" />}>

          <Route
            path="/Admin/Dashboard"
            element={<Dashboard />}
          />
        <Route
            path="/Admin/Profile"
            element={<Profile />}
          />
           <Route path="/admin/change-password" element={<ChangePass />} />
        </Route>


        {/* ================= OTHER ROUTES ================= */}

        <Route
          path="/ForgotPass"
          element={<ForgotPass />}
        />

        <Route
          path="*"
          element={<Error />}
        />

      </Routes>
    </Box>
  );
};

export default AppRoutes;