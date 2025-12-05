import jwt from "jsonwebtoken";
import Usuarios from "../models/Usuario.js";

const identificarUsuario = async (req, res, next) => {
  // Identificar si hay un token
  const { _token } = req.cookies;
  if (!_token) {
    req.usuario = null;
    return next();
  }

  // Comprobar el token
  try {
    const decoded = jwt.verify(_token, process.env.JWT_SECRET);
    const usuario = await Usuarios.scope("eliminarPassword").findByPk(
      decoded.id
    );


    req.usuario = usuario;
    res.locals.usuario = usuario;
    res.locals.role = usuario.role;

    if (usuario) {
      req.usuario = usuario;
    }
    return next();
  } catch (error) {
    console.log(error);
    return res.clearCookie("_token").redirect("/auth/login");
  }
};

export default identificarUsuario;