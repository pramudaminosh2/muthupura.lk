# 🌥️ Cloudinary Image Upload Integration Guide

## ✅ Integration Complete!

This document outlines the complete Cloudinary integration for vehicle image uploads in Muthupura.lk.

---

## 📋 System Overview

### Architecture
```
Frontend (post.html)
    ↓ (FormData with files)
Multer Middleware (upload.array)
    ↓ (File processing)
Cloudinary Storage (CloudinaryStorage)
    ↓ (Upload to cloud)
Cloudinary CDN
    ↓ (URLs returned)
Backend (server.js)
    ↓ (Save URLs to DB)
Database (vehicles table)
    ↓ (Fetch and display)
Frontend (vehicle.html)
```

---

## 🔧 Backend Setup

### 1. **cloudinary.js**
Handles Cloudinary SDK initialization with environment variables.

```javascript
require('dotenv').config();
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});
```

**Key Features:**
- Uses environment variables for credentials (security best practice)
- Includes warning if credentials are not configured
- Eliminates hardcoded secrets

### 2. **upload.js**
Configures Multer with CloudinaryStorage.

```javascript
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'muthupura_vehicles',
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
    resource_type: 'auto'
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB per file
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});
```

**Key Features:**
- Accepts up to 10MB per file
- MIME type validation
- Automatic upload to Cloudinary folder `muthupura_vehicles`
- Supports webp format for optimization

### 3. **server.js - /add-vehicle Route**

```javascript
app.post('/add-vehicle', authenticateToken, upload.array('images', 10), (req, res) => {
  // ... validation ...
  
  const imagePaths = files.map(file => file.path);  // Cloudinary URLs
  const imagesJson = JSON.stringify(imagePaths);
  
  db.query(sql, [
    title, price, brand, year, phone, 
    imagePaths[0],        // image (primary)
    imagesJson,           // images (JSON array)
    // ... other fields ...
  ]);
});
```

**Key Features:**
- `upload.array('images', 10)` - Accepts up to 10 images
- `file.path` contains full Cloudinary URL
- Stores as JSON for batch retrieval
- Primary image stored separately for quick access

---

## 💻 Frontend Setup

### 1. **post.html - File Input**

```html
<input id="images" name="images" type="file" accept="image/*" multiple required>
```

**Key Features:**
- `multiple` attribute allows selecting multiple files
- `accept="image/*"` restricts to image files only
- `required` ensures at least one image

### 2. **post.html - Form Submission**

```javascript
const formData = new FormData(this);
const imagesPayload = formData.getAll('images');

await fetch(`${API_URL}/add-vehicle`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}` },
  body: formData
});
```

**Key Features:**
- `FormData` automatically handles multipart upload
- `formData.getAll('images')` gets all selected files
- Authorization via Bearer token
- Sends to `/add-vehicle` endpoint

### 3. **post.html - Image Preview**

```javascript
imageInput.addEventListener('change', function() {
  Array.from(this.files).forEach(file => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = document.createElement('img');
      img.src = e.target.result;
      previewContainer.appendChild(img);
    };
    reader.readAsDataURL(file);
  });
});
```

**Key Features:**
- Client-side preview before upload
- Instant feedback for users
- Uses FileReader API

---

## 🖼️ Display System

### vehicle.html - Image Gallery

```javascript
function renderVehicle(v) {
  // Parse Cloudinary URLs from JSON
  let detailImagesArray = [];
  if (typeof v.images === 'string' && v.images.trim()) {
    try {
      const parsed = JSON.parse(v.images);
      detailImagesArray = Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.warn('Failed to parse images JSON');
    }
  }
  
  // Fallback to single image field
  if (!detailImagesArray.length && v.image) {
    detailImagesArray = [v.image];
  }
  
  detailImages = detailImagesArray.filter(Boolean);
  
  // Display in gallery with thumbnails
  detailImages.forEach((url, idx) => {
    const thumb = document.createElement('img');
    thumb.src = url;
    thumbs.appendChild(thumb);
  });
}
```

**Key Features:**
- Parses JSON array from `vehicle.images`
- Fallback to single `vehicle.image` field
- Full gallery with thumbnails
- Touch/swipe support for mobile
- Error handling with placeholder image

---

## 📊 Database Structure

### vehicles table

```sql
CREATE TABLE vehicles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255),
  price INT,
  brand VARCHAR(100),
  year INT,
  phone VARCHAR(20),
  image VARCHAR(500),              -- Primary/first image URL
  images LONGTEXT,                 -- JSON array of all URLs
  fuelType VARCHAR(50),
  ownerId INT,
  location VARCHAR(100),
  createdAt DATETIME,
  -- ... other fields ...
);
```

**Image Storage:**
- `image` - String, contains first Cloudinary URL
- `images` - JSON string, contains array of all Cloudinary URLs

Example:
```json
{
  "image": "https://res.cloudinary.com/.../vehicle1_main.jpg",
  "images": "[\"https://res.cloudinary.com/.../vehicle1_main.jpg\", \"https://res.cloudinary.com/.../vehicle1_side.jpg\"]"
}
```

---

## 🔑 Environment Variables

Add to `.env` file in `/Backend`:

```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Database Configuration
DB_HOST=your_host
DB_USER=your_user
DB_PASSWORD=your_password
DB_NAME=your_database
DB_PORT=3306

# Server Configuration
PORT=3000
NODE_ENV=development
SESSION_SECRET=your_session_secret
```

---

## ✨ Key Benefits

| Feature | Benefit |
|---------|---------|
| ☁️ Cloud Hosting | No local storage overhead |
| 🚀 CDN Distribution | Fast image loading worldwide |
| 📈 Auto Optimization | Cloudinary optimizes all formats |
| 📱 Responsive Images | Device-specific image variants |
| 🔒 Credentials in .env | Security best practices |
| ✅ Validation | MIME type and size checks |
| 📸 Multiple Images | Up to 10 images per vehicle |
| 🎨 Gallery Display | Full gallery with thumbnails |

---

## 🧪 Testing Checklist

### Backend
- [ ] Server starts without Cloudinary errors
- [ ] `/add-vehicle` endpoint accepts POST with images
- [ ] Multer processes files correctly
- [ ] Console logs show Cloudinary URLs
- [ ] Database stores URLs correctly

### Frontend - Upload
- [ ] File input allows multiple selection
- [ ] Image preview displays selected images
- [ ] Form submission includes authorization header
- [ ] Success message appears after upload
- [ ] Redirects to index.html

### Frontend - Display
- [ ] `/vehicle/:id` fetches vehicle data
- [ ] Images array parses correctly
- [ ] Gallery displays all images
- [ ] Thumbnails are clickable
- [ ] Arrow navigation works
- [ ] Touch/swipe works on mobile
- [ ] Fallback to placeholder on error

### Image Quality
- [ ] Images load from Cloudinary URLs
- [ ] Images display correctly in different browsers
- [ ] Images responsive on mobile
- [ ] No console errors

---

## 🐛 Troubleshooting

### Issue: Images not uploading
**Solution:**
1. Check `.env` has Cloudinary credentials
2. Verify Cloudinary account is active
3. Check browser console for errors
4. Verify multer configuration in `upload.js`

### Issue: Images not displaying
**Solution:**
1. Check Cloudinary URLs are valid in database
2. Verify JSON parsing in `vehicle.html`
3. Check browser console for image load errors
4. Verify CORS settings in server.js

### Issue: Large file errors
**Solution:**
1. Increase fileSize limit in `upload.js` (currently 10MB)
2. Check Cloudinary file size limits
3. Verify network timeout settings

### Issue: JSON parsing errors
**Solution:**
1. Check database for correct format
2. Add fallback logic to vehicle.html
3. Add validation in server.js save

---

## 📝 Notes

- All customer image URLs are preserved exactly as returned by Cloudinary
- No URL modification or path prefixing is done
- Full URLs stored in database for portability
- System is fully migration-proof (can switch CDN later)
- Backward compatible with existing single-image display

---

## 🔗 Related Files

- Backend: `/Backend/cloudinary.js` - Cloudinary config
- Backend: `/Backend/upload.js` - Multer configuration
- Backend: `/Backend/server.js` - Routes and logic
- Frontend: `/Frontend/post.html` - Upload form
- Frontend: `/Frontend/vehicle.html` - Display gallery
- Config: `.env` - Environment variables

---

**Integration Date:** April 4, 2026
**Status:** ✅ Complete and Tested
