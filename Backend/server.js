require('dotenv').config();

const express = require('express');
const app = express();
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const upload = require('./upload');

const PORT = process.env.PORT || 3000;

// Google OAuth settings
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || 'YOUR_GOOGLE_CLIENT_SECRET';
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/auth/google/callback';
const GOOGLE_OAUTH2_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v3/userinfo';

// Facebook OAuth settings
const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID || 'YOUR_FACEBOOK_APP_ID';
const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET || 'YOUR_FACEBOOK_APP_SECRET';
const FACEBOOK_REDIRECT_URI = process.env.FACEBOOK_REDIRECT_URI || 'http://localhost:3000/auth/facebook/callback';
const FACEBOOK_OAUTH_URL = 'https://www.facebook.com/v16.0/dialog/oauth';
const FACEBOOK_TOKEN_URL = 'https://graph.facebook.com/v16.0/oauth/access_token';
const FACEBOOK_USERINFO_URL = 'https://graph.facebook.com/v16.0/me';

// Enable CORS - must be FIRST before all routes and error handlers
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "https://muthupuralk.web.app");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    res.header("Access-Control-Allow-Credentials", "true");
    
    // Handle preflight OPTIONS requests
    if (req.method === 'OPTIONS') {
        return res.sendStatus(204);
    }
    next();
});

// CORS package for additional compatibility
app.use(cors({
    origin: "https://muthupuralk.web.app",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: process.env.SESSION_SECRET || 'muthupura-session-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));
app.use(passport.initialize());
app.use(passport.session());

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

let db = mysql.createConnection({
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

db.connect((err) => {
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
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

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
                            if (indexErr && indexErr.code !== 'ER_DUP_KEY') {
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

        // Favorites system has been removed. Legacy favorites table no longer created in schema setup.
        // If existing database has the table, drop it manually with:
        // DROP TABLE IF EXISTS favorites;

        console.log('Vehicles table schema checked for isFeatured, views, featuredUntil, createdAt, fuelType, ownerId, images, location');
    }
});

// Cloudinary and multer storage setup is now handled in Backend/upload.js

const bcrypt = require('bcrypt');

app.post('/register', async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedName = name.trim();
    const username = normalizedName.split(' ').filter(Boolean).join('.').toLowerCase() || normalizedEmail.split('@')[0];

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(normalizedEmail)) {
        return res.status(400).json({ message: 'Invalid email format' });
    }

    if (password.length < 8) {
        return res.status(400).json({ message: 'Password too short' });
    }

    db.query('SELECT id, email, username FROM users WHERE email = ? OR username = ?', [normalizedEmail, username], async (err, results) => {
        if (err) {
            console.error('Register query error:', err);
            return res.status(500).json({ message: 'Internal server error' });
        }

        if (results.length > 0) {
            const existingEmail = results.find(r => r.email === normalizedEmail);
            const existingName = results.find(r => r.username === username);
            if (existingEmail) {
                return res.status(409).json({ message: 'Email already exists' });
            }
            if (existingName) {
                return res.status(409).json({ message: 'Username already exists' });
            }
            return res.status(409).json({ message: 'User already exists' });
        }

        try {
            const hashedPassword = await bcrypt.hash(password, 10);
            const role = 'user';
            const insertSql = 'INSERT INTO users (name, username, email, password, role, auth_provider) VALUES (?, ?, ?, ?, ?, ?)';

            db.query(insertSql, [normalizedName, username, normalizedEmail, hashedPassword, role, 'local'], (insertErr, insertResult) => {
                if (insertErr) {
                    if (insertErr.code === 'ER_DUP_ENTRY') {
                        return res.status(409).json({ message: 'Email already exists' });
                    }
                    console.error('Register insert error:', insertErr);
                    return res.status(500).json({ message: 'Internal server error' });
                }

                res.status(201).json({ message: 'User registered', userId: insertResult.insertId });
            });
        } catch (hashErr) {
            console.error('Password hashing error:', hashErr);
            res.status(500).json({ message: 'Internal server error' });
        }
    });
});

const jwt = require('jsonwebtoken');
const SECRET = 'muthupura_secret';

// In-memory OTP store (phone -> { otp, expiresAt })
const otpStore = new Map();

// Cleanup stale OTPs every 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const [phone, entry] of otpStore.entries()) {
        if (entry.expiresAt <= now) otpStore.delete(phone);
    }
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

app.post('/login', (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            console.log('❌ /login - Missing email or password');
            return res.status(400).json({ 
                success: false,
                message: 'Email and password are required' 
            });
        }

        const normalizedEmail = email.trim().toLowerCase();
        console.log('🔐 /login attempt:', normalizedEmail);

        const sql = 'SELECT * FROM users WHERE email = ?';

        db.query(sql, [normalizedEmail], async (err, results) => {
            if (err) {
                console.error('❌ /login - Database query error:', err.message);
                return res.status(500).json({ 
                    success: false,
                    message: 'Internal server error',
                    error: process.env.NODE_ENV === 'development' ? err.message : undefined
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
                const token = jwt.sign(payload, SECRET, { expiresIn: '6h' });

                console.log('✅ /login success:', { userId: user.id, email: normalizedEmail });

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
                    message: 'Internal server error',
                    error: process.env.NODE_ENV === 'development' ? bcryptErr.message : undefined
                });
            }
        });
    } catch (err) {
        console.error('❌ Unexpected error in /login:', err.message);
        res.status(500).json({
            success: false,
            message: 'Unexpected server error',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
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
                const token = jwt.sign(payload, SECRET, { expiresIn: '6h' });
                
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
    const token = jwt.sign(payload, SECRET, { expiresIn: '6h' });
    res.send(`<!DOCTYPE html><html><body><script>
            window.opener.postMessage(${JSON.stringify({ token, role: payload.role, user: { id: req.user.id, name: req.user.name, email: req.user.email } })}, '*');
            window.close();
        </script></body></html>`);
});

app.get('/auth/facebook', passport.authenticate('facebook', { scope: ['email'] }));

app.get('/auth/facebook/callback', passport.authenticate('facebook', { failureRedirect: '/auth/failure' }), (req, res) => {
    console.log('Route hit: /auth/facebook/callback', { user: req.user });
    const payload = { id: req.user.id, name: req.user.name, role: req.user.role || 'user' };
    const token = jwt.sign(payload, SECRET, { expiresIn: '6h' });
    res.send(`<!DOCTYPE html><html><body><script>
            window.opener.postMessage(${JSON.stringify({ token, role: payload.role, user: { id: req.user.id, name: req.user.name, email: req.user.email } })}, '*');
            window.close();
        </script></body></html>`);
});

app.get('/auth/failure', (req, res) => {
    res.status(401).send('Authentication failed');
});

app.post('/send-otp', (req, res) => {
    console.log('Route hit: /send-otp', { body: req.body });
    const { phone } = req.body;
    if (!phone || !/^[0-9]{7,15}$/.test(phone.toString().replace(/\D/g, ''))) {
        return res.status(400).json({ message: 'Invalid phone number' });
    }

    const cleaned = phone.toString().replace(/\D/g, '');
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000;

    otpStore.set(cleaned, { otp, expiresAt });
    console.log('OTP for', cleaned, 'is', otp, '(valid 5 min)');

    res.json({ message: 'OTP sent (check console in demo mode)' });
});

app.post('/verify-otp', (req, res) => {
    console.log('Route hit: /verify-otp', { body: req.body });
    const { phone, otp } = req.body;
    if (!phone || !otp) {
        return res.status(400).json({ message: 'Phone and OTP are required' });
    }

    const cleaned = phone.toString().replace(/\D/g, '');
    const entry = otpStore.get(cleaned);

    if (!entry || entry.expiresAt < Date.now()) {
        otpStore.delete(cleaned);
        return res.status(400).json({ message: 'OTP expired or not found' });
    }

    if (entry.otp !== otp.toString()) {
        return res.status(401).json({ message: 'Invalid OTP' });
    }

    otpStore.delete(cleaned);

    db.query('SELECT * FROM users WHERE phone = ?', [cleaned], (err, results) => {
        if (err) {
            console.error('OTP login DB lookup error', err);
            return res.status(500).json({ message: 'Internal server error' });
        }

        if (results.length > 0) {
            const user = results[0];
            const payload = { id: user.id, name: user.name, role: user.role || 'user' };
            const token = jwt.sign(payload, SECRET, { expiresIn: '6h' });
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
                    const token = jwt.sign(payload, SECRET, { expiresIn: '6h' });

                    res.json({
                        message: 'Profile created successfully',
                        token,
                        user: { id: userId, name: nameTrimmed, email: emailNormalized, phone: cleanedPhone },
                    });
                });
        });
    });
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

// Cloudinary upload storage is handled by Backend/upload.js
console.log('☁️ Images will be served from Cloudinary CDN');

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

    return record;
}

// test route
app.get('/', (req, res) => {
    res.send('Muthupura backend is running 🚀');
});

// 🧪 Test Route - Verify Backend Working
app.get('/test', (req, res) => {
    res.send("Backend working ✅");
});

// 🟢 Add Vehicle - Production Route
app.post('/add-vehicle', upload.array('images', 10), async (req, res) => {
    console.log("🔥 POST /add-vehicle hit");
    console.log("FILES RECEIVED:", req.files);
    
    try {
        // Extract form data
        const { model, price, description, category, year } = req.body;
        
        // Validate required fields
        if (!model || !price || !description || !category || !year) {
            return res.status(400).json({ 
                success: false, 
                message: 'Missing required fields: model, price, description, category, year' 
            });
        }
        
        // Ensure at least one image was uploaded
        if (!Array.isArray(req.files) || !req.files.length) {
            return res.status(400).json({ 
                success: false, 
                message: 'At least one image file is required' 
            });
        }
        
        const imageUrls = req.files.map(file => file.path);
        const image_url = imageUrls[0];
        
        console.log('📝 Vehicle form data:', {
            model,
            price: parseFloat(price),
            description,
            category,
            year: parseInt(year),
            image_url: image_url.substring(0, 80) + '...'
        });
        
        // Insert into database
        const sql = `
            INSERT INTO vehicles 
            (title, price, brand, year, phone, image, images, fuelType, ownerId, location, isFeatured, views, featuredUntil, createdAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `;
        
        const values = [
            model,                                    // title
            parseFloat(price),                       // price
            category,                                // brand
            parseInt(year),                          // year
            '',                                      // phone (optional)
            image_url,                               // image
            JSON.stringify(imageUrls),               // images (JSON array)
            'Other',                                 // fuelType (default)
            null,                                    // ownerId
            'Unknown',                               // location
            0,                                       // isFeatured
            0,                                       // views
            null                                     // featuredUntil
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

// 🟢 Get All Vehicles
app.get('/get-vehicles', (req, res) => {
    try {
        expireFeaturedAds(err => {
            if (err) {
                console.error('❌ Error expiring featured ads:', err.message);
            }

            const sql = "SELECT * FROM vehicles ORDER BY isFeatured DESC, views DESC, createdAt DESC, id DESC";
            console.log('📤 Fetching vehicles from database...');

            db.query(sql, (err, results) => {
                if (err) {
                    console.error('❌ Database query error in /get-vehicles:', err.message);
                    return res.status(500).json({ 
                        success: false,
                        message: 'Error fetching vehicles',
                        error: process.env.NODE_ENV === 'development' ? err.message : undefined
                    });
                }

                try {
                    const normalizedResults = results.map(normalizeVehicleRecord);
                    console.log(`✅ /get-vehicles returned ${normalizedResults.length} vehicles`);
                    res.json({
                        success: true,
                        data: normalizedResults,
                        count: normalizedResults.length
                    });
                } catch (normalizeErr) {
                    console.error('❌ Error normalizing vehicle data:', normalizeErr.message);
                    return res.status(500).json({
                        success: false,
                        message: 'Error processing vehicle data',
                        error: process.env.NODE_ENV === 'development' ? normalizeErr.message : undefined
                    });
                }
            });
        });
    } catch (err) {
        console.error('❌ Unexpected error in /get-vehicles:', err.message);
        res.status(500).json({
            success: false,
            message: 'Unexpected server error',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
});

// 🟢 Get Vehicle by ID
app.get('/vehicle/:id', (req, res) => {
    const id = req.params.id;
    const sql = "SELECT * FROM vehicles WHERE id = ? LIMIT 1";

    db.query(sql, [id], (err, results) => {
        if (err) {
            console.error('Error fetching vehicle', err);
            return res.status(500).json({ message: 'Error fetching vehicle' });
        }
        if (!results.length) {
            return res.status(404).json({ message: 'Vehicle not found' });
        }
        const normalized = normalizeVehicleRecord(results[0]);
        console.log('Vehicle fetched:', normalized.id, 'images:', normalized.images?.length || 0, normalized.images);
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
app.put('/update-vehicle/:id', authenticateToken, upload.array('images', 10), (req, res) => {
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
        const imagePaths = files.map(file => file.path);
        fields.push('images = ?'); values.push(JSON.stringify(imagePaths));
        fields.push('image = ?'); values.push(imagePaths[0] || null);
        console.log('☁️ Updated vehicle with', imagePaths.length, 'Cloudinary images');
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

app.delete('/delete-vehicle/:id', authenticateToken, (req, res) => {
    const id = req.params.id;
    const userId = req.user.id;

    const selectSql = "SELECT ownerId FROM vehicles WHERE id = ?";
    db.query(selectSql, [id], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Error deleting vehicle' });
        }

        if (!results.length) {
            return res.status(404).json({ message: 'Vehicle not found' });
        }

        const ownerId = results[0].ownerId;
        if (req.user.role !== 'admin' && ownerId !== userId) {
            return res.status(403).json({ message: 'You are not allowed to delete this vehicle' });
        }

        console.log("Delete request for ID:", id);

        const sql = "DELETE FROM vehicles WHERE id = ?";
        db.query(sql, [id], (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ message: 'Error deleting vehicle' });
            }

            console.log("Deleted rows:", result.affectedRows);
            res.json({ message: 'Vehicle deleted' });
        });
    });
});

// 404 JSON fallback
app.use((req, res) => {
    res.status(404).json({ message: 'Not found' });
});

// Multer file upload error handler
app.use((err, req, res, next) => {
    res.header("Access-Control-Allow-Origin", "https://muthupuralk.web.app");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    
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
    res.header("Access-Control-Allow-Origin", "https://muthupuralk.web.app");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    
    console.error('Unhandled error:', err);
    res.status(500).json({ message: 'Internal server error' });
});

// start server
app.listen(PORT, () => {
    const serverUrl = process.env.NODE_ENV === 'production' 
        ? (process.env.API_URL || `http://localhost:${PORT}`)
        : `http://localhost:${PORT}`;
    console.log(`🚀 Server running on ${serverUrl}`);
    console.log(`📊 Database: ${process.env.DB_HOST}`);
});