
import { Link, useLocation } from "react-router-dom";

import "../Styles/Error.css";

import {
  Box,
  Typography,
} from "@mui/material";

import { useAuth } from "../context/UseAuth";

const Error = () => {
  const { user } = useAuth();
  const location = useLocation();

  let backPath = "/User/Login";

  if (user) {
    // Logged-in user
    backPath =
      user.role === "ADMIN"
        ? "/admin/profile"
        : "/user/Profile";
  } else {
    // Guest — determine from the URL they tried to access
    if (location.pathname.startsWith("/admin")) {
      backPath = "/admin/login";
    } else if (location.pathname.startsWith("/user")) {
      backPath = "/User/Login";
    }
  }

  return (
    <Box className="error">
      <Box className="error_inner">

        <Typography variant="h3">
          ERROR 404, PAGE NOT FOUND
        </Typography>

        <Typography variant="h4">
          This page is Not Found
        </Typography>

        <Link to={backPath}>
          {user ? "BACK TO PROFILE" : "BACK TO LOGIN"}
        </Link>

      </Box>
    </Box>
  );
};

export default Error;
