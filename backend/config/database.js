const mongoose = require('mongoose');

async function connectDatabase() {
  const mongoUri = String(process.env.MONGODB_URI || '').trim();

  if (!mongoUri) {
    throw new Error('MONGODB_URI is not configured. Add it to backend/.env or your deployment environment variables.');
  }

  if (/[<>]/.test(mongoUri)) {
    throw new Error('MONGODB_URI still contains a placeholder. Replace every <...> value with the actual Atlas connection details.');
  }

  mongoose.set('strictQuery', true);

  try {
    await mongoose.connect(mongoUri, {
      dbName: 'edumatch',
      authSource: 'admin',
      autoIndex: false,
      serverSelectionTimeoutMS: 10000,
    });
  } catch (error) {
    console.error(`[MongoDB] Initial connection failed (${error.name}): ${error.message}`);
    throw error;
  }

  const { connection } = mongoose;
  const runtimeDbName = connection?.name;
  const runtimeHost = connection?.host;

  console.log(`[MongoDB] Connected successfully | host=${runtimeHost} | db=${runtimeDbName}`);

  connection.on('error', (error) => {
    console.error(`[MongoDB] Connection error: ${error.message}`);
  });

  connection.on('disconnected', () => {
    console.warn('[MongoDB] Disconnected.');
  });

  connection.on('reconnected', () => {
    console.log('[MongoDB] Reconnected.');
  });

  return connection;
}

module.exports = {
  connectDatabase,
};
