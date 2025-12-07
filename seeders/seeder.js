import { exit } from "node:process";

import usuario from "./usuario.js";
import {  Usuarios } from "../models/index.js";
import db from "../config/db.js";

const importarDatos = async () => {
  try {
    // Autenticar
    await db.authenticate();

    //Generar las columnas
    await db.sync();

    //Insertar los datos
    await Promise.all([
     
      Usuarios.bulkCreate(usuario),
    ]);

    console.log("Datos importados correctamente");
    exit();
  } catch (error) {
    console.log(error);
    exit(1);
  }
};

const eliminarDatos = async () => {
  try {
    //Opcion 1
    // await Promise.all([
    //   Categorias.destroy({ where: {} }),
    //   Precios.destroy({ where: {} }),
    // ]);

    //Opcion Recomendada
    await db.sync({ force: true });
    console.log("Eliminado correctamente!");
    exit();
  } catch (error) {
    console.log(error);
    exit(1);
  }
};

if (process.argv[2] === "-i") {
  importarDatos();
}

if (process.argv[2] === "-e") {
  eliminarDatos();
}