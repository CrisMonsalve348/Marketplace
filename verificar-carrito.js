import sequelize from './config/db.js';
import { Carrito, CarritoItem, Producto, Usuario } from './models/index.js';

async function verificarCarrito() {
  try {
    console.log('🔍 Verificando base de datos del carrito...\n');

    // Mostrar todos los carritos activos
    const carritos = await Carrito.findAll({
      where: { estado: 'activo' },
      include: [
        {
          model: Usuario,
          attributes: ['id', 'email', 'nombre']
        }
      ]
    });

    console.log(`📦 Total de carritos activos: ${carritos.length}\n`);

    for (const carrito of carritos) {
      console.log(`═══════════════════════════════════════`);
      console.log(`🛒 Carrito ID: ${carrito.id}`);
      console.log(`👤 Usuario: ${carrito.Usuario?.email || 'No definido'}`);
      console.log(`═══════════════════════════════════════`);

      // Mostrar items en cada carrito
      const items = await CarritoItem.findAll({
        where: { carrito_id: carrito.id },
        include: [
          {
            model: Producto,
            attributes: ['id', 'nombre', 'precio', 'stock']
          }
        ]
      });

      console.log(`📋 Items en carrito: ${items.length}`);

      if (items.length > 0) {
        console.log('\n┌─────────────────────────────────────────────────────┐');
        items.forEach((item, index) => {
          console.log(`\n${index + 1}. Item ID: ${item.id}`);
          console.log(`   Cantidad: ${item.cantidad}`);
          console.log(`   Precio unitario: $${item.precio_unitario}`);
          console.log(`   Subtotal: $${(item.precio_unitario * item.cantidad).toFixed(2)}`);
          if (item.Producto) {
            console.log(`   ✅ Producto: ${item.Producto.nombre}`);
            console.log(`   Stock disponible: ${item.Producto.stock}`);
          } else {
            console.log(`   ❌ Producto: ELIMINADO`);
          }
        });
        console.log('\n└─────────────────────────────────────────────────────┘');

        // Calcular totales
        const subtotal = items.reduce((sum, item) => sum + (parseFloat(item.precio_unitario) * item.cantidad), 0);
        console.log(`\n💰 Subtotal: $${subtotal.toFixed(2)}`);
      } else {
        console.log(`   ⚠️  Carrito vacío\n`);
      }

      console.log('\n');
    }

    if (carritos.length === 0) {
      console.log('⚠️  No hay carritos activos en la base de datos');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

verificarCarrito();
