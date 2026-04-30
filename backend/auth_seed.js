const bcrypt = require('bcryptjs');
const { Usuario, sequelize } = require('./models');

async function seedAdmin() {
  try {
    await sequelize.sync();
    
    const adminExists = await Usuario.findOne({ where: { username: 'admin' } });
    if (adminExists) {
      console.log('Administrador ya existe.');
      process.exit();
    }

    const hashedPassword = await bcrypt.hash('admin123', 10);
    await Usuario.create({
      username: 'admin',
      password: hashedPassword,
      role: 'ADMIN'
    });

    console.log('Administrador inicial creado: admin / admin123');
    process.exit();
  } catch (e) {
    console.error('Error al crear administrador:', e);
    process.exit(1);
  }
}

seedAdmin();
