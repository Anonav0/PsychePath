const app = require("./app");
const config = require("./config");
const { connectDB } = require("./config/database");

const startServer = async () => {
  try {
    // Attempt database connection
    await connectDB();
  } catch (error) {
    console.error(
      `[Server Startup Failed] Unable to connect to database: ${error.message}`,
    );
    // Prevent the server from silently running when the database is required
    if (config.isProduction || process.env.REQUIRE_DB === "true") {
      console.error(
        "[Server Terminated] Database connection is required. Exiting.",
      );
      process.exit(1);
    } else {
      console.warn(
        "[Server Warning] Continuing in development mode without active database connection.",
      );
      console.warn(
        `[Server Warning] Ensure MongoDB is running at ${config.mongoUri} for full database functionality.`,
      );
    }
  }

  const server = app.listen(config.port, () => {
    console.log(
      `[Server] PsychePath API listening on port ${config.port} (${config.nodeEnv})`,
    );
  });

  // Graceful shutdown handling
  const shutdown = (signal) => {
    console.log(
      `\n[Server] Received ${signal}. Initiating graceful shutdown...`,
    );
    server.close(() => {
      console.log("[Server] HTTP server closed.");
      process.exit(0);
    });
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
};

startServer();
