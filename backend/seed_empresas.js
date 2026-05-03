const bcrypt = require('bcryptjs');
const { Empresa, Mantenimiento, Tecnico, Usuario } = require('./models');

async function seedInicial() {
  try {
    // --- Admin user (ya lo crea index.js, pero lo manejamos aquí también por consistencia) ---
    const adminExists = await Usuario.findOne({ where: { username: 'admin' } });
    if (!adminExists) {
      const hash = await bcrypt.hash('admin123', 10);
      await Usuario.create({ username: 'admin', password: hash, role: 'ADMIN' });
      console.log('✅ Usuario admin creado: admin / admin123');
    }

    // --- Técnico inicial ---
    const tecnicoExists = await Tecnico.findOne({ where: { nombre: 'Técnico Demo' } });
    if (!tecnicoExists) {
      const tecnico = await Tecnico.create({ nombre: 'Técnico Demo', especialidad: 'Mantenimiento General' });
      const hash = await bcrypt.hash('tecnico123', 10);
      await Usuario.create({ username: 'tecnico', password: hash, role: 'TECNICO', tecnico_id: tecnico.id });
      console.log('✅ Técnico demo creado: tecnico / tecnico123');
    }

    // --- Empresa de demostración ---
    const empresaExists = await Empresa.findOne({ where: { nombre: 'Empresa Demo' } });
    if (!empresaExists) {
      const empresa = await Empresa.create({
        nombre: 'Empresa Demo',
        fecha_inicio: '2026-01-01',
        frecuencia_meses: 3,
        dia_semana: 5, // Viernes
        base_tecnico: 'Técnico Demo'
      });
      // Generar 4 mantenimientos de ejemplo (uno por trimestre 2026)
      const fechas = ['2026-01-02', '2026-04-03', '2026-07-03', '2026-10-02'];
      for (const fecha of fechas) {
        await Mantenimiento.create({
          fecha_programada: fecha,
          estado: 'PENDIENTE',
          tecnico: 'Técnico Demo',
          empresa_id: empresa.id
        });
      }
      console.log('✅ Empresa demo creada con 4 mantenimientos de ejemplo');
    }

  } catch (err) {
    console.error('⚠️  Error en seed inicial:', err.message);
  }
}

module.exports = seedInicial;
