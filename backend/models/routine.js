const mongoose = require("mongoose");

const RoutineSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  title: { type: String, required: true },
  icon: { type: String, default: '💧' },
  currentStreak: { type: Number, default: 0 },
  longestStreak: { type: Number, default: 0 },
  totalCompleted: { type: Number, default: 0 },
  missedDays: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  history: [{
    date: String, // YYYY-MM-DD
    status: { type: String, enum: ['completed', 'missed', 'pending'], default: 'pending' }
  }]
});

module.exports = mongoose.model("Routine", RoutineSchema);
