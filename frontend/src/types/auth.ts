export interface User {
  id: number;
  name: string;
  email: string;
  role: "USER" | "ADMIN";
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;


  register: (
    name: string,
    email: string,
    password: string,
    role: string
  ) => Promise<{ success: boolean; message: string }>;


  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; message: string }>;


   updateProfile: (
    name: string
  ) => Promise<{
    success: boolean;
    message: string;
  }>;


  logout: () => Promise<void>;

  changePassword: (
  password: string
) => Promise<{
  success: boolean;
  message: string;
}>;
}