import db from './config/db.js';

const limpiarCarritos = async () => {
  try {
    await db.authenticate();
    console.log('Conexión a la base de datos establecida');
    
    const [results] = await db.query('DELETE FROM carrito_items');
    console.log(`Se eliminaron ${results.affectedRows} items del carrito`);
    
    await db.close();
    console.log('Carritos limpiados exitosamente');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

limpiarCarritos();
