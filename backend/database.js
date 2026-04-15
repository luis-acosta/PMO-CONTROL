require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = process.env.DATABASE_URL
  ? new Sequelize(process.env.DATABASE_URL, {
      dialect: 'postgres',
      logging: false,
      dialectOptions: {
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
      }
    })
  : new Sequelize({
      dialect: 'sqlite',
      storage: './pmo_db.sqlite',
      logging: false,
    });

module.exports = sequelize;
