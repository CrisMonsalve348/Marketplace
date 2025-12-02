import { check, validationResult } from "express-validator";
import bcrypt from "bcrypt";
import { generarId} from "../helpers/token.js";
import Usuario from "../models/Usuario.js";
import { emailRegistro, emailOlvidePassword } from "../helpers/email.js";






const formularioRegistro = (req, res) => {
  console.log(req.csrfToken());
  res.render("auth/registro", {
    tituloPagina: "Registro de Usuario",
    csrfToken: req.csrfToken(),
  });                           
};

const registrar = async(req, res) =>{

 // Validaciones
  await check("nombre")
    .notEmpty()
    .withMessage("El nombre no puede estar vacio")
    .run(req);

  await check("email")
    .isEmail()
    .withMessage("Esto no parece un correo")
    .run(req);

  await check("password")
    .isLength({ min: 6 })
    .withMessage("La contraseña debe ser al menos de 6 caracteres")
    .run(req);



  await check("repeat_password")
    .equals(req.body.password)
    .withMessage("La contraseña no es igual")
    .run(req);

  await check("role")
  .isIn(["admin", "cliente"])
  .withMessage("Debe seleccionar un rol")
  .run(req)

  let resultado = validationResult(req);
   // Verificar que el resultado este vacio
  if (!resultado.isEmpty()) {
    // Errores
    return res.render("auth/registro", {
      tituloPagina: "Registro de Usuario",
      errores: resultado.array(),
      csrfToken: req.csrfToken(),
      usuario: {
        nombre: req.body.nombre,
        email: req.body.email,
        
      },
    });
  }
    // Extraer los datos
  const { nombre, email, password, role } = req.body;

  // Validar que el usuario no exista
  const existeUsuario = await Usuario.findOne({
    where: { email },
  });
  if (existeUsuario) {
    return res.render("auth/registro", {
      tituloPagina: "Registro de Usuario",
      csrfToken: req.csrfToken(),
      errores: [{ msg: "El usuario ya existe" }],
      usuario: {
        nombre: req.body.nombre,
        email: req.body.email,
      },
    });
  }

  const usuarios = await Usuario.create({
    nombre,
    email,
    password,
    role,
    token: generarId(),
  });

  // Enviar el email
  emailRegistro({
    nombre: usuarios.nombre,
    email: usuarios.email,
    token: usuarios.token,
  });

  // Mostrar mensaje de Confirmación
  res.render("templates/mensaje", {
    tituloPagina: "Cuenta Creada",
    mensaje: "Se ha enviado un correo de confirmación, Da clic en el enlace.",
  });
};

// Funcion que va a confirmar el correo
const confirmar = async (req, res) => {
  const { token } = req.params;

  // Validar el token sea verdadero
  const usuario = await Usuario.findOne({ where: { token } });

  // Confirmar la cuenta
  if (!usuario) {
    return res.render("auth/confirmar-cuenta", {
      tituloPagina: "Error al crear cuenta",
      mensaje: "Hubo un error al confirmar tu cuenta, Intentalo de nuevo",
      error: true,
    });
  }

  //Validar la informacion y mandarla a la DB
  usuario.token = null;
  usuario.confirmado = true;
  await usuario.save();

  res.render("auth/confirmar-cuenta", {
    tituloPagina: "Cuenta confirmada",
    mensaje: "La cuenta se confirmó correctamente",
  });
};

const formularioLogin = (req, res) => {
  res.render("auth/login", {
    tituloPagina: "Inicio de Sesión",
    csrfToken: req.csrfToken(),
  });
};

const autenticar= async(req,res)=>{
//validacion
 await check("email")
    .isEmail()
    .withMessage("El correo es obligatorio")
    .run(req);

  await check("password")
    .notEmpty()
    .withMessage("La contraseña no puede estar vacia")
    .run(req);

  let resultado = validationResult(req);

  // Verificar que el resultado este vacio
  if (!resultado.isEmpty()) {
    // Errores
    return res.render("auth/login", {
      tituloPagina: "Iniciar Sesion",
      errores: resultado.array(),
      csrfToken: req.csrfToken(),
    });
  }

}

export {

    formularioRegistro,
    registrar,
    confirmar,
    formularioLogin,
    autenticar
}