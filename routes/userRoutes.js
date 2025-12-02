import express from "express";
import {
    formularioRegistro,
    registrar
} from "../controllers/usercontrollers.js"

const router = express.Router();
//registro
router.get("/registro", formularioRegistro);
router.post("/registro", registrar );

export default router;