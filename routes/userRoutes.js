import express from "express";
import {
    formularioRegistro,
    registrar,
    confirmar,
    formularioLogin,
    autenticar
} from "../controllers/usercontrollers.js"

const router = express.Router();
//registro
router.get("/registro", formularioRegistro);
router.post("/registro", registrar );

// Confirmar Cuenta
router.get("/confirmar/:token", confirmar);

//login 
router.get("/login", formularioLogin);
router.post("/login", autenticar);

export default router;