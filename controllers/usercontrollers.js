import { check, validationResult } from "express-validator";
import bcrypt from "bcrypt";
import { generarId, generarJWT} from "../helpers/token.js";
import Usuario from "../models/Usuario.js";
import { emailRegistro, emailOlvidePassword } from "../helpers/email.js";
import { Op } from "sequelize";







const formularioRegistro = (req, res) => {
  
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
    .notEmpty()
    .withMessage("Debes seleccionar un rol")
    .isIn(["cliente", "admin"])
    .withMessage("Rol inválido")
    .run(req);

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
    mensaje: "La cuenta se confirmó correctamente. Inicia sesión para continuar.",
    enlace: "/auth/login",
    textoEnlace: "Ir a Login"
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

   const { email, password } = req.body;

  // Comprobar si existe
  const usuario = await Usuario.findOne({
    where: { email },
  });

  if (!usuario) {
    return res.render("auth/login", {
      tituloPagina: "Iniciar Sesion",
      csrfToken: req.csrfToken(),
      errores: [{ msg: "El usuario no existe" }],
    });
  }

  //Comprobar si el usuario esta confirmado (TRUE)
  if (!usuario.confirmado) {
    return res.render("auth/login", {
      tituloPagina: "Iniciar Sesion",
      csrfToken: req.csrfToken(),
      errores: [{ msg: "Tu cuenta no esta confirmada" }],
    });
  }

  // Comprobar contraseña
  if (!usuario.verificarPassword(password)) {
    return res.render("auth/login", {
      tituloPagina: "Iniciar Sesion",
      csrfToken: req.csrfToken(),
      errores: [{ msg: "Contraseña incorrecta" }],
    });
  }

  // Autenticar el Usuario
  const token = generarJWT({ id: usuario.id, nombre: usuario.nombre });
  console.log("JWT cargado:", process.env.JWT_SECRET);
  // Almacenar en una Cookie
  return res
    .cookie("_token", token, {
      httpOnly: true,
      
    })
    .redirect(usuario.role === "admin" ? "/dashboard" : "/");


  }
  //olvide mi contraseña

  const formularioOlvidePassword = (req, res) => {
  res.render("auth/olvide-password", {
    tituloPagina: "Olvide Contraseña",
    csrfToken: req.csrfToken(),
  });
};

const resetPassword = async (req, res) => {
  // Validaciones
  await check("email")
    .isEmail()
    .withMessage("Esto no parece un correo")
    .run(req);

  let resultado = validationResult(req);

  // Verificar que el resultado este vacio
  if (!resultado.isEmpty()) {
    // Errores
    return res.render("auth/olvide-password", {
      tituloPagina: "Olvide contraseña",
      errores: resultado.array(),
      csrfToken: req.csrfToken(),
    });
  }

  // Buscar el usuario

  const { email } = req.body;

  const usuario = await Usuario.findOne({ where: { email } });
  if (!usuario) {
    return res.render("auth/olvide-password", {
      tituloPagina: "Recuperar contraseña",
      csrfToken: req.csrfToken(),
      errores: [{ msg: "El email no existe" }],
    });
  }

  // Generar un token y enviar un email
  usuario.token = generarId();
  await usuario.save();

  // Enviar el correo
  emailOlvidePassword({
    nombre: usuario.nombre,
    email: usuario.email,
    token: usuario.token,
  });

  //Mostrar el mensaje
  res.render("templates/mensaje", {
    tituloPagina: "Restablece la contraseña",
    mensaje: "Hemos enviado un correo de restablecer la contraseña",
  });
};


const comprobarToken = async (req, res) => {
  const { token } = req.params;

  // Validar el token sea verdadero
  const usuario = await Usuario.findOne({ where: { token } });

  if (!usuario) {
    return res.render("auth/confirmar-cuenta", {
      tituloPagina: "Restablece tu contraseña",
      mensaje: "Hubo un error al validar el token",
      error: true,
    });
  }

  // Mostrar formulario para validar la contraseña
  res.render("auth/reset-password", {
    tituloPagina: "Escribe tu nueva contraseña",
    csrfToken: req.csrfToken(),
    token,
  });
};
const nuevoPassword = async (req, res) => {
  //Validar contraseñas
  await check("password")
    .isLength({ min: 6 })
    .withMessage("La contraseña debe ser al menos de 6 caracteres")
    .run(req);

  await check("repeat_password")
    .equals(req.body.password)
    .withMessage("La contraseña no es igual")
    .run(req);

  let resultado = validationResult(req);

  // Validar que resultado este vacio
  if (!resultado.isEmpty()) {
    // Errores
    return res.render("auth/reset-password", {
      tituloPagina: "Restablece Contraseña",
      csrfToken: req.csrfToken(),
      errores: resultado.array(),
    });
  }

  const { token } = req.params;
  const { password } = req.body;

  // Identificar el usuario para hacer el cambio
  const usuario = await Usuario.findOne({ where: { token } });

  // Hashear el password
  const salt = await bcrypt.genSalt(10);
  usuario.password = await bcrypt.hash(password, salt);
  usuario.token = null;

  // Guardar en la DB
  await usuario.save();

  res.render("auth/confirmar-cuenta", {
    tituloPagina: "Contraseña cambiada",
    csrfToken: req.csrfToken(),
    mensaje: "La contraseña se cambio correctamente",
  });
};


//editar perfil 

const formularioeditarperfil=(req, res)=>{
  
  const vista = req.usuario.role === 'admin' ? 'auth/editar-perfil-admin' : 'auth/editar-perfil';
  
  res.render(vista, {
    tituloPagina: "Editar perfil de usuario",
    csrfToken: req.csrfToken(),
    usuario: req.usuario
  });   

};

const cambiarnombre = async (req, res) => {

  // VALIDAR
  await check("nombre")
    .notEmpty()
    .withMessage("El nombre no puede estar vacío")
    .run(req);

  const resultado = validationResult(req);

  if (!resultado.isEmpty()) {
    const vista = req.usuario.role === 'admin' ? 'auth/editar-perfil-admin' : 'auth/editar-perfil';
    return res.render(vista, {
      tituloPagina: "Editar perfil",
      csrfToken: req.csrfToken(),
      errores: resultado.array(),
      usuario: req.usuario   
    });
  }

  try {
    const usuario = await Usuario.findByPk(req.usuario.id);

    usuario.nombre = req.body.nombre; // cambiar nombre
    await usuario.save();             // guardar

    // Actualizar la sesión para que el nombre también cambie en las vistas
    req.usuario.nombre = req.body.nombre;
    res.locals.usuario.nombre = req.body.nombre;

    const vista = req.usuario.role === 'admin' ? 'auth/editar-perfil-admin' : 'auth/editar-perfil';

    return res.render(vista, {
      tituloPagina: "Editar perfil",
      csrfToken: req.csrfToken(),
      usuario: req.usuario,
      mensaje: "Tu nombre ha sido actualizado correctamente"
    });

  } catch (error) {
    console.log(error); 
    const vista = req.usuario.role === 'admin' ? 'auth/editar-perfil-admin' : 'auth/editar-perfil';
    
    return res.render(vista, {
      tituloPagina: "Editar perfil",
      csrfToken: req.csrfToken(),
      usuario: req.usuario,
      error: "Hubo un error al actualizar tu perfil"
    });
  }
};


//cerrar sesion 
const logout = (req, res) => {
    res.clearCookie("_token");
    return res.redirect("/auth/login");
};


//gestionar usuarios del admin
const vistadegestiondeusuarios= async (req, res)=>{
const usuarios = await Usuario.findAll({
      where: { id: { [Op.ne]: req.usuario.id } } 
    });
try{



  return res.render("auth/gestionar-usuarios", {
      tituloPagina:"Gestion de Usuarios",
      csrfToken: req.csrfToken(),
      usuarios
  });
}catch(error){
console.log(error);
}
}

// formulario editar usuario (admin)
const formularioEditarUsuarioAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const usuarioEditar = await Usuario.findByPk(id);

    if (!usuarioEditar || usuarioEditar.id === req.usuario.id) {
      return res.render("templates/mensaje", {
        tituloPagina: "Usuario no encontrado",
        mensaje: "El usuario no existe o no se puede editar.",
      });
    }

    return res.render("auth/editar-usuario", {
      tituloPagina: "Editar usuario",
      csrfToken: req.csrfToken(),
      usuarioEditar,
    });
  } catch (error) {
    console.log(error);
    return res.render("templates/mensaje", {
      tituloPagina: "Error",
      mensaje: "No se pudo cargar la edición del usuario.",
    });
  }
};

// actualizar usuario (admin)
const actualizarUsuarioAdmin = async (req, res) => {
  const { id } = req.params;

  await check("nombre")
    .notEmpty()
    .withMessage("El nombre no puede estar vacío")
    .run(req);

  await check("role")
    .isIn(["admin", "cliente"])
    .withMessage("Rol inválido")
    .run(req);

  const resultado = validationResult(req);

  const usuarioEditar = await Usuario.findByPk(id);

  if (!usuarioEditar || usuarioEditar.id === req.usuario.id) {
    return res.render("templates/mensaje", {
      tituloPagina: "Usuario no encontrado",
      mensaje: "El usuario no existe o no se puede editar.",
    });
  }

  if (!resultado.isEmpty()) {
    return res.render("auth/editar-usuario", {
      tituloPagina: "Editar usuario",
      csrfToken: req.csrfToken(),
      errores: resultado.array(),
      usuarioEditar: {
        id: usuarioEditar.id,
        nombre: req.body.nombre,
        email: usuarioEditar.email,
        role: req.body.role,
      },
    });
  }

  try {
    usuarioEditar.nombre = req.body.nombre;
    usuarioEditar.role = req.body.role;
    await usuarioEditar.save();

    const usuarios = await Usuario.findAll({
      where: { id: { [Op.ne]: req.usuario.id } },
    });

    return res.render("auth/gestionar-usuarios", {
      tituloPagina: "Gestion de Usuarios",
      csrfToken: req.csrfToken(),
      usuarios,
      mensaje: "Usuario actualizado correctamente",
    });
  } catch (error) {
    console.log(error);
    return res.render("templates/mensaje", {
      tituloPagina: "Error",
      mensaje: "Hubo un error al actualizar el usuario.",
    });
  }
};

//eliminar usuario
const eliminarusuario=async(req,res)=>{
   const { usuarioId } = req.body;
  const usuarios2 = await Usuario.findAll({
  where: {
    id: {
      [Op.ne]: req.usuario.id   
    }
  }
});
    
    
  try{
    const {usuarioId}=req.body;
    
    if(!usuarioId){
      return res.render("auth/gestionar-usuarios",{
        tituloPagina:"Error al eliminar usuario",
        mensaje:"no se envió al usuario",
         csrfToken: req.csrfToken(),
        usuarios2
      });
    }
    const usuario = await Usuario.findByPk(usuarioId);

    if (!usuario) {
      return res.render("auth/gestionar-usuarios", {
        tituloPagina: "Error",
        mensaje: "El usuario no existe",
         csrfToken: req.csrfToken(),
        usuarios2
      });
    }
    await usuario.destroy();
      const usuarios = await Usuario.findAll({
  where: {
    id: {
      [Op.ne]: req.usuario.id   
    }
  }
});

    return res.render("auth/gestionar-usuarios", {
      tituloPagina: "Usuario Eliminado",
      mensaje: "El usuario fue eliminado correctamente",
       csrfToken: req.csrfToken(),
      usuarios
    });

  }catch(error){
    console.log(error);
  }

}


export {

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
  }