import express from "express";
import{
    inicio


} from "../controllers/appcontrollers.js";

const router = express.Router();


//dashboard
router.get("/dashboard", inicio);


export default router