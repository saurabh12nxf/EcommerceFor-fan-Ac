const { createServer } = require('http');
const { storage } = require('./storage');
const { z } = require('zod');
const { 
  insertOrderSchema, 
  insertOrderItemSchema, 
  insertUserSchema 
} = require('../shared/schema');
const session = require('express-session');
const passport = require('passport');
const memorystore = require('memorystore');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

const MemoryStore = memorystore(session);

async function registerRoutes(app) {
  // Session setup
  app.use(
    session({
      secret: "your-secret-key",
      resave: false,
      saveUninitialized: false,
      store: new MemoryStore({
        checkPeriod: 86400000 // Prune expired entries every 24h
      }),
      cookie: {
        secure: process.env.NODE_ENV === "production",
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      }
    })
  );

  // Passport setup
  app.use(passport.initialize());
  app.use(passport.session());

  passport.serializeUser((user, done) => {
    console.log("Serializing user:", user.id);
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      console.log("Deserializing user:", id);
      const user = await storage.getUser(id);
      if (!user) {
        console.error("User not found during deserialization:", id);
        return done(new Error(`User ${id} not found`), null);
      }
      console.log("User found:", user.id);
      done(null, user);
    } catch (error) {
      console.error("Error deserializing user:", error);
      done(error, null);
    }
  });

  // Auth middleware - Define these BEFORE using them
  const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Unauthorized" });
  };

  const hasRole = (roles) => (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const user = req.user;
    if (!roles.includes(user.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    
    next();
  };

  // Google OAuth Strategy - only set up if credentials are available
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: "/api/auth/google/callback"
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            const googleId = profile.id;
            const email = profile.emails?.[0].value;

            if (!email) {
              return done(new Error("Email not provided by Google OAuth"), null);
            }

            // Check if email is in approved list
            const approvedEmail = await storage.getApprovedEmail(email);
            if (!approvedEmail) {
              return done(new Error("Email not approved for access"), null);
            }

            // Find or create user
            let user = await storage.getUserByGoogleId(googleId);
            if (!user) {
              user = await storage.createUser({
                name: profile.displayName,
                email,
                picture: profile.photos?.[0]?.value,
                googleId,
                role: approvedEmail.role
              });
            }

            return done(null, user);
          } catch (error) {
            return done(error, null);
          }
        }
      )
    );
  } else {
    console.log("Google OAuth credentials not found. Authentication will not work.");
  }

  // Auth routes for Google OAuth
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    app.get("/api/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));

    app.get(
      "/api/auth/google/callback",
      passport.authenticate("google", { 
        failureRedirect: "/login?error=google-auth-failed" 
      }),
      (req, res) => {
        res.redirect("/");
      }
    );
  }

  // Make sure approved emails for development exist
  try {
    // Add approved email for development
    const devEmail = await storage.getApprovedEmail("dev@example.com");
    if (!devEmail) {
      await storage.addApprovedEmail({
        email: "dev@example.com",
        role: "admin"
      });
      console.log("Added development email to approved list");
    }
  } catch (error) {
    console.error("Error setting up approved emails:", error);
  }

  // Dev login route - always available regardless of Google OAuth setup
  app.get("/api/auth/dev-login", async (req, res) => {
    try {
      // Create a development user with a stable ID
      const devUserData = {
        name: "Development User",
        email: "dev@example.com",
        role: "admin",
        googleId: "dev-google-id"
      };
      
      // Check if user already exists, if not create it in storage
      let devUser = await storage.getUserByEmail("dev@example.com");
      
      if (!devUser) {
        console.log("Creating development user...");
        // Store the user in the database/storage
        devUser = await storage.createUser(devUserData);
        console.log("Dev user created:", devUser);
      } else {
        console.log("Development user found:", devUser.id);
      }
      
      // Log in with the user that's in storage
      req.login(devUser, (err) => {
        if (err) {
          console.error("Dev login error:", err);
          return res.status(500).json({ message: "Failed to login", error: err.message });
        }
        console.log("Dev login successful for user:", devUser.id);
        return res.redirect("/");
      });
    } catch (error) {
      console.error("Error in dev-login:", error);
      res.status(500).json({ message: "Failed to set up development user", error: error.message });
    }
  });

  app.get("/api/auth/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ authenticated: false });
    }
    res.json({ 
      authenticated: true, 
      user: req.user 
    });
  });

  app.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Failed to logout" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  // Product routes
  app.get("/api/products", async (req, res) => {
    try {
      const products = await storage.getProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.get("/api/products/category/:category", async (req, res) => {
    try {
      const { category } = req.params;
      const products = await storage.getProductsByCategory(category);
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch products by category" });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const product = await storage.getProduct(id);
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  // Order routes
  app.post("/api/orders", isAuthenticated, async (req, res) => {
    try {
      const user = req.user;
      const { order, items } = req.body;
      
      // Validate order and items
      const validatedOrder = insertOrderSchema.parse({
        ...order,
        userId: user.id,
        status: "paid" // New orders start as paid
      });
      
      const validatedItems = z.array(insertOrderItemSchema).parse(items);
      
      // Create order and items
      const newOrder = await storage.createOrder(validatedOrder, validatedItems);
      res.status(201).json(newOrder);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid order data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create order" });
    }
  });

  app.get("/api/orders", isAuthenticated, async (req, res) => {
    try {
      const user = req.user;
      
      let orders = [];
      if (user.role === "admin") {
        orders = await storage.getAllOrders();
      } else if (user.role === "rider") {
        orders = await storage.getRiderOrders(user.id);
      } else {
        orders = await storage.getUserOrders(user.id);
      }
      
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.get("/api/orders/:id", isAuthenticated, async (req, res) => {
    try {
      const id = req.params.id;
      const orderWithItems = await storage.getOrderWithItems(id);
      
      if (!orderWithItems) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      const user = req.user;
      const { order } = orderWithItems;
      
      // Check permission to access this order
      if (
        user.role !== "admin" && 
        order.userId !== user.id && 
        (user.role !== "rider" || order.riderId !== user.id)
      ) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      res.json(orderWithItems);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch order" });
    }
  });

  // Admin-specific routes
  app.patch("/api/admin/orders/:id/status", hasRole(["admin"]), async (req, res) => {
    try {
      const id = req.params.id;
      const { status, riderId } = req.body;
      
      if (!["paid", "shipped", "delivered", "undelivered", "cancelled"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      
      const updatedOrder = await storage.updateOrderStatus(id, status, riderId);
      
      if (!updatedOrder) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      res.json(updatedOrder);
    } catch (error) {
      res.status(500).json({ message: "Failed to update order status" });
    }
  });

  // Rider-specific routes
  app.patch("/api/rider/orders/:id/status", hasRole(["rider"]), async (req, res) => {
    try {
      const id = req.params.id;
      const { status } = req.body;
      const user = req.user;
      
      if (!["delivered", "undelivered"].includes(status)) {
        return res.status(400).json({ message: "Riders can only mark orders as delivered or undelivered" });
      }
      
      // Get the order first to check if this rider is assigned
      const order = await storage.getOrder(id);
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      if (order.riderId !== user.id) {
        return res.status(403).json({ message: "You are not assigned to this order" });
      }
      
      const updatedOrder = await storage.updateOrderStatus(id, status);
      
      res.json(updatedOrder);
    } catch (error) {
      res.status(500).json({ message: "Failed to update order status" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

module.exports = { registerRoutes };