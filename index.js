
import express from "express";
import csurf from "csurf";
import cookieParser from "cookie-parser";
import userRoutes from "./routes/userRoutes.js";
import db from "./config/db.js";

// Crear APP
const app = express();

// Habilitar lectura de los forms
app.use(express.urlencoded({ extended: true }));

// Habilitar el Cookie Parser
app.use(cookieParser());

// Habiliar el CSRF
app.use(csurf({ cookie: true }));

// Conexion a la DB
try {
  await db.authenticate();
  db.sync();
  console.log("La conexion es correcta a la DB");
} catch (error) {
  console.error("No se puede conectar", error);
}

// Habilitar Pug
app.set("view engine", "pug");
app.set("views", "./views");

// Definir la ruta Public
app.use(express.static("public"));

// Routing
app.use("/auth", userRoutes);
// Definir el puerto
const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log("El servidor esta corriendo en el puerto: " + port);
});
 