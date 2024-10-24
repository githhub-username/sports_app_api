const multer = require('multer');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'merch_images/'); // Directory where images are saved
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + "_" + Date.now() + ".jpg");
    }
});

const upload = multer({ storage: storage });

module.exports = upload;
