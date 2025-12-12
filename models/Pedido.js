import { DataTypes } from "sequelize";
import db from "../config/db.js";

const Pedido = db.define(
  "pedidos",
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
    total: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.0,
    },
    estado: {
      type: DataTypes.ENUM("pendiente", "pagado", "enviado", "cancelado"),
      allowNull: false,
      defaultValue: "pendiente",
    },
    direccion_envio: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    metodo_pago: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    admin_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "Usuario admin que cambió el estado",
    },
    fecha_cambio_estado: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: "Fecha cuando se cambió el estado",
    },
  },
  {
    timestamps: true,
    createdAt: "fecha_creacion",
    updatedAt: "fecha_actualizacion",
  }
);

export default Pedido;
