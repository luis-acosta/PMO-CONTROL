require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Empresa, Activo, Mantenimiento, Tecnico, sequelize } = require('./models');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => res.send({ message: 'API Backend Node.js Express Activo' }));

// --- Endpoints Tecnicos ---
app.get('/tecnicos', async (req, res) => {
  const tecnicos = await Tecnico.findAll();
  res.json(tecnicos);
});

app.post('/tecnicos', async (req, res) => {
  try {
    const tecnico = await Tecnico.create(req.body);
    res.status(201).json(tecnico);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/tecnicos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const tecnico = await Tecnico.findByPk(id);
    if (!tecnico) return res.status(404).json({ error: "Técnico no encontrado" });
    await tecnico.update(req.body);
    res.json(tecnico);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/tecnicos/:id', async (req, res) => {
  try {
    await Tecnico.destroy({ where: { id: req.params.id } });
    res.json({ message: 'Tecnico eliminado' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// --- Endpoints Empresas ---
app.get('/empresas', async (req, res) => {
  const empresas = await Empresa.findAll();
  res.json(empresas);
});

app.post('/empresas', async (req, res) => {
  try {
    const { nombre, fecha_inicio, frecuencia_meses, dia_semana, base_tecnico } = req.body;
    
    // Crear Empresa
    const empresa = await Empresa.create({ nombre, fecha_inicio, frecuencia_meses, dia_semana, base_tecnico });
    
    // Si se enviaron parámetros de agendamiento, procedemos a generar el cronograma
    if (fecha_inicio && frecuencia_meses) {
      const frecMeses = parseInt(frecuencia_meses) || 1;
      const dSemana = parseInt(dia_semana) ?? 6;
      let tecnicoAsignado = base_tecnico || null;
      const [year, month, day] = fecha_inicio.split('-');
      let currentObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      
      const iterations = Math.floor(12 / frecMeses);
      const generatedDates = [];

      for (let i = 0; i < iterations; i++) {
          // Ajustar al día de la semana correcto ANTES de evaluar
          // Si el día actual no es el día de la semana pedido, lo corremos hacia adelante hasta que lo sea
          while (currentObj.getDay() !== dSemana) {
             currentObj.setDate(currentObj.getDate() + 1);
          }

          const currentStr = currentObj.toISOString().split('T')[0];
          
          generatedDates.push({
              empresa_id: empresa.id,
              fecha_programada: currentStr,
              estado: 'PENDIENTE',
              tecnico: tecnicoAsignado
          });

          // Calcular siguiente fecha agregando los meses para la próxima iteración
          currentObj.setMonth(currentObj.getMonth() + frecMeses);
      }

      if (generatedDates.length > 0) {
          await Mantenimiento.bulkCreate(generatedDates);
      }
    }

    res.status(201).json(empresa);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/empresas/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const empresa = await Empresa.findByPk(id);
    if (!empresa) return res.status(404).json({ error: "Empresa no encontrada" });
    
    await empresa.update(req.body);

    const { fecha_inicio, frecuencia_meses, dia_semana, base_tecnico } = req.body;
    if (fecha_inicio && frecuencia_meses) {
      await Mantenimiento.destroy({ 
        where: { 
          empresa_id: id, 
          estado: ['PENDIENTE', 'VENCIDO']
        } 
      });

      const frecMeses = parseInt(frecuencia_meses) || 1;
      const dSemana = parseInt(dia_semana) ?? 6;
      let tecnicoAsignado = base_tecnico || null;
      if (tecnicoAsignado === 'none' || tecnicoAsignado === '') tecnicoAsignado = null;
      
      const [year, month, day] = fecha_inicio.split('-');
      const iterations = Math.floor(12 / frecMeses);
      
      // Mantenemos memoria de los ejecutados para no sobreescribirlos
      const ejecutados = await Mantenimiento.findAll({ where: { empresa_id: id, estado: 'EJECUTADO' }});
      const generatedDates = [];

      for (let i = 0; i < iterations; i++) {
          let targetDate = new Date(parseInt(year), (parseInt(month) - 1) + (i * frecMeses), parseInt(day));
          
          while (targetDate.getDay() !== dSemana) {
              targetDate.setDate(targetDate.getDate() + 1);
          }

          const targetStr = targetDate.toISOString().split('T')[0];
          const trgMonth = targetDate.getMonth();
          const trgYear = targetDate.getFullYear();
          
          // Verificar si ya hay un mantenimiento ejecutado este mismo mes y año
          const yaEjecutado = ejecutados.some(ej => {
             const ejDate = new Date(ej.fecha_programada + 'T00:00:00');
             return ejDate.getMonth() === trgMonth && ejDate.getFullYear() === trgYear;
          });

          if (!yaEjecutado) {
              generatedDates.push({
                  empresa_id: empresa.id,
                  fecha_programada: targetStr,
                  estado: 'PENDIENTE',
                  tecnico: tecnicoAsignado
              });
          }
      }
      
      if (generatedDates.length > 0) {
          await Mantenimiento.bulkCreate(generatedDates);
      }
    }

    res.json(empresa);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/empresas/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const empresa = await Empresa.findByPk(id);
    if (!empresa) return res.status(404).json({ error: "Empresa no encontrada" });
    
    // Borrar mantenimientos en cascada manualmente por seguridad (o confiar en la DB si onDelete:'CASCADE' estuviera probado)
    await Mantenimiento.destroy({ where: { empresa_id: id } });
    await Activo.destroy({ where: { empresa_id: id } });
    
    await empresa.destroy();
    res.json({ message: "Empresa y dependencias eliminadas" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// --- Endpoints Activos ---
app.get('/activos', async (req, res) => {
  const activos = await Activo.findAll({ include: Empresa });
  res.json(activos);
});

app.post('/activos', async (req, res) => {
  try {
    const activo = await Activo.create(req.body);
    res.status(201).json(activo);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// --- Endpoints Mantenimientos ---
app.get('/mantenimientos', async (req, res) => {
  // Primero actualizar los VENCIDOS dinámicamente
  await updateVencidos();

  // Luego hacer la consulta normal
  const mantenimientos = await Mantenimiento.findAll({ include: Empresa });
  res.json(mantenimientos);
});

app.post('/mantenimientos', async (req, res) => {
  try {
    // Para V2, este endpoint es para crear mantenimientos puntuales o personalizados.
    const dateStr = req.body.fecha_programada;
    if (!dateStr) return res.status(400).json({ error: "fecha_programada requerida" });
    
    const mantenimiento = await Mantenimiento.create({ ...req.body, estado: req.body.estado || 'PENDIENTE' });
    res.status(201).json(mantenimiento);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/mantenimientos/:id', async (req, res) => {
  try {
    const act = await Mantenimiento.findByPk(req.params.id);
    if (!act) return res.status(404).json({ error: "No encontrado" });
    
    // Si se pasa a EJECUTADO, usar la fecha enviada o la actual
    let payload = { ...req.body };
    if (payload.estado === "EJECUTADO" && act.estado !== "EJECUTADO") {
       payload.fecha_ejecucion = payload.fecha_ejecucion ? new Date(payload.fecha_ejecucion) : new Date();
    }

    await act.update(payload);
    res.json(act);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/mantenimientos/:id', async (req, res) => {
  try {
    const act = await Mantenimiento.findByPk(req.params.id);
    if (!act) return res.status(404).json({ error: "No encontrado" });
    
    await act.destroy();
    res.json({ message: "Mantenimiento eliminado" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Helper for VENCIDO logic
const updateVencidos = async () => {
    const { Op } = require('sequelize');
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    await Mantenimiento.update(
      { estado: 'VENCIDO' },
      {
        where: {
          estado: 'PENDIENTE',
          fecha_programada: {
            [Op.lt]: todayStr
          }
        }
      }
    );
};

app.get('/mantenimientos', async (req, res) => {
  await updateVencidos();
  const mantenimientos = await Mantenimiento.findAll({ include: Empresa });
  res.json(mantenimientos);
});

app.put('/mantenimientos/:id', async (req, res) => {
  try {
    const mantenimiento = await Mantenimiento.findByPk(req.params.id);
    if (!mantenimiento) return res.status(404).json({ error: 'Mantenimiento no encontrado' });
    
    await mantenimiento.update(req.body);
    res.json(mantenimiento);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Puerto e inicio de Servidor
const PORT = process.env.PORT || 3001; // Usamos 3001 para que no choque con 3000 de React/Next

sequelize.sync({ alter: true }).then(() => {
  console.log("Database connected and synchronized.");
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}).catch(err => {
  console.error("Failed to sync DB. Make sure PostgreSQL is running and DATABASE_URL is valid.", err);
});
