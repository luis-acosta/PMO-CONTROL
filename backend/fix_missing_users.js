const { Tecnico, Usuario } = require('./models');
const bcrypt = require('bcryptjs');

async function fixUsers() {
  try {
    const tecnicos = await Tecnico.findAll();
    const usuarios = await Usuario.findAll();
    const userTecnicoIds = usuarios.map(u => u.tecnico_id).filter(id => id !== null);

    const missing = tecnicos.filter(t => !userTecnicoIds.includes(t.id));

    console.log(`Encontrados ${missing.length} técnicos sin usuario.`);

    for (const t of missing) {
      const username = t.nombre.toLowerCase().replace(/\s+/g, '_') + '_tec';
      const password = await bcrypt.hash('pmo123', 10);
      
      await Usuario.create({
        username,
        password,
        role: 'TECNICO',
        tecnico_id: t.id
      });
      console.log(`Creado usuario "${username}" para el técnico "${t.nombre}".`);
    }

    console.log('Reparación completada.');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

fixUsers();
