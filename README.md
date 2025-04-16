Fan & AC E-Commerce Platform
A full-stack e-commerce platform for fans and air conditioners with multiple user roles, authentication, and order management.

Features
Multi-Role System: Customer, Admin, and Rider interfaces
Product Management: Browse, filter, and view product details
Shopping Cart: Add products with color and size variants
Order Management: Create, track, and manage orders
Authentication: Secure login with Google OAuth
Admin Dashboard: Manage products, orders, and rider assignments
Rider Interface: Update delivery status with tracking
Tech Stack
Frontend: React, Tailwind CSS, Shadcn UI Components
Backend: Express.js, Node.js
Database: MongoDB with Mongoose
Authentication: Google OAuth
State Management: React Context API, TanStack Query
API Endpoints
Authentication
GET /api/auth/google: Google OAuth login
GET /api/auth/user: Get current user
POST /api/auth/logout: Logout current user
GET /api/auth/dev-login: Development-only login (testing)
Products
GET /api/products: Get all products
GET /api/products/category/:category: Get products by category (fan, ac)
GET /api/products/:id: Get product details
Orders
POST /api/orders: Create a new order
GET /api/orders: Get user orders (role-based access)
GET /api/orders/:id: Get specific order with items
Admin Only
PATCH /api/admin/orders/:id/status: Update order status, assign riders
Rider Only
PATCH /api/rider/orders/:id/status: Update delivery status
Installation
Clone the repository

git clone [https://github.com/yourusername/fan-ac-ecommerce.git](https://github.com/saurabh12nxf/EcommerceFor-fan-Ac.git)
cd fan-ac-ecommerce
Install dependencies

npm install
Set up environment variables
Create a .env file with:

MONGODB_URI=your_mongodb_connection_string
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
Start the development server

npm run dev
Testing the API
Using Postman
Authentication:

Visit http://localhost:5000/api/auth/dev-login in your browser first
After login, copy the session cookie to Postman
Create an Order:

Method: POST
URL: http://localhost:5000/api/orders
Headers: Content-Type: application/json
Body:
{
  "order": {
    "total": 29999,
    "shippingAddress": "123 Main St, City",
    "contactPhone": "555-123-4567"
  },
  "items": [
    {
      "productId": "PRODUCT_ID",
      "quantity": 2,
      "price": 14999,
      "color": "White",
      "size": "Standard"
    }
  ]
}
Get Orders:

Method: GET
URL: http://localhost:5000/api/orders
Project Structure
ecommerce-platform/
├── server/              # Backend code
│   ├── index.js         # Server entry point
│   ├── routes.js        # API endpoints
│   ├── storage.js       # Data access layer
│   └── db.js            # Database connection
├── shared/
│   └── schema.js        # Data models and validation
├── client/              # Frontend code
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── contexts/    # React context providers
│   │   ├── hooks/       # Custom hooks
│   │   ├── lib/         # Utility functions
│   │   ├── pages/       # Page components
│   │   └── App.tsx      # Main application component
└── package.json
Contributing
Fork the repository
Create your feature branch (git checkout -b feature/amazing-feature)
Commit your changes (git commit -m 'Add some amazing feature')
Push to the branch (git push origin feature/amazing-feature)
Open a Pull Request
License
This project is licensed under the MIT License - see the LICENSE file for details.

Acknowledgments
Built with Express.js
UI components from shadcn/ui
Icons from Lucide React
