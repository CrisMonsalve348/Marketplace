import { Sequelize } from "sequelize";


const inicio =  (req, res) => {
    res.render("dashboard", {
    pagina: "Inicio",
     csrfToken: req.csrfToken(),
  });
};

export{
    inicio


}