import express from "express";
import {
  listadoCategorias,
  formularioNuevaCategoria,
  guardarCategoria,
  formularioEditarCategoria,
  actualizarCategoria,
  eliminarCategoria,
} from "../controllers/categoriacontrollers.js";
import protegerRutaadmin from "../middleware/protegerruta.js";

const router = express.Router();

// Todas las rutas requieren autenticación como admin
router.use(protegerRutaadmin);

// Listado de categorías
router.get("/", listadoCategorias);

// Formulario nueva categoría
router.get("/nueva", formularioNuevaCategoria);
router.post("/nueva", guardarCategoria);

// Editar categoría
router.get("/editar/:id", formularioEditarCategoria);
router.post("/editar/:id", actualizarCategoria);

// Eliminar categoría
router.post("/eliminar/:id", eliminarCategoria);

export default router;
