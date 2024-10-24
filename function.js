const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Define the directory where images will be uploaded
const uploadDirectory = path.join(__dirname, 'merch_images');

// Ensure the upload directory exists (this is a backup check; we already do this in index.js)
if (!fs.existsSync(uploadDirectory)) {
    fs.mkdirSync(uploadDirectory, { recursive: true });
}

// Set up storage engine for multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDirectory); // Directory where images are saved
    },
    filename: function (req, file, cb) {
        // Create a unique filename using the current timestamp and original filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `${file.fieldname}_${uniqueSuffix}${path.extname(file.originalname)}`); // Add original file extension
    }
});

// Initialize multer with storage options
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 } // Set file size limit to 5MB, adjust as needed
});

module.exports = upload;
