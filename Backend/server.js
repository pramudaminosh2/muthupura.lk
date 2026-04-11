require('dotenv').config();

// Firebase Admin SDK - use existing firebase.js setup
const bucket = require('./firebase');
const admin = require('firebase-admin');

const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const postLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 20,
    message: 'Too many posts',
    skip: (req) => process.env.NODE_ENV !== 'production'
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per windowMs
    message: 'Too many authentication attempts, please try again later',
    skip: (req) => process.env.NODE_ENV !== 'production'
});

const apiLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 30, // 30 requests per minute
    message: 'Too many API requests, please try again later',
    skip: (req) => process.env.NODE_ENV !== 'production'
});

const mysql = require('mysql2');
const crypto = require('crypto');

// Test URL parsing function (for debugging)
function extractFilePathFromUrl(imageUrl) {
    try {
        if (!imageUrl || typeof imageUrl !== 'string') {
            return null;
        }

        console.log(`🔍 Input URL: ${imageUrl.substring(0, 100)}...`);

        // NEW LOGIC: Handle Google Cloud Storage URLs
        // Format: https://storage.googleapis.com/muthupuralk.firebasestorage.app/vehicles/filename.jpg

        const bucketPrefix = 'https://storage.googleapis.com/muthupuralk.firebasestorage.app/';

        if (imageUrl.startsWith(bucketPrefix)) {
            // Remove the bucket prefix to get the file path
            const filePath = imageUrl.substring(bucketPrefix.length);

            // Decode URL encoding (%20 → space, etc.)
            const decodedPath = decodeURIComponent(filePath);

            console.log(`✅ GCS extraction - extracted: ${decodedPath}`);
            console.log(`📁 Final result: ${decodedPath}`);
            return decodedPath;
        }

        // Fallback: Try old Firebase /o/ format for backward compatibility
        console.log('⚠️  URL does not match GCS format, trying legacy Firebase format...');

        // URL format: https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{filePath}?alt=media&token={token}
        let filePath = null;

        // Method 1: Try URL parsing (most reliable)
        const urlObj = new URL(imageUrl);
        const pathname = urlObj.pathname;
        console.log(`🔍 URL pathname: ${pathname}`);

        // Extract path after /o/ and before any query parameters
        const filePathMatch = pathname.match(/\/o\/(.+)$/);
        if (filePathMatch && filePathMatch[1]) {
            filePath = decodeURIComponent(filePathMatch[1]);
            console.log(`✅ Legacy URL parsing method - extracted: ${filePath}`);
        } else {
            // Fallback: regex method for problematic URLs
            const regexMatch = imageUrl.match(/\/o\/([^?]+)/);
            if (regexMatch && regexMatch[1]) {
                filePath = decodeURIComponent(regexMatch[1]);
                console.log(`✅ Legacy fallback regex method - extracted: ${filePath}`);
            }
        }

        console.log(`📁 Final result: ${filePath || 'FAILED TO EXTRACT'}`);
        return filePath;
    } catch (error) {
        console.warn('❌ Error extracting file path from URL:', error.message);
        return null;
    }
}

// Multer setup for memory storage
const multer = require('multer');
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB per file
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Google OAuth settings
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || 'YOUR_GOOGLE_CLIENT_SECRET';
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || (process.env.NODE_ENV === 'production' ? 'https://muthupura-backend.onrender.com/auth/google/callback' : 'http://localhost:3000/auth/google/callback');
const GOOGLE_OAUTH2_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v3/userinfo';

// Facebook OAuth settings
const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID || 'YOUR_FACEBOOK_APP_ID';
const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET || 'YOUR_FACEBOOK_APP_SECRET';
const FACEBOOK_REDIRECT_URI = process.env.FACEBOOK_REDIRECT_URI || (process.env.NODE_ENV === 'production' ? 'https://muthupura-backend.onrender.com/auth/facebook/callback' : 'http://localhost:3000/auth/facebook/callback');
const FACEBOOK_OAUTH_URL = 'https://www.facebook.com/v16.0/dialog/oauth';
const FACEBOOK_TOKEN_URL = 'https://graph.facebook.com/v16.0/oauth/access_token';
const FACEBOOK_USERINFO_URL = 'https://graph.facebook.com/v16.0/me';

// ============================================
// EXPRESS APP INITIALIZATION
// ============================================
const app = express();

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ FIXED: Production-ready CORS configuration
const allowedOrigins = [
  'https://muthupura.lk',
  'https://www.muthupura.lk',
  'http://localhost:3000',
  'http://127.0.0.1:5500'
];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS not allowed for this origin: ' + origin));
    }
  },
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// ✅ FIXED: Caching headers & security headers
app.use((req, res, next) => {
    if (req.method === 'GET') {
        if (req.path.match(/\.(css|js|png|jpg|jpeg|gif|woff|woff2|svg)$/)) {
            res.set('Cache-Control', 'public, max-age=604800, immutable');
        } else if (req.path.startsWith('/get-vehicles') || req.path.startsWith('/vehicles')) {
            res.set('Cache-Control', 'public, max-age=300');
        } else {
            res.set('Cache-Control', 'no-cache');
        }
    } else {
        res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    }
    // Security headers
    res.set('X-Content-Type-Options', 'nosniff');
    res.set('X-Frame-Options', 'DENY');
    next();
});

app.use(session({
    secret: process.env.SESSION_SECRET || 'muthupura-session-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));
app.use(passport.initialize());
app.use(passport.session());

// Serve static files from Frontend directory
app.use(express.static('../Frontend'));

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser((id, done) => {
    db.query('SELECT * FROM users WHERE id = ?', [id], (err, results) => {
        if (err) return done(err);
        done(null, results[0]);
    });
});

const handleOAuthLogin = (provider, providerId, email, name, callback) => {
    console.log(`OAuth login attempt`, { provider, providerId, email, name });
    const keyField = provider === 'google' ? 'google_id' : provider === 'facebook' ? 'facebook_id' : null;
    if (!keyField) return callback(new Error('Invalid provider'));

    db.query(`SELECT * FROM users WHERE ${keyField} = ? OR email = ?`, [providerId, email], (err, results) => {
        if (err) {
            console.error('OAuth DB lookup error', err);
            return callback(err);
        }

        if (results.length > 0) {
            const user = results[0];
            const updateData = {};
            if (!user[keyField]) updateData[keyField] = providerId;
            if (!user.auth_provider || user.auth_provider === 'local') updateData.auth_provider = provider;

            if (Object.keys(updateData).length > 0) {
                db.query(`UPDATE users SET ? WHERE id = ?`, [updateData, user.id], (updateErr) => {
                    if (updateErr) console.error('OAuth user update error', updateErr);
                    return callback(null, { ...user, ...updateData });
                });
            } else {
                return callback(null, user);
            }
            return;
        }

        const username = (name || email.split('@')[0]).toLowerCase().replace(/[^a-z0-9]/g, '').substr(0, 20) + Math.floor(Math.random() * 10000);
        const role = 'user';
        const authProvider = provider;

        db.query('INSERT INTO users (name, username, email, role, auth_provider, ' + keyField + ') VALUES (?, ?, ?, ?, ?, ?)',
            [name, username, email, role, authProvider, providerId], (insertErr, insertResult) => {
                if (insertErr) {
                    console.error('OAuth user insert error', insertErr);
                    return callback(insertErr);
                }
                const newUser = { id: insertResult.insertId, name, email, role, auth_provider: authProvider, [keyField]: providerId };
                return callback(null, newUser);
            });
    });
};

passport.use(new GoogleStrategy({
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: GOOGLE_REDIRECT_URI
}, (accessToken, refreshToken, profile, done) => {
    const googleId = profile.id;
    const email = (profile.emails?.[0]?.value || '').trim().toLowerCase();
    const name = profile.displayName || (profile.name ? `${profile.name.givenName || ''} ${profile.name.familyName || ''}`.trim() : email.split('@')[0]);

    handleOAuthLogin('google', googleId, email, name, done);
}));

passport.use(new FacebookStrategy({
    clientID: FACEBOOK_APP_ID,
    clientSecret: FACEBOOK_APP_SECRET,
    callbackURL: FACEBOOK_REDIRECT_URI,
    profileFields: ['id', 'displayName', 'emails']
}, (accessToken, refreshToken, profile, done) => {
    const facebookId = profile.id;
    const email = (profile.emails?.[0]?.value || '').trim().toLowerCase();
    const name = profile.displayName || email.split('@')[0];

    handleOAuthLogin('facebook', facebookId, email, name, done);
}));

// ✅ FIXED: Use Pool instead of single connection for production reliability
// Pool automatically handles connection reuse and recovery
let db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT) || 3306,
    ssl: {
        rejectUnauthorized: false
    },
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// ✅ FIXED: Pools don't need .connect() - test connection with a simple query instead
db.query('SELECT NOW() as server_time', (err, results) => {
    if (err) {
        console.error('❌ Database connection FAILED:', err.message);
        console.error('Connection details:', {
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            database: process.env.DB_NAME,
            port: process.env.DB_PORT
        });
        process.exit(1);
    } else {
        console.log('\n✅ Database Connection SUCCESS');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('Connection Details:');
        console.log(`  Host: ${process.env.DB_HOST}`);
        console.log(`  Database: ${process.env.DB_NAME}`);
        console.log(`  User: ${process.env.DB_USER}`);
        console.log(`  Port: ${process.env.DB_PORT}`);
        console.log(`  SSL: ${process.env.DB_SSL === 'true' ? 'Enabled' : 'Disabled'}`);
        console.log('  Server Time:', results[0]?.server_time);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        // ✅ FIXED: Create OTP sessions table for persistent OTP storage
        db.query(`
            CREATE TABLE IF NOT EXISTS otp_sessions (
                id INT PRIMARY KEY AUTO_INCREMENT,
                phone VARCHAR(32) UNIQUE NOT NULL,
                otp VARCHAR(10) NOT NULL,
                expiresAt DATETIME NOT NULL,
                attempts INT DEFAULT 0,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_phone_expires (phone, expiresAt)
            )
        `, (err) => {
            if (err && !err.message.includes('already exists')) {
                console.error('Error creating otp_sessions table:', err.message);
            } else {
                console.log('✅ OTP sessions table ready');
            }
        });

        // Ensure required vehicle fields exist for featured and view counter
        db.query("ALTER TABLE vehicles ADD COLUMN isFeatured TINYINT(1) DEFAULT 0", alterErr => {
            if (alterErr && alterErr.code !== 'ER_DUP_FIELDNAME') {
                console.error('Failed to add isFeatured column:', alterErr);
            }
        });

        db.query("ALTER TABLE vehicles ADD COLUMN views INT DEFAULT 0", alterErr => {
            if (alterErr && alterErr.code !== 'ER_DUP_FIELDNAME') {
                console.error('Failed to add views column:', alterErr);
            }
        });

        db.query("ALTER TABLE vehicles ADD COLUMN featuredUntil DATETIME NULL", alterErr => {
            if (alterErr && alterErr.code !== 'ER_DUP_FIELDNAME') {
                console.error('Failed to add featuredUntil column:', alterErr);
            }
        });

        db.query("ALTER TABLE vehicles ADD COLUMN createdAt DATETIME DEFAULT CURRENT_TIMESTAMP", alterErr => {
            if (alterErr && alterErr.code !== 'ER_DUP_FIELDNAME') {
                console.error('Failed to add createdAt column:', alterErr);
            }
        });

        db.query("ALTER TABLE vehicles ADD COLUMN fuelType VARCHAR(32) DEFAULT 'Petrol'", alterErr => {
            if (alterErr && alterErr.code !== 'ER_DUP_FIELDNAME') {
                console.error('Failed to add fuelType column:', alterErr);
            }
        });

        db.query("ALTER TABLE vehicles ADD COLUMN ownerId INT NULL", alterErr => {
            if (alterErr && alterErr.code !== 'ER_DUP_FIELDNAME') {
                console.error('Failed to add ownerId column:', alterErr);
            }
        });

        db.query("ALTER TABLE vehicles ADD COLUMN images TEXT NULL", alterErr => {
            if (alterErr && alterErr.code !== 'ER_DUP_FIELDNAME') {
                console.error('Failed to add images column:', alterErr);
            }
        });

        db.query("ALTER TABLE vehicles ADD COLUMN location VARCHAR(128) DEFAULT 'Unknown'", alterErr => {
            if (alterErr && alterErr.code !== 'ER_DUP_FIELDNAME') {
                console.error('Failed to add location column:', alterErr);
            }
        });

        db.query("ALTER TABLE vehicles ADD COLUMN description TEXT NULL", alterErr => {
            if (alterErr && alterErr.code !== 'ER_DUP_FIELDNAME') {
                console.error('Failed to add description column:', alterErr);
            }
        });

        db.query("ALTER TABLE users ADD COLUMN name VARCHAR(128) NULL", alterErr => {
            if (alterErr && alterErr.code !== 'ER_DUP_FIELDNAME') {
                console.error('Failed to add name column to users:', alterErr);
            }
        });

        db.query("ALTER TABLE users ADD COLUMN email VARCHAR(180) NULL", alterErr => {
            if (alterErr && alterErr.code !== 'ER_DUP_FIELDNAME') {
                console.error('Failed to add email column to users:', alterErr);
            }

            // If the table existed with users but no email, default any empty records to a unique placeholder, then create constraint.
            if (!alterErr || alterErr.code === 'ER_DUP_FIELDNAME') {
                db.query("UPDATE users SET email = CONCAT('user', id, '@muthupura.local') WHERE email IS NULL OR TRIM(email) = ''", updErr => {
                    if (updErr) {
                        console.error('Failed to backfill empty e-mail records:', updErr);
                    }
                    db.query('ALTER TABLE users MODIFY COLUMN email VARCHAR(180) NOT NULL', modifyErr => {
                        if (modifyErr && modifyErr.code !== 'ER_DUP_FIELDNAME') {
                            console.error('Failed to enforce email NOT NULL:', modifyErr);
                        }
                        db.query('ALTER TABLE users ADD UNIQUE INDEX uniq_users_email (email)', indexErr => {
                            if (indexErr && indexErr.code !== 'ER_DUP_KEY' && !indexErr.message.includes('Duplicate key name')) {
                                console.error('Failed to add unique index on email:', indexErr);
                            }
                        });
                    });
                });
            }
        });

        db.query("ALTER TABLE users ADD COLUMN createdAt DATETIME DEFAULT CURRENT_TIMESTAMP", alterErr => {
            if (alterErr && alterErr.code !== 'ER_DUP_FIELDNAME') {
                console.error('Failed to add createdAt column to users:', alterErr);
            }
        });

        db.query("ALTER TABLE users ADD COLUMN role VARCHAR(32) DEFAULT 'user'", alterErr => {
            if (alterErr && alterErr.code !== 'ER_DUP_FIELDNAME') {
                console.error('Failed to add role column to users:', alterErr);
            }
        });

        db.query("ALTER TABLE users ADD COLUMN google_id VARCHAR(180) NULL", alterErr => {
            if (alterErr && alterErr.code !== 'ER_DUP_FIELDNAME') {
                console.error('Failed to add google_id column to users:', alterErr);
            }
        });

        db.query("ALTER TABLE users ADD COLUMN facebook_id VARCHAR(180) NULL", alterErr => {
            if (alterErr && alterErr.code !== 'ER_DUP_FIELDNAME') {
                console.error('Failed to add facebook_id column to users:', alterErr);
            }
        });

        db.query("ALTER TABLE users ADD COLUMN phone VARCHAR(32) NULL", alterErr => {
            if (alterErr && alterErr.code !== 'ER_DUP_FIELDNAME') {
                console.error('Failed to add phone column to users:', alterErr);
            }
        });

        db.query("ALTER TABLE users ADD COLUMN username VARCHAR(180) NULL", alterErr => {
            if (alterErr && alterErr.code !== 'ER_DUP_FIELDNAME') {
                console.error('Failed to add username column to users:', alterErr);
            }
        });

        db.query("ALTER TABLE users ADD COLUMN auth_provider VARCHAR(32) DEFAULT 'local'", alterErr => {
            if (alterErr && alterErr.code !== 'ER_DUP_FIELDNAME') {
                console.error('Failed to add auth_provider column to users:', alterErr);
            }
        });

        db.query("ALTER TABLE users ADD COLUMN firebase_uid VARCHAR(180) NULL UNIQUE", alterErr => {
            if (alterErr && alterErr.code !== 'ER_DUP_FIELDNAME') {
                console.error('Failed to add firebase_uid column to users:', alterErr);
            }
        });

        // Favorites system has been removed. Legacy favorites table no longer created in schema setup.
        // If existing database has the table, drop it manually with:
        // DROP TABLE IF EXISTS favorites;

        console.log('Vehicles table schema checked for isFeatured, views, featuredUntil, createdAt, fuelType, ownerId, images, location');
    }
});

// ✅ FIXED: Add pool error handler for connection drops
db.on('error', (err) => {
    console.error('❌ Unexpected database connection error:', err.message);
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
        console.error('Database connection was closed.');
    }
    if (err.code === 'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR') {
        console.error('Database connection had a fatal error.');
    }
    if (err.code === 'PROTOCOL_ENQUEUE_AFTER_CLOSE') {
        console.error('Database connection was manually closed.');
    }
    // Reconnect attempt is handled automatically by the pool
});

// Firebase Storage setup for image uploads

// Helper function to upload file to Firebase Storage
async function uploadToFirebase(file) {
  const fileName = `vehicles/${Date.now()}_${file.originalname}`;
  const fileUpload = bucket.file(fileName);

  const stream = fileUpload.createWriteStream({
    metadata: {
      contentType: file.mimetype,
    },
  });

  return new Promise((resolve, reject) => {
    stream.on('error', (error) => {
      console.error('Upload error:', error);
      reject(error);
    });

    stream.on('finish', async () => {
      try {
        // Make the file publicly accessible
        await fileUpload.makePublic();
        // Get the public URL
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
        resolve(publicUrl);
      } catch (publicError) {
        console.error('Error making file public:', publicError);
        reject(publicError);
      }
    });

    stream.end(file.buffer);
  });
}

const bcrypt = require('bcrypt');

app.post('/register', authLimiter, async (req, res) => {
    try {
        const { name, email, password, idToken, phone, provider } = req.body;

        // If idToken is provided (from Firebase Auth), verify it
        let firebaseUser = null;
        let normalizedEmail = null;
        let normalizedName = null;
        let normalizedPhone = null;
        let authProvider = provider || 'local';

        if (idToken) {
            try {
                // Verify Firebase idToken with Admin SDK
                firebaseUser = await admin.auth().verifyIdToken(idToken);
                normalizedEmail = (firebaseUser.email || '').trim().toLowerCase();
                normalizedName = (name || firebaseUser.name || firebaseUser.email.split('@')[0]).trim();
                normalizedPhone = (phone || '').replace(/\D/g, '');
                authProvider = provider || (firebaseUser.provider === 'anonymous' ? 'local' : firebaseUser.provider);
            } catch (tokenErr) {
                console.error('Firebase idToken verification failed:', tokenErr);
                return res.status(401).json({ 
                    success: false,
                    message: 'Invalid Firebase token' 
                });
            }
        } else {
            // Local auth (email/password)
            if (!name || !email || !password) {
                return res.status(400).json({ 
                    success: false,
                    message: 'Name, email, and password are required' 
                });
            }

            normalizedEmail = email.trim().toLowerCase();
            normalizedName = name.trim();
            normalizedPhone = (phone || '').replace(/\D/g, '');

            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailPattern.test(normalizedEmail)) {
                return res.status(400).json({ 
                    success: false,
                    message: 'Invalid email format' 
                });
            }

            if (password.length < 8) {
                return res.status(400).json({ 
                    success: false,
                    message: 'Password must be at least 8 characters' 
                });
            }
        }

        if (!normalizedEmail) {
            return res.status(400).json({ 
                success: false,
                message: 'Email is required' 
            });
        }

        // Generate username from name
        const username = (normalizedName || normalizedEmail.split('@')[0])
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '')
            .substring(0, 20) || 'user' + Math.floor(Math.random() * 10000);

        // UPSERT: Try to find existing user by email, or insert new one
        db.query(
            `INSERT INTO users (firebase_uid, name, username, email, phone, password, role, auth_provider, createdAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
             ON DUPLICATE KEY UPDATE
                name = IF(VALUES(name) != '', VALUES(name), name),
                phone = IF(VALUES(phone) != '', VALUES(phone), phone),
                auth_provider = IF(VALUES(auth_provider) != 'local', VALUES(auth_provider), auth_provider),
                firebase_uid = IF(VALUES(firebase_uid) != '', VALUES(firebase_uid), firebase_uid)`,
            [
                firebaseUser?.uid || null,
                normalizedName,
                username,
                normalizedEmail,
                normalizedPhone || null,
                idToken ? null : (password ? await bcrypt.hash(password, 10) : null),
                'user',
                authProvider
            ],
            (err, result) => {
                if (err) {
                    console.error('❌ Register database error:', {
                        message: err.message,
                        code: err.code,
                        errno: err.errno,
                        sql: err.sql
                    });
                    
                    if (err.code === 'ER_DUP_ENTRY') {
                        // Email already exists - return success anyway so OAuth flows work
                        db.query('SELECT id, name, email, role FROM users WHERE email = ?', [normalizedEmail], (selectErr, users) => {
                            if (selectErr) {
                                console.error('❌ Error retrieving duplicate user:', selectErr.message);
                                return res.status(500).json({ 
                                    success: false,
                                    message: 'Database error' 
                                });
                            }
                            
                            if (!users || !users.length) {
                                console.error('❌ No user found for duplicate email:', normalizedEmail);
                                return res.status(500).json({ 
                                    success: false,
                                    message: 'Database error' 
                                });
                            }
                            const user = users[0];
                            const token = jwt.sign(
                                { id: user.id, name: user.name, email: user.email, role: user.role },
                                SECRET,
                                { expiresIn: '6h' }
                            );
                            return res.status(200).json({
                                success: true,
                                message: 'User already exists',
                                user: { id: user.id, name: user.name, email: user.email, role: user.role },
                                token
                            });
                        });
                        return;
                    }
                    console.error('Register upsert error:', err);
                    return res.status(500).json({ 
                        success: false,
                        message: 'Internal server error' 
                    });
                }

                const userId = result.insertId || result.affectedRows > 0;
                
                // Get the user record
                db.query('SELECT id, name, email, role FROM users WHERE email = ?', [normalizedEmail], (selectErr, users) => {
                    if (selectErr) {
                        console.error('❌ Error retrieving user after registration:', selectErr.message);
                        return res.status(500).json({ 
                            success: false,
                            message: 'Failed to retrieve user' 
                        });
                    }
                    
                    if (!users || !users.length) {
                        console.error('❌ No user found after registration for email:', normalizedEmail);
                        return res.status(500).json({ 
                            success: false,
                            message: 'Failed to retrieve user' 
                        });
                    }

                    const user = users[0];
                    const token = jwt.sign(
                        { id: user.id, name: user.name, email: user.email, role: user.role },
                        SECRET,
                        { expiresIn: '6h' }
                    );

                    res.status(201).json({
                        success: true,
                        message: 'User registered successfully',
                        user: { id: user.id, name: user.name, email: user.email, role: user.role },
                        token
                    });
                });
            }
        );
    } catch (err) {
        console.error('❌ Unexpected error in /register:', {
            message: err.message,
            stack: err.stack,
            code: err.code
        });
        res.status(500).json({
            success: false,
            message: 'Unexpected server error',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
});

const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET || 'muthupura_secret_fallback_change_in_production';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'muthupura_refresh_secret_fallback_change_in_production';

// ✅ FIXED: Move OTP to database instead of in-memory
// Create OTP table on startup (will be done after DB connection established)

// Cleanup stale OTPs from database every 5 minutes
setInterval(() => {
    db.query('DELETE FROM otp_sessions WHERE expiresAt < NOW()', (err) => {
        if (err) console.error('Error cleaning OTPs:', err.message);
    });
}, 5 * 60 * 1000);

// Middleware: verify JWT token
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ message: 'No token provided' });

    jwt.verify(token, SECRET, (err, user) => {
        if (err) return res.status(403).json({ message: 'Invalid token' });
        console.log('JWT payload verified:', user);
        req.user = user;
        next();
    });
}

// Middleware: only admin
function requireAdmin(req, res, next) {
    if (req.user?.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
    }
    next();
}

// ✅ NEW: Middleware to verify Firebase tokens
async function verifyFirebaseToken(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }

    try {
        const decoded = await admin.auth().verifyIdToken(token);
        req.firebaseUser = decoded;
        next();
    } catch (err) {
        console.error('Firebase token verification failed:', err.message);
        return res.status(403).json({ error: 'Invalid or expired Firebase token' });
    }
}

// ✅ NEW: Firebase Authentication endpoint
app.post('/firebase-auth', verifyFirebaseToken, async (req, res) => {
    try {
        const firebaseUser = req.firebaseUser;

        // Extract Firebase user info
        const email = (firebaseUser.email || '').trim().toLowerCase();
        const name = firebaseUser.name || email.split('@')[0];
        const uid = firebaseUser.uid;

        console.log('🔐 Firebase auth attempt:', { uid, email, name });

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Firebase user must have an email'
            });
        }

        // Check if user exists in database
        db.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
            if (err) {
                console.error('❌ Firebase auth - Database query error:', err.message);
                return res.status(500).json({
                    success: false,
                    message: 'Internal server error'
                });
            }

            // If user exists, return JWT
            if (results.length > 0) {
                const user = results[0];

                // Update firebase_uid if not already set
                if (!user.firebase_uid) {
                    db.query('UPDATE users SET firebase_uid = ? WHERE id = ?', [uid, user.id], (updateErr) => {
                        if (updateErr) {
                            console.error('Error updating firebase_uid:', updateErr.message);
                        }
                    });
                }

                const payload = {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                };
                const token = jwt.sign(payload, SECRET, { expiresIn: '1h' });

                console.log('✅ Firebase auth success (existing user):', { userId: user.id, email });

                return res.json({
                    success: true,
                    token,
                    user: {
                        id: user.id,
                        email: user.email,
                        name: user.name,
                        role: user.role
                    }
                });
            }

            // If user doesn't exist, create new user
            console.log('📝 Creating new Firebase user:', email);

            const defaultUsername = (name || email.split('@')[0]).toLowerCase().replace(/[^a-z0-9]/g, '').substr(0, 20) + Math.floor(Math.random() * 10000);

            db.query(
                'INSERT INTO users (name, email, username, firebase_uid, role, auth_provider) VALUES (?, ?, ?, ?, ?, ?)',
                [name, email, defaultUsername, uid, 'user', 'firebase'],
                (insertErr, insertResult) => {
                    if (insertErr) {
                        console.error('❌ Firebase auth - Error creating user:', insertErr.message);
                        return res.status(500).json({
                            success: false,
                            message: 'Error creating user account'
                        });
                    }

                    const newUser = {
                        id: insertResult.insertId,
                        name,
                        email,
                        role: 'user'
                    };

                    const payload = {
                        id: newUser.id,
                        name: newUser.name,
                        email: newUser.email,
                        role: newUser.role
                    };
                    const token = jwt.sign(payload, SECRET, { expiresIn: '1h' });

                    console.log('✅ Firebase auth success (new user created):', newUser);

                    return res.json({
                        success: true,
                        token,
                        user: newUser
                    });
                }
            );
        });
    } catch (err) {
        console.error('❌ Firebase auth error:', err.message);
        return res.status(500).json({
            success: false,
            message: 'Authentication failed'
        });
    }
});

app.post('/login', authLimiter, async (req, res) => {
    try {
        const { email, password, idToken } = req.body;

        // If idToken is provided, verify it with Firebase Admin SDK
        if (idToken) {
            try {
                const firebaseUser = await admin.auth().verifyIdToken(idToken);
                const normalizedEmail = (firebaseUser.email || '').trim().toLowerCase();

                console.log('🔐 /login with Firebase idToken:', normalizedEmail);

                // Find user in database
                db.query('SELECT * FROM users WHERE email = ?', [normalizedEmail], (err, results) => {
                    if (err) {
                        console.error('❌ /login - Database query error:', err.message);
                        return res.status(500).json({
                            success: false,
                            message: 'Internal server error'
                        });
                    }

                    if (results.length === 0) {
                        console.log('❌ /login - User not found:', normalizedEmail);
                        return res.status(404).json({
                            success: false,
                            message: 'User account does not exist'
                        });
                    }

                    const user = results[0];
                    const payload = {
                        id: user.id,
                        name: user.name,
                        role: user.role
                    };
                    const token = jwt.sign(payload, SECRET, { expiresIn: '1h' });

                    console.log('✅ /login success (Firebase):', { userId: user.id, email: normalizedEmail });

                    res.json({
                        success: true,
                        message: 'Login success',
                        token,
                        role: user.role,
                        user: {
                            id: user.id,
                            name: user.name,
                            email: user.email,
                            role: user.role
                        }
                    });
                });
                return;
            } catch (tokenErr) {
                console.error('❌ Firebase idToken verification failed:', tokenErr);
                // Fall through to local auth
            }
        }

        // Local auth (email/password)
        if (!email || !password) {
            console.log('❌ /login - Missing email or password');
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        const normalizedEmail = email.trim().toLowerCase();
        console.log('🔐 /login attempt (local):', normalizedEmail);

        db.query('SELECT * FROM users WHERE email = ?', [normalizedEmail], async (err, results) => {
            if (err) {
                console.error('❌ /login - Database query error:', err.message);
                return res.status(500).json({
                    success: false,
                    message: 'Internal server error'
                });
            }

            if (results.length === 0) {
                console.log('❌ /login failed - User not found:', normalizedEmail);
                return res.status(404).json({
                    success: false,
                    message: 'User account does not exist'
                });
            }

            const user = results[0];
            console.log('✅ /login - User found:', { id: user.id, email: user.email });

            try {
                if (!user.password) {
                    console.log('❌ /login - User has no password (OAuth only):', normalizedEmail);
                    return res.status(401).json({
                        success: false,
                        message: 'This account uses OAuth. Please login with Google or Facebook.'
                    });
                }

                const match = await bcrypt.compare(password, user.password);

                if (!match) {
                    console.log('❌ /login - Invalid password for:', normalizedEmail);
                    return res.status(401).json({
                        success: false,
                        message: 'Invalid password'
                    });
                }

                const payload = {
                    id: user.id,
                    name: user.name,
                    role: user.role
                };
                const token = jwt.sign(payload, SECRET, { expiresIn: '1h' });

                console.log('✅ /login success (local):', { userId: user.id, email: normalizedEmail });

                res.json({
                    success: true,
                    message: 'Login success',
                    token,
                    role: user.role,
                    user: {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        role: user.role
                    }
                });
            } catch (bcryptErr) {
                console.error('❌ /login - Password comparison error:', bcryptErr.message);
                return res.status(500).json({
                    success: false,
                    message: 'Internal server error'
                });
            }
        });
    } catch (err) {
        console.error('❌ Unexpected error in /login:', err.message);
        res.status(500).json({
            success: false,
            message: 'Unexpected server error'
        });
    }
});

app.post('/otp-login', (req, res) => {
    try {
        const { phone } = req.body;
        
        if (!phone || typeof phone !== 'string') {
            console.log('❌ /otp-login - Missing or invalid phone');
            return res.status(400).json({ 
                success: false,
                message: 'Phone number is required' 
            });
        }

        const normalizedPhone = phone.replace(/\D/g, '');
        if (!normalizedPhone || normalizedPhone.length < 7 || normalizedPhone.length > 15) {
            console.log('❌ /otp-login - Invalid phone format:', normalizedPhone);
            return res.status(400).json({ 
                success: false,
                message: 'Invalid phone number' 
            });
        }

        console.log('📱 /otp-login attempt:', normalizedPhone);

        db.query('SELECT * FROM users WHERE phone = ?', [normalizedPhone], (err, results) => {
            if (err) {
                console.error('❌ /otp-login - Database error:', err.message);
                return res.status(500).json({ 
                    success: false,
                    message: 'Internal server error',
                    error: process.env.NODE_ENV === 'development' ? err.message : undefined
                });
            }

            if (results.length > 0) {
                const user = results[0];
                const payload = { id: user.id, name: user.name, role: user.role || 'user' };
                const token = jwt.sign(payload, SECRET, { expiresIn: '1h' });
                
                console.log('✅ /otp-login success:', { userId: user.id, phone: normalizedPhone });
                
                return res.json({
                    success: true,
                    message: 'OTP login success',
                    token,
                    role: payload.role,
                    user: {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        phone: user.phone,
                        role: payload.role
                    },
                    isNewUser: false
                });
            }

            console.log('📝 /otp-login - New user detected:', normalizedPhone);
            return res.json({
                success: true,
                message: 'User not found, please complete profile',
                isNewUser: true,
                phone: normalizedPhone
            });
        });
    } catch (err) {
        console.error('❌ Unexpected error in /otp-login:', err.message);
        res.status(500).json({
            success: false,
            message: 'Unexpected server error',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
});

app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/auth/failure' }), (req, res) => {
    console.log('Route hit: /auth/google/callback', { user: req.user });
    const payload = { id: req.user.id, name: req.user.name, role: req.user.role || 'user' };
    const token = jwt.sign(payload, SECRET, { expiresIn: '1h' });
    res.send(`<!DOCTYPE html><html><body><script>
            window.opener.postMessage(${JSON.stringify({ token, role: payload.role, user: { id: req.user.id, name: req.user.name, email: req.user.email } })}, '*');
            window.close();
        </script></body></html>`);
});

app.get('/auth/facebook', passport.authenticate('facebook', { scope: ['email'] }));

app.get('/auth/facebook/callback', passport.authenticate('facebook', { failureRedirect: '/auth/failure' }), (req, res) => {
    console.log('Route hit: /auth/facebook/callback', { user: req.user });
    const payload = { id: req.user.id, name: req.user.name, role: req.user.role || 'user' };
    const token = jwt.sign(payload, SECRET, { expiresIn: '1h' });
    res.send(`<!DOCTYPE html><html><body><script>
            window.opener.postMessage(${JSON.stringify({ token, role: payload.role, user: { id: req.user.id, name: req.user.name, email: req.user.email } })}, '*');
            window.close();
        </script></body></html>`);
});

app.get('/auth/failure', (req, res) => {
    res.status(401).send('Authentication failed');
});

app.post('/send-otp', authLimiter, (req, res) => {
    console.log('Route hit: /send-otp', { body: req.body });
    const { phone } = req.body;
    if (!phone || !/^[0-9]{7,15}$/.test(phone.toString().replace(/\D/g, ''))) {
        return res.status(400).json({ message: 'Invalid phone number' });
    }

    const cleaned = phone.toString().replace(/\D/g, '');
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // ✅ FIXED: Store OTP in database instead of memory
    db.query(
        'INSERT INTO otp_sessions (phone, otp, expiresAt) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 5 MINUTE)) ON DUPLICATE KEY UPDATE otp = ?, expiresAt = DATE_ADD(NOW(), INTERVAL 5 MINUTE)',
        [cleaned, otp, otp],
        (err) => {
            if (err) {
                console.error('Error storing OTP:', err.message);
                return res.status(500).json({ message: 'Internal server error' });
            }
            console.log(`✅ OTP for ${cleaned} stored (valid 5 min)`);
            res.json({ message: 'OTP sent successfully' });
        }
    );
});

app.post('/verify-otp', authLimiter, (req, res) => {
    console.log('Route hit: /verify-otp', { body: req.body });
    const { phone, otp } = req.body;
    if (!phone || !otp) {
        return res.status(400).json({ message: 'Phone and OTP are required' });
    }

    const cleaned = phone.toString().replace(/\D/g, '');
    
    // ✅ FIXED: Retrieve OTP from database
    db.query(
        'SELECT * FROM otp_sessions WHERE phone = ? AND expiresAt > NOW()',
        [cleaned],
        (err, results) => {
            if (err) {
                console.error('OTP lookup error:', err.message);
                return res.status(500).json({ message: 'Internal server error' });
            }

            if (!results.length) {
                return res.status(400).json({ message: 'OTP expired or not found' });
            }

            const entry = results[0];
            if (entry.otp !== otp.toString()) {
                return res.status(401).json({ message: 'Invalid OTP' });
            }

            // Delete OTP after successful verification
            db.query('DELETE FROM otp_sessions WHERE phone = ?', [cleaned]);

            db.query('SELECT * FROM users WHERE phone = ?', [cleaned], (err2, userResults) => {
                if (err2) {
                    console.error('OTP user lookup error:', err2.message);
                    return res.status(500).json({ message: 'Internal server error' });
                }

                if (userResults.length > 0) {
                    const user = userResults[0];
                    const payload = { id: user.id, name: user.name, role: user.role || 'user' };
                    const token = jwt.sign(payload, SECRET, { expiresIn: '1h' });
                    res.json({
                        message: 'OTP login success',
                        token,
                        role: payload.role,
                        user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: payload.role },
                        isNewUser: false
            });
        } else {
            res.json({
                message: 'OTP verified. Please complete profile.',
                isNewUser: true,
                phone: cleaned
            });
        }
    });
});

app.post('/complete-profile', (req, res) => {
    console.log('Route hit: /complete-profile', { body: req.body });
    const { name, email, phone } = req.body;

    const cleanedPhone = phone ? phone.toString().replace(/\D/g, '') : '';
    const emailNormalized = email ? email.trim().toLowerCase() : '';
    const nameTrimmed = name ? name.trim() : '';

    if (!nameTrimmed) {
        return res.status(400).json({ message: 'Name is required' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailNormalized || !emailRegex.test(emailNormalized)) {
        return res.status(400).json({ message: 'Valid email is required' });
    }

    if (!cleanedPhone || cleanedPhone.length < 7 || cleanedPhone.length > 15) {
        return res.status(400).json({ message: 'Valid phone is required' });
    }

    db.query('SELECT id FROM users WHERE email = ?', [emailNormalized], (emailErr, emailResults) => {
        if (emailErr) {
            console.error('Complete profile e-mail lookup error', emailErr);
            return res.status(500).json({ message: 'Internal server error' });
        }

        if (emailResults.length > 0) {
            return res.status(409).json({ message: 'Email already in use' });
        }

        db.query('SELECT id FROM users WHERE phone = ?', [cleanedPhone], (phoneErr, phoneResults) => {
            if (phoneErr) {
                console.error('Complete profile phone lookup error', phoneErr);
                return res.status(500).json({ message: 'Internal server error' });
            }

            if (phoneResults.length > 0) {
                return res.status(409).json({ message: 'Phone already registered' });
            }

            const usernameBase = nameTrimmed.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 15) || 'user';
            const username = `${usernameBase}${Math.floor(1000 + Math.random() * 9000)}`;
            const role = 'user';

            db.query('INSERT INTO users (name, username, email, phone, role, auth_provider) VALUES (?, ?, ?, ?, ?, ?)',
                [nameTrimmed, username, emailNormalized, cleanedPhone, role, 'otp'], (insertErr, result) => {
                    if (insertErr) {
                        console.error('Complete profile insert error', insertErr);
                        return res.status(500).json({ message: 'Internal server error' });
                    }

                    const userId = result.insertId;
                    const payload = { id: userId, name: nameTrimmed, role };
                    const token = jwt.sign(payload, SECRET, { expiresIn: '1h' });

                    res.json({
                        message: 'Profile created successfully',
                        token,
                        user: { id: userId, name: nameTrimmed, email: emailNormalized, phone: cleanedPhone },
                    });
                });
        });
    });
});

// ✅ NEW: Email Verification Endpoint
app.post('/send-verification-email', authLimiter, authenticateToken, (req, res) => {
    const userId = req.user.id;
    const { email } = req.body;

    if (!email || !validateEmail(email)) {
        return res.status(400).json({ message: 'Invalid email address' });
    }

    // Generate verification token (24h expiry)
    const verificationToken = jwt.sign({ userId, email }, SECRET, { expiresIn: '24h' });
    
    // In production, send email here with verification link
    // For now, log token
    console.log(`📧 Verification email would be sent to ${email}`);
    console.log(`🔗 Verification token: ${verificationToken}`);
    
    res.json({ 
        message: 'Verification email sent (check console in demo)',
        token: process.env.NODE_ENV === 'development' ? verificationToken : undefined
    });
});

// ✅ NEW: Verify Email Endpoint
app.post('/verify-email', (req, res) => {
    const { token } = req.body;

    if (!token) {
        return res.status(400).json({ message: 'Verification token required' });
    }

    try {
        const decoded = jwt.verify(token, SECRET);
        const { userId, email } = decoded;

        db.query(
            'UPDATE users SET email = ?, is_verified = 1 WHERE id = ?',
            [email, userId],
            (err) => {
                if (err) {
                    console.error('Email verification error:', err.message);
                    return res.status(500).json({ message: 'Internal server error' });
                }
                res.json({ success: true, message: 'Email verified successfully' });
            }
        );
    } catch (err) {
        res.status(401).json({ message: 'Invalid or expired verification token' });
    }
});

// ✅ NEW: Password Reset Request Endpoint
app.post('/request-password-reset', authLimiter, (req, res) => {
    const { email } = req.body;

    if (!email || !validateEmail(email)) {
        return res.status(400).json({ message: 'Invalid email address' });
    }

    db.query('SELECT id FROM users WHERE email = ?', [email.toLowerCase()], (err, results) => {
        if (err) {
            console.error('Password reset lookup error:', err.message);
            return res.status(500).json({ message: 'Internal server error' });
        }

        if (!results.length) {
            // Don't reveal if email exists
            return res.json({ message: 'If email exists, reset link sent' });
        }

        const userId = results[0].id;
        const resetToken = jwt.sign({ userId }, SECRET, { expiresIn: '1h' });

        // In production, send email with reset link
        console.log(`🔑 Password reset token for user ${userId}: ${resetToken}`);
        
        res.json({ 
            message: 'Password reset link sent to email',
            token: process.env.NODE_ENV === 'development' ? resetToken : undefined
        });
    });
});

// ✅ NEW: Password Reset Confirmation Endpoint
app.post('/reset-password', (req, res) => {
    const { token, newPassword } = req.body;

    if (!token || !newPassword || newPassword.length < 6) {
        return res.status(400).json({ message: 'Invalid token or password (min 6 chars)' });
    }

    try {
        const decoded = jwt.verify(token, SECRET);
        const userId = decoded.userId;

        // Hash new password
        bcrypt.hash(newPassword, 10, (hashErr, hashedPassword) => {
            if (hashErr) {
                console.error('Password hashing error:', hashErr.message);
                return res.status(500).json({ message: 'Internal server error' });
            }

            db.query(
                'UPDATE users SET password = ? WHERE id = ?',
                [hashedPassword, userId],
                (err) => {
                    if (err) {
                        console.error('Password reset error:', err.message);
                        return res.status(500).json({ message: 'Internal server error' });
                    }
                    res.json({ success: true, message: 'Password reset successfully' });
                }
            );
        });
    } catch (err) {
        res.status(401).json({ message: 'Invalid or expired reset token' });
    }
});

app.get('/me', authenticateToken, (req, res) => {
    db.query('SELECT id, name, email, role FROM users WHERE id = ?', [req.user.id], (err, results) => {
        if (err) {
            console.error('Profile fetch error:', err);
            return res.status(500).json({ message: 'Internal server error' });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ user: results[0] });
    });
});

app.get('/profile', authenticateToken, (req, res) => {
    db.query('SELECT name, email FROM users WHERE id = ?', [req.user.id], (err, results) => {
        if (err) {
            console.error('Profile fetch error:', err);
            return res.status(500).json({ message: 'Internal server error' });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(results[0]);
    });
});

// Firebase Storage setup for image uploads
console.log('☁️ Images will be served from Firebase Storage');

function normalizeVehicleRecord(vehicle) {
    const record = { ...vehicle };
    record.location = (record.location || 'Unknown').toString();

    if (record.images && !Array.isArray(record.images)) {
        try {
            record.images = JSON.parse(record.images);
        } catch (e) {
            // fallback for non-JSON string paths
            if (typeof record.images === 'string' && record.images.trim()) {
                record.images = record.images.split(',').map(s => s.trim()).filter(Boolean);
            } else {
                record.images = [];
            }
        }
    }

    if (!Array.isArray(record.images)) {
        record.images = record.images ? [record.images] : [];
    }

    // keep all image entries as provided by API/DB (no silent dedupe)
    // (if dedupe is required, apply explicitly in the UI)

    if ((!record.image || record.image === '') && record.images.length) {
        record.image = record.images[0];
    }

    if (!record.images.length && record.image) {
        record.images = [record.image];
    }

    // ✅ ENSURE ALL FIELDS ARE NORMALIZED
    return {
        id:              record.id,
        title:           record.title || '',
        brand:           record.brand || '',
        model:           record.model || '',
        year:            record.year || '',
        price:           record.price || 0,
        phone:           record.phone || '',
        image:           record.image || '',
        images:          record.images,
        fuelType:        record.fuelType || record.fuel_type || '',
        vehicle_type:    record.vehicle_type || '',
        condition:       record.condition || '',
        transmission:    record.transmission || '',
        engine_capacity: record.engine_capacity || null,
        mileage:         record.mileage || null,
        features:        record.features || '',
        listing_type:    record.listing_type || 'sale',
        location:        record.location || '',
        description:     record.description || '',
        isFeatured:      record.isFeatured === 1 || record.isFeatured === true,
        is_approved:     record.is_approved === 1 || record.is_approved === true,
        views:           record.views || 0,
        createdAt:       record.createdAt || null
    };
}

// test route
app.get('/', (req, res) => {
    res.send('Muthupura backend is running 🚀');
});

// 🧪 Test Route - Verify Backend Working
app.get('/test', (req, res) => {
    res.send("Backend working ✅");
});

// ⚕️ HEALTH CHECK - Database Connectivity Test
app.get('/api/health', (req, res) => {
    db.query('SELECT NOW() as server_time', (err, results) => {
        if (err) {
            console.error('❌ Health check failed:', err.message);
            return res.status(503).json({
                status: 'error',
                db: 'disconnected',
                message: err.message
            });
        }
        res.json({
            status: 'ok',
            db: 'connected',
            timestamp: results[0]?.server_time,
            api_url: process.env.API_URL,
            environment: process.env.NODE_ENV
        });
    });
});

// 📊 DEBUG ROUTES - Tables, Schema, Sample Data

// List all tables in database
app.get('/api/debug/tables', (req, res) => {
    db.query(`SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE() ORDER BY table_name`, (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({
            tables: results.map(r => r.table_name),
            count: results.length
        });
    });
});

// Get vehicles table schema
app.get('/api/debug/vehicles-schema', (req, res) => {
    db.query(`SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'vehicles' ORDER BY column_name`, (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({
            columns: results,
            count: results.length
        });
    });
});

// Get vehicle count
app.get('/api/debug/vehicles-count', (req, res) => {
    db.query(`SELECT COUNT(*) as total FROM vehicles`, (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({
            total_vehicles: results[0]?.total || 0
        });
    });
});

// Get first 3 vehicles (raw data for inspection)
app.get('/api/debug/vehicles-sample', (req, res) => {
    db.query(`SELECT * FROM vehicles ORDER BY id DESC LIMIT 3`, (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({
            sample_vehicles: results.map(normalizeVehicleRecord),
            count: results.length
        });
    });
});

// 🟢 Add Vehicle - Production Route
app.post('/add-vehicle', authenticateToken, postLimiter, upload.array('images', 10), async (req, res) => {
    console.log("🔥 POST /add-vehicle hit from user:", req.user.id);
    console.log("FILES RECEIVED:", req.files?.length || 0);
    
    try {
        // Extract form data - including ALL new fields
        const { 
            title, brand, model, year, price, 
            fuelType, location, phone, description,
            vehicle_type, condition, transmission,
            engine_capacity, mileage, features,
            listing_type
        } = req.body;
        
        // ✅ FIXED: Input validation for all required fields
        const titleSanitized = sanitizeString(title, 255);
        const brandSanitized = sanitizeString(brand, 100);
        const modelSanitized = sanitizeString(model, 100);
        const locationSanitized = sanitizeString(location, 128);
        const phoneSanitized = sanitizeString(phone, 32);
        
        if (!titleSanitized) {
            return res.status(400).json({ success: false, message: 'Title is required' });
        }
        if (!brandSanitized) {
            return res.status(400).json({ success: false, message: 'Brand is required' });
        }
        if (!validateYear(year)) {
            return res.status(400).json({ success: false, message: 'Invalid year (must be 1900-current)' });
        }
        if (!validatePrice(price)) {
            return res.status(400).json({ success: false, message: 'Invalid price (must be 0-999999999)' });
        }
        if (!fuelType || !['Petrol', 'Diesel', 'Electric', 'Hybrid'].includes(fuelType)) {
            return res.status(400).json({ success: false, message: 'Invalid fuel type' });
        }
        if (!locationSanitized) {
            return res.status(400).json({ success: false, message: 'Location is required' });
        }
        if (!validatePhone(phoneSanitized)) {
            return res.status(400).json({ success: false, message: 'Invalid phone number (7-15 digits)' });
        }
        
        // Ensure at least one image was uploaded
        if (!Array.isArray(req.files) || !req.files.length) {
            return res.status(400).json({ 
                success: false, 
                message: 'At least one image file is required' 
            });
        }
        
        // Upload images to Firebase Storage
        const imageUrls = [];
        for (const file of req.files) {
            try {
                const url = await uploadToFirebase(file);
                imageUrls.push(url);
                console.log('✅ Uploaded image:', url);
            } catch (uploadError) {
                console.error('❌ Failed to upload image:', uploadError);
                return res.status(500).json({ 
                    success: false, 
                    message: 'Failed to upload image to storage' 
                });
            }
        }
        
        const image_url = imageUrls[0]; // Use first image as primary
        
        console.log('📝 Vehicle form data:', {
            title,
            brand,
            model,
            year: parseInt(year),
            price: parseFloat(price),
            fuelType,
            vehicle_type,
            condition,
            transmission,
            location,
            phone,
            description: description || null,
            image_url: image_url.substring(0, 80) + '...'
        });
        
        // Insert into database - with ALL new columns
        const sql = `
            INSERT INTO vehicles 
            (title, brand, model, year, price, phone, 
             image, images, fuelType, vehicle_type, condition,
             transmission, engine_capacity, mileage, features,
             listing_type, ownerId, location, description,
             isFeatured, is_approved, views, featuredUntil, createdAt)
            VALUES 
            (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `;
        
        const values = [
            titleSanitized,                          // 1. title
            brandSanitized,                          // 2. brand
            modelSanitized || null,                  // 3. model
            parseInt(year),                          // 4. year
            parseFloat(price),                       // 5. price
            phoneSanitized,                          // 6. phone
            image_url,                               // 7. image
            JSON.stringify(imageUrls),               // 8. images (JSON array)
            fuelType,                                // 9. fuelType
            sanitizeString(vehicle_type, 64) || null,// 10. vehicle_type
            sanitizeString(condition, 50) || null,   // 11. condition
            sanitizeString(transmission, 32) || null,// 12. transmission
            engine_capacity ? parseInt(engine_capacity) : null,  // 13. engine_capacity
            mileage ? parseInt(mileage) : null,      // 14. mileage
            sanitizeString(features, 500) || null,   // 15. features
            listing_type || 'sale',                  // 16. listing_type
            req.user.id,                             // 17. ✅ FIXED: ownerId now assigned from authenticated user
            locationSanitized,                       // 18. location
            sanitizeString(description, 2000) || null,// 19. description
            0,                                       // 20. isFeatured
            location,                                // 18. location
            description || null,                     // 19. description
            0,                                       // 20. isFeatured
            0,                                       // 21. is_approved (pending admin approval)
            0,                                       // 22. views
            null                                     // 23. featuredUntil
        ];
        
        db.query(sql, values, (err, result) => {
            if (err) {
                console.error('❌ Database error:', err.message);
                return res.status(500).json({ 
                    success: false, 
                    message: 'Failed to save vehicle',
                    error: process.env.NODE_ENV === 'development' ? err.message : null
                });
            }
            
            console.log(`✅ Vehicle saved with ID: ${result.insertId}`);
            
            res.status(201).json({ 
                success: true, 
                message: 'Vehicle posted successfully', 
                vehicleId: result.insertId,
                image_url: image_url
            });
        });
        
    } catch (err) {
        console.error('❌ Unexpected error in /add-vehicle:', err.message);
        res.status(500).json({ 
            success: false, 
            message: 'Server error',
            error: process.env.NODE_ENV === 'development' ? err.message : null
        });
    }
});

// 🟢 Get All Vehicles (with ✅ PAGINATION)
app.get('/get-vehicles', apiLimiter, (req, res) => {
    expireFeaturedAds(err => {
        if (err) {
            console.error('❌ Error expiring featured ads:', err.message);
        }

        // ✅ FIXED: Add pagination parameters
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, parseInt(req.query.limit) || 20);  // max 100 per page
        const offset = (page - 1) * limit;

        // First: Get total count
        db.query('SELECT COUNT(*) as total FROM vehicles WHERE is_approved = 1', (countErr, countResults) => {
            if (countErr) {
                console.error('❌ [/get-vehicles] Count query error:', countErr.message);
                return res.status(500).json({ success: false, message: 'Error fetching vehicles' });
            }

            const total = countResults[0]?.total || 0;
            const totalPages = Math.ceil(total / limit);

            // Second: Get paginated results
            const sql = "SELECT * FROM vehicles WHERE is_approved = 1 ORDER BY isFeatured DESC, views DESC, createdAt DESC, id DESC LIMIT ? OFFSET ?";
            console.log(`📤 [/get-vehicles] Fetching page ${page} (${limit} per page, total: ${total})...`);

            db.query(sql, [limit, offset], (err, results) => {
                if (err) {
                    console.error('❌ [/get-vehicles] Database query error:', err.message);
                    return res.status(500).json({ 
                        success: false,
                        message: 'Error fetching vehicles',
                        error: process.env.NODE_ENV === 'development' ? err.message : undefined
                    });
                }

                try {
                    const normalizedResults = results.map(normalizeVehicleRecord);
                    console.log(`✅ [/get-vehicles] Returned ${normalizedResults.length} vehicles (page ${page}/${totalPages})`);
                    res.json({
                        success: true,
                        data: normalizedResults,
                        count: normalizedResults.length,
                        pagination: {
                            page,
                            limit,
                            total,
                            totalPages,
                            hasMore: page < totalPages
                        }
                    });
                } catch (normalizeErr) {
                    console.error('\u274c [/get-vehicles] Error normalizing vehicle data:', normalizeErr.message);
                    return res.status(500).json({
                        success: false,
                        message: 'Error processing vehicle data',
                        error: process.env.NODE_ENV === 'development' ? normalizeErr.message : undefined
                    });
                }
            });
        });
    });
});

// 🟢 Get Vehicle by ID (with view counter increment)
app.get('/vehicle/:id', (req, res) => {
    const id = req.params.id;
    const sql = "SELECT * FROM vehicles WHERE id = ? LIMIT 1";

    console.log(`📱 [/vehicle/${id}] Fetching vehicle...`);

    db.query(sql, [id], (err, results) => {
        if (err) {
            console.error(`❌ [/vehicle/${id}] Database error:`, err.message);
            return res.status(500).json({ 
                error: err.message, 
                message: 'Error fetching vehicle' 
            });
        }
        if (!results.length) {
            console.log(`⚠️ [/vehicle/${id}] Vehicle not found`);
            return res.status(404).json({ 
                error: 'Not found',
                message: 'Vehicle not found' 
            });
        }
        
        // ✅ FIXED: Increment view counter
        const updateViewsSql = "UPDATE vehicles SET views = views + 1 WHERE id = ?";
        db.query(updateViewsSql, [id], (updateErr) => {
            if (updateErr) {
                console.warn(`⚠️ [/vehicle/${id}] Failed to increment views:`, updateErr.message);
                // Don't fail the response, just log warning
            } else {
                console.log(`👁️ [/vehicle/${id}] View count incremented`);
            }
        });
        
        const normalized = normalizeVehicleRecord(results[0]);
        console.log(`✅ [/vehicle/${id}] Vehicle fetched, images: ${normalized.images?.length || 0}, current views: ${normalized.views || 0}`);
        return res.json(normalized);
    });
});

// 🟢 My Vehicles (logged-in user)
app.get('/my-vehicles', authenticateToken, (req, res) => {
    const userId = req.user.id;
    const sql = "SELECT * FROM vehicles WHERE ownerId = ? ORDER BY isFeatured DESC, views DESC, createdAt DESC, id DESC";

    db.query(sql, [userId], (err, results) => {
        if (err) {
            console.error('Error fetching my vehicles', err);
            return res.status(500).json({ message: 'Error fetching my vehicles' });
        }
        res.json(results.map(normalizeVehicleRecord));
    });
});

// 🟢 UpdateLogged-in Vehicle
app.put('/update-vehicle/:id', authenticateToken, upload.array('images', 10), async (req, res) => {
    const vehicleId = req.params.id;
    const userId = req.user.id;

    const { title, price, brand, year, phone, fuelType, location } = req.body;

    const fields = [];
    const values = [];

    if (title) { fields.push('title = ?'); values.push(title.trim()); }
    if (price !== undefined) { const p = Number(price); if (Number.isNaN(p) || p < 0) return res.status(400).json({ message: 'Invalid price' }); fields.push('price = ?'); values.push(p); }
    if (brand) { fields.push('brand = ?'); values.push(brand.trim()); }
    if (year !== undefined) { const y = Number(year); const currentYear = new Date().getFullYear(); if (!Number.isInteger(y) || y < 1900 || y > currentYear + 1) return res.status(400).json({ message: 'Invalid year' }); fields.push('year = ?'); values.push(y); }
    if (phone) { const pPhone = phone.toString().trim(); if (pPhone.length < 7 || pPhone.length > 20) return res.status(400).json({ message: 'Invalid phone' }); fields.push('phone = ?'); values.push(pPhone); }
    if (fuelType) { if (!['Electric','Petrol','Diesel','Hybrid'].includes(fuelType)) return res.status(400).json({ message: 'Invalid fuel type' }); fields.push('fuelType = ?'); values.push(fuelType); }
    if (location) { fields.push('location = ?'); values.push(location.trim()); }

    const files = Array.isArray(req.files) ? req.files : [];
    if (files.length) {
        try {
            const imageUrls = [];
            for (const file of files) {
                const url = await uploadToFirebase(file);
                imageUrls.push(url);
            }
            fields.push('images = ?'); values.push(JSON.stringify(imageUrls));
            fields.push('image = ?'); values.push(imageUrls[0] || null);
            console.log('☁️ Updated vehicle with', imageUrls.length, 'Firebase images');
        } catch (uploadError) {
            console.error('❌ Failed to upload images:', uploadError);
            return res.status(500).json({ message: 'Failed to upload images' });
        }
    }

    if (!fields.length) {
        return res.status(400).json({ message: 'No update fields provided' });
    }

    const selectSql = "SELECT ownerId FROM vehicles WHERE id = ?";
    db.query(selectSql, [vehicleId], (err, results) => {
        if (err) {
            console.error('Error checking vehicle ownership', err);
            return res.status(500).json({ message: 'Error updating vehicle' });
        }
        if (!results.length) {
            return res.status(404).json({ message: 'Vehicle not found' });
        }
        const ownerId = results[0].ownerId;
        if (req.user.role !== 'admin' && ownerId !== userId) {
            return res.status(403).json({ message: 'Not authorized to update this vehicle' });
        }

        const sql = `UPDATE vehicles SET ${fields.join(', ')} WHERE id = ?`;
        values.push(vehicleId);

        db.query(sql, values, (err, result) => {
            if (err) {
                console.error('Error updating vehicle', err);
                return res.status(500).json({ message: 'Error updating vehicle' });
            }
            res.json({ message: 'Vehicle updated' });
        });
    });
});

// 🟢 Alias endpoint compatible with admin requirement
app.get('/vehicles', (req, res) => {
    try {
        expireFeaturedAds(err => {
            if (err) {
                console.error('Error expiring featured ads', err);
            }

            // Build dynamic filter query
            const { 
                search, type, location, brand, 
                minPrice, maxPrice, year, 
                fuel, transmission 
            } = req.query;
            
            let conditions = ['is_approved = 1'];
            let params = [];
            
            if (search) {
                conditions.push(
                    '(title LIKE ? OR brand LIKE ? OR model LIKE ?)'
                );
                const s = `%${search}%`;
                params.push(s, s, s);
            }
            if (type) {
                conditions.push('vehicle_type = ?');
                params.push(type);
            }
            if (location) {
                conditions.push('location LIKE ?');
                params.push(`%${location}%`);
            }
            if (brand) {
                conditions.push('brand LIKE ?');
                params.push(`%${brand}%`);
            }
            if (minPrice) {
                conditions.push('price >= ?');
                params.push(parseFloat(minPrice));
            }
            if (maxPrice) {
                conditions.push('price <= ?');
                params.push(parseFloat(maxPrice));
            }
            if (year) {
                conditions.push('year = ?');
                params.push(parseInt(year));
            }
            if (fuel) {
                conditions.push('fuelType = ?');
                params.push(fuel);
            }
            if (transmission) {
                conditions.push('transmission = ?');
                params.push(transmission);
            }
            
            const whereClause = conditions.join(' AND ');
            const sql = `
                SELECT * FROM vehicles 
                WHERE ${whereClause}
                ORDER BY isFeatured DESC, views DESC, 
                         createdAt DESC, id DESC
            `;
            
            console.log('📤 [/vehicles] SQL:', sql);
            console.log('📤 [/vehicles] Params:', params);
            
            db.query(sql, params, (err, results) => {
                if (err) {
                    console.error('❌ [/vehicles] Error:', err.message);
                    return res.status(500).json({ 
                        error: err.message,
                        message: 'Error fetching vehicles'
                    });
                }

                try {
                    const normalized = results.map(normalizeVehicleRecord);
                    console.log(`✅ [/vehicles] Returned ${normalized.length} vehicles`);
                    res.json(normalized);
                } catch (normalizeErr) {
                    console.error('❌ [/vehicles] Normalization error:', normalizeErr.message);
                    return res.status(500).json({
                        error: normalizeErr.message,
                        message: 'Error processing vehicle data'
                    });
                }
            });
        });
    } catch (err) {
        console.error('❌ Unexpected error in /vehicles:', err.message);
        res.status(500).json({
            error: err.message,
            message: 'Unexpected server error'
        });
    }
});

// Refresh expired featured ads
function expireFeaturedAds(callback) {
    const sql = "UPDATE vehicles SET isFeatured = 0, featuredUntil = NULL WHERE isFeatured = 1 AND featuredUntil IS NOT NULL AND featuredUntil < NOW()";
    db.query(sql, callback);
}

// 🟢 Admin-only GET route
app.get('/admin/vehicles', authenticateToken, requireAdmin, (req, res) => {
    expireFeaturedAds(err => {
        if (err) {
            console.error('Error expiring featured ads', err);
        }

        const sql = "SELECT * FROM vehicles ORDER BY isFeatured DESC, views DESC, createdAt DESC, id DESC";

        db.query(sql, (err, results) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ message: 'Error fetching vehicles' });
            }

            res.json(results.map(normalizeVehicleRecord));
        });
    });
});

// 🟢 Toggle featured status for a vehicle (admin only)
app.put('/toggle-feature/:id', authenticateToken, requireAdmin, (req, res) => {
    const { id } = req.params;

    const sqlSelect = "SELECT isFeatured FROM vehicles WHERE id = ?";
    db.query(sqlSelect, [id], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Error reading vehicle' });
        }

        if (!results.length) {
            return res.status(404).json({ message: 'Vehicle not found' });
        }

        const current = results[0].isFeatured ? 1 : 0;
        const nextFeatured = current ? 0 : 1;
        let sqlUpdate;
        let params;

        if (nextFeatured) {
            sqlUpdate = "UPDATE vehicles SET isFeatured = 1, featuredUntil = DATE_ADD(NOW(), INTERVAL 14 DAY) WHERE id = ?";
            params = [id];
        } else {
            sqlUpdate = "UPDATE vehicles SET isFeatured = 0, featuredUntil = NULL WHERE id = ?";
            params = [id];
        }

        db.query(sqlUpdate, params, (err) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ message: 'Error updating featured status' });
            }

            return res.json({ message: 'Feature updated', isFeatured: Boolean(nextFeatured) });
        });
    });
});

// Backward compat: support old POST call in case any legacy integration remains
app.post('/toggle-feature/:id', authenticateToken, requireAdmin, (req, res, next) => {
    req.method = 'PUT';
    next();
});

// 🟢 ADMIN APPROVAL ROUTES
app.put('/admin/approve/:id', authenticateToken, requireAdmin, (req, res) => {
    const { id } = req.params;
    db.query(
        'UPDATE vehicles SET is_approved = 1 WHERE id = ?',
        [id],
        (err, result) => {
            if (err) {
                console.error('❌ Error approving vehicle:', err.message);
                return res.status(500).json({ error: err.message });
            }
            console.log(`✅ Vehicle ${id} approved`);
            res.json({ success: true, message: 'Vehicle approved' });
        }
    );
});

app.put('/admin/reject/:id', authenticateToken, requireAdmin, (req, res) => {
    const { id } = req.params;
    db.query(
        'DELETE FROM vehicles WHERE id = ?',
        [id],
        (err) => {
            if (err) {
                console.error('❌ Error rejecting vehicle:', err.message);
                return res.status(500).json({ error: err.message });
            }
            console.log(`✅ Vehicle ${id} rejected and deleted`);
            res.json({ success: true, message: 'Vehicle rejected' });
        }
    );
});


// 🟢 Increment view count
app.post('/vehicle/:id/view', (req, res) => {
    const { id } = req.params;
    const sql = "UPDATE vehicles SET views = views + 1 WHERE id = ?";

    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error incrementing view count ❌');
        }

        const selectSql = "SELECT views FROM vehicles WHERE id = ?";
        db.query(selectSql, [id], (selErr, selResult) => {
            if (selErr) {
                console.error(selErr);
                return res.status(500).send('Error retrieving views ❌');
            }

            res.json({ message: 'View incremented', views: selResult[0]?.views || 0 });
        });
    });
});

app.delete('/delete-vehicle/:id', authenticateToken, async (req, res) => {
    const id = req.params.id;
    const userId = req.user.id;

    const selectSql = "SELECT ownerId, images FROM vehicles WHERE id = ?";
    db.query(selectSql, [id], async (err, results) => {
        if (err) {
            console.error('❌ Error fetching vehicle:', err);
            return res.status(500).json({ message: 'Error deleting vehicle' });
        }

        if (!results.length) {
            return res.status(404).json({ message: 'Vehicle not found' });
        }

        const ownerId = results[0].ownerId;
        const imagesJson = results[0].images;

        if (req.user.role !== 'admin' && ownerId !== userId) {
            return res.status(403).json({ message: 'You are not allowed to delete this vehicle' });
        }

        console.log(`🗑️  Delete request for vehicle ID: ${id}`);
        console.log(`📦 Images to process: ${imagesJson ? 'yes' : 'none'}`);
        console.log(`🏺 Using Firebase Storage bucket: ${bucket.name}`);

        // STEP 1: Parse images from vehicle record
        let imageUrls = [];
        try {
            if (imagesJson) {
                imageUrls = typeof imagesJson === 'string' ? JSON.parse(imagesJson) : (Array.isArray(imagesJson) ? imagesJson : []);
                console.log(`📸 Found ${imageUrls.length} images in database`);
            }
        } catch (parseErr) {
            console.warn('⚠️  Could not parse images JSON:', parseErr.message);
        }

        // STEP 2: Delete images from Firebase Storage
        let deletedImageCount = 0;
        const deletionResults = [];
        
        if (imageUrls.length > 0) {
            for (const imageUrl of imageUrls) {
                try {
                    if (!imageUrl || typeof imageUrl !== 'string') {
                        console.warn('⚠️  Skip invalid image URL:', imageUrl);
                        continue;
                    }

                    console.log(`🔍 Processing image URL: ${imageUrl.substring(0, 80)}...`);

                    // Extract file path from Firebase download URL
                    const filePath = extractFilePathFromUrl(imageUrl);
                    console.log(`📁 Final extracted file path: ${filePath || 'FAILED TO EXTRACT'}`);

                    if (filePath) {
                        console.log(`🗑️  Attempting to delete from storage: ${filePath}`);
                        console.log("Deleting:", filePath); // EXTRA DEBUG TIP
                        const file = bucket.file(filePath);

                        try {
                            await file.delete();
                            deletedImageCount++;
                            deletionResults.push({ filePath, status: 'success' });
                            console.log(`✅ Successfully deleted: ${filePath}`);
                        } catch (deleteErr) {
                            // Check if file doesn't exist (error code 404) - still consider it success
                            if (deleteErr.code === 404 || deleteErr.message.includes('404') || deleteErr.message.includes('not found')) {
                                deletedImageCount++;
                                deletionResults.push({ filePath, status: 'success (not found)', message: 'File not found in storage, marked as removed' });
                                console.log(`ℹ️  File not found in storage (already deleted): ${filePath}`);
                            } else {
                                deletionResults.push({ filePath, status: 'failed', error: deleteErr.message });
                                console.warn(`⚠️  Failed to delete ${filePath}: ${deleteErr.message}`);
                            }
                        }
                    } else {
                        deletionResults.push({ url: imageUrl, status: 'failed', error: 'Could not extract file path' });
                        console.warn(`⚠️  Could not extract file path from URL: ${imageUrl}`);
                    }
                } catch (imgProcessErr) {
                    deletionResults.push({ url: imageUrl, status: 'failed', error: imgProcessErr.message });
                    console.warn(`⚠️  Error processing image ${imageUrl}: ${imgProcessErr.message}`);
                }
            }
        }

        console.log(`📊 Image deletion summary: ${deletedImageCount}/${imageUrls.length} files removed`);
        if (deletionResults.length > 0) {
            console.log('📋 Deletion details:', JSON.stringify(deletionResults, null, 2));
        }

        // STEP 3: Delete database record after image cleanup attempts
        const deleteSql = "DELETE FROM vehicles WHERE id = ?";
        db.query(deleteSql, [id], (err, result) => {
            if (err) {
                console.error('❌ Error deleting database record:', err);
                return res.status(500).json({ message: 'Error deleting vehicle' });
            }

            console.log(`✅ Vehicle ${id} deleted successfully from database`);
            console.log(`🎯 Final result: Vehicle deleted with ${deletedImageCount}/${imageUrls.length} images removed from storage`);
            
            res.json({ 
                message: 'Vehicle deleted successfully',
                imagesRemoved: deletedImageCount,
                totalImages: imageUrls.length,
                deletionDetails: deletionResults
            });
        });
    });
});

// Test endpoint for URL parsing (for debugging)
app.post('/test-url-parsing', (req, res) => {
    const { url } = req.body;
    if (!url) {
        return res.status(400).json({ error: 'URL parameter required' });
    }

    console.log('🧪 Testing URL parsing for:', url);
    const filePath = extractFilePathFromUrl(url);

    res.json({
        inputUrl: url,
        extractedPath: filePath,
        success: !!filePath
    });
});

// Multer file upload error handler 2.0
app.use((err, req, res, next) => {
    if (err && err.name === 'MulterError') {
        console.error('❌ Multer upload error:', err.code, err.field, err.message);
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ success: false, message: 'File too large' });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({ success: false, message: 'Too many files' });
        }
        return res.status(400).json({ success: false, message: 'File upload error: ' + err.message });
    } else if (err) {
        return next(err);
    }
    next();
});

// global error handler: JSON output only
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(err.status || 500).json({ success: false, message: err.message || 'Internal server error' });
});
});

// start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    const serverUrl = process.env.NODE_ENV === 'production' 
        ? (process.env.API_URL || `http://localhost:${PORT}`)
        : `http://localhost:${PORT}`;
    console.log(`🚀 Server running on ${serverUrl}`);
    console.log(`📊 Database: ${process.env.DB_HOST}`);
});
