const mongoose = require('mongoose');

// DB_MODE=memory (default): starts a throwaway in-process MongoDB — no install needed,
//   data is wiped every time the API stops.
// DB_MODE=mongo: connects to a real MongoDB at MONGO_URI and keeps data between runs.
const DB_MODE = (process.env.DB_MODE || 'memory').toLowerCase();
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/browserstack-lab';

let memoryServer;

async function connect() {
  if (DB_MODE === 'mongo') {
    await mongoose.connect(MONGO_URI);
    return `real MongoDB (${MONGO_URI})`;
  }
  if (DB_MODE !== 'memory') {
    throw new Error(`Invalid DB_MODE "${DB_MODE}" (use "memory" or "mongo")`);
  }
  const { MongoMemoryServer } = require('mongodb-memory-server');
  memoryServer = await MongoMemoryServer.create();
  await mongoose.connect(memoryServer.getUri('browserstack-lab'));
  return 'in-memory MongoDB (data is lost when the API stops)';
}

async function disconnect() {
  await mongoose.disconnect();
  if (memoryServer) await memoryServer.stop();
}

module.exports = { connect, disconnect };
