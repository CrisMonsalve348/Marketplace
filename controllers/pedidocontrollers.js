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
      ],
    });

    if (!pedido) {
      return res.status(404).render("templates/mensaje", {
        tituloPagina: "No encontrado",
        mensaje: "Pedido no encontrado",
      });
    }

    // Si es una ruta de cliente (/mis-pedidos/:id), verificar que el pedido pertenezca al usuario
    if (req.path.startsWith("/mis-pedidos")) {
      const usuarioId = req.usuario?.id || req.usuario?.dataValues?.id;
      if (pedido.usuario_id !== usuarioId) {
        return res.status(403).render("templates/mensaje", {
          tituloPagina: "No autorizado",
          mensaje: "No tienes permiso para ver este pedido",
        });
      }
    }

    // Cargar items del pedido
    const items = await PedidoItem.findAll({
      where: { pedido_id: id },
    });

    // Cargar productos para cada item (para mostrar info extra como imagen)
    // Pero usar siempre los precios guardados en PedidoItem, no los del producto actual
    for (let item of items) {
      const producto = await Producto.findByPk(item.producto_id, {
        attributes: ["id", "nombre", "imagen_principal"]
      });
      item.Producto = producto || null;
      
      // Asegurar que los precios vienen del PedidoItem (los guardados en el momento de la compra)
      if (!item.precio_unitario) {
        item.precio_unitario = 0;
      }
      if (!item.subtotal) {
        item.subtotal = 0;
      }
    }

    // Calcular subtotal usando SIEMPRE los precios guardados en el pedido
    const subtotal = items.reduce(
      (sum, item) => sum + (parseFloat(item.subtotal) || 0),
      0
    );

    // Si es ruta de cliente, renderizar vista de cliente
    if (req.path.startsWith("/mis-pedidos")) {
      return res.render("pedidos/miDetalle", {
        titulo: "Detalle del Pedido",
        pedido,
        items,
        subtotal: subtotal.toFixed(2),
      });
    }

    // Si es admin, renderizar vista de admin
    const estadosDisponibles = [
      { valor: "pendiente", label: "Pendiente" },
      { valor: "pagado", label: "Pagado" },
      { valor: "enviado", label: "Enviado" },
      { valor: "cancelado", label: "Cancelado" },
    ];

    res.render("admin/pedidos/detalle", {
      tituloPagina: "Detalle del Pedido",
      pedido,
      items,
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

    const pedido = await Pedido.findByPk(id);

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
      // Cargar items del pedido
      const items = await PedidoItem.findAll({
        where: { pedido_id: id },
      });

      // Restaurar stock para cada item del pedido
      for (const item of items) {
        const producto = await Producto.findByPk(item.producto_id);
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

const misPedidos = async (req, res) => {
  try {
    const usuarioId = req.usuario?.id || req.usuario?.dataValues?.id;
    const { estado } = req.query;
    
    console.log("Usuario en req:", req.usuario);
    console.log("Usuario ID:", usuarioId);
    
    if (!usuarioId) {
      return res.status(401).json({
        error: "Usuario no autenticado",
      });
    }

    let whereClause = { usuario_id: usuarioId };
    if (estado && estado !== "todos") {
      whereClause.estado = estado;
    }

    const pedidos = await Pedido.findAll({
      where: whereClause,
      order: [["fecha_creacion", "DESC"]],
    });

    console.log("Pedidos encontrados:", pedidos.length);

    // Cargar items para cada pedido
    for (let pedido of pedidos) {
      const items = await PedidoItem.findAll({
        where: { pedido_id: pedido.id },
      });

      console.log(`Cargando ${items.length} items para pedido ${pedido.id}`);

      for (let item of items) {
        item.Producto = await Producto.findByPk(item.producto_id, {
          attributes: ["id", "nombre", "precio", "imagen_principal"],
        });
      }

      pedido.PedidoItems = items;
    }

    console.log("Renderizando vista con", pedidos.length, "pedidos");

    res.render("pedidos/misPedidos", {
      titulo: "Mis Pedidos",
      pedidos,
      filtroEstado: estado || "todos",
    });
  } catch (error) {
    console.log("Error cargando mis pedidos:", error);
    res.status(500).json({
      error: "Error cargando tus pedidos",
      details: error.message,
    });
  }
};

export { listadoPedidos, verDetallePedido, cambiarEstado, misPedidos };
