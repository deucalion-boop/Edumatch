const mongoose = require('mongoose');

async function connectDatabase() {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error('MONGODB_URI is not configured in .env');
  }

  mongoose.set('strictQuery', true);

  await mongoose.connect(mongoUri, {
    autoIndex: false,
  });

  const { connection } = mongoose;
  const runtimeDbName = connection?.name;
  const runtimeHost = connection?.host;
  const runtimePort = connection?.port;

  console.log(`[MongoDB] connected | host=${runtimeHost} | port=${runtimePort} | db=${runtimeDbName}`);
  console.log(`[MongoDB] readyState=${connection.readyState} (1=connected)`);
  console.log(`[MongoDB] uri=${mongoUri}`);

  connection.on('error', (error) => {
    console.error('[MongoDB] connection error:', error);
  });

  connection.on('disconnected', () => {
    console.error('[MongoDB] disconnected');
  });

  connection.on('reconnected', () => {
    console.log('[MongoDB] reconnected');
  });
}

module.exports = {
  connectDatabase,
};
