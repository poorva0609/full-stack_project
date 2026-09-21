import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import "../Styles/Login.css";

import {
  Box,
  TextField,
  Button,
  Typography,
} from "@mui/material";

import { useAuth } from "../context/UseAuth";

const AdminLoginForm = () => {
  const navigate = useNavigate();

  // Get login function from AuthContext
  const {user ,  login } = useAuth();
  console.log(user)

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  // Added
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    // Clear previous error
    setError("");

    try {
      setLoading(true);

      // Call AuthContext login
      const result = await login(
        formData.email,
        formData.password
      );

      // Login failed
      if (!result.success) {
        setError(result.message);
        return;
      }

      // Login successful
      navigate("/admin/Profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      className="parent"
      component="form"
      onSubmit={handleSubmit}
    >
      <Box className="inner-parent">

        <Box className="child1">

          <Typography variant="h5">
            Login
          </Typography>

          <TextField
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            fullWidth
            required
          />

          <TextField
            label="Password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            fullWidth
            required
          />

          {/* Backend error */}
          {error && (
            <Typography color="error">
              {error}
            </Typography>
          )}

          <Button
            type="submit"
            fullWidth
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </Button>

          <pre>
            Don't have an Account?{" "}
            <Link to="/Admin/Register">
              Register
            </Link>
          </pre>

        </Box>

        <Box className="child2">

          <Typography variant="h2">
             Management System
          </Typography>

          <Typography variant="h6">
            Welcome back! Please login to your account
          </Typography>

          <img
            src="https://media.istockphoto.com/id/1164538944/vector/woman-with-laptop-studying-or-working-concept-table-with-books-lamp-coffee-cup-vector.jpg?s=612x612&w=0&k=20&c=VhUj_AZoUnilUKdRessjsK6JQUjXCfum7RQyuzOr6_0="
            className="login-image"
          />

        </Box>

      </Box>
    </Box>
  );
};

export default AdminLoginForm;