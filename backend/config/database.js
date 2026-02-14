// config/database.js
const mysql = require('mysql2/promise');

const poolConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'job_platform',
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 10,
    waitForConnections: true,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    timezone: '+05:30', // IST timezone
    dateStrings: true,
    multipleStatements: false,
    charset: 'utf8mb4'
};

const pool = mysql.createPool(poolConfig);

// Test database connection
const testConnection = async () => {
    try {
        const connection = await pool.getConnection();
        console.log(`📦 Connected to MySQL Database: ${poolConfig.database}`);
        connection.release();
        return true;
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        throw error;
    }
};

// Query helper with error handling
const query = async (sql, params = []) => {
    try {
        const [results] = await pool.execute(sql, params);
        return results;
    } catch (error) {
        console.error('Database Query Error:', error);
        throw error;
    }
};

// Transaction helper
const transaction = async (callback) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const result = await callback(connection);
        await connection.commit();
        return result;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

// Get single result helper
const getOne = async (sql, params = []) => {
    const results = await query(sql, params);
    return results[0] || null;
};

// Check if record exists
const exists = async (table, conditions) => {
    const keys = Object.keys(conditions);
    const values = Object.values(conditions);
    const whereClause = keys.map(key => `${key} = ?`).join(' AND ');
    
    const sql = `SELECT COUNT(*) as count FROM ${table} WHERE ${whereClause}`;
    const result = await getOne(sql, values);
    return result.count > 0;
};

// Insert helper
const insert = async (table, data) => {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map(() => '?').join(', ');
    
    const sql = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`;
    const result = await query(sql, values);
    return result.insertId;
};

// Update helper
const update = async (table, data, conditions) => {
    const dataKeys = Object.keys(data);
    const dataValues = Object.values(data);
    const setClause = dataKeys.map(key => `${key} = ?`).join(', ');
    
    const conditionKeys = Object.keys(conditions);
    const conditionValues = Object.values(conditions);
    const whereClause = conditionKeys.map(key => `${key} = ?`).join(' AND ');
    
    const sql = `UPDATE ${table} SET ${setClause} WHERE ${whereClause}`;
    const result = await query(sql, [...dataValues, ...conditionValues]);
    return result.affectedRows;
};

// Delete helper
const remove = async (table, conditions) => {
    const keys = Object.keys(conditions);
    const values = Object.values(conditions);
    const whereClause = keys.map(key => `${key} = ?`).join(' AND ');
    
    const sql = `DELETE FROM ${table} WHERE ${whereClause}`;
    const result = await query(sql, values);
    return result.affectedRows;
};

module.exports = {
    pool,
    query,
    getOne,
    exists,
    insert,
    update,
    remove,
    transaction,
    testConnection
};