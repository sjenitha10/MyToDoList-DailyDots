const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    unique: true,
    required: true
  },
  email: {
    type: String,
    unique: true,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  streak: {
    type: Number,
    default: 0
  },
  lastActiveDate: {
    type: String,
    default: ""
  }
}, { timestamps: true });

module.exports = mongoose.model("User", UserSchema);