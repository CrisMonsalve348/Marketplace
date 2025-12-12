import express from "express";
import {
  agregarAlCarrito,
  verCarrito,
  actualizarItem,
  eliminarItem,
  formularioCheckout,
  procesarCheckout,
} from "../controllers/carritocontrollers.js";
import protegerRuta from "../middleware/protegerruta.js";

const router = express.Router();

// POST - Agregar producto (AJAX)
router.post("/agregar", agregarAlCarrito);

// GET - Ver carrito
router.get("/", protegerRuta, verCarrito);

// POST - Actualizar cantidad
router.post("/actualizar", protegerRuta, actualizarItem);

// DELETE - Eliminar item
router.delete("/:item_id", protegerRuta, eliminarItem);

// GET - Formulario checkout
router.get("/checkout", protegerRuta, formularioCheckout);

// POST - Procesar checkout
router.post("/procesar", protegerRuta, procesarCheckout);

export default router;
