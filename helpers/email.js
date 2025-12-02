
import nodemailer from "nodemailer";

const emailRegistro = async (datos) => {
  const transport = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const { email, nombre, token } = datos;

  // Enviar el correo

  await transport.sendMail({
    from: "MarketPlaceOLX.com",
    to: email,
    subject: "Confirma tu cuenta en MarketPlaceOLX",
    text: "Confirma tu cuenta en MarketPlaceOLX",
    html: `
    <p>Hola ${nombre}, comprueba tu cuenta en MarketPlace</p>
    
    <p>Tu cuenta ya esta lista, solo debes confirmarla en el siguiente enlace: 
    <a href="${process.env.BACKEND_URL}:${
      process.env.PORT ?? 3000
    }/auth/confirmar/${token}">Confirmar cuenta</a> </p>

    <p>Si tu no creaste la cuenta, puedes ignorar el mensaje.</p>
    `,
  });
};

const emailOlvidePassword = async (datos) => {
  const transport = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const { email, nombre, token } = datos;

  // Enviar el correo

  await transport.sendMail({
    from: "BienesRaicesSENA.com",
    to: email,
    subject: "Restablecer tu contraseña en Bienes Raices SENA",
    text: "Restablecer tu contraseña en Bienes Raices SENA",
    html: `
    <p>Hola ${nombre}, has solicitado restablecer tu cuenta en Bienes Raices SENA</p>
    
    <p>Restaura tu contraseña en el siguiente enlace: 
    <a href="${process.env.BACKEND_URL}:${
      process.env.PORT ?? 3000
    }/auth/olvide-password/${token}">Restablecer</a> </p>

    <p>Si no pediste restablecer, Ignora el mensaje</p>
    `,
  });
};

export { emailRegistro, emailOlvidePassword };
