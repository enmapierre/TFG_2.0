import mysql from 'mysql2/promise';

const dbConfig = {
  host: 'localhost',
  port: 3306,
  user: 'root',      // Pon tu usuario de MySQL
  password: 'WWww1234', // Pon tu contraseña de MySQL
  database: 'tienda',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

export const pool = mysql.createPool(dbConfig);

