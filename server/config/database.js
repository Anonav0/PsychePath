const mongoose = require("mongoose");
const config = require("./index");

let isConnected = false;
let memoryServerInstance = null;

const connectDB = async () => {
  if (!config.mongoUri) {
    const errorMsg = "MONGODB_URI is not defined in environment configuration";
    console.error(`[Database Error] ${errorMsg}`);
    throw new Error(errorMsg);
  }

  try {
    const conn = await mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: 2000,
    });

    isConnected = true;
    console.log(
      `[Database] MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`,
    );
    return conn;
  } catch (error) {
    if (!config.isProduction) {
      console.log(
        "[Database] Local MongoDB not reachable. Provisioning in-memory development database (MongoMemoryServer)...",
      );
      try {
        const { MongoMemoryServer } = require("mongodb-memory-server");
        memoryServerInstance = await MongoMemoryServer.create();
        const memUri = memoryServerInstance.getUri();
        const conn = await mongoose.connect(memUri);
        isConnected = true;
        console.log(`[Database] In-memory MongoDB running at: ${memUri}`);

        // Auto-seed development database so the app is immediately usable
        try {
          const seedDatabase = require("../utils/seed");
          await seedDatabase({ disconnectOnComplete: false });
          console.log(
            "[Database] Development database auto-seeded with demo accounts and curriculum.",
          );
        } catch (seedErr) {
          console.warn("[Database Warning] Seeding warning:", seedErr.message);
        }

        return conn;
      } catch (memErr) {
        console.error(
          "[Database Error] Could not start in-memory MongoDB:",
          memErr.message,
        );
      }
    }

    isConnected = false;
    console.error(
      `[Database Connection Error] Failed to connect to MongoDB: ${error.message}`,
    );
    throw error;
  }
};

const getDBStatus = () => {
  const stateMap = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };
  const readyState = mongoose.connection.readyState;
  return {
    state: stateMap[readyState] || "unknown",
    isConnected: readyState === 1,
  };
};

module.exports = {
  connectDB,
  getDBStatus,
};
