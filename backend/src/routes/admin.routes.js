import express from "express"
import { deleteUser, getUser, getUsers } from "../controller/admin.controllers.js"
import { authenticate } from "../middlewares/auth.middleware.js"
const router = express.Router()

router.get("/users" ,authenticate ,  getUsers)

router.get("/user/:id" ,authenticate, getUser)

router.delete("/user/:id" ,authenticate, deleteUser)

export default router