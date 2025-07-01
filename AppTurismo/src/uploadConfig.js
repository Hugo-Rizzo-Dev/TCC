const multer = require("multer");
const path = require("path");
const { v4 } = require("uuid");

const storage = multer.diskStorage({
  destination: path.resolve(__dirname, "..", "uploads"),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${v4()}${ext}`);
  },
});

module.exports = multer({ storage });
