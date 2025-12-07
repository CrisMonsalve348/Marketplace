import bcrypt from "bcrypt";

const usuario = [
  {
    nombre: "J. Sebastian Duque",
    email: "info@jsebastiandq.com",
    confirmado: 1,
    password: bcrypt.hashSync("123456", 10),
    role:"admin"
  },
  {
    nombre: "Tamarindo Tamayo",
    email: "info@test2.com",
    confirmado: 1,
    password: bcrypt.hashSync("123456", 10),
    role:"cliente"
  },
  {
    nombre: "Tamarindo Tamayo",
    email: "info@test2.com",
    confirmado: 1,
    password: bcrypt.hashSync("123456", 10),
    role:"cliente"
  },
  {
    nombre: "Tamarindo Tamayo",
    email: "info@test2.com",
    confirmado: 1,
    password: bcrypt.hashSync("123456", 10),
    role:"cliente"
  },
  {
    nombre: "Tamarindo Tamayo",
    email: "info@test2.com",
    confirmado: 1,
    password: bcrypt.hashSync("123456", 10),
    role:"cliente"
  },
  {
    nombre: "Tamarindo Tamayo",
    email: "info@test2.com",
    confirmado: 1,
    password: bcrypt.hashSync("123456", 10),
    role:"cliente"
  },
];

export default usuario;