/**
 * Script de prueba para verificar la unificación de PMO-CONTROL.
 * Ejecutar con: node scratch/verify_unification.js
 */

async function verifyUnification() {
    const BASE_URL = 'http://localhost:3001';
    
    console.log('--- Iniciando verificación de unificación ---');

    // 1. Verificar el Backend (API)
    try {
        console.log(`\n1. Probando API en ${BASE_URL}/api...`);
        const resApi = await fetch(`${BASE_URL}/api`);
        const dataApi = await resApi.json();
        console.log('Status:', resApi.status);
        console.log('Data:', dataApi);
        if (dataApi.message && dataApi.message.includes('API Backend')) {
            console.log('✅ API alcanzable y operativa.');
        } else {
            console.log('❌ Respuesta inesperada de la API.');
        }
    } catch (e) {
        console.log('❌ Error al conectar con la API:', e.message);
    }

    // 2. Verificar el Frontend (Root)
    try {
        console.log(`\n2. Probando Frontend (Root) en ${BASE_URL}/...`);
        const resRoot = await fetch(`${BASE_URL}/`);
        const textRoot = await resRoot.text();
        console.log('Status:', resRoot.status);
        if (textRoot.includes('<!DOCTYPE html>') || textRoot.includes('<html')) {
            console.log('✅ Frontend (index.html) servido correctamente.');
        } else {
            console.log('❌ El servidor no devolvió HTML en la raíz.');
        }
    } catch (e) {
        console.log('❌ Error al conectar con el Frontend:', e.message);
    }

    // 3. Verificar el Catch-all (Ruta del frontend)
    try {
        console.log(`\n3. Probando Catch-all en ${BASE_URL}/login...`);
        const resLogin = await fetch(`${BASE_URL}/login`);
        const textLogin = await resLogin.text();
        console.log('Status:', resLogin.status);
        // Debería devolver el mismo index.html para que el router de Next.js tome el control
        if (textLogin.includes('<!DOCTYPE html>') || textLogin.includes('<html')) {
            console.log('✅ Ruta de frontend servida por el catch-all (index.html).');
        } else {
            console.log('❌ El catch-all no devolvió HTML para rutas de frontend.');
        }
    } catch (e) {
        console.log('❌ Error al probar el catch-all:', e.message);
    }

    console.log('\n--- Verificación completada ---');
    console.log('Nota: Asegúrate de que el contenedor esté corriendo (docker-compose up) antes de ejecutar esta prueba.');
}

verifyUnification();
