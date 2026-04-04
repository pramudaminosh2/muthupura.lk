const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const CloudinaryStorage = require('multer-storage-cloudinary').CloudinaryStorage || require('multer-storage-cloudinary');

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'vehicles',
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

module.exports = upload;