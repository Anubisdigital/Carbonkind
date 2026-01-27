/**
 * index Social Network - Backend Server
 * Complete with real OAuth authentication and all features
 */

// Import required modules
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const path = require('path');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// SECURITY & MIDDLEWARE CONFIGURATION
// ============================================

// Security headers
app.use(helmet({
    contentSecurityPolicy: false, // Disable for development, configure for production
    crossOriginEmbedderPolicy: false
}));

// CORS configuration
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', apiLimiter);

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || crypto.randomBytes(64).toString('hex'),
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Initialize Passport for authentication
app.use(passport.initialize());
app.use(passport.session());

// ============================================
// DATABASE CONFIGURATION
// ============================================

// MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/index';

// Connect to MongoDB
mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('✅ Connected to MongoDB'))
.catch(err => {
    console.error('❌ MongoDB connection error:', err);
    // Continue without MongoDB for demo (using in-memory storage)
    console.log('⚠️ Using in-memory storage (data will be lost on restart)');
});

// ============================================
// IN-MEMORY STORAGE (Fallback if no MongoDB)
// ============================================

let users = [];
let posts = [];
let reports = [];
let userCounter = 42; // Start with 42 users for demo

// Load sample data if no MongoDB
function initializeSampleData() {
    if (users.length === 0) {
        users = [
            {
                id: 'user_1',
                username: 'alexjohnson',
                displayName: 'Alex Johnson',
                email: 'alex@example.com',
                provider: 'google',
                avatar: 'https://ui-avatars.com/api/?name=Alex+Johnson&background=10b981&color=fff',
                createdAt: new Date(Date.now() - 86400000 * 7) // 7 days ago
            },
            {
                id: 'user_2',
                username: 'taylorswift',
                displayName: 'Taylor Swift',
                email: 'taylor@example.com',
                provider: 'github',
                avatar: 'https://ui-avatars.com/api/?name=Taylor+Swift&background=059669&color=fff',
                createdAt: new Date(Date.now() - 86400000 * 5) // 5 days ago
            },
            {
                id: 'user_3',
                username: 'techenthusiast',
                displayName: 'Tech Enthusiast',
                email: 'tech@example.com',
                provider: 'facebook',
                avatar: 'https://ui-avatars.com/api/?name=Tech+Enthusiast&background=34d399&color=fff',
                createdAt: new Date(Date.now() - 86400000 * 3) // 3 days ago
            }
        ];
    }

    if (posts.length === 0) {
        posts = [
            {
                id: 'post_1',
                userId: 'user_1',
                username: 'alexjohnson',
                displayName: 'Alex Johnson',
                avatar: 'https://ui-avatars.com/api/?name=Alex+Johnson&background=10b981&color=fff',
                text: 'Just discovered this amazing platform! So easy to share media from anywhere.',
                mediaLink: 'https://images.unsplash.com/photo-1579546929662-711aa81148cf?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000',
                mediaType: 'image',
                likes: ['user_2', 'user_3'],
                comments: [
                    {
                        id: 'comment_1',
                        userId: 'user_2',
                        username: 'taylorswift',
                        displayName: 'Taylor Swift',
                        avatar: 'https://ui-avatars.com/api/?name=Taylor+Swift&background=059669&color=fff',
                        text: 'Welcome to index!',
                        createdAt: new Date(Date.now() - 7200000) // 2 hours ago
                    },
                    {
                        id: 'comment_2',
                        userId: 'user_3',
                        username: 'techenthusiast',
                        displayName: 'Tech Enthusiast',
                        avatar: 'https://ui-avatars.com/api/?name=Tech+Enthusiast&background=34d399&color=fff',
                        text: 'Great to have you here!',
                        createdAt: new Date(Date.now() - 3600000) // 1 hour ago
                    }
                ],
                reports: [],
                createdAt: new Date(Date.now() - 7200000), // 2 hours ago
                isRemoved: false
            },
            {
                id: 'post_2',
                userId: 'user_2',
                username: 'taylorswift',
                displayName: 'Taylor Swift',
                avatar: 'https://ui-avatars.com/api/?name=Taylor+Swift&background=059669&color=fff',
                text: 'Check out this beautiful landscape from my hike yesterday!',
                mediaLink: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000',
                mediaType: 'image',
                likes: ['user_1', 'user_3'],
                comments: [
                    {
                        id: 'comment_3',
                        userId: 'user_1',
                        username: 'alexjohnson',
                        displayName: 'Alex Johnson',
                        avatar: 'https://ui-avatars.com/api/?name=Alex+Johnson&background=10b981&color=fff',
                        text: 'Beautiful view!',
                        createdAt: new Date(Date.now() - 1800000) // 30 minutes ago
                    }
                ],
                reports: [],
                createdAt: new Date(Date.now() - 18000000), // 5 hours ago
                isRemoved: false
            },
            {
                id: 'post_3',
                userId: 'user_3',
                username: 'techenthusiast',
                displayName: 'Tech Enthusiast',
                avatar: 'https://ui-avatars.com/api/?name=Tech+Enthusiast&background=34d399&color=fff',
                text: 'Here\'s a great tutorial I found on YouTube about JavaScript frameworks.',
                mediaLink: 'https://www.youtube.com/embed/DHvZLI7Db8E',
                mediaType: 'video',
                likes: ['user_2'],
                comments: [],
                reports: [
                    {
                        userId: 'user_1',
                        username: 'alexjohnson',
                        reason: 'spam',
                        createdAt: new Date(Date.now() - 86400000) // 1 day ago
                    }
                ],
                createdAt: new Date(Date.now() - 86400000), // 1 day ago
                isRemoved: false
            }
        ];
    }
}

// Initialize sample data
initializeSampleData();

// ============================================
// PASSPORT AUTHENTICATION STRATEGIES
// ============================================

// Serialize and deserialize user
passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        // Try to find user in database first
        let user;
        if (mongoose.connection.readyState === 1) {
            // Using MongoDB
            const User = mongoose.model('User');
            user = await User.findById(id);
        } else {
            // Using in-memory storage
            user = users.find(u => u.id === id);
        }
        
        if (!user) {
            return done(new Error('User not found'), null);
        }
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

// Local Strategy for email/password (only if using MongoDB)
if (mongoose.connection.readyState === 1) {
    const LocalStrategy = require('passport-local').Strategy;
    const User = require('./models/User'); // You'll need to create this model
    
    passport.use(new LocalStrategy({
        usernameField: 'email',
        passwordField: 'password'
    }, async (email, password, done) => {
        try {
            const user = await User.findOne({ email: email.toLowerCase(), provider: 'email' });
            
            if (!user) {
                return done(null, false, { message: 'Invalid email or password' });
            }
            
            const isValidPassword = await bcrypt.compare(password, user.password);
            
            if (!isValidPassword) {
                return done(null, false, { message: 'Invalid email or password' });
            }
            
            // Update last login
            user.lastLogin = Date.now();
            await user.save();
            
            return done(null, user);
        } catch (error) {
            return done(error, null);
        }
    }));
}

// Configure OAuth strategies based on environment variables
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    const GoogleStrategy = require('passport-google-oauth20').Strategy;
    
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || `${process.env.BACKEND_URL || 'http://localhost:3000'}/auth/google/callback`,
        scope: ['profile', 'email']
    },
    async (accessToken, refreshToken, profile, done) => {
        try {
            let user;
            
            if (mongoose.connection.readyState === 1) {
                // Using MongoDB
                const User = mongoose.model('User');
                user = await User.findOne({ provider: 'google', providerId: profile.id });
                
                if (!user) {
                    // Generate unique username
                    let username = profile.displayName.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
                    if (!username || username.length < 3) {
                        username = 'user' + Math.floor(Math.random() * 10000);
                    }
                    
                    // Ensure username is unique
                    let usernameExists = await User.findOne({ username: username });
                    let counter = 1;
                    while (usernameExists) {
                        username = username + counter;
                        usernameExists = await User.findOne({ username: username });
                        counter++;
                    }
                    
                    user = new User({
                        provider: 'google',
                        providerId: profile.id,
                        username: username,
                        displayName: profile.displayName,
                        email: profile.emails?.[0]?.value || '',
                        avatar: profile.photos?.[0]?.value || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.displayName)}&background=10b981&color=fff`
                    });
                    await user.save();
                    console.log(`✅ New Google user created: ${user.username}`);
                } else {
                    user.lastLogin = Date.now();
                    await user.save();
                }
            } else {
                // Using in-memory storage
                user = users.find(u => u.provider === 'google' && u.email === profile.emails?.[0]?.value);
                
                if (!user) {
                    user = {
                        id: 'google_' + Date.now(),
                        username: profile.displayName.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase(),
                        displayName: profile.displayName,
                        email: profile.emails?.[0]?.value || '',
                        provider: 'google',
                        avatar: profile.photos?.[0]?.value || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.displayName)}&background=10b981&color=fff`,
                        createdAt: new Date()
                    };
                    users.push(user);
                    userCounter++;
                    console.log(`✅ New Google user created: ${user.username}`);
                }
            }
            
            return done(null, user);
        } catch (error) {
            return done(error, null);
        }
    }));
}

if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
    const GitHubStrategy = require('passport-github2').Strategy;
    
    passport.use(new GitHubStrategy({
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: process.env.GITHUB_CALLBACK_URL || `${process.env.BACKEND_URL || 'http://localhost:3000'}/auth/github/callback`,
        scope: ['user:email']
    },
    async (accessToken, refreshToken, profile, done) => {
        try {
            let user;
            
            if (mongoose.connection.readyState === 1) {
                // Using MongoDB
                const User = mongoose.model('User');
                user = await User.findOne({ provider: 'github', providerId: profile.id });
                
                if (!user) {
                    // Generate unique username
                    let username = profile.username;
                    if (!username || username.length < 3) {
                        username = 'user' + Math.floor(Math.random() * 10000);
                    }
                    
                    // Ensure username is unique
                    let usernameExists = await User.findOne({ username: username });
                    let counter = 1;
                    while (usernameExists) {
                        username = username + counter;
                        usernameExists = await User.findOne({ username: username });
                        counter++;
                    }
                    
                    user = new User({
                        provider: 'github',
                        providerId: profile.id,
                        username: username,
                        displayName: profile.displayName || profile.username,
                        email: profile.emails?.[0]?.value || '',
                        avatar: profile.photos?.[0]?.value || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.displayName || profile.username)}&background=10b981&color=fff`
                    });
                    await user.save();
                    console.log(`✅ New GitHub user created: ${user.username}`);
                } else {
                    user.lastLogin = Date.now();
                    await user.save();
                }
            } else {
                // Using in-memory storage
                user = users.find(u => u.provider === 'github' && u.username === profile.username);
                
                if (!user) {
                    user = {
                        id: 'github_' + Date.now(),
                        username: profile.username,
                        displayName: profile.displayName || profile.username,
                        email: profile.emails?.[0]?.value || '',
                        provider: 'github',
                        avatar: profile.photos?.[0]?.value || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.displayName || profile.username)}&background=10b981&color=fff`,
                        createdAt: new Date()
                    };
                    users.push(user);
                    userCounter++;
                    console.log(`✅ New GitHub user created: ${user.username}`);
                }
            }
            
            return done(null, user);
        } catch (error) {
            return done(error, null);
        }
    }));
}

if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
    const FacebookStrategy = require('passport-facebook').Strategy;
    
    passport.use(new FacebookStrategy({
        clientID: process.env.FACEBOOK_APP_ID,
        clientSecret: process.env.FACEBOOK_APP_SECRET,
        callbackURL: process.env.FACEBOOK_CALLBACK_URL || `${process.env.BACKEND_URL || 'http://localhost:3000'}/auth/facebook/callback`,
        profileFields: ['id', 'displayName', 'photos', 'email']
    },
    async (accessToken, refreshToken, profile, done) => {
        try {
            let user;
            
            if (mongoose.connection.readyState === 1) {
                // Using MongoDB
                const User = mongoose.model('User');
                user = await User.findOne({ provider: 'facebook', providerId: profile.id });
                
                if (!user) {
                    // Generate unique username
                    let username = profile.displayName.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
                    if (!username || username.length < 3) {
                        username = 'user' + Math.floor(Math.random() * 10000);
                    }
                    
                    // Ensure username is unique
                    let usernameExists = await User.findOne({ username: username });
                    let counter = 1;
                    while (usernameExists) {
                        username = username + counter;
                        usernameExists = await User.findOne({ username: username });
                        counter++;
                    }
                    
                    user = new User({
                        provider: 'facebook',
                        providerId: profile.id,
                        username: username,
                        displayName: profile.displayName,
                        email: profile.emails?.[0]?.value || '',
                        avatar: profile.photos?.[0]?.value || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.displayName)}&background=10b981&color=fff`
                    });
                    await user.save();
                    console.log(`✅ New Facebook user created: ${user.username}`);
                } else {
                    user.lastLogin = Date.now();
                    await user.save();
                }
            } else {
                // Using in-memory storage
                user = users.find(u => u.provider === 'facebook' && u.email === profile.emails?.[0]?.value);
                
                if (!user) {
                    user = {
                        id: 'facebook_' + Date.now(),
                        username: profile.displayName.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase(),
                        displayName: profile.displayName,
                        email: profile.emails?.[0]?.value || '',
                        provider: 'facebook',
                        avatar: profile.photos?.[0]?.value || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.displayName)}&background=10b981&color=fff`,
                        createdAt: new Date()
                    };
                    users.push(user);
                    userCounter++;
                    console.log(`✅ New Facebook user created: ${user.username}`);
                }
            }
            
            return done(null, user);
        } catch (error) {
            return done(error, null);
        }
    }));
}

// ============================================
// HELPER FUNCTIONS
// ============================================

// Sanitize text input to prevent XSS attacks
function sanitizeText(text) {
    if (!text) return '';
    
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
}

// Detect media type from URL
function detectMediaType(url) {
    if (!url) return 'none';
    
    const urlLower = url.toLowerCase();
    
    // Video platforms
    if (urlLower.includes('youtube.com') || urlLower.includes('youtu.be')) return 'video';
    if (urlLower.includes('vimeo.com')) return 'video';
    if (urlLower.includes('tiktok.com')) return 'video';
    
    // Image platforms
    if (urlLower.includes('imgur.com')) return 'image';
    if (urlLower.includes('postimages.org')) return 'image';
    if (urlLower.includes('cloudinary.com')) return 'image';
    if (urlLower.includes('drive.google.com') && urlLower.includes('/uc?')) return 'image';
    if (urlLower.includes('dropbox.com') && urlLower.includes('dl=0')) return 'image';
    if (urlLower.includes('cdn.discordapp.com')) return 'image';
    if (urlLower.includes('unsplash.com')) return 'image';
    if (urlLower.includes('pinimg.com')) return 'image';
    
    // File extensions
    if (urlLower.match(/\.(jpg|jpeg|png|gif|webp|bmp|svg)$/)) return 'image';
    if (urlLower.match(/\.(mp4|webm|ogg|mov)$/)) return 'video';
    
    // Default to embed for other links
    return 'embed';
}

// Format user object for response
function formatUserForResponse(user) {
    return {
        id: user.id || user._id,
        username: user.username,
        displayName: user.displayName || user.username,
        email: user.email,
        avatar: user.avatar,
        provider: user.provider,
        createdAt: user.createdAt
    };
}

// Format post object for response
function formatPostForResponse(post, currentUserId = null) {
    const liked = currentUserId ? post.likes.includes(currentUserId) : false;
    const reported = currentUserId ? post.reports.some(r => r.userId === currentUserId) : false;
    
    return {
        id: post.id || post._id,
        userId: post.userId,
        username: post.username,
        displayName: post.displayName,
        avatar: post.avatar,
        text: post.text,
        mediaLink: post.mediaLink,
        mediaType: post.mediaType,
        likes: post.likes.length,
        comments: post.comments.map(comment => ({
            id: comment.id || comment._id,
            userId: comment.userId,
            username: comment.username,
            displayName: comment.displayName,
            avatar: comment.avatar,
            text: comment.text,
            createdAt: comment.createdAt
        })),
        reporters: post.reports.map(report => ({
            userId: report.userId,
            username: report.username,
            reason: report.reason
        })),
        reportCount: post.reports.length,
        createdAt: post.createdAt,
        liked: liked,
        reported: reported
    };
}

// ============================================
// AUTHENTICATION ROUTES
// ============================================

// Email/Password Registration (Demo version - no real database)
app.post('/auth/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        
        // Validation
        if (!username || !email || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        
        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }
        
        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }
        
        // Username validation
        const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
        if (!usernameRegex.test(username)) {
            return res.status(400).json({ error: 'Username must be 3-30 characters and can only contain letters, numbers, and underscores' });
        }
        
        // Check if email already exists
        const existingUser = users.find(u => u.email === email.toLowerCase());
        if (existingUser) {
            return res.status(400).json({ error: 'Email already registered' });
        }
        
        // Create new user
        const user = {
            id: 'email_' + Date.now(),
            username: username,
            displayName: username,
            email: email.toLowerCase(),
            provider: 'email',
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=10b981&color=fff`,
            createdAt: new Date()
        };
        
        users.push(user);
        userCounter++;
        
        // Log in the user
        req.login(user, (err) => {
            if (err) {
                return res.status(500).json({ error: 'Login after registration failed' });
            }
            
            res.json({
                success: true,
                user: formatUserForResponse(user)
            });
        });
        
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// Email/Password Login (Demo version)
app.post('/auth/login', (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }
        
        // Find user by email (demo - in real app, check password)
        const user = users.find(u => u.email === email.toLowerCase() && u.provider === 'email');
        
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        
        // In a real app, you would verify the password here
        // For demo, we accept any password
        
        // Log in the user
        req.login(user, (err) => {
            if (err) {
                return res.status(500).json({ error: 'Login failed' });
            }
            
            res.json({
                success: true,
                user: formatUserForResponse(user)
            });
        });
        
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Google OAuth routes
app.get('/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/login' }),
    (req, res) => {
        // Successful authentication
        res.redirect(process.env.FRONTEND_URL || 'http://localhost:3000');
    }
);

// GitHub OAuth routes
app.get('/auth/github',
    passport.authenticate('github', { scope: ['user:email'] })
);

app.get('/auth/github/callback',
    passport.authenticate('github', { failureRedirect: '/login' }),
    (req, res) => {
        // Successful authentication
        res.redirect(process.env.FRONTEND_URL || 'http://localhost:3000');
    }
);

// Facebook OAuth routes
app.get('/auth/facebook',
    passport.authenticate('facebook', { scope: ['email'] })
);

app.get('/auth/facebook/callback',
    passport.authenticate('facebook', { failureRedirect: '/login' }),
    (req, res) => {
        // Successful authentication
        res.redirect(process.env.FRONTEND_URL || 'http://localhost:3000');
    }
);

// Logout route
app.get('/auth/logout', (req, res) => {
    req.logout((err) => {
        if (err) {
            return res.status(500).json({ error: 'Logout failed' });
        }
        res.json({ success: true, message: 'Logged out successfully' });
    });
});

// Check authentication status
app.get('/auth/status', (req, res) => {
    if (req.isAuthenticated()) {
        res.json({
            authenticated: true,
            user: formatUserForResponse(req.user)
        });
    } else {
        res.json({ authenticated: false });
    }
});

// ============================================
// API ROUTES
// ============================================

// Get total user count
app.get('/api/users/count', async (req, res) => {
    try {
        let count;
        
        if (mongoose.connection.readyState === 1) {
            // Using MongoDB
            const User = mongoose.model('User');
            count = await User.countDocuments();
        } else {
            // Using in-memory storage
            count = userCounter;
        }
        
        res.json({ count });
    } catch (error) {
        console.error('Error getting user count:', error);
        res.status(500).json({ error: 'Failed to get user count' });
    }
});

// Create a new post
app.post('/api/posts', async (req, res) => {
    try {
        if (!req.isAuthenticated()) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        
        const { text, mediaLink } = req.body;
        
        // Validate input
        if (!text || text.trim().length === 0) {
            return res.status(400).json({ error: 'Post text is required' });
        }
        
        if (text.length > 2000) {
            return res.status(400).json({ error: 'Post text is too long (max 2000 characters)' });
        }
        
        // Detect media type
        const mediaType = detectMediaType(mediaLink);
        
        // Create new post
        const post = {
            id: 'post_' + Date.now(),
            userId: req.user.id || req.user._id,
            username: req.user.username,
            displayName: req.user.displayName || req.user.username,
            avatar: req.user.avatar,
            text: sanitizeText(text),
            mediaLink: mediaLink || '',
            mediaType: mediaType,
            likes: [],
            comments: [],
            reports: [],
            createdAt: new Date(),
            isRemoved: false
        };
        
        posts.unshift(post);
        
        res.status(201).json({
            success: true,
            post: formatPostForResponse(post, req.user.id || req.user._id)
        });
        
    } catch (error) {
        console.error('Error creating post:', error);
        res.status(500).json({ error: 'Failed to create post' });
    }
});

// Get all posts (with pagination)
app.get('/api/posts', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        
        // Get active posts
        const activePosts = posts.filter(post => !post.isRemoved);
        
        // Apply pagination
        const paginatedPosts = activePosts.slice(skip, skip + limit);
        
        // Format response
        const currentUserId = req.isAuthenticated() ? (req.user.id || req.user._id) : null;
        const formattedPosts = paginatedPosts.map(post => 
            formatPostForResponse(post, currentUserId)
        );
        
        res.json({
            posts: formattedPosts,
            pagination: {
                page,
                limit,
                total: activePosts.length,
                pages: Math.ceil(activePosts.length / limit)
            }
        });
        
    } catch (error) {
        console.error('Error fetching posts:', error);
        res.status(500).json({ error: 'Failed to fetch posts' });
    }
});

// Like/unlike a post
app.post('/api/posts/:postId/like', async (req, res) => {
    try {
        if (!req.isAuthenticated()) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        
        const { postId } = req.params;
        const userId = req.user.id || req.user._id;
        
        // Find the post
        const post = posts.find(p => p.id === postId && !p.isRemoved);
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }
        
        // Check if user already liked the post
        const likeIndex = post.likes.indexOf(userId);
        
        if (likeIndex === -1) {
            // Add like
            post.likes.push(userId);
        } else {
            // Remove like
            post.likes.splice(likeIndex, 1);
        }
        
        res.json({
            success: true,
            liked: likeIndex === -1,
            likes: post.likes.length
        });
        
    } catch (error) {
        console.error('Error liking post:', error);
        res.status(500).json({ error: 'Failed to update like' });
    }
});

// Add comment to a post
app.post('/api/posts/:postId/comments', async (req, res) => {
    try {
        if (!req.isAuthenticated()) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        
        const { postId } = req.params;
        const { text } = req.body;
        
        // Validate comment text
        if (!text || text.trim().length === 0) {
            return res.status(400).json({ error: 'Comment text is required' });
        }
        
        if (text.length > 500) {
            return res.status(400).json({ error: 'Comment is too long (max 500 characters)' });
        }
        
        // Find the post
        const post = posts.find(p => p.id === postId && !p.isRemoved);
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }
        
        // Add comment
        const comment = {
            id: 'comment_' + Date.now(),
            userId: req.user.id || req.user._id,
            username: req.user.username,
            displayName: req.user.displayName || req.user.username,
            avatar: req.user.avatar,
            text: sanitizeText(text),
            createdAt: new Date()
        };
        
        post.comments.push(comment);
        
        res.status(201).json({
            success: true,
            comment: {
                id: comment.id,
                userId: comment.userId,
                username: comment.username,
                displayName: comment.displayName,
                avatar: comment.avatar,
                text: comment.text,
                createdAt: comment.createdAt
            }
        });
        
    } catch (error) {
        console.error('Error adding comment:', error);
        res.status(500).json({ error: 'Failed to add comment' });
    }
});

// Report a post
app.post('/api/posts/:postId/report', async (req, res) => {
    try {
        if (!req.isAuthenticated()) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        
        const { postId } = req.params;
        const { reason } = req.body;
        
        // Validate reason
        const validReasons = ['spam', 'harassment', 'hate', 'violence', 'nudity', 'copyright', 'other'];
        if (!reason || !validReasons.includes(reason)) {
            return res.status(400).json({ error: 'Valid report reason is required' });
        }
        
        // Find the post
        const post = posts.find(p => p.id === postId && !p.isRemoved);
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }
        
        const userId = req.user.id || req.user._id;
        
        // Check if user already reported this post
        const alreadyReported = post.reports.some(report => 
            report.userId === userId
        );
        
        if (alreadyReported) {
            return res.status(400).json({ error: 'You have already reported this post' });
        }
        
        // Add report
        post.reports.push({
            userId: userId,
            username: req.user.username,
            reason: reason,
            createdAt: new Date()
        });
        
        // Check if post has 5 or more reports
        let removed = false;
        if (post.reports.length >= 5) {
            post.isRemoved = true;
            removed = true;
        }
        
        res.json({
            success: true,
            message: removed 
                ? 'Report submitted. This post has been removed due to multiple reports.' 
                : 'Report submitted successfully',
            reportCount: post.reports.length,
            removed: removed
        });
        
    } catch (error) {
        console.error('Error reporting post:', error);
        res.status(500).json({ error: 'Failed to submit report' });
    }
});

// Get user profile
app.get('/api/users/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        
        let user;
        if (mongoose.connection.readyState === 1) {
            // Using MongoDB
            const User = mongoose.model('User');
            user = await User.findById(userId).select('-password -__v');
        } else {
            // Using in-memory storage
            user = users.find(u => u.id === userId);
        }
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Get user's post count
        const postCount = posts.filter(p => p.userId === userId && !p.isRemoved).length;
        
        res.json({
            id: user.id || user._id,
            username: user.username,
            displayName: user.displayName,
            avatar: user.avatar,
            provider: user.provider,
            createdAt: user.createdAt,
            postCount: postCount
        });
        
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});

// ============================================
// STATIC FILES & ERROR HANDLING
// ============================================

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        userCount: userCounter,
        postCount: posts.length,
        usingMongoDB: mongoose.connection.readyState === 1
    });
});

// Serve the frontend HTML for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    
    const message = process.env.NODE_ENV === 'production' 
        ? 'Something went wrong' 
        : err.message;
    
    res.status(err.status || 500).json({ error: message });
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
    console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
    
    // Log which OAuth providers are configured
    const providers = [];
    if (process.env.GOOGLE_CLIENT_ID) providers.push('Google');
    if (process.env.GITHUB_CLIENT_ID) providers.push('GitHub');
    if (process.env.FACEBOOK_APP_ID) providers.push('Facebook');
    
    if (providers.length > 0) {
        console.log(`✅ OAuth Providers: ${providers.join(', ')}`);
    } else {
        console.warn('⚠️ No OAuth providers configured. Using demo mode.');
        console.log('💡 To enable real OAuth, set environment variables:');
        console.log('   GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET');
        console.log('   GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET');
        console.log('   FACEBOOK_APP_ID, FACEBOOK_APP_SECRET');
    }
    
    if (mongoose.connection.readyState !== 1) {
        console.log('💡 Using in-memory storage. Data will be lost on restart.');
        console.log('💡 To use MongoDB, set MONGODB_URI environment variable.');
    }
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received. Closing server...');
    if (mongoose.connection.readyState === 1) {
        mongoose.connection.close();
    }
    process.exit(0);
});
