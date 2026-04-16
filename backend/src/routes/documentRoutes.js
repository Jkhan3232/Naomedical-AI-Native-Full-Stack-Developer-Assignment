const express = require("express");
const multer = require("multer");
const auth = require("../middleware/auth");
const {
  createDocument,
  getMyDocuments,
  getSharedDocuments,
  getDocumentById,
  updateDocument,
  shareDocument,
  listDocumentShares,
  updateShareRole,
  revokeShare,
  createFromTxtUpload,
} = require("../controllers/documentController");
const { AppError } = require("../utils/errors");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype === "text/plain" ||
      file.originalname.toLowerCase().endsWith(".txt")
    ) {
      return cb(null, true);
    }
    return cb(new Error("Only .txt files are allowed"));
  },
  limits: {
    fileSize: 1024 * 1024,
  },
});

router.use(auth);

const handleUpload = (req, res, next) => {
  upload.single("file")(req, res, (error) => {
    if (!error) {
      return next();
    }

    if (error instanceof multer.MulterError) {
      return next(new AppError(error.message, 400));
    }

    return next(new AppError(error.message || "Invalid file upload", 400));
  });
};

router.post("/", createDocument);
router.get("/my", getMyDocuments);
router.get("/shared", getSharedDocuments);
router.get("/:id/shares", listDocumentShares);
router.patch("/:id/shares/:userId", updateShareRole);
router.delete("/:id/shares/:userId", revokeShare);
router.get("/:id", getDocumentById);
router.put("/:id", updateDocument);
router.post("/:id/share", shareDocument);
router.post("/upload", handleUpload, createFromTxtUpload);

module.exports = router;
