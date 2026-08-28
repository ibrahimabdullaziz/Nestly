import { loginSchema, registerSchema } from "./auth.validation";
import express from "express";
import { validate } from "../../common/middleware/validate";
import { getMe, login, refresh, register } from "./auth.controller";
import { authGuard } from "../../common/middleware/authGuard";

const authRoutes = express.Router();

authRoutes.post("/register", validate(registerSchema), register);
authRoutes.post("/login", validate(loginSchema), login);
authRoutes.post("/refresh", refresh);
authRoutes.get("/me", authGuard, getMe);

export default authRoutes;
