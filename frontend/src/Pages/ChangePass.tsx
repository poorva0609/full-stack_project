
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

import "../Styles/ChangePass.css";

import {
  Box,
  TextField,
  Typography,
} from "@mui/material";

import { useAuth } from "../context/UseAuth";

const ChangePass = () => {
  const navigate = useNavigate();
  const { user , changePassword } = useAuth();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);

    const result = await changePassword(password);

    setLoading(false);

    if (!result.success) {
      setError(result.message);
      return;
    }

    alert("Password changed successfully");

    navigate(`/${user?.role.toLowerCase()}/login`);
  };

  return (
    <Box
      className="parent"
      component="form"
      onSubmit={handleSubmit}
    >
      <Box className="child">

        <Typography variant="h5">
          Change Password
        </Typography>

        <Typography variant="h6">
          Enter your new password
        </Typography>

        <TextField
          label="New Password"
          type="password"
          fullWidth
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <TextField
          label="Confirm Password"
          type="password"
          fullWidth
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />

        {error && (
          <Typography color="error">
            {error}
          </Typography>
        )}

        <button
          className="pass_BUtton"
          type="submit"
          disabled={loading}
        >
          {loading ? "Changing..." : "Change Password"}
        </button>

        <pre>
          <Link to={`/${user?.role.toLowerCase()}/Profile`}>
            BACK TO PROFILE
          </Link>
        </pre>

      </Box>
    </Box>
  );
};

export default ChangePass;

