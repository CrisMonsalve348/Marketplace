import express from "express";
import{
    inicio


} from "../controllers/appcontrollers.js";
import identificarUsuario from "../middleware/identificarUsuario.js";  

const router = express.Router();


//dashboard
router.get("/dashboard", identificarUsuario, inicio);


export default router