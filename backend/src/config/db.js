const mongoose = require("mongoose");

let isConnected = false;

const connectDB = async () => {
  if (isConnected || mongoose.connection.readyState === 1) {
    return;
  }

  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    throw new Error("MONGO_URI is not configured");
  }

  await mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: 10000,
  });
  isConnected = true;
  console.log("MongoDB connected");
};

module.exports = connectDB;
