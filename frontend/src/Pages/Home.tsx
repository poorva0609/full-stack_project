import { Link } from "react-router-dom";
import { useAuth } from "../context/UseAuth";

import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Divider,
  Stack,
  Typography,
  CircularProgress,
  Chip,
} from "@mui/material";

const Home = () => {
  const { user, loading, logout } = useAuth();

  // Loading state
  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: "#f5f5f5",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 2,
      }}
    >
      <Container maxWidth="sm">
        <Card>
          <CardContent sx={{ padding: 4 }}>

            {/* Page Title */}
            <Typography
              component="h1"
              variant="h4"
              align="center"
              gutterBottom
            >
              Authentication System
            </Typography>

            <Divider sx={{ marginY: 3 }} />

            {user ? (
              /* ================= LOGGED IN ================= */
              <Box>
                <Typography
                  component="h2"
                  variant="h5"
                  gutterBottom
                >
                  User Information
                </Typography>

                <Stack spacing={2} sx={{ marginTop: 3 }}>

                  {/* ID */}
                  <Box>
                    <Typography
                      component="p"
                      variant="body2"
                      color="text.secondary"
                    >
                      ID
                    </Typography>

                    <Typography component="p" variant="body1">
                      {user.id}
                    </Typography>
                  </Box>

                  {/* Name */}
                  <Box>
                    <Typography
                      component="p"
                      variant="body2"
                      color="text.secondary"
                    >
                      Name
                    </Typography>

                    <Typography component="p" variant="body1">
                      {user.name}
                    </Typography>
                  </Box>

                  {/* Email */}
                  <Box>
                    <Typography
                      component="p"
                      variant="body2"
                      color="text.secondary"
                    >
                      Email
                    </Typography>

                    <Typography component="p" variant="body1">
                      {user.email}
                    </Typography>
                  </Box>

                  {/* Role */}
                  <Box>
                    <Typography
                      component="p"
                      variant="body2"
                      color="text.secondary"
                    >
                      Role
                    </Typography>

                    <Chip
                      label={user.role}
                      color={
                        user.role === "ADMIN"
                          ? "error"
                          : "primary"
                      }
                      size="small"
                    />
                  </Box>
                </Stack>

                {/* Logout */}
                <Button
                  variant="contained"
                  color="error"
                  fullWidth
                  sx={{ marginTop: 4 }}
                  onClick={logout}
                >
                  Logout
                </Button>
              </Box>
            ) : (
              /* ================= NOT LOGGED IN ================= */
              <Box>
                <Typography
                  component="h2"
                  variant="h5"
                  align="center"
                  gutterBottom
                >
                  Welcome
                </Typography>

                <Typography
                  component="p"
                  variant="body1"
                  color="text.secondary"
                  align="center"
                  sx={{ marginBottom: 4 }}
                >
                  You are not currently logged in.
                </Typography>

                <Stack spacing={2}>

                  {/* Register */}
                  <Button
                    component={Link}
                    to="/user/register"
                    variant="contained"
                    fullWidth
                  >
                    Register
                  </Button>

                  {/* Login */}
                  <Button
                    component={Link}
                    to="/user/login"
                    variant="outlined"
                    fullWidth
                  >
                    Login
                  </Button>

                </Stack>
              </Box>
            )}

          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default Home;