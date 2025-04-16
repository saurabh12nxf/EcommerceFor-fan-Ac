const mongoose = require('mongoose');
const { Schema } = mongoose;
const { z } = require('zod');

// Enums
const USER_ROLES = ['customer', 'admin', 'rider'];
const ORDER_STATUSES = ['pending', 'paid', 'shipped', 'delivered', 'undelivered', 'cancelled'];
const PRODUCT_CATEGORIES = ['fan', 'ac'];

// User Schema
const userSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  picture: { type: String },
  role: { type: String, enum: USER_ROLES, required: true, default: 'customer' },
  googleId: { type: String, required: true, unique: true },
  phoneNumber: { type: String },
  address: { type: String },
}, { timestamps: true });

// Approved Email Schema
const approvedEmailSchema = new Schema({
  email: { type: String, required: true, unique: true },
  role: { type: String, enum: USER_ROLES, required: true, default: 'customer' },
});

// Product Schema
const productSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, enum: PRODUCT_CATEGORIES, required: true },
  basePrice: { type: Number, required: true }, // Price in cents
  image: { type: String, required: true },
  averageRating: { type: Number },
  reviewCount: { type: Number },
  colors: { type: [String], required: true },
  sizes: { type: [String], required: true },
});

// Order Schema
const orderSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ORDER_STATUSES, required: true, default: 'pending' },
  total: { type: Number, required: true }, // Total in cents
  riderId: { type: Schema.Types.ObjectId, ref: 'User' },
  shippingAddress: { type: String },
  contactPhone: { type: String },
}, { timestamps: true });

// Order Item Schema
const orderItemSchema = new Schema({
  orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true }, // Price at the time of purchase in cents
  color: { type: String, required: true },
  size: { type: String, required: true },
});

// Initialize models
let UserModel, ApprovedEmailModel, ProductModel, OrderModel, OrderItemModel;

// Only create models on the server side
if (typeof window === 'undefined') {
  try {
    // Check if models are already defined to prevent overwriting
    UserModel = mongoose.models.User || mongoose.model('User', userSchema);
    ApprovedEmailModel = mongoose.models.ApprovedEmail || mongoose.model('ApprovedEmail', approvedEmailSchema);
    ProductModel = mongoose.models.Product || mongoose.model('Product', productSchema);
    OrderModel = mongoose.models.Order || mongoose.model('Order', orderSchema);
    OrderItemModel = mongoose.models.OrderItem || mongoose.model('OrderItem', orderItemSchema);
  } catch (error) {
    console.error('Error creating Mongoose models:', error);
  }
}

// Create Zod schemas for validation
const insertUserSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  picture: z.string().optional(),
  role: z.enum(USER_ROLES).default('customer'),
  googleId: z.string(),
  phoneNumber: z.string().optional(),
  address: z.string().optional(),
});

const insertApprovedEmailSchema = z.object({
  email: z.string().email(),
  role: z.enum(USER_ROLES).default('customer'),
});

const insertProductSchema = z.object({
  name: z.string(),
  description: z.string(),
  category: z.enum(PRODUCT_CATEGORIES),
  basePrice: z.number().int().positive(),
  image: z.string(),
  averageRating: z.number().optional(),
  reviewCount: z.number().optional(),
  colors: z.array(z.string()),
  sizes: z.array(z.string()),
});

const insertOrderSchema = z.object({
  userId: z.string(),
  status: z.enum(ORDER_STATUSES).default('pending'),
  total: z.number().int().positive(),
  riderId: z.string().optional(),
  shippingAddress: z.string().optional(),
  contactPhone: z.string().optional(),
});

const insertOrderItemSchema = z.object({
  orderId: z.string(),
  productId: z.string(),
  quantity: z.number().int().positive(),
  price: z.number().int().positive(),
  color: z.string(),
  size: z.string(),
});

module.exports = {
  // Constants
  USER_ROLES,
  ORDER_STATUSES,
  PRODUCT_CATEGORIES,
  
  // Models
  UserModel,
  ApprovedEmailModel,
  ProductModel,
  OrderModel,
  OrderItemModel,
  
  // Schemas
  userSchema,
  approvedEmailSchema,
  productSchema,
  orderSchema,
  orderItemSchema,
  
  // Validation schemas
  insertUserSchema,
  insertApprovedEmailSchema,
  insertProductSchema,
  insertOrderSchema,
  insertOrderItemSchema
};