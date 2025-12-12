import { DataTypes } from "sequelize";
import db from "../config/db.js";

const Carrito = db.define(
  "carritos",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    usuario_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    estado: {
      type: DataTypes.ENUM("activo", "convertido_en_pedido"),
      allowNull: false,
      defaultValue: "activo",
    },
  },
  {
    timestamps: true,
    createdAt: "fecha_creacion",
    updatedAt: "fecha_actualizacion",
  }
);

export default Carrito;
