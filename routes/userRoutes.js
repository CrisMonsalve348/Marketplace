import express from "express";
import {
    formularioRegistro,
    registrar,
    confirmar
} from "../controllers/usercontrollers.js"

const router = express.Router();
//registro
router.get("/registro", formularioRegistro);
router.post("/registro", registrar );

// Confirmar Cuenta
router.get("/confirmar/:token", confirmar);

export default router;