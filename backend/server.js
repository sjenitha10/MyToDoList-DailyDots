require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("./models/user");
const Task = require("./models/task");
const Routine = require("./models/routine");

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

    // STREAK LOGIC
    const today = new Date().toISOString().split("T")[0];
    if (user.lastActiveDate !== today) {
      if (!user.lastActiveDate) {
        user.streak = 1;
      } else {
        const last = new Date(user.lastActiveDate);
        const curr = new Date(today);
        const diffDays = Math.floor((curr - last) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          user.streak += 1;
        } else if (diffDays > 1) {
          user.streak = 1; // Missed a day, reset streak
        }
      }
      user.lastActiveDate = today;
      await user.save();
    }

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

/* GET PROFILE */
app.get("/profile/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const totalCompleted = await Task.countDocuments({ userId: req.params.id, completed: true });

    res.json({
      username: user.username,
      email: user.email,
      streak: user.streak,
      memberSince: user.createdAt,
      totalCompleted
    });
  } catch (err) {
    res.status(500).json(err);
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

/* ----------------- ROUTINES ----------------- */

app.get("/routines", async (req, res) => {
  try {
    const userId = req.query.userId;
    const routines = await Routine.find({ userId });
    
    const today = new Date().toISOString().split("T")[0];
    
    for (let routine of routines) {
      let updated = false;
      const createdDate = new Date(routine.createdAt).toISOString().split("T")[0];
      const start = new Date(createdDate);
      const end = new Date(today);
      
      const historyMap = {};
      routine.history.forEach(h => historyMap[h.date] = h.status);
      
      const newHistory = [];
      let currentStreak = 0;
      
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split("T")[0];
        let status = historyMap[dateStr];
        
        if (!status) {
          status = (dateStr === today) ? 'pending' : 'missed';
          updated = true;
        } else if (status === 'pending' && dateStr !== today) {
          // If a past day was left as pending, it should now be missed
          status = 'missed';
          updated = true;
        }
        
        newHistory.push({ date: dateStr, status });
        
        if (status === 'completed') {
          currentStreak++;
        } else if (status === 'missed') {
          currentStreak = 0;
        }
      }
      
      if (updated || routine.currentStreak !== currentStreak) {
        routine.history = newHistory;
        routine.currentStreak = currentStreak;
        if (currentStreak > routine.longestStreak) {
          routine.longestStreak = currentStreak;
        }
        routine.totalCompleted = newHistory.filter(h => h.status === 'completed').length;
        routine.missedDays = newHistory.filter(h => h.status === 'missed').length;
        await routine.save();
      }
    }
    
    res.json(routines);
  } catch (err) {
    res.status(500).json(err);
  }
});

app.post("/routines", async (req, res) => {
  try {
    const routine = new Routine(req.body);
    const today = new Date().toISOString().split("T")[0];
    routine.history.push({ date: today, status: 'pending' });
    await routine.save();
    res.json(routine);
  } catch(err) {
    res.status(500).json(err);
  }
});

app.put("/routines/:id/complete", async (req, res) => {
  try {
    const routine = await Routine.findById(req.params.id);
    const today = new Date().toISOString().split("T")[0];
    
    const todayEntry = routine.history.find(h => h.date === today);
    if (todayEntry) {
      if (todayEntry.status === 'pending') {
        todayEntry.status = 'completed';
        routine.currentStreak++;
        if (routine.currentStreak > routine.longestStreak) {
          routine.longestStreak = routine.currentStreak;
        }
        routine.totalCompleted++;
      }
    } else {
      routine.history.push({ date: today, status: 'completed' });
      routine.currentStreak++;
      routine.totalCompleted++;
    }
    
    await routine.save();
    res.json(routine);
  } catch(err) {
    res.status(500).json(err);
  }
});

app.delete("/routines/:id", async (req, res) => {
  await Routine.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted" });
});

/* SERVER */
app.listen(5000, () => {
  console.log("Server running on port 5000");
});