const mongoose = require("mongoose");

const sharedUserSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ["viewer", "editor"],
      default: "editor",
    },
    sharedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false },
);

const documentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    content: {
      type: String,
      default: "",
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    sharedWith: [sharedUserSchema],
  },
  {
    timestamps: true,
    optimisticConcurrency: true,
  },
);

documentSchema.index({ ownerId: 1, updatedAt: -1 });
documentSchema.index({ "sharedWith.userId": 1, updatedAt: -1 });

module.exports = mongoose.model("Document", documentSchema);
