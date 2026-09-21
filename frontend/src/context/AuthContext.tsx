
import {
  useEffect,
  useState,
  type ReactNode,
} from "react";

import type { User } from "../types/auth";
import { AuthContext } from "./UseAuth";
import { apiRequest } from "../api/apiRequest";

export const AuthProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [user, setUser] = useState<User | null>(null);

  // Only used while checking authentication
  // when the application first loads.
  const [loading, setLoading] = useState(true);

  // --------------------------------
  // RESTORE SESSION
  // --------------------------------

  useEffect(() => {
    let mounted = true;

    const checkAuth = async () => {
      try {
        const result = await apiRequest<User>({
          method: "GET",
          url: "/user/profile",
        });

        if (!mounted) return;

        if (result.success) {
          setUser(result.data);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Session restore failed:", error);

        if (mounted) {
          setUser(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    checkAuth();

    return () => {
      mounted = false;
    };
  }, []);

  // --------------------------------
  // REGISTER
  // --------------------------------

  const register = async (
    name: string,
    email: string,
    password: string,
    role: string
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const result = await apiRequest<User>({
        method: "POST",
        url: "/auth/register",
        data: {
          name,
          email,
          password,
          role,
        },
      });

      if (result.success) {
        setUser(result.data);

        return {
          success: true,
          message: result.message,
        };
      }

      return {
        success: false,
        message: result.error.message,
      };
    } catch (error) {
      console.error("Register failed:", error);

      return {
        success: false,
        message: "Unable to complete registration.",
      };
    }
  };

  // --------------------------------
  // LOGIN
  // --------------------------------

  const login = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const result = await apiRequest<User>({
        method: "POST",
        url: "/auth/login",
        data: {
          email,
          password,
        },
      });

      if (result.success) {
        setUser(result.data);

        return {
          success: true,
          message: result.message,
        };
      }

      return {
        success: false,
        message: result.error.message,
      };
    } catch (error) {
      console.error("Login failed:", error);

      return {
        success: false,
        message: "Unable to complete login.",
      };
    }
  };

  // --------------------------------
  // UPDATE PROFILE
  // --------------------------------

  const updateProfile = async (
    name: string
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const result = await apiRequest<User>({
        method: "PATCH",
        url: "/user/profile",
        data: {
          name,
        },
      });

      if (result.success) {
        // Update the user stored in AuthContext
        // with the latest profile data.
        setUser(result.data);

        return {
          success: true,
          message: result.message,
        };
      }

      return {
        success: false,
        message: result.error.message,
      };
    } catch (error) {
      console.error("Profile update failed:", error);

      return {
        success: false,
        message: "Unable to update profile.",
      };
    }
  };

  // --------------------------------
  // LOGOUT
  // --------------------------------

  const logout = async (): Promise<void> => {
    try {
      const result = await apiRequest({
        method: "POST",
        url: "/auth/logout",
      });

      if (!result.success) {
        console.error("Logout failed:", result.error.message);
      }
    } catch (error) {
      console.error("Logout request failed:", error);
    } finally {
      // ALWAYS clear frontend authentication state.
      //
      // Even if the backend request fails,
      // the frontend should consider the user logged out.
      setUser(null);
    }
  };

  // --------------------------------
  // CHANGE PASSWORD
  // --------------------------------

  const changePassword = async (
    password: string
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const result = await apiRequest({
        method: "POST",
        url: "/auth/change-password",
        data: {
          password,
        },
      });

      if (result.success) {
        // Password change invalidates the current session.
        setUser(null);

        return {
          success: true,
          message:
            "Password changed successfully. Please log in again.",
        };
      }

      return {
        success: false,
        message: result.error.message,
      };
    } catch (error) {
      console.error("Password change failed:", error);

      return {
        success: false,
        message: "Unable to change password.",
      };
    }
  };

  // --------------------------------
  // PROVIDER
  // --------------------------------

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        register,
        login,
        updateProfile,
        logout,
        changePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
