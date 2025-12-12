import { Sequelize } from "sequelize";
import { productosDestacados } from "./productcontrollers.js";
import Producto from "../models/Producto.js";
import Categoria from "../models/Categoria.js";


const inicio = async (req, res) => {
  try {
    const productos = await Producto.findAll({
      include: [{ model: Categoria, attributes: ["id", "nombre"] }],
      order: [["fecha_creacion", "DESC"]],
      limit: 12,
    });
    
    res.render("dashboard", {
      tituloPagina: "Panel de Administración",
      productos,
      csrfToken: req.csrfToken(),
    });
  } catch (error) {
    console.error('Error en inicio:', error);
    res.render("dashboard", {
      tituloPagina: "Panel de Administración",
      productos: [],
      csrfToken: req.csrfToken(),
    });
  }
};

const home = async (req, res) => {
  const productos = await productosDestacados();
  
  res.render("index", {
    pagina: "Inicio",
    productos,
    csrfToken: req.csrfToken(),
  });
};

export{
    inicio,
    home
}