const mongoose = require("mongoose");

const TaskSchema = new mongoose.Schema({

  text: String,

  deadline: String,

  priority: String,

  completed: Boolean,

  userId: String

});

module.exports = mongoose.model("Task", TaskSchema);