const { Empresa, sequelize } = require('./models');

const seedData = async () => {
  try {
    // Sincronizar sin forzar la eliminacion de la bd por completo para seguridad temporal:
    await sequelize.sync(); 
    
    // Solo carga si no hay datos
    const count = await Empresa.count();
    if (count > 0) {
      console.log("Ya existen empresas en la BD. Saltando seed.");
      process.exit();
    }

    const empresas = [
      { nombre: 'TUBOS Y METALES' },
      { nombre: 'QUEBRACHO' },
      { nombre: 'HUMBERTO RODRIGUEZ' },
      { nombre: 'DARAS INGENIERIA' },
      { nombre: 'ELECTROMAC' },
      { nombre: 'SERVILOGISTIC' }
    ];

    for (const emp of empresas) {
      await Empresa.create(emp);
    }
    
    console.log("Datos de prueba cargados correctamente.");
    process.exit();
  } catch(e) {
    console.error("Error cargando DB:", e);
    process.exit(1);
  }
};

seedData();
