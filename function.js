const multer = require('multer');
const path = require('path');

// Set up storage engine for multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'merch_images/'); // Directory where images are saved
    },
    filename: function (req, file, cb) {
        // Create a unique filename using the current timestamp and original filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `${file.fieldname}_${uniqueSuffix}${path.extname(file.originalname)}`); // Add original file extension
    }
});

// Initialize multer with storage options
const upload = multer({ storage: storage });

module.exports = upload;
