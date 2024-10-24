const multer = require('multer');
const path = require('path');

// Set up storage configuration for Multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'merch_images/'); // Directory where images are saved
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + path.extname(file.originalname); // Add a unique timestamp to the filename
        cb(null, file.fieldname + "_" + uniqueSuffix);
    }
});

// Create an upload instance with the storage configuration
const upload = multer({ storage: storage });

module.exports = upload;
