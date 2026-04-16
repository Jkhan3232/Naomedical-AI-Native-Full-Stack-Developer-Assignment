const errorHandler = (err, req, res, next) => {
  if (!err.statusCode || err.statusCode >= 500) {
    console.error(err);
  }

  if (err.name === "ValidationError") {
    return res.status(400).json({
      message: "Validation error",
      details: Object.values(err.errors).map((item) => item.message),
    });
  }

  if (err.name === "CastError") {
    return res.status(400).json({ message: `Invalid ${err.path}` });
  }

  if (err.code === 11000) {
    return res
      .status(409)
      .json({ message: "Duplicate value", details: err.keyValue });
  }

  const status = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  return res.status(status).json({ message, details: err.details || null });
};

module.exports = errorHandler;
