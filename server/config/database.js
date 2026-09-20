const mongoose = require("mongoose");
const config = require("./index");

let isConnected = false;

const connectDB = async () => {
  if (!config.mongoUri) {
    const errorMsg = "MONGODB_URI is not defined in environment configuration";
    console.error(`[Database Error] ${errorMsg}`);
    throw new Error(errorMsg);
  }

  try {
    const conn = await mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });

    isConnected = true;
    console.log(
      `[Database] MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`,
    );
    return conn;
  } catch (error) {
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
