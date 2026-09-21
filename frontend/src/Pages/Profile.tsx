
import {
  Box,
  Typography,
} from "@mui/material";

import {
  useNavigate,
} from "react-router-dom";

import {
  useState,
} from "react";

import "../Styles/Profile.css";
import Navbar from "../Components/Navbar/Navbar";
import { useAuth } from "../context/UseAuth";

const Profile = () => {
  const navigate = useNavigate();

  const {
    user,
    logout,
    updateProfile,
  } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [error, setError] = useState("");

  // --------------------------------
  // NO USER
  // --------------------------------

  if (!user) {
    return null;
  }

  const {
    name,
    email,
    role,
  } = user;

  const userType = role.toLowerCase();

  // --------------------------------
  // EDIT PROFILE
  // --------------------------------

  const handleEdit = () => {
    setNewName(name);
    setError("");
    setIsEditing(true);
  };

  // --------------------------------
  // SAVE PROFILE
  // --------------------------------

  const handleSave = async () => {
    setError("");

    const trimmedName = newName.trim();

    if (!trimmedName) {
      setError("Name cannot be empty");
      return;
    }

    if (trimmedName === name) {
      setIsEditing(false);
      return;
    }

    setLoading(true);

    const result = await updateProfile(trimmedName);

    setLoading(false);

    if (!result.success) {
      setError(result.message);
      return;
    }

    setIsEditing(false);
  };

  // --------------------------------
  // CANCEL EDIT
  // --------------------------------

  const handleCancel = () => {
    setNewName("");
    setError("");
    setIsEditing(false);
  };

  // --------------------------------
  // LOGOUT
  // --------------------------------

  const handleLogout = async () => {
    setError("");
    setLogoutLoading(true);

    try {
      await logout();

      // logout() clears user state even if
      // the backend logout request fails.
      navigate(`/${userType}/login`, {
        replace: true,
      });
    } catch (error) {
      console.error("Logout failed:", error);

      // Normally logout() shouldn't throw because
      // AuthContext handles the error itself.
      // This is just an extra safety net.
      navigate(`/${userType}/login`, {
        replace: true,
      });
    } finally {
      setLogoutLoading(false);
    }
  };

  // --------------------------------
  // UI
  // --------------------------------

  return (
    <Box className="absolute_parent_profile">

      <Navbar />

      <Box className="profile_page">

        <Box className="inner-profile">

          {/* ------------------------- */}
          {/* HEADER */}
          {/* ------------------------- */}

          <Box className="heading">

            <Typography
              variant="h3"
              id="h3"
            >
              Welcome! {name}
            </Typography>

            <Typography
              variant="h5"
              id="h5"
            >
              {email}
            </Typography>

            <Typography variant="h6">
              Role: {role}
            </Typography>

          </Box>

          {/* ------------------------- */}
          {/* NAME */}
          {/* ------------------------- */}

          <Box className="name">

            <Typography
              variant="h5"
              id="h5"
            >
              Full Name
            </Typography>

            {isEditing ? (
              <input
                type="text"
                value={newName}
                onChange={(e) =>
                  setNewName(e.target.value)
                }
                disabled={loading}
              />
            ) : (
              <Typography>
                {name}
              </Typography>
            )}

          </Box>

          {/* ------------------------- */}
          {/* EMAIL */}
          {/* ------------------------- */}

          <Box className="email">

            <Typography
              variant="h5"
              id="h5"
            >
              Email Address
            </Typography>

            {/* Email is NEVER editable */}

            <Typography>
              {email}
            </Typography>

          </Box>

          {/* ------------------------- */}
          {/* ROLE */}
          {/* ------------------------- */}

          <Box className="age">

            <Typography
              variant="h5"
              id="h5"
            >
              Role
            </Typography>

            <Typography>
              {role}
            </Typography>

          </Box>

          {/* ------------------------- */}
          {/* ERROR */}
          {/* ------------------------- */}

          {error && (
            <Typography color="error">
              {error}
            </Typography>
          )}

          {/* ------------------------- */}
          {/* BUTTONS */}
          {/* ------------------------- */}

          <Box className="profile_button">

            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  disabled={
                    loading ||
                    logoutLoading
                  }
                >
                  {loading
                    ? "SAVING..."
                    : "SAVE"}
                </button>

                <button
                  onClick={handleCancel}
                  disabled={
                    loading ||
                    logoutLoading
                  }
                >
                  CANCEL
                </button>
              </>
            ) : (
              <button
                onClick={handleEdit}
                disabled={logoutLoading}
              >
                EDIT
              </button>
            )}

            {/* LOGOUT */}

            <button
              onClick={handleLogout}
              disabled={
                logoutLoading ||
                loading
              }
            >
              {logoutLoading
                ? "LOGGING OUT..."
                : "LOGOUT"}
            </button>

          </Box>

        </Box>

      </Box>

    </Box>
  );
};

export default Profile;
