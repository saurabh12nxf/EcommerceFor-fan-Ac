const mongoose = require('mongoose');
const { 
  UserModel,
  ApprovedEmailModel,
  ProductModel,
  OrderModel,
  OrderItemModel,
  USER_ROLES,
  ORDER_STATUSES,
  PRODUCT_CATEGORIES
} = require('../shared/schema');
const { getDb } = require('./db');

// In-memory storage class that simulates MongoDB storage if MongoDB is not available
class MemStorage {
  constructor() {
    console.log("Initializing in-memory storage as fallback...");
    this.users = new Map();
    this.approvedEmails = new Map();
    this.products = new Map();
    this.orders = new Map();
    this.orderItems = new Map();
    this.nextId = 1;
    
    this.initializeData();
  }
  
  // Generate a MongoDB-like ObjectId
  generateId() {
    return `mock_${Date.now()}_${this.nextId++}`;
  }
  
  // Initialize with sample data
  async initializeData() {
    // Initialize with some approved emails
    await this.addApprovedEmail({ email: "admin@example.com", role: "admin" });
    await this.addApprovedEmail({ email: "rider@example.com", role: "rider" });
    await this.addApprovedEmail({ email: "customer@example.com", role: "customer" });
    
    // Initialize with some products
    await this.createProduct({
      name: "Premium Tower Fan",
      description: "High-performance tower fan with oscillation and remote control.",
      category: "fan",
      basePrice: 14999, // $149.99
      image: "https://images.unsplash.com/photo-1551498641-f5c6fe9d4afa?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
      averageRating: 4,
      reviewCount: 42,
      colors: ["White", "Black", "Silver"],
      sizes: ["Standard", "Compact", "Large"]
    });
    
    await this.createProduct({
      name: "Eco Smart AC",
      description: "Energy-efficient air conditioner with smart temperature control.",
      category: "ac",
      basePrice: 54999, // $549.99
      image: "https://images.unsplash.com/photo-1588854337115-1c67d9247e4d?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
      averageRating: 5,
      reviewCount: 118,
      colors: ["White", "Silver"],
      sizes: ["8,000", "10,000", "12,000"]
    });
    
    await this.createProduct({
      name: "Ceiling Fan with Light",
      description: "Modern ceiling fan with integrated LED light and wireless remote.",
      category: "fan",
      basePrice: 19999, // $199.99
      image: "https://images.unsplash.com/photo-1631083734151-b3112976d253?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
      averageRating: 4,
      reviewCount: 87,
      colors: ["Brushed Nickel", "Oil-Rubbed Bronze", "Matte White"],
      sizes: ["42 inch", "52 inch", "60 inch"]
    });
    
    await this.createProduct({
      name: "Portable AC Unit",
      description: "Move from room to room with this powerful portable air conditioner.",
      category: "ac",
      basePrice: 32999, // $329.99
      image: "https://images.unsplash.com/photo-1580810734586-763f9a2cfcb4?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
      averageRating: 3,
      reviewCount: 56,
      colors: ["White", "Black"],
      sizes: ["8,000", "10,000", "14,000"]
    });
    
    await this.createProduct({
      name: "Ultra Quiet Desk Fan",
      description: "Whisper-quiet operation with adjustable speeds and tilt.",
      category: "fan",
      basePrice: 3999, // $39.99
      image: "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
      averageRating: 4,
      reviewCount: 204,
      colors: ["White", "Black", "Pink", "Blue"],
      sizes: ["6 inch", "9 inch", "12 inch"]
    });
  }

  // User operations
  async getUser(id) {
    return this.users.get(id);
  }

  async getUserByEmail(email) {
    for (const user of this.users.values()) {
      if (user.email === email) {
        return user;
      }
    }
    return undefined;
  }

  async getUserByGoogleId(googleId) {
    for (const user of this.users.values()) {
      if (user.googleId === googleId) {
        return user;
      }
    }
    return undefined;
  }

  async createUser(user) {
    const id = this.generateId();
    const now = new Date();
    const newUser = { 
      ...user, 
      _id: id,
      id,
      createdAt: now,
      updatedAt: now
    };
    
    this.users.set(id, newUser);
    return newUser;
  }

  async updateUser(id, userData) {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { 
      ...user, 
      ...userData,
      updatedAt: new Date()
    };
    
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Approved emails operations
  async getApprovedEmail(email) {
    return this.approvedEmails.get(email);
  }

  async addApprovedEmail(email) {
    const id = this.generateId();
    const newApprovedEmail = { 
      ...email, 
      _id: id,
      id
    };
    
    this.approvedEmails.set(email.email, newApprovedEmail);
    return newApprovedEmail;
  }

  // Product operations
  async getProducts() {
    return Array.from(this.products.values());
  }

  async getProductsByCategory(category) {
    return Array.from(this.products.values()).filter(
      product => product.category === category
    );
  }

  async getProduct(id) {
    return this.products.get(id);
  }

  async createProduct(product) {
    const id = this.generateId();
    const newProduct = { 
      ...product, 
      _id: id,
      id
    };
    
    this.products.set(id, newProduct);
    return newProduct;
  }

  // Order operations
  async createOrder(order, items) {
    const id = this.generateId();
    const now = new Date();
    
    const newOrder = { 
      ...order, 
      _id: id,
      id,
      createdAt: now,
      updatedAt: now
    };
    
    this.orders.set(id, newOrder);
    
    // Create order items with the new order ID
    const orderItems = items.map(item => {
      const itemId = this.generateId();
      return { 
        ...item, 
        _id: itemId,
        id: itemId,
        orderId: id 
      };
    });
    
    this.orderItems.set(id, orderItems);
    
    return newOrder;
  }

  async getOrder(id) {
    return this.orders.get(id);
  }

  async getOrderWithItems(id) {
    const order = this.orders.get(id);
    if (!order) return undefined;
    
    const items = await this.getOrderItems(id);
    return { order, items };
  }

  async getUserOrders(userId) {
    return Array.from(this.orders.values()).filter(
      order => order.userId.toString() === userId
    );
  }

  async getRiderOrders(riderId) {
    return Array.from(this.orders.values()).filter(
      order => order.riderId && order.riderId.toString() === riderId
    );
  }

  async getAllOrders() {
    return Array.from(this.orders.values());
  }

  async updateOrderStatus(id, status, riderId) {
    const order = this.orders.get(id);
    if (!order) return undefined;
    
    const updatedOrder = { 
      ...order, 
      status: status,
      updatedAt: new Date(),
      ...(riderId ? { riderId } : {})
    };
    
    this.orders.set(id, updatedOrder);
    return updatedOrder;
  }

  // Order Items operations
  async getOrderItems(orderId) {
    return this.orderItems.get(orderId) || [];
  }
}

// MongoDB storage implementation
class MongoDBStorage {
  constructor() {
    // Initialize the database with sample data
    this.init();
  }

  // Initialize database with sample data if needed
  async init() {
    try {
      if (!mongoose.connection || mongoose.connection.readyState !== 1) {
        console.log("MongoDB not connected, skipping initialization");
        return;
      }
      
      // Check if we already have products
      const productsCount = await ProductModel.countDocuments();
      if (productsCount === 0) {
        console.log("Initializing MongoDB with sample data...");
        
        // Initialize with some approved emails
        await ApprovedEmailModel.create([
          { email: "admin@example.com", role: "admin" },
          { email: "rider@example.com", role: "rider" },
          { email: "customer@example.com", role: "customer" }
        ]);
        
        // Initialize with some products
        await ProductModel.create([
          {
            name: "Premium Tower Fan",
            description: "High-performance tower fan with oscillation and remote control.",
            category: "fan",
            basePrice: 14999, // $149.99
            image: "https://images.unsplash.com/photo-1551498641-f5c6fe9d4afa?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
            averageRating: 4,
            reviewCount: 42,
            colors: ["White", "Black", "Silver"],
            sizes: ["Standard", "Compact", "Large"]
          },
          {
            name: "Eco Smart AC",
            description: "Energy-efficient air conditioner with smart temperature control.",
            category: "ac",
            basePrice: 54999, // $549.99
            image: "https://images.unsplash.com/photo-1588854337115-1c67d9247e4d?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
            averageRating: 5,
            reviewCount: 118,
            colors: ["White", "Silver"],
            sizes: ["8,000", "10,000", "12,000"]
          },
          {
            name: "Ceiling Fan with Light",
            description: "Modern ceiling fan with integrated LED light and wireless remote.",
            category: "fan",
            basePrice: 19999, // $199.99
            image: "https://images.unsplash.com/photo-1631083734151-b3112976d253?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
            averageRating: 4,
            reviewCount: 87,
            colors: ["Brushed Nickel", "Oil-Rubbed Bronze", "Matte White"],
            sizes: ["42 inch", "52 inch", "60 inch"]
          },
          {
            name: "Portable AC Unit",
            description: "Move from room to room with this powerful portable air conditioner.",
            category: "ac",
            basePrice: 32999, // $329.99
            image: "https://images.unsplash.com/photo-1580810734586-763f9a2cfcb4?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
            averageRating: 3,
            reviewCount: 56,
            colors: ["White", "Black"],
            sizes: ["8,000", "10,000", "14,000"]
          },
          {
            name: "Ultra Quiet Desk Fan",
            description: "Whisper-quiet operation with adjustable speeds and tilt.",
            category: "fan",
            basePrice: 3999, // $39.99
            image: "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
            averageRating: 4,
            reviewCount: 204,
            colors: ["White", "Black", "Pink", "Blue"],
            sizes: ["6 inch", "9 inch", "12 inch"]
          }
        ]);
        
        console.log("Sample data initialized successfully in MongoDB.");
      }
    } catch (error) {
      console.error("Failed to initialize MongoDB database:", error);
    }
  }

  // User operations
  async getUser(id) {
    try {
      const user = await UserModel.findById(id);
      return user ? user.toObject() : undefined;
    } catch (error) {
      console.error("Error getting user by ID:", error);
      return undefined;
    }
  }

  async getUserByEmail(email) {
    try {
      const user = await UserModel.findOne({ email });
      return user ? user.toObject() : undefined;
    } catch (error) {
      console.error("Error getting user by email:", error);
      return undefined;
    }
  }

  async getUserByGoogleId(googleId) {
    try {
      const user = await UserModel.findOne({ googleId });
      return user ? user.toObject() : undefined;
    } catch (error) {
      console.error("Error getting user by Google ID:", error);
      return undefined;
    }
  }

  async createUser(user) {
    try {
      const newUser = await UserModel.create(user);
      return newUser.toObject();
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  }

  async updateUser(id, userData) {
    try {
      const user = await UserModel.findByIdAndUpdate(
        id,
        { $set: userData },
        { new: true }
      );
      return user ? user.toObject() : undefined;
    } catch (error) {
      console.error("Error updating user:", error);
      return undefined;
    }
  }

  // Approved emails operations
  async getApprovedEmail(email) {
    try {
      const approvedEmail = await ApprovedEmailModel.findOne({ email });
      return approvedEmail ? approvedEmail.toObject() : undefined;
    } catch (error) {
      console.error("Error getting approved email:", error);
      return undefined;
    }
  }

  async addApprovedEmail(email) {
    try {
      const newApprovedEmail = await ApprovedEmailModel.create(email);
      return newApprovedEmail.toObject();
    } catch (error) {
      console.error("Error adding approved email:", error);
      throw error;
    }
  }

  // Product operations
  async getProducts() {
    try {
      const products = await ProductModel.find();
      return products.map(product => product.toObject());
    } catch (error) {
      console.error("Error getting products:", error);
      return [];
    }
  }

  async getProductsByCategory(category) {
    try {
      const products = await ProductModel.find({ category });
      return products.map(product => product.toObject());
    } catch (error) {
      console.error(`Error getting products by category ${category}:`, error);
      return [];
    }
  }

  async getProduct(id) {
    try {
      const product = await ProductModel.findById(id);
      return product ? product.toObject() : undefined;
    } catch (error) {
      console.error("Error getting product by ID:", error);
      return undefined;
    }
  }

  async createProduct(product) {
    try {
      const newProduct = await ProductModel.create(product);
      return newProduct.toObject();
    } catch (error) {
      console.error("Error creating product:", error);
      throw error;
    }
  }

  // Order operations
  async createOrder(order, items) {
    try {
      // Create the order
      const newOrder = await OrderModel.create(order);
      const orderId = newOrder._id;
      
      // Create order items with the new order ID
      const orderItemsWithOrderId = items.map(item => ({
        ...item,
        orderId
      }));
      
      await OrderItemModel.create(orderItemsWithOrderId);
      
      return newOrder.toObject();
    } catch (error) {
      console.error("Error creating order:", error);
      throw error;
    }
  }

  async getOrder(id) {
    try {
      const order = await OrderModel.findById(id);
      return order ? order.toObject() : undefined;
    } catch (error) {
      console.error("Error getting order by ID:", error);
      return undefined;
    }
  }

  async getOrderWithItems(id) {
    try {
      const order = await OrderModel.findById(id);
      if (!order) return undefined;
      
      const items = await this.getOrderItems(id);
      return { 
        order: order.toObject(), 
        items 
      };
    } catch (error) {
      console.error("Error getting order with items:", error);
      return undefined;
    }
  }

  async getUserOrders(userId) {
    try {
      const orders = await OrderModel.find({ userId });
      return orders.map(order => order.toObject());
    } catch (error) {
      console.error("Error getting user orders:", error);
      return [];
    }
  }

  async getRiderOrders(riderId) {
    try {
      const orders = await OrderModel.find({ riderId });
      return orders.map(order => order.toObject());
    } catch (error) {
      console.error("Error getting rider orders:", error);
      return [];
    }
  }

  async getAllOrders() {
    try {
      const orders = await OrderModel.find().sort({ createdAt: -1 });
      return orders.map(order => order.toObject());
    } catch (error) {
      console.error("Error getting all orders:", error);
      return [];
    }
  }

  async updateOrderStatus(id, status, riderId) {
    try {
      const updateData = { status };
      if (riderId) {
        updateData.riderId = riderId;
      }
      
      const order = await OrderModel.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true }
      );
      
      return order ? order.toObject() : undefined;
    } catch (error) {
      console.error("Error updating order status:", error);
      return undefined;
    }
  }

  // Order Items operations
  async getOrderItems(orderId) {
    try {
      const items = await OrderItemModel.find({ orderId });
      return items.map(item => item.toObject());
    } catch (error) {
      console.error("Error getting order items:", error);
      return [];
    }
  }
}

// Factory function to create the appropriate storage based on MongoDB connection status
const createStorage = () => {
  // Check if MongoDB is connected
  if (mongoose.connection && mongoose.connection.readyState === 1) {
    console.log("Using MongoDB storage");
    return new MongoDBStorage();
  } else {
    console.log("MongoDB not connected, using in-memory storage");
    return new MemStorage();
  }
};

// Export the storage implementation
module.exports = {
  storage: createStorage()
};