import { check, validationResult } from "express-validator";
import { Op } from "sequelize";
import Carrito from "../models/Carrito.js";
import CarritoItem from "../models/CarritoItem.js";
import Producto from "../models/Producto.js";
import Pedido from "../models/Pedido.js";
import PedidoItem from "../models/PedidoItem.js";
import db from "../config/db.js";

// Obtener o crear carrito del usuario
const obtenerCarrito = async (usuarioId) => {
  let carrito = await Carrito.findOne({
    where: { usuario_id: usuarioId, estado: "activo" },
  });

  if (!carrito) {
    carrito = await Carrito.create({
      usuario_id: usuarioId,
      estado: "activo",
    });
  }

  return carrito;
};

// Agregar producto al carrito (POST AJAX)
const agregarAlCarrito = async (req, res) => {
  try {
    if (!req.usuario) {
      return res.status(401).json({ error: "Debes iniciar sesión" });
    }

    const { producto_id, cantidad } = req.body;

    // Validar cantidad
    const cantidadNum = parseInt(cantidad) || 1;
    if (cantidadNum <= 0) {
      return res.status(400).json({ error: "La cantidad debe ser mayor a 0" });
    }

    // Validar que producto exista y esté disponible
    const producto = await Producto.findByPk(producto_id);
    if (!producto || producto.estado !== "publicado") {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    // Validar stock
    if (cantidadNum > producto.stock) {
      return res.status(400).json({ error: "Stock insuficiente" });
    }

    // Obtener o crear carrito
    const carrito = await obtenerCarrito(req.usuario.id);

    // Verificar si el item ya existe en el carrito
    let item = await CarritoItem.findOne({
      where: {
        carrito_id: carrito.id,
        producto_id: producto_id,
      },
    });

    if (item) {
      // Actualizar cantidad
      const nuevaCantidad = item.cantidad + cantidadNum;
      if (nuevaCantidad > producto.stock) {
        return res.status(400).json({ error: "Stock insuficiente para esa cantidad" });
      }
      item.cantidad = nuevaCantidad;
      item.precio_unitario = producto.precio;
      await item.save();
    } else {
      // Crear nuevo item
      item = await CarritoItem.create({
        carrito_id: carrito.id,
        producto_id: producto_id,
        cantidad: cantidadNum,
        precio_unitario: producto.precio,
      });
    }

    // Calcular total del carrito
    const items = await CarritoItem.findAll({
      where: { carrito_id: carrito.id },
    });

    const total = items.reduce(
      (sum, i) => sum + parseFloat(i.precio_unitario) * i.cantidad,
      0
    );

    res.json({
      success: true,
      message: "Producto agregado al carrito",
      carritoItems: items.length,
      carritoTotal: total.toFixed(2),
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error agregando producto" });
  }
};

// Ver carrito
const verCarrito = async (req, res) => {
  try {
    if (!req.usuario) {
      return res.redirect("/auth/login");
    }

    const carrito = await obtenerCarrito(req.usuario.id);

    // Obtener items del carrito
    const items = await CarritoItem.findAll({
      where: { carrito_id: carrito.id },
      raw: false
    });

    // Para cada item, obtener el producto asociado
    for (let item of items) {
      if (item.producto_id) {
        item.Producto = await Producto.findByPk(item.producto_id, {
          attributes: ["id", "nombre", "imagen_principal", "stock"]
        });
        console.log(`Producto ${item.producto_id}:`, item.Producto?.dataValues);
      }
    }

    const subtotal = items.reduce(
      (sum, i) => sum + parseFloat(i.precio_unitario) * i.cantidad,
      0
    );

    const total = subtotal; // Más adelante se puede agregar impuestos/envío

    res.render("carrito/ver", {
      pagina: "Mi Carrito",
      items,
      subtotal: subtotal.toFixed(2),
      total: total.toFixed(2),
      csrfToken: req.csrfToken(),
    });
  } catch (error) {
    console.log(error);
    res.status(500).render("templates/mensaje", {
      tituloPagina: "Error",
      mensaje: "Error cargando el carrito",
    });
  }
};

// Actualizar cantidad de item en carrito
const actualizarItem = async (req, res) => {
  try {
    if (!req.usuario) {
      return res.status(401).json({ error: "Debes iniciar sesión" });
    }

    const { item_id, cantidad } = req.body;
    const cantidadNum = parseInt(cantidad);

    if (cantidadNum < 1) {
      return res.status(400).json({ error: "Cantidad mínima es 1" });
    }

    const item = await CarritoItem.findByPk(item_id);

    if (!item) {
      return res.status(404).json({ error: "Item no encontrado" });
    }

    // Obtener producto asociado
    const producto = await Producto.findByPk(item.producto_id);
    
    if (!producto) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    // Verificar que el item pertenece al carrito del usuario
    const carrito = await Carrito.findOne({
      where: { id: item.carrito_id, usuario_id: req.usuario.id },
    });

    if (!carrito) {
      return res.status(403).json({ error: "No autorizado" });
    }

    // Validar stock
    if (cantidadNum > producto.stock) {
      return res.status(400).json({ error: "Stock insuficiente" });
    }

    item.cantidad = cantidadNum;
    await item.save();

    res.json({ success: true, message: "Item actualizado" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error actualizando item" });
  }
};

// Eliminar item del carrito
const eliminarItem = async (req, res) => {
  try {
    if (!req.usuario) {
      return res.status(401).json({ error: "Debes iniciar sesión" });
    }

    const { item_id } = req.params;

    const item = await CarritoItem.findByPk(item_id);

    if (!item) {
      return res.status(404).json({ error: "Item no encontrado" });
    }

    // Verificar que el item pertenece al carrito del usuario
    const carrito = await Carrito.findOne({
      where: { id: item.carrito_id, usuario_id: req.usuario.id },
    });

    if (!carrito) {
      return res.status(403).json({ error: "No autorizado" });
    }

    await item.destroy();

    res.json({ success: true, message: "Item eliminado" });
  } catch (error) {
    console.log("Error eliminando item:", error);
    res.status(500).json({ error: "Error eliminando item" });
  }
};

// Mostrar formulario de checkout
const formularioCheckout = async (req, res) => {
  try {
    if (!req.usuario) {
      return res.redirect("/auth/login");
    }

    const carrito = await obtenerCarrito(req.usuario.id);

    const items = await CarritoItem.findAll({
      where: { carrito_id: carrito.id },
      include: [{ 
        model: Producto,
        attributes: ["id", "nombre", "stock"],
        required: true
      }],
    });

    if (items.length === 0) {
      return res.redirect("/carrito");
    }

    const subtotal = items.reduce(
      (sum, i) => sum + parseFloat(i.precio_unitario) * i.cantidad,
      0
    );

    res.render("carrito/checkout", {
      pagina: "Finalizar Pedido",
      items,
      subtotal: subtotal.toFixed(2),
      total: subtotal.toFixed(2),
      csrfToken: req.csrfToken(),
    });
  } catch (error) {
    console.log(error);
    res.status(500).render("templates/mensaje", {
      tituloPagina: "Error",
      mensaje: "Error accediendo a checkout",
    });
  }
};

// Procesar checkout y crear pedido
const procesarCheckout = async (req, res) => {
  try {
    if (!req.usuario) {
      return res.status(401).redirect("/auth/login");
    }

    // Validar datos
    await check("direccion_envio")
      .notEmpty()
      .withMessage("La dirección es obligatoria")
      .isLength({ min: 10 })
      .withMessage("La dirección debe tener al menos 10 caracteres")
      .run(req);

    await check("metodo_pago")
      .isIn(["contra_entrega", "tarjeta", "transferencia"])
      .withMessage("Método de pago inválido")
      .run(req);

    const resultado = validationResult(req);

    if (!resultado.isEmpty()) {
      const carrito = await obtenerCarrito(req.usuario.id);
      const items = await CarritoItem.findAll({
        where: { carrito_id: carrito.id },
        include: [{ 
          model: Producto,
          attributes: ["id", "nombre", "stock"],
          required: true
        }],
      });
      const subtotal = items.reduce(
        (sum, i) => sum + parseFloat(i.precio_unitario) * i.cantidad,
        0
      );

      return res.render("carrito/checkout", {
        pagina: "Finalizar Pedido",
        items,
        subtotal: subtotal.toFixed(2),
        total: subtotal.toFixed(2),
        errores: resultado.array(),
        csrfToken: req.csrfToken(),
      });
    }

    const { direccion_envio, metodo_pago } = req.body;

    const carrito = await obtenerCarrito(req.usuario.id);

    const items = await CarritoItem.findAll({
      where: { carrito_id: carrito.id },
    });

    if (items.length === 0) {
      return res.status(400).render("templates/mensaje", {
        tituloPagina: "Carrito vacío",
        mensaje: "No hay productos en tu carrito",
      });
    }

    // Cargar productos para cada item
    for (let item of items) {
      item.Producto = await Producto.findByPk(item.producto_id, {
        attributes: ["id", "nombre", "stock", "estado"]
      });
    }

    // Calcular total y validar stock
    let total = 0;
    for (const item of items) {
      if (!item.Producto) {
        return res.status(400).render("templates/mensaje", {
          tituloPagina: "Producto no encontrado",
          mensaje: "Uno de los productos en tu carrito ya no existe",
        });
      }
      if (item.cantidad > item.Producto.stock) {
        return res.status(400).render("templates/mensaje", {
          tituloPagina: "Stock insuficiente",
          mensaje: `No hay suficiente stock de ${item.Producto.nombre}`,
        });
      }
      total += parseFloat(item.precio_unitario) * item.cantidad;
    }

    // Crear pedido dentro de una transacción para garantizar consistencia
    const t = await db.transaction();
    try {
      const pedido = await Pedido.create(
        {
          usuario_id: req.usuario.id,
          total: total,
          estado: "pendiente",
          direccion_envio,
          metodo_pago,
        },
        { transaction: t }
      );

      // Crear PedidoItems y descontar stock
      for (const item of items) {
        await PedidoItem.create(
          {
            pedido_id: pedido.id,
            producto_id: item.producto_id,
            cantidad: item.cantidad,
            precio_unitario: item.precio_unitario,
            subtotal: parseFloat(item.precio_unitario) * item.cantidad,
          },
          { transaction: t }
        );

        // Descontar stock
        const producto = item.Producto;
        producto.stock = producto.stock - item.cantidad;
        if (producto.stock < 0) producto.stock = 0;

        // Si el stock llega a 0, marcar como no disponible
        if (producto.stock === 0) {
          // usar el nuevo estado 'no disponible'
          producto.estado = "no disponible";
        }

        await producto.save({ transaction: t });
      }

      // Marcar carrito como convertido
      carrito.estado = "convertido_en_pedido";
      await carrito.save({ transaction: t });

      // Limpiar carrito items
      await CarritoItem.destroy({ where: { carrito_id: carrito.id }, transaction: t });

      await t.commit();

      // renderizar confirmación fuera de la transacción
      const pedidoConfirm = await Pedido.findByPk(pedido.id, {
        include: [{
          model: PedidoItem,
          include: [{
            model: Producto,
            attributes: ["id", "nombre"]
          }]
        }]
      });

      res.render("carrito/confirmacion", {
        pagina: "Pedido Confirmado",
        pedido: pedidoConfirm,
        total: total.toFixed(2),
      });
      return;
    } catch (txErr) {
      await t.rollback();
      console.log("Error en transacción de checkout:", txErr);
      return res.status(500).render("templates/mensaje", {
        tituloPagina: "Error",
        mensaje: "Error procesando el pedido. Intenta de nuevo.",
      });
    }

    // Nota: el flujo normal ya contesta dentro de la transacción arriba.
  } catch (error) {
    console.log("Error en checkout:", error);
    res.status(500).render("templates/mensaje", {
      tituloPagina: "Error",
      mensaje: "Error procesando el pedido. Intenta de nuevo.",
    });
  }
};

export {
  agregarAlCarrito,
  verCarrito,
  actualizarItem,
  eliminarItem,
  formularioCheckout,
  procesarCheckout,
};
