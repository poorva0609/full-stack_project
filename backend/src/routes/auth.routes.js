import express from "express"
import { changePassword, login, register , logout, refreshToken } from "../controller/auth.controllers.js"
import { authenticate, authenticateRefreshToken } from "../middlewares/auth.middleware.js"
const router = express.Router()


router.post("/register", register )

router.post("/login" , login)
+
router.post("/change-password" , authenticate , changePassword)

router.post("/logout" , authenticateRefreshToken , logout)

router.post("/refresh" , authenticateRefreshToken  , refreshToken)

export default router