import {
  Link,
  useNavigate,
} from "react-router-dom";

import {
  Box,
  Button,
  Typography,
} from "@mui/material";

import "../../Styles/Navbar.css";
import { useAuth } from "../../context/UseAuth";
import { useState } from "react";

const Navbar = () => {
  const navigate = useNavigate();
  const [loading , setLoading] = useState(false);
  const {
    user,
    logout,
  } = useAuth();

  const userType = user?.role.toLowerCase();

  // --------------------------------
  // LOGOUT
  // --------------------------------

  const handleLogout = async () => {
    if (!userType) {
      return;
    }

    try {

      setLoading(true)
      await logout();
      setLoading(false)

      navigate(`/${userType}/login`, {
        replace: true,
      });
    } catch (error) {
      console.error("Logout failed:", error);

      // Even if something unexpected happens,
      // send the user to login.
      navigate(`/${userType}/login`, {
        replace: true,
      });
    }
  };

  // --------------------------------
  // NO USER
  // --------------------------------

  if (!user) {
    return null;
  }

  // --------------------------------
  // UI
  // --------------------------------

  return (
    <Box className="absolute_parent">

      <Box className="parent_Navbar">

        <Typography variant="h5">
          Management System
        </Typography>

        {/* ADMIN DASHBOARD */}

        {user.role === "ADMIN" && (
          <Link to="/admin/dashboard">
            Dashboard
          </Link>
        )}

        {/* PROFILE */}

        <Link
          to={`/${userType}/profile`}
        >
          Profile
        </Link>

        {/* CHANGE PASSWORD */}

        <Link
          to={`/${userType}/change-password`}
        >
          Change Password
        </Link>

        {/* LOGOUT */}

        <Button
          onClick={handleLogout}
        >
          {loading == true ? "Logging out ...": " Logout"}
        </Button>

      </Box>

    </Box>
  );
};

export default Navbar;