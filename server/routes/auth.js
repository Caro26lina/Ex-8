const express = require('express');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

console.log('🔧 Initializing auth routes...');

// Test route
router.get('/test', (req, res) => {
    console.log('✅ GET /api/auth/test called');
    res.json({
        success: true,
        message: 'Auth routes are working perfectly!',
        timestamp: new Date().toISOString()
    });
});

// JWT Token Generation Function with EXTENSIVE Debugging
const generateToken = (userId) => {
    console.log(' ');
    console.log('🔑 [JWT DEBUG] === STARTING TOKEN GENERATION ===');
    console.log('🔑 [JWT DEBUG] User ID:', userId);
    console.log('🔑 [JWT DEBUG] JWT_SECRET exists:', !!process.env.JWT_SECRET);
    console.log('🔑 [JWT DEBUG] JWT_SECRET length:', process.env.JWT_SECRET ? process.env.JWT_SECRET.length : 0);
    console.log('🔑 [JWT DEBUG] JWT_EXPIRE:', process.env.JWT_EXPIRE);
    console.log('🔑 [JWT DEBUG] jwt module loaded:', !!jwt);
    console.log('🔑 [JWT DEBUG] jwt.sign function:', typeof jwt.sign);
    
    try {
        if (!process.env.JWT_SECRET) {
            throw new Error('JWT_SECRET is not defined in environment variables');
        }

        console.log('🔑 [JWT DEBUG] Calling jwt.sign...');
        
        const token = jwt.sign(
            { 
                id: userId,
                timestamp: new Date().toISOString()
            }, 
            process.env.JWT_SECRET, 
            { 
                expiresIn: process.env.JWT_EXPIRE || '30d',
                algorithm: 'HS256'
            }
        );
        
        console.log('✅ [JWT DEBUG] Token generated successfully!');
        console.log('✅ [JWT DEBUG] Token length:', token.length);
        console.log('✅ [JWT DEBUG] Token preview:', token.substring(0, 50) + '...');
        console.log('🔑 [JWT DEBUG] === TOKEN GENERATION COMPLETE ===');
        console.log(' ');
        
        return token;
    } catch (error) {
        console.error('❌ [JWT DEBUG] TOKEN GENERATION FAILED!');
        console.error('❌ [JWT DEBUG] Error message:', error.message);
        console.error('❌ [JWT DEBUG] Error name:', error.name);
        console.error('❌ [JWT DEBUG] Error stack:', error.stack);
        console.log('🔑 [JWT DEBUG] === TOKEN GENERATION FAILED ===');
        console.log(' ');
        throw error;
    }
};

// REGISTER ROUTE with COMPLETE DEBUGGING
router.post('/register', [
    body('username')
        .isLength({ min: 3 })
        .withMessage('Username must be at least 3 characters long'),
    body('email')
        .isEmail()
        .withMessage('Please provide a valid email'),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long')
], async (req, res) => {
    console.log(' ');
    console.log('📝 [REGISTER] === REGISTRATION STARTED ===');
    console.log('📝 [REGISTER] Request body:', req.body);
    
    try {
        // Check validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.log('❌ [REGISTER] Validation errors:', errors.array());
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { username, email, password } = req.body;

        console.log('👤 [REGISTER] Checking if user exists...');
        // Check if user exists
        const existingUser = await User.findOne({
            $or: [{ email }, { username }]
        });

        if (existingUser) {
            console.log('❌ [REGISTER] User already exists');
            return res.status(400).json({
                success: false,
                message: 'User already exists with this email or username'
            });
        }

        console.log('👤 [REGISTER] Creating new user in database...');
        // Create user
        const user = await User.create({
            username,
            email,
            password
        });

        console.log('✅ [REGISTER] User created successfully in DB');
        console.log('✅ [REGISTER] User ID:', user._id);
        console.log('✅ [REGISTER] Username:', user.username);

        // Generate JWT token with error handling
        let token;
        try {
            console.log('🔑 [REGISTER] Starting token generation...');
            token = generateToken(user._id);
            console.log('✅ [REGISTER] Token generation completed successfully');
        } catch (tokenError) {
            console.error('❌ [REGISTER] CRITICAL: Token generation failed!');
            console.error('❌ [REGISTER] Error:', tokenError.message);
            
            // Delete the user since token generation failed
            console.log('🗑️ [REGISTER] Deleting user due to token failure...');
            await User.findByIdAndDelete(user._id);
            console.log('🗑️ [REGISTER] User deleted from database');
            
            return res.status(500).json({
                success: false,
                message: 'Authentication setup failed',
                error: tokenError.message,
                details: 'JWT token could not be generated'
            });
        }
        
        console.log('🎉 [REGISTER] === REGISTRATION COMPLETED SUCCESSFULLY ===');
        console.log('👤 [REGISTER] User:', user.username);
        console.log('🔑 [REGISTER] Token generated successfully');
        console.log(' ');
        
        res.status(201).json({
            success: true,
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error('❌ [REGISTER] === REGISTRATION FAILED ===');
        console.error('❌ [REGISTER] Error:', error.message);
        console.error('❌ [REGISTER] Stack:', error.stack);
        console.log(' ');
        
        res.status(500).json({
            success: false,
            message: 'Server error during registration',
            error: error.message
        });
    }
});

// LOGIN ROUTE
router.post('/login', [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').exists().withMessage('Please provide a password')
], async (req, res) => {
    console.log('🔐 POST /api/auth/login called with email:', req.body.email);
    
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { email, password } = req.body;

        // Check if user exists and password is correct
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Check password
        const isPasswordMatch = await user.matchPassword(password);
        if (!isPasswordMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Generate JWT token with error handling
        let token;
        try {
            token = generateToken(user._id);
        } catch (tokenError) {
            console.error('❌ Token generation failed:', tokenError);
            return res.status(500).json({
                success: false,
                message: 'Authentication failed',
                error: tokenError.message
            });
        }

        console.log('✅ Login successful for user:', user._id);
        
        res.status(200).json({
            success: true,
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error('❌ Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during login'
        });
    }
});

// GET USER ROUTE
router.get('/me', async (req, res) => {
    console.log('👤 GET /api/auth/me called');
    try {
        res.status(200).json({
            success: true,
            message: 'Get user endpoint is working',
            user: {
                id: 'sample-id',
                username: 'sampleuser',
                email: 'sample@example.com'
            }
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// Debug route to check JWT configuration
router.get('/debug-jwt', (req, res) => {
    const jwtConfig = {
        hasJwtSecret: !!process.env.JWT_SECRET,
        jwtSecretLength: process.env.JWT_SECRET ? process.env.JWT_SECRET.length : 0,
        jwtExpire: process.env.JWT_EXPIRE,
        nodeEnv: process.env.NODE_ENV,
        jwtModule: {
            loaded: !!jwt,
            version: jwt.version,
            signType: typeof jwt.sign
        }
    };
    
    console.log('🔑 JWT Debug Info:', jwtConfig);
    
    res.json({
        success: true,
        message: 'JWT Configuration Debug',
        jwtConfig: jwtConfig
    });
});

// Test JWT route
router.get('/test-jwt', (req, res) => {
    console.log('🔑 Testing JWT generation...');
    try {
        const testToken = jwt.sign(
            { test: true, timestamp: new Date().toISOString() },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );
        
        console.log('✅ Test token generated successfully');
        res.json({
            success: true,
            message: 'JWT test successful',
            token: testToken,
            tokenLength: testToken.length
        });
    } catch (error) {
        console.error('❌ JWT test failed:', error);
        res.status(500).json({
            success: false,
            message: 'JWT test failed',
            error: error.message
        });
    }
});

console.log('✅ Auth routes initialized');

module.exports = router;