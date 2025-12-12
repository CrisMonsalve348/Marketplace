import { check, validationResult } from "express-validator";
import Categoria from "../models/Categoria.js";

// Listar categorías (Admin)
const listadoCategorias = async (req, res) => {
  try {
    const categorias = await Categoria.findAll({
      order: [["nombre", "ASC"]],
    });

    res.render("admin/categorias/listado", {
      tituloPagina: "Gestión de Categorías",
      categorias,
      csrfToken: req.csrfToken(),
    });
  } catch (error) {
    console.log("Error listando categorías:", error);
    res.status(500).render("templates/mensaje", {
      tituloPagina: "Error",
      mensaje: "Error cargando categorías",
    });
  }
};

// Formulario nueva categoría
const formularioNuevaCategoria = (req, res) => {
  res.render("admin/categorias/nueva", {
    tituloPagina: "Nueva Categoría",
    csrfToken: req.csrfToken(),
  });
};

// Guardar nueva categoría
const guardarCategoria = async (req, res) => {
  // Validaciones
  await check("nombre")
    .notEmpty()
    .withMessage("El nombre es obligatorio")
    .isLength({ min: 2, max: 100 })
    .withMessage("El nombre debe tener entre 2 y 100 caracteres")
    .run(req);

  await check("slug")
    .notEmpty()
    .withMessage("El slug es obligatorio")
    .matches(/^[a-z0-9-]+$/)
    .withMessage("El slug solo puede contener letras minúsculas, números y guiones")
    .run(req);

  const resultado = validationResult(req);

  if (!resultado.isEmpty()) {
    return res.render("admin/categorias/nueva", {
      tituloPagina: "Nueva Categoría",
      errores: resultado.array(),
      categoria: req.body,
      csrfToken: req.csrfToken(),
    });
  }

  try {
    const { nombre, descripcion, slug, estado } = req.body;

    // Verificar que el slug sea único
    const categoriaExistente = await Categoria.findOne({ where: { slug } });
    if (categoriaExistente) {
      return res.render("admin/categorias/nueva", {
        tituloPagina: "Nueva Categoría",
        errores: [{ msg: "El slug ya está en uso. Elige otro." }],
        categoria: req.body,
        csrfToken: req.csrfToken(),
      });
    }

    await Categoria.create({
      nombre,
      descripcion: descripcion || null,
      slug,
      estado: estado || "activo",
    });

    res.redirect("/admin/categorias");
  } catch (error) {
    console.log("Error guardando categoría:", error);
    res.render("admin/categorias/nueva", {
      tituloPagina: "Nueva Categoría",
      errores: [{ msg: "Error guardando la categoría. Intenta de nuevo." }],
      categoria: req.body,
      csrfToken: req.csrfToken(),
    });
  }
};

// Formulario editar categoría
const formularioEditarCategoria = async (req, res) => {
  const { id } = req.params;

  try {
    const categoria = await Categoria.findByPk(id);

    if (!categoria) {
      return res.status(404).render("templates/mensaje", {
        tituloPagina: "No encontrado",
        mensaje: "Categoría no encontrada",
      });
    }

    res.render("admin/categorias/editar", {
      tituloPagina: "Editar Categoría",
      categoria,
      csrfToken: req.csrfToken(),
    });
  } catch (error) {
    console.log("Error cargando categoría:", error);
    res.status(500).render("templates/mensaje", {
      tituloPagina: "Error",
      mensaje: "Error cargando la categoría",
    });
  }
};

// Actualizar categoría
const actualizarCategoria = async (req, res) => {
  const { id } = req.params;

  // Validaciones
  await check("nombre")
    .notEmpty()
    .withMessage("El nombre es obligatorio")
    .isLength({ min: 2, max: 100 })
    .withMessage("El nombre debe tener entre 2 y 100 caracteres")
    .run(req);

  await check("slug")
    .notEmpty()
    .withMessage("El slug es obligatorio")
    .matches(/^[a-z0-9-]+$/)
    .withMessage("El slug solo puede contener letras minúsculas, números y guiones")
    .run(req);

  const resultado = validationResult(req);

  if (!resultado.isEmpty()) {
    return res.render("admin/categorias/editar", {
      tituloPagina: "Editar Categoría",
      errores: resultado.array(),
      categoria: { id, ...req.body },
      csrfToken: req.csrfToken(),
    });
  }

  try {
    const categoria = await Categoria.findByPk(id);

    if (!categoria) {
      return res.status(404).render("templates/mensaje", {
        tituloPagina: "No encontrado",
        mensaje: "Categoría no encontrada",
      });
    }

    const { nombre, descripcion, slug, estado } = req.body;

    // Verificar que el slug sea único (excepto para la categoría actual)
    const categoriaConSlug = await Categoria.findOne({ where: { slug } });
    if (categoriaConSlug && categoriaConSlug.id !== parseInt(id)) {
      return res.render("admin/categorias/editar", {
        tituloPagina: "Editar Categoría",
        errores: [{ msg: "El slug ya está en uso. Elige otro." }],
        categoria: { id, ...req.body },
        csrfToken: req.csrfToken(),
      });
    }

    // Actualizar
    categoria.nombre = nombre;
    categoria.descripcion = descripcion || null;
    categoria.slug = slug;
    categoria.estado = estado || "activo";

    await categoria.save();

    res.redirect("/admin/categorias");
  } catch (error) {
    console.log("Error actualizando categoría:", error);
    res.render("admin/categorias/editar", {
      tituloPagina: "Editar Categoría",
      errores: [{ msg: "Error actualizando la categoría. Intenta de nuevo." }],
      categoria: { id, ...req.body },
      csrfToken: req.csrfToken(),
    });
  }
};

// Eliminar categoría
const eliminarCategoria = async (req, res) => {
  const { id } = req.params;

  try {
    const categoria = await Categoria.findByPk(id);

    if (!categoria) {
      return res.status(404).json({
        error: "Categoría no encontrada",
      });
    }

    await categoria.destroy();

    res.redirect("/admin/categorias");
  } catch (error) {
    console.log("Error eliminando categoría:", error);
    res.status(500).json({
      error: "Error eliminando la categoría",
    });
  }
};

export {
  listadoCategorias,
  formularioNuevaCategoria,
  guardarCategoria,
  formularioEditarCategoria,
  actualizarCategoria,
  eliminarCategoria,
};
