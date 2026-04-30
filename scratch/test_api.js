async function testCreateEmpresa() {
    const url = 'http://localhost:3001/empresas';
    const payload = {
        nombre: 'Empresa Test Fetch ' + Date.now(),
        fecha_inicio: '2026-05-01',
        frecuencia_meses: 2,
        dia_semana: 5, // Viernes
        base_tecnico: 'Luis Acosta'
    };

    try {
        console.log('Sending request to:', url);
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        const data = await response.json();
        console.log('Response Status:', response.status);
        console.log('Response Data:', data);

        if (response.status === 201) {
            console.log('SUCCESS: Empresa created successfully.');
            
            // Verify if it appears in the list
            const listResponse = await fetch(url);
            const listData = await listResponse.json();
            const found = listData.find(e => e.nombre === payload.nombre);
            if (found) {
                console.log('SUCCESS: Empresa verified in the list.');
            } else {
                console.log('FAILURE: Empresa not found in the list after creation.');
            }

            // Verify mantenimientos
            const mantUrl = 'http://localhost:3001/mantenimientos';
            const mantResponse = await fetch(mantUrl);
            const mantData = await mantResponse.json();
            const counts = mantData.filter(m => m.empresa_id === data.id).length;
            console.log(`Verified ${counts} mantenimientos generated for this empresa.`);
        }
    } catch (error) {
        console.error('ERROR:', error.message);
    }
}

testCreateEmpresa();
