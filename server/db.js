const { MongoClient, ServerApiVersion } = require('mongodb');
const mongoose = require('mongoose');

// Set up mongoose connection
console.log('Setting up MongoDB connection...');
mongoose.set('strictQuery', false);

// Connect to MongoDB
const connectDB = async () => {
  try {
    // For production, use a real MongoDB connection string
    // await mongoose.connect('mongodb://username:password@host:port/database');
    
    // For development in environments like Replit
    console.log('Creating MongoDB connection for development');
    
    await mongoose.connect('mongodb://127.0.0.1:27017/ecommerce', {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
      family: 4 // Use IPv4, avoid IPv6 issues
    });
    
    console.log('MongoDB connected successfully');
    return true;
  } catch (error) {
    console.error('MongoDB connection failed:', error);
    
    // Fallback to in-memory mode for development
    console.log('Falling back to mock database mode');
    return false;
  }
};

// Initialize connection
connectDB();

// Export mongoose
module.exports = {
  mongoose,
  
  // Function to access database (if connected)
  getDb: async function() {
    if (mongoose.connection.readyState !== 1) {
      // Not connected
      console.log('MongoDB not connected, will use fallback storage');
      return null;
    }
    
    return mongoose.connection.db;
  }
};