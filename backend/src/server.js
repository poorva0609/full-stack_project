import app from "./app.js";
import dotenv from "dotenv";
dotenv.config();
import jwt from "jsonwebtoken";
import authRoutes from "./routes/auth.routes.js"
import userRoutes from "./routes/user.routes.js"
import adminRoutes from "./routes/admin.routes.js"
import { prismaClient } from "./prismaClient/Client.js";
import { errorHandler } from "./middlewares/error.middleware.js";
import cors from "cors";

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
}));
app.get("/healthCheck", async (req, res) => {
  try {
    await prismaClient.$queryRaw`SELECT 1`;

    return res.status(200).json({
      status: "ok",
      database: "connected",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Health check failed:", error);

    return res.status(503).json({
      status: "error",
      database: "disconnected",
      timestamp: new Date().toISOString(),
    });
  }
});

app.use("/api/v1/auth" , authRoutes )
app.use("/api/v1/user" , userRoutes)
app.use("/api/v1/admin" , adminRoutes)


app.use(errorHandler)
app.listen(3000 , ()=> {
    console.log("Server is running on port 3000")
})