const http = require('http');

function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ statusCode: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ statusCode: res.statusCode, data: body });
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function runTest() {
  const host = 'localhost';
  const port = 3001;

  try {
    console.log('1. Login Admin...');
    let res = await request({ host, port, path: '/login', method: 'POST', headers: {'Content-Type':'application/json'}}, {username:'admin', password:'admin123'});
    const token = res.data.token;

    console.log('2. Listar Usuarios...');
    res = await request({ host, port, path: '/usuarios', method: 'GET', headers: {'Authorization': `Bearer ${token}`}});
    const users = res.data;
    const targetUser = users.find(u => u.role === 'TECNICO');

    if (!targetUser) {
      console.log('No hay técnicos para probar la edición. Saltando...');
    } else {
      console.log(`3. Editando Usuario: ${targetUser.username}`);
      const newPass = 'nueva_pass_123';
      res = await request({ host, port, path: `/usuarios/${targetUser.id}`, method: 'PUT', headers: {'Content-Type':'application/json', 'Authorization': `Bearer ${token}`}}, {
        username: 'tec_editado',
        password: newPass,
        role: 'TECNICO'
      });
      console.log('Update Res:', res.data.message);

      console.log('4. Probando Acceso con Nueva Contraseña...');
      res = await request({ host, port, path: '/login', method: 'POST', headers: {'Content-Type':'application/json'}}, {
        username: 'tec_editado',
        password: newPass
      });
      
      if (res.statusCode === 200) {
        console.log('¡Acceso concedido con nuevas credenciales!');
        console.log('Token obtenido:', res.data.token.substring(0, 10) + '...');
      } else {
        throw new Error('Falló el acceso con nueva contraseña');
      }
    }

    console.log('\n--- RESULTADO FINAL: TODAS LAS PRUEBAS PASARON ---');
  } catch (err) {
    console.error('ERROR EN PRUEBAS:', err.message);
  }
}

runTest();
