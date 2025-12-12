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
    nuevoPassword,
    formularioeditarperfil,
    cambiarnombre,
    logout,
    vistadegestiondeusuarios,
    eliminarusuario,
    formularioEditarUsuarioAdmin,
    actualizarUsuarioAdmin
} from "../controllers/usercontrollers.js"
import protegerRuta  from "../middleware/protegerruta.js"
import protegerRutaadmin  from "../middleware/protegerrutaadmin.js"

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

//editar perfil
router.get("/editar-perfil",protegerRuta, formularioeditarperfil );
router.post("/editar-perfil", protegerRuta, cambiarnombre);

//cerrar sesion 
router.get("/logout", protegerRuta, logout);


//gestionar usuarios del admin
router.get("/gestionar-usuarios", protegerRutaadmin,vistadegestiondeusuarios)
router.post("/gestionar-usuarios", protegerRutaadmin, eliminarusuario)
router.get("/gestionar-usuarios/:id/editar", protegerRutaadmin, formularioEditarUsuarioAdmin)
router.post("/gestionar-usuarios/:id/editar", protegerRutaadmin, actualizarUsuarioAdmin)


export default router;