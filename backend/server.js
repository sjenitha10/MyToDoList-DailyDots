require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("./models/user");
const Task = require("./models/task");

const app = express();

app.use(cors());
app.use(express.json());

/* CONNECT DATABASE */
mongoose.connect(process.env.MONGO_URL, {
  serverSelectionTimeoutMS: 5000 // 5 seconds timeout
})
  .then(() => console.log("✅ MongoDB Connected Successfully"))
  .catch(err => {
    console.error("❌ MongoDB Connection Error:");
    if (err.message.includes("IP is not whitelisted") || err.name === "MongooseServerSelectionError") {
      console.error("👉 YOUR IP IS NOT WHITELISTED in MongoDB Atlas.");
      console.error("   Please go to Atlas -> Network Access -> Add Current IP.");
    } else {
      console.error(err);
    }
  });

/* SIGNUP */
app.post("/signup", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(400).json({
        message: existingUser.username === username ? "Username is already taken" : "Email is already registered"
      });
    }

    // HASH PASSWORD
    const hashedPassword = await bcrypt.hash(password, 10);

    // CREATE USER
    const user = new User({
      username,
      email,
      password: hashedPassword
    });

    await user.save();

    res.json({
      message: "User Created Successfully"
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error creating user" });
  }
});

/* LOGIN */
app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    // FIND USER
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(400).json({
        message: "User not found"
      });
    }

    // CHECK PASSWORD
    const validPassword = await bcrypt.compare(
      password,
      user.password
    );

    if (!validPassword) {
      return res.status(400).json({
        message: "Invalid Password"
      });
    }

    // CREATE TOKEN
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET
    );

    res.json({
      token,
      userId: user._id,
      username: user.username
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/* GET TASKS */
app.get("/tasks", async (req, res) => {

  try {

    const userId = req.query.userId;

    const tasks = await Task.find({
      userId: userId
    });

    res.json(tasks);

  } catch (err) {

    res.status(500).json(err);

  }

});

/* ADD TASK */
app.post("/tasks", async (req, res) => {
  const task = new Task(req.body);
  await task.save();
  res.json(task);
});

/* DELETE TASK */
app.delete("/tasks/:id", async (req, res) => {
  await Task.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted" });
});

/* COMPLETE TASK */
app.put("/tasks/:id", async (req, res) => {
  const updated = await Task.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );

  res.json(updated);
});

/* SERVER */
app.listen(5000, () => {
  console.log("Server running on port 5000");
});