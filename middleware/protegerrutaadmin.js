import jwt from "jsonwebtoken";
import { Usuario} from "../models/index.js";

const protegerRutaadmin = async (req, res, next) => {
  // Verificar si hay un token
  const { _token } = req.cookies;
  if (!_token) {
    return res.redirect("/auth/login");
  }

  try {
    // Validar el token
    const decoded = jwt.verify(_token, process.env.JWT_SECRET);

    // Buscar el usuario autenticado
    const usuario = await Usuario.scope("eliminarPassword").findByPk(
      decoded.id
    );

    if (!usuario || usuario.role !='admin') {
        if(usuario){
       return res.redirect("/dashboard");
        }
        else{
           
            return res.redirect("/auth/login"); 
        }
    }

    console.log(usuario);

    // Guardar el usuario en req y en las vistas
    req.usuario = usuario;
    res.locals.usuario = usuario;
    res.locals.role = usuario.role;

    return next();
  } catch (error) {
    console.log(error);
    return res.clearCookie("_token").redirect("/auth/login");
  }
};

export default protegerRutaadmin;
