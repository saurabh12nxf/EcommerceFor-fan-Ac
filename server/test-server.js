const express = require('express');
const app = express();

// Simple test route
app.get('/test', (req, res) => {
  res.send('Express server is working!');
});

// API test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working!' });
});

// Start server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
  console.log(`Try accessing http://localhost:${PORT}/test`);
});