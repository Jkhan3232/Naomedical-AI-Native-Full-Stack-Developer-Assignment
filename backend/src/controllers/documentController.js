const Document = require("../models/Document");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const { AppError } = require("../utils/errors");
const {
  requireNonEmptyString,
  requireObjectId,
} = require("../utils/validation");

const asIdString = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (value._id) return value._id.toString();
  return value.toString();
};

const getDocumentOrThrow = async (documentId) => {
  const doc = await Document.findById(documentId);
  if (!doc) {
    throw new AppError("Document not found", 404);
  }
  return doc;
};

const getAccess = (doc, userId) => {
  const isOwner = asIdString(doc.ownerId) === userId;
  const sharedRecord = doc.sharedWith.find(
    (entry) => asIdString(entry.userId) === userId,
  );
  return { isOwner, sharedRecord };
};

const createDocument = asyncHandler(async (req, res) => {
  const title = requireNonEmptyString(req.body.title, "Title", 120);

  const document = await Document.create({
    title,
    content: "",
    ownerId: req.user.id,
    sharedWith: [],
  });

  return res.status(201).json(document);
});

const getMyDocuments = asyncHandler(async (req, res) => {
  const documents = await Document.find({ ownerId: req.user.id }).sort({
    updatedAt: -1,
  });
  return res.json(documents);
});

const getSharedDocuments = asyncHandler(async (req, res) => {
  const documents = await Document.find({ "sharedWith.userId": req.user.id })
    .sort({ updatedAt: -1 })
    .populate("ownerId", "email name");

  return res.json(documents);
});

const getDocumentById = asyncHandler(async (req, res) => {
  requireObjectId(req.params.id, "Document id");
  const doc = await Document.findById(req.params.id)
    .populate("ownerId", "email name")
    .populate("sharedWith.userId", "email name");

  if (!doc) {
    throw new AppError("Document not found", 404);
  }

  const { isOwner, sharedRecord } = getAccess(doc, req.user.id);

  if (!isOwner && !sharedRecord) {
    throw new AppError("Access denied", 403);
  }

  return res.json({
    ...doc.toObject(),
    permissions: {
      canRename: isOwner,
      canShare: isOwner,
      canEdit: isOwner || (sharedRecord && sharedRecord.role === "editor"),
      role: isOwner ? "owner" : sharedRecord.role,
    },
  });
});

const updateDocument = asyncHandler(async (req, res) => {
  requireObjectId(req.params.id, "Document id");
  const { title, content, version } = req.body;

  if (title === undefined && content === undefined) {
    throw new AppError("Nothing to update", 400);
  }

  const doc = await getDocumentOrThrow(req.params.id);
  const { isOwner, sharedRecord } = getAccess(doc, req.user.id);

  if (!isOwner && !sharedRecord) {
    throw new AppError("Access denied", 403);
  }

  if (
    version !== undefined &&
    Number.isInteger(version) &&
    version !== doc.__v
  ) {
    throw new AppError("Document has newer changes. Please reload.", 409, {
      expectedVersion: doc.__v,
    });
  }

  if (title !== undefined) {
    if (!isOwner) {
      throw new AppError("Only owner can rename document", 403);
    }
    doc.title = requireNonEmptyString(title, "Title", 120);
  }

  if (content !== undefined) {
    if (!isOwner && sharedRecord.role !== "editor") {
      throw new AppError("You have view-only access", 403);
    }
    if (typeof content !== "string") {
      throw new AppError("Content must be a string", 400);
    }
    doc.content = content;
  }

  await doc.save();
  return res.json(doc);
});

const shareDocument = asyncHandler(async (req, res) => {
  requireObjectId(req.params.id, "Document id");
  const role = req.body.role === "viewer" ? "viewer" : "editor";
  const { email, userId } = req.body;

  if (!email && !userId) {
    throw new AppError("email or userId is required", 400);
  }

  const doc = await getDocumentOrThrow(req.params.id);

  if (doc.ownerId.toString() !== req.user.id) {
    throw new AppError("Only owner can share document", 403);
  }

  let targetUser = null;
  if (userId) {
    requireObjectId(userId, "userId");
    targetUser = await User.findById(userId);
  } else {
    const normalizedEmail = requireNonEmptyString(email, "email").toLowerCase();
    targetUser = await User.findOne({ email: normalizedEmail });
  }

  if (!targetUser) {
    throw new AppError("Target user not found", 404);
  }

  if (targetUser._id.toString() === req.user.id) {
    throw new AppError("Owner already has access", 400);
  }

  const existing = doc.sharedWith.find(
    (entry) => entry.userId.toString() === targetUser._id.toString(),
  );

  if (existing) {
    existing.role = role;
  } else {
    doc.sharedWith.push({ userId: targetUser._id, role });
  }

  await doc.save();
  return res.json({ message: "Document shared", document: doc });
});

const listDocumentShares = asyncHandler(async (req, res) => {
  requireObjectId(req.params.id, "Document id");
  const doc = await Document.findById(req.params.id).populate(
    "sharedWith.userId",
    "email name",
  );

  if (!doc) {
    throw new AppError("Document not found", 404);
  }

  if (doc.ownerId.toString() !== req.user.id) {
    throw new AppError("Only owner can view sharing settings", 403);
  }

  return res.json(doc.sharedWith);
});

const updateShareRole = asyncHandler(async (req, res) => {
  requireObjectId(req.params.id, "Document id");
  requireObjectId(req.params.userId, "Shared user id");
  const { role } = req.body;

  if (role !== "viewer" && role !== "editor") {
    throw new AppError("Role must be viewer or editor", 400);
  }

  const doc = await getDocumentOrThrow(req.params.id);

  if (doc.ownerId.toString() !== req.user.id) {
    throw new AppError("Only owner can change roles", 403);
  }

  const sharedEntry = doc.sharedWith.find(
    (entry) => entry.userId.toString() === req.params.userId,
  );
  if (!sharedEntry) {
    throw new AppError("Shared user not found", 404);
  }

  sharedEntry.role = role;
  await doc.save();
  return res.json({ message: "Role updated", document: doc });
});

const revokeShare = asyncHandler(async (req, res) => {
  requireObjectId(req.params.id, "Document id");
  requireObjectId(req.params.userId, "Shared user id");
  const doc = await getDocumentOrThrow(req.params.id);

  if (doc.ownerId.toString() !== req.user.id) {
    throw new AppError("Only owner can revoke access", 403);
  }

  const before = doc.sharedWith.length;
  doc.sharedWith = doc.sharedWith.filter(
    (entry) => entry.userId.toString() !== req.params.userId,
  );

  if (before === doc.sharedWith.length) {
    throw new AppError("Shared user not found", 404);
  }

  await doc.save();
  return res.json({ message: "Access revoked", document: doc });
});

const createFromTxtUpload = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new AppError("A .txt file is required", 400);
  }

  const title = req.body.title?.trim()
    ? req.body.title.trim()
    : req.file.originalname;
  const text = req.file.buffer.toString("utf8");

  const safeHtml = text
    .split("\n")
    .map(
      (line) =>
        `<p>${line.replace(/[<>&]/g, (char) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" })[char])}</p>`,
    )
    .join("");

  const document = await Document.create({
    title,
    content: safeHtml,
    ownerId: req.user.id,
    sharedWith: [],
  });

  return res.status(201).json(document);
});

module.exports = {
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
};
