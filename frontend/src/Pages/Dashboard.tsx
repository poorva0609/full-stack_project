
import { useEffect, useState } from "react";

import Navbar from "../Components/Navbar/Navbar";
import { apiRequest } from "../api/apiRequest";
import "../Styles/Dashboard.css";

import {
  Box,
  Button,
  CircularProgress,
  Typography,
} from "@mui/material";
import type { User } from "../types/auth";


const Dashboard = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteloading, setdeleteLoading] = useState(false);
  const [error, setError] = useState("");

  // --------------------------------
  // GET USERS
  // --------------------------------

  useEffect(() => {
    let mounted = true;

    const getUsers = async () => {
      try {
        setLoading(true);
        setError("");

        const result = await apiRequest<User[]>({
          method: "GET",
          url: "/admin/users",
        });

        if (!mounted) return;

        if (result.success) {
          setUsers(result.data);
        } else {
          setError(result.error.message);
        }
      } catch (error) {
        console.error("Failed to load users:", error);

        if (mounted) {
          setError("Failed to load users");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    getUsers();

    return () => {
      mounted = false;
    };
  }, []);

  // --------------------------------
  // DELETE USER
  // --------------------------------

  const handleDelete = async (id: number) => {
   
    const confirmed = window.confirm(
      "Are you sure you want to delete this user?"
    );

    if (!confirmed) return;
    setdeleteLoading(true)
    try {
      const result = await apiRequest({
        method: "DELETE",
        url: `/admin/user/${id}`,
      });

      if (!result.success) {
        alert(result.error.message);
        return;
      }
      setdeleteLoading(false)
      // Remove deleted user from UI
      setUsers((prevUsers) =>
        prevUsers.filter((user) => user.id !== id)
      );
    } catch (error) {
      console.error("Failed to delete user:", error);

      alert("Failed to delete user");
    }
  };

  // --------------------------------
  // UI
  // --------------------------------

  return (
    <>
      <Navbar />

      <Box className="dashboard_parent">
        <Typography variant="h4">
          User Management
        </Typography>

        {/* Loading */}
        {loading && (
          <Box>
            <CircularProgress />
          </Box>
        )}

        {/* Error */}
        {!loading && error && (
          <Typography color="error">
            {error}
          </Typography>
        )}

        {/* No users */}
        {!loading && !error && users.length === 0 && (
          <Typography>
            No users found
          </Typography>
        )}

        {/* Users */}
        {!loading && !error && users.length > 0 && (
          <Box>
            {users.map((user) => (
              <Box
                key={user.id}
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "15px",
                  marginTop: "15px",
                  border: "1px solid #ddd",
                  borderRadius: "8px",
                }}
              >
                <Box>
                  <Typography variant="h6">
                    {user.name}
                  </Typography>

                  <Typography>
                    {user.email}
                  </Typography>

                  <Typography>
                    Role: {user.role}
                  </Typography>
                </Box>

                <Button
                  variant="contained"
                  color="error"
                  onClick={() => handleDelete(user.id)}
                >
                 {deleteloading == true ? "Deleteing User ..." : "Delete"}
                </Button>
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </>
  );
};

export default Dashboard;
