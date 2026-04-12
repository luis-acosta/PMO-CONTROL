require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './pmo_db.sqlite',
  logging: false, // Desactivar logueo de base de datos para no saturar consola
});

module.exports = sequelize;
