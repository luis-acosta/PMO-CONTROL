require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Empresa, Activo, Mantenimiento, Tecnico, Usuario, sequelize } = require('./models');

const JWT_SECRET = process.env.JWT_SECRET || 'pmo_fallback_secret';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => res.send({ message: 'API Backend Node.js Express Activo' }));

// --- Middleware de Autenticación ---
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: "Acceso denegado. Token no proporcionado." });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Token inválido o expirado." });
    req.user = user;
    next();
  });
};

const authorizeRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "No tienes permisos para realizar esta acción." });
    }
    next();
  };
};

// --- Endpoints de Autenticación ---
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await Usuario.findOne({ 
      where: { username },
      include: [ { model: Tecnico } ]
    });

    if (!user) return res.status(401).json({ error: "Usuario o contraseña incorrectos." });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(401).json({ error: "Usuario o contraseña incorrectos." });

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, tecnico_id: user.tecnico_id },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({ 
      token, 
      user: { 
        id: user.id, 
        username: user.username, 
        role: user.role,
        tecnico: user.Tecnico ? user.Tecnico.nombre : null
      } 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- Endpoints Tecnicos ---
app.get('/tecnicos', async (req, res) => {
  const tecnicos = await Tecnico.findAll();
  res.json(tecnicos);
});

app.post('/tecnicos', authenticateToken, authorizeRole(['ADMIN']), async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { nombre, especialidad, username, password } = req.body;
    
    // Crear Técnico
    const tecnico = await Tecnico.create({ nombre, especialidad }, { transaction: t });
    
    // Crear Usuario si se proporcionaron credenciales
    if (username && password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      await Usuario.create({
        username,
        password: hashedPassword,
        role: 'TECNICO',
        tecnico_id: tecnico.id
      }, { transaction: t });
    }

    await t.commit();
    res.status(201).json(tecnico);
  } catch (error) {
    await t.rollback();
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

// --- Endpoints Usuarios ---
app.get('/usuarios', authenticateToken, authorizeRole(['ADMIN']), async (req, res) => {
  try {
    const usuarios = await Usuario.findAll({
      include: [ { model: Tecnico } ]
    });
    res.json(usuarios);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/usuarios', authenticateToken, authorizeRole(['ADMIN']), async (req, res) => {
  try {
    const { username, password, role, nombre } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Si se especifica un nombre, creamos un técnico también si el rol es TECNICO
    let tecnico_id = null;
    if (role === 'TECNICO' && nombre) {
      const tecnico = await Tecnico.create({ nombre });
      tecnico_id = tecnico.id;
    }

    const usuario = await Usuario.create({
      username,
      password: hashedPassword,
      role,
      tecnico_id
    });

    res.status(201).json(usuario);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/usuarios/:id', authenticateToken, authorizeRole(['ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;
    const { username, password, role, nombre } = req.body;
    const user = await Usuario.findByPk(id, { include: [Tecnico] });
    if (!user) return res.status(404).json({ error: "Usuario no encontrado" });

    let updateData = { username, role };
    if (password && password.trim() !== "") {
      updateData.password = await bcrypt.hash(password, 10);
    }

    await user.update(updateData);

    // Si tiene un técnico vinculado, actualizar su nombre
    if (user.Tecnico && nombre) {
      await user.Tecnico.update({ nombre });
    }

    res.json({ message: "Usuario actualizado con éxito" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/usuarios/:id', authenticateToken, authorizeRole(['ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;
    const user = await Usuario.findByPk(id);
    if (!user) return res.status(404).json({ error: "Usuario no encontrado" });

    // Si es el usuario actual, no permitir borrarlo
    if (user.id === req.user.id) {
      return res.status(400).json({ error: "No puedes eliminar tu propio usuario" });
    }

    await user.destroy();
    res.json({ message: "Usuario eliminado" });
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
      
      const iterations = Math.floor(36 / frecMeses);
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
      const iterations = Math.floor(36 / frecMeses);
      
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

// --- Endpoints Mantenimientos ---
app.get('/mantenimientos', async (req, res) => {
  await updateVencidos();
  const mantenimientos = await Mantenimiento.findAll({ include: Empresa });
  res.json(mantenimientos);
});

app.post('/mantenimientos', async (req, res) => {
  try {
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

// Puerto e inicio de Servidor
const PORT = process.env.PORT || 3001; // Usamos 3001 para que no choque con 3000 de React/Next

sequelize.sync({ alter: false }).then(() => {
  console.log("Database connected and synchronized.");
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}).catch(err => {
  console.error("Failed to sync DB. Make sure PostgreSQL is running and DATABASE_URL is valid.", err);
});
