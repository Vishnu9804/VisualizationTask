const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

pool.on('connect', () => {
    console.log('Successfully connected to Supabase PostgreSQL');
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

module.exports = {
    // This helper function makes running SQL queries cleaner in our controllers
    query: (text, params) => pool.query(text, params),
};