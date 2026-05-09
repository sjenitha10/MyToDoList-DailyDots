let tasks = [];

/* UI STATE MANAGEMENT */
function showSignup() {
  document.getElementById("loginCard").style.display = "none";
  document.getElementById("signupCard").style.display = "block";
  document.getElementById("signupCard").style.animation = "fadeIn 0.5s ease-out";
}

function showLogin() {
  document.getElementById("signupCard").style.display = "none";
  document.getElementById("loginCard").style.display = "block";
  document.getElementById("loginCard").style.animation = "fadeIn 0.5s ease-out";
}

/* AUTHENTICATION */
async function signup() {
  const username = document.getElementById("signupUsername").value.trim();
  const email = document.getElementById("signupEmail").value.trim();
  const password = document.getElementById("signupPassword").value;

  if (!username || !email || !password) {
    alert("Please fill in all fields ✨");
    return;
  }

  try {
    const res = await fetch("https://dailydots-g1iy.onrender.com/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password })
    });

    const data = await res.json();
    
    if (res.ok) {
      alert("💕 Account created! Please login.");
      showLogin();
      // Fill login username for convenience
      document.getElementById("loginUsername").value = username;
    } else {
      alert(data.message || "Something went wrong 🌸");
    }
  } catch (err) {
    alert("Backend server is not running 🌸");
  }
}

async function login() {
  const username = document.getElementById("loginUsername").value.trim();
  const password = document.getElementById("loginPassword").value;

  if (!username || !password) {
    alert("Please enter both username and password 🌸");
    return;
  }

  try {
    const res = await fetch("https://dailydots-g1iy.onrender.com/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();

    if (data.token) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("userId", data.userId);
      localStorage.setItem("username", data.username);
      
      initApp();
    } else {
      alert(data.message || "Invalid credentials 🌸");
    }
  } catch (err) {
    alert("Backend server is not running 🌸");
  }
}

function logout() {
  localStorage.clear();
  location.reload();
}

/* APP LOGIC */
function initApp() {
  document.getElementById("authPage").style.display = "none";
  document.getElementById("app").style.display = "block";
  loadTasks();
}

async function loadTasks() {
  const userId = localStorage.getItem("userId");
  try {
    const res = await fetch(`https://dailydots-g1iy.onrender.com/tasks?userId=${userId}`);
    tasks = await res.json();
    renderTasks();
  } catch (err) {
    console.error("Error loading tasks:", err);
  }
}

async function addTask() {
  const input = document.getElementById("taskInput");
  const deadlineInput = document.getElementById("deadline");
  const text = input.value.trim();
  const deadline = deadlineInput.value;

  if (!text || !deadline) {
    alert("Enter task and deadline 🌸");
    return;
  }

  const userId = localStorage.getItem("userId");
  const task = {
    text,
    deadline,
    completed: false,
    userId: userId,
    priority: getPriority(deadline)
  };

  try {
    await fetch("https://dailydots-g1iy.onrender.com/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(task)
    });

    input.value = "";
    deadlineInput.value = "";
    loadTasks();
  } catch (err) {
    alert("Failed to add task 🌸");
  }
}

function getPriority(deadline) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(deadline);
  due.setHours(0, 0, 0, 0);
  
  const diffTime = due.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return "high"; // Due today or overdue
  if (diffDays <= 3) return "medium";
  return "low";
}

function renderTasks() {
  const filter = document.getElementById("filter").value;
  const todoList = document.getElementById("todoList");
  const urgentList = document.getElementById("urgentList");
  const urgentColumn = document.getElementById("urgentColumn");

  // Clear lists
  todoList.innerHTML = "";
  urgentList.innerHTML = "";

  let counts = { todo: 0, urgent: 0 };

  tasks.forEach(task => {
    // Remove the early return for completed tasks so they remain visible
    // if (task.completed) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(task.deadline);
    due.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    const priority = getPriority(task.deadline);
    
    // Apply filter
    if (filter !== "all") {
      if (filter === "week" && diffDays > 7) return;
      if (filter === "later" && diffDays <= 7) return;
    }

    const div = document.createElement("div");
    div.className = `task ${priority} ${task.completed ? 'completed' : ''}`;

    div.innerHTML = `
      <div>
        <strong>${task.text}</strong>
        <small>Due: ${task.deadline}</small>
      </div>
      <div class="buttons">
        <button onclick="toggleComplete('${task._id}')" title="Mark as Done">✔</button>
        <button onclick="deleteTask('${task._id}')" title="Delete Task">🗑</button>
      </div>
    `;

    // Distribute to columns
    if (priority === "high") {
      urgentList.appendChild(div);
      counts.urgent++;
    } else {
      todoList.appendChild(div);
      counts.todo++;
    }
  });

  // 2. SHOW URGENT COLUMN ONLY IF TASKS EXIST
  if (counts.urgent > 0) {
    urgentColumn.style.display = "block";
  } else {
    urgentColumn.style.display = "none";
  }
}

async function toggleComplete(id) {
  const task = tasks.find(t => t._id === id);
  try {
    await fetch(`https://dailydots-g1iy.onrender.com/tasks/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: !task.completed })
    });
    loadTasks();
  } catch (err) {
    console.error(err);
  }
}

async function deleteTask(id) {
  if (!confirm("Delete this task? 🌸")) return;
  try {
    await fetch(`https://dailydots-g1iy.onrender.com/tasks/${id}`, { method: "DELETE" });
    loadTasks();
  } catch (err) {
    console.error(err);
  }
}

/* INITIALIZATION */
window.onload = () => {
  if (localStorage.getItem("token")) {
    initApp();
  } else {
    document.getElementById("authPage").style.display = "flex";
    document.getElementById("app").style.display = "none";
  }
};