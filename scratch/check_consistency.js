const axios = require('axios');

async function test() {
  try {
    const resEmpresas = await axios.get('http://localhost:3001/empresas');
    const resMantenimientos = await axios.get('http://localhost:3001/mantenimientos');
    
    const empresaIds = new Set(resEmpresas.data.map(e => e.id));
    const orphans = resMantenimientos.data.filter(m => m.empresa_id && !empresaIds.has(m.empresa_id));
    const nulls = resMantenimientos.data.filter(m => !m.empresa_id);

    console.log('Empresas count:', resEmpresas.data.length);
    console.log('Mantenimientos count:', resMantenimientos.data.length);
    console.log('Orphaned Mantenimientos (invalid ID):', orphans.length);
    console.log('Null Mantenimientos (no ID):', nulls.length);
    
    if (orphans.length > 0) {
        console.log('Sample orphans:', orphans.slice(0, 3).map(o => ({ id: o.id, empresa_id: o.empresa_id })));
    }
  } catch (e) {
    console.error(e.message);
  }
}

test();
