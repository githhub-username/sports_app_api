const multer = require('multer');
const path = require('path');

// Configure storage for uploaded images
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'merch_images/'); // Directory where images are saved
    },
    filename: function (req, file, cb) {
        // Create a unique filename by combining original name with timestamp and random value
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9); // Generate a random suffix
        cb(null, `${file.fieldname}_${uniqueSuffix}${path.extname(file.originalname)}`); // Maintain original extension
    }
});

// Create the multer instance
const upload = multer({ storage: storage });

module.exports = upload;
