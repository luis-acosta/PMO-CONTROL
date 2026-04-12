const { DataTypes } = require('sequelize');
const sequelize = require('./database');

const Empresa = sequelize.define('Empresa', {
  id: { 
    type: DataTypes.INTEGER, 
    primaryKey: true, 
    autoIncrement: true 
  },
  nombre: { 
    type: DataTypes.STRING, 
    allowNull: false 
  },
  fecha_inicio: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  frecuencia_meses: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  dia_semana: {
    type: DataTypes.INTEGER, // 0=Domingo..6=Sábado
    defaultValue: 6
  },
  base_tecnico: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, { 
  tableName: 'empresas', 
  timestamps: false 
});

const Activo = sequelize.define('Activo', {
  id: { 
    type: DataTypes.INTEGER, 
    primaryKey: true, 
    autoIncrement: true 
  },
  tipo: { 
    type: DataTypes.STRING, 
    allowNull: false 
  },
  serial: { 
    type: DataTypes.STRING, 
    allowNull: false 
  }
}, { 
  tableName: 'activos', 
  timestamps: false 
});

const Tecnico = sequelize.define('Tecnico', {
  nombre: { type: DataTypes.STRING, allowNull: false },
  especialidad: { type: DataTypes.STRING }
}, { tableName: 'tecnicos', timestamps: false });

const Mantenimiento = sequelize.define('Mantenimiento', {
  id: { 
    type: DataTypes.INTEGER, 
    primaryKey: true, 
    autoIncrement: true 
  },
  fecha_programada: { 
    type: DataTypes.DATEONLY, 
    allowNull: false
  },
  estado: { 
    type: DataTypes.STRING, 
    defaultValue: 'PENDIENTE' 
  },
  fecha_ejecucion: {
    type: DataTypes.DATE,
    allowNull: true
  },
  tecnico: {
    type: DataTypes.STRING,
    allowNull: true
  },
  observaciones: { 
    type: DataTypes.TEXT, 
    allowNull: true 
  },
  empresa_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'empresas', key: 'id' }
  }
}, { 
  tableName: 'mantenimientos', 
  timestamps: false 
});

// Relaciones
Empresa.hasMany(Activo, { foreignKey: 'empresa_id' });
Activo.belongsTo(Empresa, { foreignKey: 'empresa_id' });

Empresa.hasMany(Mantenimiento, { foreignKey: 'empresa_id' });
Mantenimiento.belongsTo(Empresa, { foreignKey: 'empresa_id' });

module.exports = { Empresa, Activo, Mantenimiento, Tecnico, sequelize };
