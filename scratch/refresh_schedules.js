const axios = require('axios');

async function refreshAll() {
  try {
    const res = await axios.get('http://localhost:3001/empresas');
    const empresas = res.data;
    
    for (const emp of empresas) {
      console.log(`Refreshing ${emp.nombre} (ID: ${emp.id})...`);
      // Simular un PUT con los mismos datos para disparar la regeneración de 3 años
      await axios.put(`http://localhost:3001/empresas/${emp.id}`, {
        nombre: emp.nombre,
        fecha_inicio: emp.fecha_inicio || '2026-01-01',
        frecuencia_meses: emp.frecuencia_meses || 1,
        dia_semana: emp.dia_semana || 6,
        base_tecnico: emp.base_tecnico
      });
    }
    console.log('All companies refreshed with 3-year schedules.');
  } catch (e) {
    console.error('Error refreshing:', e.message);
    if (e.response) console.error(e.response.data);
  }
}

refreshAll();
