import { check, validationResult } from "express-validator";
import { Op } from "sequelize";
import Pedido from "../models/Pedido.js";
import PedidoItem from "../models/PedidoItem.js";
import Producto from "../models/Producto.js";
import Usuario from "../models/Usuario.js";

// Listar pedidos con filtro por estado
const listadoPedidos = async (req, res) => {
  try {
    const { estado } = req.query;

    let whereClause = {};
    if (estado && estado !== "todos") {
      whereClause.estado = estado;
    }

    const pedidos = await Pedido.findAll({
      where: whereClause,
      include: [
        {
          model: Usuario,
          attributes: ["id", "nombre", "email"],
        },
      ],
      order: [["fecha_creacion", "DESC"]],
    });

    const estadosDisponibles = [
      { valor: "pendiente", label: "Pendiente" },
      { valor: "pagado", label: "Pagado" },
      { valor: "enviado", label: "Enviado" },
      { valor: "cancelado", label: "Cancelado" },
    ];

    res.render("admin/pedidos/listado", {
      tituloPagina: "Gestión de Pedidos",
      pedidos,
      estadosDisponibles,
      filtroEstado: estado || "todos",
      csrfToken: req.csrfToken(),
    });
  } catch (error) {
    console.log("Error listando pedidos:", error);
    res.status(500).render("templates/mensaje", {
      tituloPagina: "Error",
      mensaje: "Error cargando pedidos",
    });
  }
};

// Ver detalle del pedido
const verDetallePedido = async (req, res) => {
  try {
    const { id } = req.params;

    const pedido = await Pedido.findByPk(id, {
      include: [
        {
          model: Usuario,
          attributes: ["id", "nombre", "email"],
        },
        {
          model: PedidoItem,
          include: [
            {
              model: Producto,
              attributes: ["id", "nombre", "imagen_principal", "precio"],
            },
          ],
        },
      ],
    });

    if (!pedido) {
      return res.status(404).render("templates/mensaje", {
        tituloPagina: "No encontrado",
        mensaje: "Pedido no encontrado",
      });
    }

    // Calcular subtotal
    const items = pedido.pedido_items || [];
    const subtotal = items.reduce(
      (sum, item) => sum + parseFloat(item.subtotal || 0),
      0
    );

    const estadosDisponibles = [
      { valor: "pendiente", label: "Pendiente" },
      { valor: "pagado", label: "Pagado" },
      { valor: "enviado", label: "Enviado" },
      { valor: "cancelado", label: "Cancelado" },
    ];

    res.render("admin/pedidos/detalle", {
      tituloPagina: "Detalle del Pedido",
      pedido,
      subtotal: subtotal.toFixed(2),
      estadosDisponibles,
      csrfToken: req.csrfToken(),
    });
  } catch (error) {
    console.log("Error viendo detalle:", error);
    res.status(500).render("templates/mensaje", {
      tituloPagina: "Error",
      mensaje: "Error cargando detalle del pedido",
    });
  }
};

// Cambiar estado del pedido
const cambiarEstado = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    // Validar estado
    const estadosValidos = ["pendiente", "pagado", "enviado", "cancelado"];
    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({
        error: "Estado inválido",
      });
    }

    const pedido = await Pedido.findByPk(id, {
      include: [
        {
          model: PedidoItem,
          include: [{ model: Producto }],
        },
      ],
    });

    if (!pedido) {
      return res.status(404).json({
        error: "Pedido no encontrado",
      });
    }

    const estadoAnterior = pedido.estado;

    // Si se cancela un pedido que no ha sido enviado, restaurar stock
    if (
      estado === "cancelado" &&
      estadoAnterior !== "enviado" &&
      estadoAnterior !== "cancelado"
    ) {
      // Restaurar stock para cada item del pedido
      for (const item of pedido.pedido_items) {
        const producto = item.producto;
        if (producto) {
          producto.stock += item.cantidad;
          
          // Si el producto estaba "no disponible" y ahora tiene stock, cambiar a "publicado"
          if (producto.estado === "no disponible" && producto.stock > 0) {
            producto.estado = "publicado";
          }
          
          await producto.save();
        }
      }
    }

    // Actualizar estado del pedido
    pedido.estado = estado;
    pedido.admin_id = req.usuario.id;
    pedido.fecha_cambio_estado = new Date();

    await pedido.save();

    res.json({
      success: true,
      message: "Estado actualizado correctamente",
      pedido,
    });
  } catch (error) {
    console.log("Error cambiando estado:", error);
    res.status(500).json({
      error: "Error actualizando estado",
    });
  }
};

export { listadoPedidos, verDetallePedido, cambiarEstado };
