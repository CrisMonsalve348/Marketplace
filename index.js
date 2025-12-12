import express from "express";
import csurf from "csurf";
import cookieParser from "cookie-parser";
import upload from "./config/multer.js";
import userRoutes from "./routes/userRoutes.js";
import appRoutes from "./routes/appRoutes.js";
import carritoRoutes from "./routes/carritoRoutes.js";
import identificarUsuario from "./middleware/identificarUsuario.js";
import db from "./config/db.js";
import Categoria from "./models/Categoria.js";

// Crear APP
const app = express();

// Habilitar lectura de los forms (ANTES de csurf)
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Habilitar el Cookie Parser (ANTES de csurf)
app.use(cookieParser());

// Aplicar multer ANTES de CSRF para rutas específicas que lo necesitan
app.post("/admin/productos/nuevo", upload.single("imagen"));
app.post("/admin/productos/:id/editar", upload.single("imagen"));

// Habiliar el CSRF (DESPUÉS de cookieParser y multer)
app.use(csurf({ cookie: true }));

// Conexion a la DB
try {
  await db.authenticate();
  await db.sync();
  console.log("La conexion es correcta a la DB");
} catch (error) {
  console.error("No se puede conectar", error);
}

// Habilitar Pug
app.set("view engine", "pug");
app.set("views", "./views");

// Definir la ruta Public (ANTES de las rutas que usan CSRF)
app.use(express.static("public"));

// Identificar usuario en todas las rutas (global)
app.use(identificarUsuario);

// Cargar categorías activas para el header (disponibles en todas las vistas)
app.use(async (req, res, next) => {
  try {
    const categorias = await Categoria.findAll({
      where: { estado: "activo" },
      attributes: ["id", "nombre", "slug"],
      order: [["nombre", "ASC"]],
    });
    res.locals.categoriasMenu = categorias.map((c) => c.get({ plain: true }));
  } catch (e) {
    res.locals.categoriasMenu = [];
  }
  next();
});

// Routing
import categoriaRoutes from "./routes/categoriaRoutes.js";

app.use("/auth", userRoutes);
app.use("/", appRoutes);
app.use("/carrito", carritoRoutes);
app.use("/admin/categorias", categoriaRoutes);
// Definir el puerto
const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log("El servidor esta corriendo en el puerto: " + port);
});