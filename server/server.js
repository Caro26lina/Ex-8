const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Load environment variables with better error handling
try {
  require('dotenv').config();
  console.log('✅ Environment variables loaded');
  
  // Check if JWT_SECRET is set
  if (!process.env.JWT_SECRET) {
    console.log('⚠️  JWT_SECRET not found in environment variables, using fallback');
    process.env.JWT_SECRET = 'fallback_jwt_secret_for_development_digital_voting_2024_12345';
  }
  if (!process.env.JWT_EXPIRE) {
    process.env.JWT_EXPIRE = '30d';
  }
  
  console.log('🔑 JWT Configuration:', {
    hasSecret: !!process.env.JWT_SECRET,
    secretLength: process.env.JWT_SECRET.length,
    expire: process.env.JWT_EXPIRE
  });
} catch (error) {
  console.log('❌ Error loading environment variables:', error.message);
}

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Debug middleware to log requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Basic route - test if server is working
app.get('/', (req, res) => {
  res.json({ 
    message: 'Digital Voting Platform API',
    status: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Test route to check environment variables
app.get('/api/debug', (req, res) => {
  res.json({
    mongodb_uri: process.env.MONGODB_URI ? '✅ Set' : '❌ Not set',
    port: process.env.PORT || '5000 (default)',
    jwt_secret: process.env.JWT_SECRET ? '✅ Set' : '❌ Not set',
    jwt_secret_length: process.env.JWT_SECRET ? process.env.JWT_SECRET.length : 0,
    node_env: process.env.NODE_ENV || 'development'
  });
});

// Debug route to check JWT configuration
app.get('/api/debug-jwt', (req, res) => {
  const jwtInfo = {
    hasJwtSecret: !!process.env.JWT_SECRET,
    jwtSecretPreview: process.env.JWT_SECRET ? 
      process.env.JWT_SECRET.substring(0, 10) + '...' : 'Not set',
    jwtSecretLength: process.env.JWT_SECRET ? process.env.JWT_SECRET.length : 0,
    jwtExpire: process.env.JWT_EXPIRE,
    allEnvVars: Object.keys(process.env).filter(key => key.includes('JWT') || key.includes('SECRET'))
  };
  
  console.log('🔑 JWT Debug Information:', jwtInfo);
  
  res.json({
    success: true,
    message: 'JWT Configuration Check',
    data: jwtInfo
  });
});

// Debug route to check available routes
app.get('/api/debug-routes', (req, res) => {
  const routes = [];
  app._router.stack.forEach(middleware => {
    if (middleware.route) {
      // Routes registered directly on the app
      routes.push({
        path: middleware.route.path,
        methods: Object.keys(middleware.route.methods)
      });
    } else if (middleware.name === 'router') {
      // Routes registered via router
      middleware.handle.stack.forEach(handler => {
        if (handler.route) {
          const route = handler.route;
          routes.push({
            path: route.path,
            methods: Object.keys(route.methods),
            middleware: 'router'
          });
        }
      });
    }
  });
  
  res.json({
    success: true,
    totalRoutes: routes.length,
    availableRoutes: routes
  });
});

// Test route to check if auth file exists
app.get('/api/check-auth-file', (req, res) => {
  const authFile = path.join(__dirname, 'routes', 'auth.js');
  const authFileExists = fs.existsSync(authFile);
  
  res.json({ 
    success: true, 
    authFileExists: authFileExists,
    message: authFileExists ? 'Auth route file exists' : 'Auth route file NOT found',
    filePath: authFile
  });
});

// Test route for auth
app.get('/api/auth/test', (req, res) => {
  res.json({
    success: true,
    message: 'Auth test route is working!',
    timestamp: new Date().toISOString()
  });
});

// Routes with better error handling
console.log('🔄 Loading routes...');
try {
  // Load auth routes
  const authRoutes = require('./routes/auth');
  app.use('/api/auth', authRoutes);
  console.log('✅ Auth routes mounted at /api/auth');

  // Load competition routes if exists
  try {
    const competitionRoutes = require('./routes/competitions');
    app.use('/api/competitions', competitionRoutes);
    console.log('✅ Competition routes mounted at /api/competitions');
  } catch (compError) {
    console.log('ℹ️  Competition routes not available:', compError.message);
  }

  // Only load test routes if the file exists
  const testRoutePath = path.join(__dirname, 'routes', 'test.js');
  if (fs.existsSync(testRoutePath)) {
    try {
      app.use('/api', require(testRoutePath));
      console.log('✅ Test routes loaded successfully');
    } catch (testError) {
      console.log('❌ Error loading test routes:', testError.message);
    }
  } else {
    console.log('ℹ️  Test routes not found (optional)');
  }
  
  console.log('✅ All routes loaded successfully');
} catch (error) {
  console.log('❌ Error loading routes:', error.message);
  console.log('💡 Make sure all route files exist in the routes folder');
}

// MongoDB Connection with better error handling
const connectDB = async () => {
  try {
    // Check if MongoDB URI is defined
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in environment variables. Please check your .env file');
    }

    console.log('🔗 Attempting to connect to MongoDB...');
    console.log('📁 Database:', process.env.MONGODB_URI);

    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000, // Increased to 10 seconds
      bufferCommands: false,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
    
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    console.log('💡 Troubleshooting tips:');
    console.log('   1. Make sure MongoDB is running on your system');
    console.log('   2. Check if the MONGODB_URI in .env file is correct');
    console.log('   3. Verify MongoDB service is started');
    console.log('   4. Try: sudo systemctl start mongod (Linux) or net start MongoDB (Windows)');
    
    // Don't exit in development - allow server to run without DB
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
};

// Connect to database
connectDB();

// MongoDB connection event handlers
mongoose.connection.on('connected', () => {
  console.log('✅ Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️  Mongoose disconnected from MongoDB');
});

// Health check endpoint (for monitoring)
app.get('/api/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    database: dbStatus,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  });
});

// Handle 404 errors
app.use('*', (req, res) => {
  console.log(`❌ 404 - Route not found: ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    availableEndpoints: [
      'GET  /',
      'GET  /api/debug',
      'GET  /api/debug-jwt',
      'GET  /api/health',
      'GET  /api/debug-routes',
      'GET  /api/check-auth-file',
      'GET  /api/auth/test',
      'POST /api/auth/register',
      'POST /api/auth/login',
      'GET  /api/auth/me',
      'GET  /api/competitions',
      'POST /api/competitions'
    ]
  });
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error('🚨 Global Error Handler:', err.stack);
  
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(val => val.message);
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors: messages
    });
  }
  
  // Mongoose duplicate key error
  if (err.code === 11000) {
    return res.status(400).json({
      success: false,
      message: 'Duplicate field value entered'
    });
  }
  
  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
  
  // Route not found
  if (err.code === 'MODULE_NOT_FOUND') {
    return res.status(500).json({
      success: false,
      message: 'Server configuration error: Route module not found'
    });
  }
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log('🚨 Unhandled Rejection at:', promise, 'reason:', err);
  // Close server & exit process
  if (server) {
    server.close(() => {
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.log('🚨 Uncaught Exception:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('👋 Received SIGINT. Shutting down gracefully...');
  if (server) {
    server.close(() => {
      console.log('✅ HTTP server closed.');
      mongoose.connection.close(false, () => {
        console.log('✅ MongoDB connection closed.');
        process.exit(0);
      });
    });
  } else {
    process.exit(0);
  }
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log('\n' + '='.repeat(50));
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📍 API URL: http://localhost:${PORT}`);
  console.log('='.repeat(50) + '\n');
});

module.exports = app;