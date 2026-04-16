const jwt = require("jsonwebtoken");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const { AppError } = require("../utils/errors");
const { requireNonEmptyString } = require("../utils/validation");

const login = asyncHandler(async (req, res) => {
  const normalizedEmail = requireNonEmptyString(
    req.body.email,
    "Email",
  ).toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
    throw new AppError("Email format is invalid", 400);
  }

  let user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    const fallbackName = req.body.name?.trim() || "New User";
    user = await User.create({ email: normalizedEmail, name: fallbackName });
  }

  const token = jwt.sign(
    { id: user._id.toString(), email: user.email, name: user.name },
    process.env.JWT_SECRET || "dev-secret",
    { expiresIn: "7d" },
  );

  return res.json({ token, user });
});

module.exports = { login };
