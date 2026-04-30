const { Empresa, Mantenimiento } = require('./models');

async function refreshAll() {
  try {
    const empresas = await Empresa.findAll();
    
    for (const empresa of empresas) {
      console.log(`Refreshing ${empresa.nombre} (ID: ${empresa.id})...`);
      
      const id = empresa.id;
      const { fecha_inicio, frecuencia_meses, dia_semana, base_tecnico } = empresa;
      
      if (fecha_inicio && frecuencia_meses) {
        // Borrar existentes
        await Mantenimiento.destroy({ 
          where: { 
            empresa_id: id, 
            estado: ['PENDIENTE', 'VENCIDO']
          } 
        });

        const frecMeses = parseInt(frecuencia_meses) || 1;
        const dSemana = parseInt(dia_semana) ?? 6;
        let tecnicoAsignado = base_tecnico || null;
        
        const [year, month, day] = fecha_inicio.split('-');
        const iterations = Math.floor(36 / frecMeses);
        
        const generatedDates = [];

        for (let i = 0; i < iterations; i++) {
            let targetDate = new Date(parseInt(year), (parseInt(month) - 1) + (i * frecMeses), parseInt(day));
            
            while (targetDate.getDay() !== dSemana) {
                targetDate.setDate(targetDate.getDate() + 1);
            }

            const targetStr = targetDate.toISOString().split('T')[0];
            
            generatedDates.push({
                empresa_id: id,
                fecha_programada: targetStr,
                estado: 'PENDIENTE',
                tecnico: tecnicoAsignado
            });
        }
        
        if (generatedDates.length > 0) {
            await Mantenimiento.bulkCreate(generatedDates);
        }
      }
    }
    console.log('All companies refreshed with 3-year schedules.');
    process.exit();
  } catch (e) {
    console.error('Error refreshing:', e);
    process.exit(1);
  }
}

refreshAll();
