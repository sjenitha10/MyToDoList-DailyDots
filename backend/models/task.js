const mongoose = require("mongoose");

const TaskSchema = new mongoose.Schema({
  title: String,
  description: String,
  category: String,
  dueDate: String,
  priority: String,
  completed: Boolean,
  isDailyFocus: {
    type: Boolean,
    default: false
  },
  completedAt: Date,
  userId: String
}, { timestamps: true });

module.exports = mongoose.model("Task", TaskSchema);