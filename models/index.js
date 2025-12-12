import Usuario from "./Usuario.js";
import Producto from "./Producto.js";
import Categoria from "./Categoria.js";
import ImagenProducto from "./ImagenProducto.js";
import Carrito from "./Carrito.js";
import CarritoItem from "./CarritoItem.js";
import Pedido from "./Pedido.js";
import PedidoItem from "./PedidoItem.js";

// Asociaciones Usuario
Usuario.hasMany(Producto, { foreignKey: "usuario_id" });
Usuario.hasMany(Carrito, { foreignKey: "usuario_id" });
Usuario.hasMany(Pedido, { foreignKey: "usuario_id" });

// Asociaciones Categoria
Categoria.hasMany(Producto, { foreignKey: "categoria_id" });

// Asociaciones Producto
Producto.belongsTo(Usuario, { foreignKey: "usuario_id" });
Producto.belongsTo(Categoria, { foreignKey: "categoria_id" });
Producto.hasMany(ImagenProducto, { foreignKey: "producto_id" });
Producto.hasMany(CarritoItem, { foreignKey: "producto_id" });
Producto.hasMany(PedidoItem, { foreignKey: "producto_id" });

// Asociaciones ImagenProducto
ImagenProducto.belongsTo(Producto, { foreignKey: "producto_id" });

// Asociaciones Carrito
Carrito.belongsTo(Usuario, { foreignKey: "usuario_id" });
Carrito.hasMany(CarritoItem, { foreignKey: "carrito_id" });

// Asociaciones CarritoItem
CarritoItem.belongsTo(Carrito, { foreignKey: "carrito_id" });
CarritoItem.belongsTo(Producto, { foreignKey: "producto_id" });

// Asociaciones Pedido
Pedido.belongsTo(Usuario, { foreignKey: "usuario_id" });
Pedido.hasMany(PedidoItem, { foreignKey: "pedido_id" });

// Asociaciones PedidoItem
PedidoItem.belongsTo(Pedido, { foreignKey: "pedido_id" });
PedidoItem.belongsTo(Producto, { foreignKey: "producto_id" });

export {
  Usuario,
  Producto,
  Categoria,
  ImagenProducto,
  Carrito,
  CarritoItem,
  Pedido,
  PedidoItem,
};
