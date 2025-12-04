import jwt from "jsonwebtoken";
import { Usuarios } from "../models/index.js";

const protegerRuta = async (req, res, next) => {
  // Verificar si hay un token
  const { _token } = req.cookies;
  if (!_token) {
    return res.redirect("/auth/login");
  }

  try {
    // Validar el token
    const decoded = jwt.verify(_token, process.env.JWT_SECRET);

    // Buscar el usuario autenticado
    const usuario = await Usuarios.scope("eliminarPassword").findByPk(
      decoded.id
    );

    if (!usuario) {
      return res.redirect("/auth/login");
    }

    console.log(usuario);

    // Guardar el usuario en req y en las vistas
    req.usuario = usuario;
    res.locals.usuario = usuario;

    return next();
  } catch (error) {
    console.log(error);
    return res.clearCookie("_token").redirect("/auth/login");
  }
};

export default protegerRuta;
