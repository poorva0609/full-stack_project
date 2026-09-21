import AppRoutes from './Routes'
import {
  Box
} from "@mui/material";
import { AuthProvider } from './context/AuthContext';


function App() {
  return (
    <AuthProvider>
      <Box>
         <AppRoutes />
      </Box>
    </AuthProvider>
  );
}

export default App;