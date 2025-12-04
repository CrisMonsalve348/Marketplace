import express from "express";
import {
    formularioRegistro,
    registrar,
    confirmar,
    formularioLogin,
    autenticar,
    formularioOlvidePassword,
    resetPassword,
    comprobarToken,
    nuevoPassword
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

//olvide mi contraseña
router.get("/olvide-password", formularioOlvidePassword);
router.post("/olvide-password", resetPassword);


//recuperar contraseña
router.get("/reset-password/:token", comprobarToken);
router.post("/reset-password/:token", nuevoPassword);
export default router;