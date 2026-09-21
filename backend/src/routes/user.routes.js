import express from "express"
import { getProfile, updateProfile } from "../controller/user.controllers.js"
import { authenticate } from "../middlewares/auth.middleware.js"
const router = express.Router()

router.get("/profile" , authenticate , getProfile)

router.patch("/profile" , authenticate , updateProfile)
export default router