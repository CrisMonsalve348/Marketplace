import sequelize from './config/db.js';
import { Carrito, CarritoItem, Producto, Usuario } from './models/index.js';
import { Op } from 'sequelize';

async function diagnosticar() {
  try {
    console.log('🔎 Diagnóstico detallado del carrito...\n');

    // Carrito 2 que tiene items
    const carrito = await Carrito.findByPk(2);
    console.log(`Carrito ID: ${carrito.id}\n`);

    // Items del carrito sin relaciones
    const items = await CarritoItem.findAll({
      where: { carrito_id: 2 },
      raw: true
    });

    console.log('📋 Items crudos del carrito:');
    console.log(JSON.stringify(items, null, 2));
    console.log('\n');

    // Verificar si esos producto_ids existen
    const productosIds = items.map(i => i.producto_id);
    console.log(`🔍 Buscando productos con IDs: ${productosIds.join(', ')}`);

    const productos = await Producto.findAll({
      where: { id: { [Op.in]: productosIds } },
      raw: true
    });

    console.log(`\n✅ Productos encontrados: ${productos.length}`);
    console.log(JSON.stringify(productos, null, 2));

    // Ahora con include
    console.log('\n\n📦 Items con include:');
    const itemsConInclude = await CarritoItem.findAll({
      where: { carrito_id: 2 },
      include: [
        {
          model: Producto,
          attributes: ['id', 'nombre', 'precio'],
          required: false
        }
      ]
    });

    itemsConInclude.forEach((item, i) => {
      console.log(`\nItem ${i + 1}:`);
      console.log(`  ID: ${item.id}`);
      console.log(`  Producto ID: ${item.producto_id}`);
      console.log(`  Producto: ${item.Producto ? item.Producto.nombre : 'NULL'}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

diagnosticar();
