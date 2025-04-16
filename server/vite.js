const path = require('path');

// Simple logging utility
function log(message, source = "express") {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`${timestamp} [${source}] ${message}`);
}

// Setup Vite for development
async function setupVite(app, server) {
  // In development mode, we use Vite to serve the frontend
  // This function would typically initialize Vite
  log("Development mode: Setting up Vite server");
  
  // For a real implementation, you would include Vite here
  // but keeping it simple for this example
  
  return server;
}

// Serve static files in production
function serveStatic(app) {
  log("Production mode: Serving static files");
  
  // Serve static files from the 'dist' directory
  app.use(express.static(path.join(__dirname, '../client/dist')));
  
  // All other requests should be directed to index.html for SPA routing
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
}

module.exports = {
  log,
  setupVite,
  serveStatic
};