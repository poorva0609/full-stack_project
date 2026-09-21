import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import "../Styles/Register.css";

import {
  Box,
  TextField,
  Button,
  Typography,
} from "@mui/material";

import { useAuth } from "../context/UseAuth";

const AdminRegisterForm = () => {
  const navigate = useNavigate();

  // Added: get register function from AuthContext
  const { register } = useAuth();

  // Added: loading and backend error state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmpassword: "",
    role: "ADMIN"
  });

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

    // Clear previous backend error
    setError("");
    console.log(formData.name, formData.email, formData.password, formData.role)
    // Your existing password validation
    if (formData.password != formData.confirmpassword) {
      alert("password not matched!");
      return;
    }

    // Your existing name validation
    const str = "0123456789/?><,.!@#$%^&*(){}[]:;+-*-=|";

    for (const i of str) {
      if (formData.name.includes(i)) {
        alert("Not a valid name");
        return;
      }
    }

    try {
      setLoading(true);
      
      // Call AuthContext register function
      const result = await register(
        formData.name,
        formData.email,
        formData.password,
        formData.role
      );

      // Backend/AuthContext returned an error
      if (!result.success) {
        setError(result.message);
        return;
      }

      // Registration successful
      alert(result.message || "Registration successful!");

      navigate("/Admin/Profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      className="parent-register"
      component="form"
      onSubmit={handleSubmit}
    >
      <Box className="child-register">
        <Typography variant="h3">
          Create Account
        </Typography>

        <Typography variant="h6">
          Fill in the details to get started.
        </Typography>

        <TextField
          label="Name"
          name="name"
          type="text"
          value={formData.name}
          onChange={handleChange}
          fullWidth
          required
        />

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

        <TextField
          label="confirmpassword"
          name="confirmpassword"
          type="password"
          value={formData.confirmpassword}
          onChange={handleChange}
          fullWidth
          required
        />

        {/* Added: backend/API error */}
        {error && (
          <Typography color="error">
            {error}
          </Typography>
        )}

        <Button
          className="register_button"
          type="submit"
          fullWidth
          disabled={loading}
        >
          {loading ? "Registering..." : "Register"}
        </Button>

        <pre>
          Already have an Account?{" "}
          <Link to="/Admin/Login">LOGIN</Link>
        </pre>
      </Box>
    </Box>
  );
};

export default AdminRegisterForm;