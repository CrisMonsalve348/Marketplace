import express from "express";
import { inicio, home } from "../controllers/appcontrollers.js";
import identificarUsuario from "../middleware/identificarUsuario.js";
import protegerRutaadmin from "../middleware/protegerrutaadmin.js";
import {
  formularioNuevo,
  guardarNuevo,
  formularioEditar,
  actualizarProducto,
  listadoPublico,
  listadoAdmin,
  verDetalle,
  verDetalleAdmin,
} from "../controllers/productcontrollers.js";
import {
  listadoPedidos,
  verDetallePedido,
  cambiarEstado,
} from "../controllers/pedidocontrollers.js";

const router = express.Router();

// Home page (public)
router.get("/", home);

//dashboard (solo admin)
router.get("/dashboard", protegerRutaadmin, inicio);

// Admin - Productos
router.get("/admin/productos", protegerRutaadmin, listadoAdmin);
router.get("/admin/productos/nuevo", protegerRutaadmin, formularioNuevo);
router.post("/admin/productos/nuevo", protegerRutaadmin, guardarNuevo);
router.get("/admin/productos/:id/editar", protegerRutaadmin, formularioEditar);
router.post("/admin/productos/:id/editar", protegerRutaadmin, actualizarProducto);
router.get("/admin/productos/:id/detalle", protegerRutaadmin, verDetalleAdmin);

// Admin - Pedidos
router.get("/admin/pedidos", protegerRutaadmin, listadoPedidos);
router.get("/admin/pedidos/:id", protegerRutaadmin, verDetallePedido);
router.post("/admin/pedidos/:id/estado", protegerRutaadmin, cambiarEstado);

// Public listing y búsqueda
router.get("/productos", listadoPublico);
router.get("/productos/:id", verDetalle);

export default router;
