import { check, validationResult } from "express-validator";
import path from "path";
import fs from "fs";
import { Op } from "sequelize";
import Producto from "../models/Producto.js";
import Categoria from "../models/Categoria.js";

// Mostrar formulario nuevo producto (admin)
const formularioNuevo = async (req, res) => {
  const categorias = await Categoria.findAll();
  res.render("productos/nuevo", {
    pagina: "Nuevo Producto",
    categorias,
    csrfToken: req.csrfToken(),
  });
};

// Procesar nuevo producto
const guardarNuevo = async (req, res) => {
  // Validaciones
  await check("nombre")
    .notEmpty()
    .withMessage("El nombre es obligatorio")
    .isLength({ min: 3, max: 255 })
    .withMessage("El nombre debe tener entre 3 y 255 caracteres")
    .run(req);
  
  await check("precio")
    .notEmpty()
    .withMessage("El precio es obligatorio")
    .isFloat({ min: 0.01 })
    .withMessage("El precio debe ser mayor a 0")
    .run(req);
  
  await check("stock")
    .notEmpty()
    .withMessage("El stock es obligatorio")
    .isInt({ min: 0 })
    .withMessage("El stock debe ser un número entero no negativo")
    .run(req);
  
  await check("categoria_id")
    .optional()
    .isInt()
    .withMessage("Categoría inválida")
    .custom(async (value) => {
      if (value) {
        const categoria = await Categoria.findByPk(value);
        if (!categoria) {
          throw new Error("La categoría seleccionada no existe");
        }
      }
      return true;
    })
    .run(req);

  const resultado = validationResult(req);
  const categorias = await Categoria.findAll();

  if (!resultado.isEmpty()) {
    // eliminar archivo si se subió
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    return res.render("productos/nuevo", {
      pagina: "Nuevo Producto",
      errores: resultado.array(),
      categorias,
      producto: req.body,
      csrfToken: req.csrfToken(),
    });
  }

    if (!req.file) {
      return res.render("productos/nuevo", {
        pagina: "Nuevo Producto",
        errores: [{ msg: "La imagen es obligatoria" }],
        categorias,
        producto: req.body,
        csrfToken: req.csrfToken(),
      });
    }

    // Validar extensión de imagen
    const extensionesPermitidas = ['.jpg', '.jpeg', '.png', '.gif'];
    const ext = path.extname(req.file.originalname).toLowerCase();
    if (!extensionesPermitidas.includes(ext)) {
      fs.unlinkSync(req.file.path);
      return res.render("productos/nuevo", {
        pagina: "Nuevo Producto",
        errores: [{ msg: "Formato de imagen no válido. Solo JPG, JPEG, PNG o GIF" }],
        categorias,
        producto: req.body,
        csrfToken: req.csrfToken(),
      });
    }

    // Validar tamaño de imagen (máx 5MB)
    if (req.file.size > 5 * 1024 * 1024) {
      fs.unlinkSync(req.file.path);
      return res.render("productos/nuevo", {
        pagina: "Nuevo Producto",
        errores: [{ msg: "La imagen no debe superar los 5MB" }],
        categorias,
        producto: req.body,
        csrfToken: req.csrfToken(),
      });
    }

    try {
      const { nombre, descripcion, precio, stock, categoria_id } = req.body;

      const imagen_principal = req.file
        ? `/uploads/productos/${req.file.filename}`
        : null;

      const nuevoProducto = await Producto.create({
        nombre,
        descripcion: descripcion || null,
        precio: parseFloat(precio),
        stock: parseInt(stock),
        estado: "publicado",
        categoria_id: categoria_id || null,
        imagen_principal,
    });

    console.log("Producto creado:", nuevoProducto.id);
    return res.redirect("/admin/productos");
  } catch (error) {
    console.log("Error guardando producto:", error);
    if (req.file) fs.unlinkSync(req.file.path);
    return res.render("productos/nuevo", {
      pagina: "Nuevo Producto",
      errores: [{ msg: "Error guardando el producto. Intenta de nuevo." }],
      categorias,
      producto: req.body,
      csrfToken: req.csrfToken(),
    });
  }
};

// Listado público de productos publicados con filtros
const listadoPublico = async (req, res) => {
  const { categoria, precioMin, precioMax, orden, buscar } = req.query;

  // Construir condiciones WHERE
  const where = { estado: "publicado" };

  if (buscar) {
    where[Op.or] = [
      { nombre: { [Op.like]: `%${buscar}%` } },
      { descripcion: { [Op.like]: `%${buscar}%` } },
    ];
  }

  if (categoria) {
    where.categoria_id = categoria;
  }

  if (precioMin || precioMax) {
    where.precio = {};
    if (precioMin) where.precio[Op.gte] = parseFloat(precioMin);
    if (precioMax) where.precio[Op.lte] = parseFloat(precioMax);
  }

  // Definir orden
  let order = [["fecha_creacion", "DESC"]];
  if (orden === "precioAsc") {
    order = [["precio", "ASC"]];
  } else if (orden === "precioDesc") {
    order = [["precio", "DESC"]];
  } else if (orden === "nombre") {
    order = [["nombre", "ASC"]];
  }

  try {
    const productos = await Producto.findAll({
      where,
      order,
      include: [{ model: Categoria, attributes: ["id", "nombre", "slug"] }],
    });

    const categorias = await Categoria.findAll({ where: { estado: "activo" } });

    // Obtener nombre de categoría si hay filtro por categoría
    let nombreCategoria = null;
    if (categoria) {
      const categoriaSeleccionada = await Categoria.findByPk(categoria);
      if (categoriaSeleccionada) {
        nombreCategoria = categoriaSeleccionada.nombre;
      }
    }

    return res.render("productos/listado", {
      pagina: nombreCategoria || "Productos",
      productos,
      categorias,
      filtros: { categoria, precioMin, precioMax, orden, buscar },
    });
  } catch (error) {
    console.error('Error en listadoPublico:', error);
    if (error.sql) console.error('SQL:', error.sql);

    // Fallback: si el error parece por columna faltante (p.ej. fecha_creacion), intentar ordenar por id
    const msg = (error.message || '').toLowerCase();
    if (msg.includes('unknown column') || msg.includes('fecha_creacion')) {
      try {
        const productos = await Producto.findAll({
          where,
          order: [["id", "DESC"]],
          include: [{ model: Categoria, attributes: ["id", "nombre", "slug"] }],
        });
        const categorias = await Categoria.findAll({ where: { estado: "activo" } });
        return res.render("productos/listado", {
          pagina: "Productos",
          productos,
          categorias,
          filtros: { categoria, precioMin, precioMax, orden, buscar },
        });
      } catch (err2) {
        console.error('Fallback también falló:', err2);
        if (err2.sql) console.error('SQL fallback:', err2.sql);
      }
    }

    // Si todo falla, mostrar página con lista vacía y mensaje amigable
    const categorias = [];
    return res.status(500).render('templates/mensaje', {
      tituloPagina: 'Error',
      mensaje: 'Hubo un error cargando los productos. Revisa la consola del servidor para más detalles.'
    });
  }
};

// Listado admin (gestionar)
const listadoAdmin = async (req, res) => {
  try {
    const { categoria, buscar } = req.query;
    
    // Si no hay búsqueda ni categoría, mostrar la vista de gestión
    if (!buscar && !categoria) {
      const productos = await Producto.findAll({
        order: [["fecha_creacion", "DESC"]],
        include: [{ model: Categoria, attributes: ["id", "nombre", "slug"] }],
      });

      return res.render("productos/gestion", {
        tituloPagina: "Gestionar Productos",
        productos,
        csrfToken: req.csrfToken(),
      });
    }

    // Si hay búsqueda o categoría, mostrar el dashboard con resultados
    let where = {};
    let categoriaSeleccionada = null;

    // Filtrar por categoría (si se pasa ID directamente)
    if (categoria) {
      where.categoria_id = parseInt(categoria);
      // Obtener info de la categoría seleccionada
      categoriaSeleccionada = await Categoria.findByPk(categoria, {
        attributes: ["id", "nombre"],
      });
    }

    // Filtrar por búsqueda de nombre de producto o categoría
    if (buscar && buscar.trim()) {
      const buscarTrim = buscar.trim();
      
      // Primero buscar si hay categorías que coincidan
      const categoriasCoincidentes = await Categoria.findAll({
        where: {
          nombre: { [Op.like]: `%${buscarTrim}%` }
        },
        attributes: ['id']
      });

      const idsCategoriasCoincidentes = categoriasCoincidentes.map(cat => cat.id);

      // Buscar productos que coincidan por nombre O por ID de categoría encontrada
      if (idsCategoriasCoincidentes.length > 0) {
        where[Op.or] = [
          { nombre: { [Op.like]: `%${buscarTrim}%` } },
          { categoria_id: { [Op.in]: idsCategoriasCoincidentes } }
        ];
      } else {
        // Solo buscar por nombre de producto
        where.nombre = { [Op.like]: `%${buscarTrim}%` };
      }
    }

    const productos = await Producto.findAll({
      where,
      order: [["fecha_creacion", "DESC"]],
      include: [{ model: Categoria, attributes: ["id", "nombre", "slug"] }],
    });

    return res.render("dashboard", {
      tituloPagina: buscar ? `Resultados de búsqueda: "${buscar}"` : (categoriaSeleccionada ? `Productos - ${categoriaSeleccionada.nombre}` : "Panel de Administración"),
      productos,
      filtros: { categoria, buscar },
      categoriaSeleccionada,
      csrfToken: req.csrfToken(),
    });
  } catch (error) {
    console.error('Error en listadoAdmin:', error);
    // If Sequelize provides SQL information, log it too
    if (error.sql) console.error('SQL:', error.sql);
    return res.status(500).render('templates/mensaje', {
      tituloPagina: 'Error',
      mensaje: 'Error cargando productos. Revisa los logs del servidor para más detalles.'
    });
  }
};

// Ver detalle de un producto
const verDetalle = async (req, res) => {
  const { id } = req.params;

  const producto = await Producto.findByPk(id, {
    include: [{ model: Categoria, attributes: ["id", "nombre", "slug"] }],
  });

  if (!producto || producto.estado !== "publicado") {
    return res.status(404).render("templates/mensaje", {
      tituloPagina: "Producto no encontrado",
      mensaje: "El producto que buscas no existe o no está disponible.",
      enlace: "/productos",
      textoEnlace: "Volver a productos",
    });
  }

  // Obtener productos relacionados (misma categoría)
  const relacionados = await Producto.findAll({
    where: {
      estado: "publicado",
      categoria_id: producto.categoria_id,
      id: { [Op.ne]: id },
    },
    limit: 4,
    order: [["fecha_creacion", "DESC"]],
  });

  res.render("productos/detalle", {
    pagina: producto.nombre,
    producto,
    relacionados,
    csrfToken: req.csrfToken(),
  });
};

// Productos destacados para el home
const productosDestacados = async () => {
  try {
    const productos = await Producto.findAll({
      where: { estado: "publicado" },
      order: [["fecha_creacion", "DESC"]],
      limit: 6,
      include: [{ model: Categoria, attributes: ["nombre", "slug"] }],
    });

    return productos;
  } catch (error) {
    console.error('Error cargando productos destacados:', error);
    if (error.sql) console.error('SQL:', error.sql);
    return [];
  }
};

// Mostrar formulario editar producto (admin)
const formularioEditar = async (req, res) => {
  const { id } = req.params;

  try {
    const producto = await Producto.findByPk(id);
    
    if (!producto) {
      return res.status(404).render("templates/mensaje", {
        tituloPagina: "No encontrado",
        mensaje: "Producto no encontrado",
      });
    }

    const categorias = await Categoria.findAll();

    res.render("productos/editar", {
      pagina: "Editar Producto",
      producto,
      categorias,
      csrfToken: req.csrfToken(),
    });
  } catch (error) {
    console.log("Error cargando producto:", error);
    res.status(500).render("templates/mensaje", {
      tituloPagina: "Error",
      mensaje: "Error cargando el producto",
    });
  }
};

// Actualizar producto (admin)
const actualizarProducto = async (req, res) => {
  const { id } = req.params;

  // Validaciones
  await check("nombre")
    .notEmpty()
    .withMessage("El nombre es obligatorio")
    .isLength({ min: 3, max: 255 })
    .withMessage("El nombre debe tener entre 3 y 255 caracteres")
    .run(req);
  
  await check("precio")
    .notEmpty()
    .withMessage("El precio es obligatorio")
    .isFloat({ min: 0.01 })
    .withMessage("El precio debe ser mayor a 0")
    .run(req);
  
  await check("stock")
    .notEmpty()
    .withMessage("El stock es obligatorio")
    .isInt({ min: 0 })
    .withMessage("El stock debe ser un número entero no negativo")
    .run(req);
  
  await check("categoria_id")
    .optional()
    .isInt()
    .withMessage("Categoría inválida")
    .custom(async (value) => {
      if (value) {
        const categoria = await Categoria.findByPk(value);
        if (!categoria) {
          throw new Error("La categoría seleccionada no existe");
        }
      }
      return true;
    })
    .run(req);

  const resultado = validationResult(req);
  const categorias = await Categoria.findAll();

  try {
    const producto = await Producto.findByPk(id);

    if (!producto) {
      return res.status(404).render("templates/mensaje", {
        tituloPagina: "No encontrado",
        mensaje: "Producto no encontrado",
      });
    }

    if (!resultado.isEmpty()) {
      // eliminar archivo si se subió
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.render("productos/editar", {
        pagina: "Editar Producto",
        errores: resultado.array(),
        categorias,
        producto: { id, ...req.body },
        csrfToken: req.csrfToken(),
      });
    }

    const { nombre, descripcion, precio, stock, categoria_id, estado } = req.body;

    // Si se sube nueva imagen, validar y eliminar la anterior
    if (req.file) {
      // Validar extensión
      const extensionesPermitidas = ['.jpg', '.jpeg', '.png', '.gif'];
      const ext = path.extname(req.file.originalname).toLowerCase();
      if (!extensionesPermitidas.includes(ext)) {
        fs.unlinkSync(req.file.path);
        return res.render("productos/editar", {
          pagina: "Editar Producto",
          errores: [{ msg: "Formato de imagen no válido. Solo JPG, JPEG, PNG o GIF" }],
          categorias,
          producto: { id, ...req.body },
          csrfToken: req.csrfToken(),
        });
      }

      // Validar tamaño (máx 5MB)
      if (req.file.size > 5 * 1024 * 1024) {
        fs.unlinkSync(req.file.path);
        return res.render("productos/editar", {
          pagina: "Editar Producto",
          errores: [{ msg: "La imagen debe pesar menos de 5MB" }],
          categorias,
          producto: { id, ...req.body },
          csrfToken: req.csrfToken(),
        });
      }

      // Eliminar imagen anterior si existe
      if (producto.imagen_principal) {
        const imagenAnterior = path.join(process.cwd(), "public", producto.imagen_principal);
        if (fs.existsSync(imagenAnterior)) {
          fs.unlinkSync(imagenAnterior);
        }
      }

      // Actualizar con nueva imagen
      producto.imagen_principal = `/uploads/productos/${req.file.filename}`;
    }

    // Actualizar datos
    producto.nombre = nombre;
    producto.descripcion = descripcion || null;
    producto.precio = parseFloat(precio);
    producto.stock = parseInt(stock);
    producto.categoria_id = categoria_id || null;
    producto.estado = estado || producto.estado;

    await producto.save();

    console.log("Producto actualizado:", producto.id);
    return res.redirect("/admin/productos");
  } catch (error) {
    console.log("Error actualizando producto:", error);
    if (req.file) fs.unlinkSync(req.file.path);
    return res.render("productos/editar", {
      pagina: "Editar Producto",
      errores: [{ msg: "Error actualizando el producto. Intenta de nuevo." }],
      categorias,
      producto: { id, ...req.body },
      csrfToken: req.csrfToken(),
    });
  }
};

// Ver detalle de un producto en admin
const verDetalleAdmin = async (req, res) => {
  const { id } = req.params;

  try {
    const producto = await Producto.findByPk(id, {
      include: [{ model: Categoria, attributes: ["id", "nombre", "slug"] }],
    });

    if (!producto) {
      return res.status(404).render("templates/mensaje", {
        tituloPagina: "Producto no encontrado",
        mensaje: "El producto que buscas no existe.",
        enlace: "/admin/productos",
        textoEnlace: "Volver a productos",
      });
    }

    res.render("productos/detalleAdmin", {
      pagina: `${producto.nombre}`,
      producto,
      csrfToken: req.csrfToken(),
    });
  } catch (error) {
    console.error("Error en verDetalleAdmin:", error);
    return res.status(500).render("templates/mensaje", {
      tituloPagina: "Error",
      mensaje: "Error cargando el producto.",
      enlace: "/admin/productos",
      textoEnlace: "Volver a productos",
    });
  }
};

export { 
  formularioNuevo, 
  guardarNuevo,
  formularioEditar,
  actualizarProducto,
  listadoPublico, 
  listadoAdmin, 
  verDetalle,
  verDetalleAdmin,
  productosDestacados 
};