// At the top of server/index.js
require('dotenv').config();
const express = require('express');
const { registerRoutes } = require('./routes');
const { log, setupVite, serveStatic } = require('./vite');

async function main() {
  const app = express();
  
  // Middleware for JSON parsing
  app.use(express.json());
  
  // Register API routes
  const httpServer = await registerRoutes(app);
  
  // For development with Vite
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, httpServer);
  } else {
    serveStatic(app);
  }
  
  // General error handler
  app.use((err, _req, res, _next) => {
    log(`Error: ${err.message}`);
    
    res.status(500).json({
      error: "Internal Server Error",
      message: process.env.NODE_ENV === "development" ? err.message : "Something went wrong"
    });
  });
  
  // Start the server
  const PORT = process.env.PORT || 5000;
  httpServer.listen(PORT, () => {
    log(`serving on port ${PORT}`);
  });
}

main().catch(err => {
  console.error("Server failed to start:", err);
  process.exit(1);
});