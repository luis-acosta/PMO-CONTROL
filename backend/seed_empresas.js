const { Empresa, Mantenimiento, sequelize } = require('./models');
const path = require('path');
const fs = require('fs');

async function seedEmpresas() {
  try {
    const count = await Empresa.count();
    if (count > 0) {
      console.log(`ℹ️  Seed omitido: ya existen ${count} empresas en la base de datos.`);
      return;
    }

    console.log('🌱 Base de datos vacía. Cargando datos iniciales...');

    const dataPath = path.join(__dirname, 'seed_data.json');
    if (!fs.existsSync(dataPath)) {
      console.warn('⚠️  seed_data.json no encontrado. Omitiendo seed de empresas.');
      return;
    }

    const { empresas, mantenimientos } = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

    // Insertar empresas manteniendo sus IDs originales
    for (const empresa of empresas) {
      await Empresa.create({
        id: empresa.id,
        nombre: empresa.nombre,
        fecha_inicio: empresa.fecha_inicio,
        frecuencia_meses: empresa.frecuencia_meses,
        dia_semana: empresa.dia_semana,
        base_tecnico: empresa.base_tecnico,
      });
    }
    console.log(`✅ ${empresas.length} empresas insertadas.`);

    // Insertar mantenimientos
    for (const m of mantenimientos) {
      await Mantenimiento.create({
        id: m.id,
        fecha_programada: m.fecha_programada,
        estado: m.estado,
        fecha_ejecucion: m.fecha_ejecucion || null,
        tecnico: m.tecnico,
        observaciones: m.observaciones || null,
        empresa_id: m.empresa_id,
      });
    }
    console.log(`✅ ${mantenimientos.length} mantenimientos insertados.`);

  } catch (err) {
    console.error('⚠️  Error en seed de empresas:', err.message);
  }
}

module.exports = seedEmpresas;
