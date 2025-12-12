import db from "../config/db.js";
import { Producto, Usuarios } from "../models/index.js";

const syncDatabase = async () => {
  try {
    await db.authenticate();
    console.log("Conexión a la base de datos OK");
    // Use 'alter' during development to update table structures without losing data.
    await db.sync({ alter: true });
    console.log("Sincronización completada");
    process.exit(0);
  } catch (error) {
    console.error("Error sincronizando la base de datos:", error);
    process.exit(1);
  }
};

syncDatabase();
