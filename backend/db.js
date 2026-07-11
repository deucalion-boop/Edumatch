const postgres = require('postgres');

const connectionString = String(process.env.DATABASE_URL || '').trim();

if (!connectionString) {
  throw new Error('DATABASE_URL is not configured in backend/.env');
}

const sql = postgres(connectionString, {
  ssl: 'require',
});

module.exports = sql;
module.exports.default = sql;
