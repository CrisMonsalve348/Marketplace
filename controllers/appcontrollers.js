import { Sequelize } from "sequelize";
import { productosDestacados } from "./productcontrollers.js";


const inicio =  (req, res) => {
    res.render("dashboard", {
    tituloPagina: "Panel de Administración",
     csrfToken: req.csrfToken(),
  });
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