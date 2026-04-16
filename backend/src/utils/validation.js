const mongoose = require("mongoose");
const { AppError } = require("./errors");

const requireNonEmptyString = (value, fieldName, max = null) => {
  if (typeof value !== "string" || !value.trim()) {
    throw new AppError(`${fieldName} must be a non-empty string`, 400);
  }

  const normalized = value.trim();
  if (max && normalized.length > max) {
    throw new AppError(`${fieldName} must be <= ${max} chars`, 400);
  }

  return normalized;
};

const requireObjectId = (value, fieldName) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw new AppError(`${fieldName} is invalid`, 400);
  }
  return value;
};

module.exports = { requireNonEmptyString, requireObjectId };
