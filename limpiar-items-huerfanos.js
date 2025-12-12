import sequelize from './config/db.js';
import { CarritoItem } from './models/index.js';

async function limpiarItemsHuerfanos() {
  try {
    console.log('🧹 Eliminando items sin producto...\n');

    const resultado = await CarritoItem.destroy({
      where: {
        producto_id: {
          [sequelize.Sequelize.Op.notIn]: sequelize.literal('(SELECT id FROM productos)')
        }
      }
    });

    console.log(`✅ Eliminados ${resultado} items sin producto\n`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

limpiarItemsHuerfanos();
