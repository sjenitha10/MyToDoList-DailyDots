let tasks = [];
let focusTimer = null;
let focusSecondsLeft = 25 * 60;
let isFocusPaused = true;
let currentFocusTaskId = null;

// --- AUTH LOGIC ---
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

async function signup() {
  const username = document.getElementById("signupUsername").value.trim();
  const email = document.getElementById("signupEmail").value.trim();
  const password = document.getElementById("signupPassword").value;
  if (!username || !email || !password) return alert("Please fill in all fields ✨");
  try {
    const res = await fetch("http://localhost:5000/signup", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password })
    });
    const data = await res.json();
    if (res.ok) {
      alert("💕 Account created! Please login.");
      showLogin();
      document.getElementById("loginUsername").value = username;
    } else alert(data.message || "Something went wrong 🌸");
  } catch (err) { alert("Backend server is not running 🌸"); }
}

async function login() {
  const username = document.getElementById("loginUsername").value.trim();
  const password = document.getElementById("loginPassword").value;
  if (!username || !password) return alert("Please enter both username and password 🌸");
  try {
    const res = await fetch("http://localhost:5000/login", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (data.token) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("userId", data.userId);
      localStorage.setItem("username", data.username);
      initApp();
    } else alert(data.message || "Invalid credentials 🌸");
  } catch (err) { alert("Backend server is not running 🌸"); }
}

function logout() {
  localStorage.clear();
  location.reload();
}

function togglePassword(inputId, iconId) {
  const input = document.getElementById(inputId);
  const icon = document.getElementById(iconId);
  if (input.type === "password") {
    input.type = "text";
    icon.setAttribute("data-lucide", "eye-off");
  } else {
    input.type = "password";
    icon.setAttribute("data-lucide", "eye");
  }
  lucide.createIcons();
}

// --- APP INIT & ROUTING ---
function initApp() {
  document.getElementById("authPage").style.display = "none";
  document.getElementById("app").style.display = "flex";
  document.getElementById("topNavUsername").textContent = localStorage.getItem("username") || "User";
  loadTasks();
  loadRoutines();
  loadProfile();
}

function switchView(view) {
  const views = ["overviewView", "tasksView", "profileView", "routinesView", "calendarView", "analyticsView"];
  views.forEach(v => {
    const el = document.getElementById(v);
    if(el) el.style.display = "none";
  });
  
  const navs = ["navOverview", "navTasks", "navRoutines", "navCalendar", "navAnalytics"];
  navs.forEach(n => {
    const el = document.getElementById(n);
    if(el) el.classList.remove("active");
  });

  if (view === 'overview') {
    document.getElementById("overviewView").style.display = "block";
    document.getElementById("navOverview").classList.add("active");
    renderOverview();
  } else if (view === 'tasks') {
    document.getElementById("tasksView").style.display = "flex";
    document.getElementById("navTasks").classList.add("active");
  } else if (view === 'profile') {
    document.getElementById("profileView").style.display = "flex";
    loadProfile();
  } else if (view === 'routines') {
    document.getElementById("routinesView").style.display = "flex";
    document.getElementById("navRoutines").classList.add("active");
  } else if (view === 'calendar') {
    document.getElementById("calendarView").style.display = "flex";
    if(document.getElementById("navCalendar")) document.getElementById("navCalendar").classList.add("active");
    renderFullCalendar();
  } else if (view === 'analytics') {
    document.getElementById("analyticsView").style.display = "flex";
    if(document.getElementById("navAnalytics")) document.getElementById("navAnalytics").classList.add("active");
    renderAnalytics();
  }
  lucide.createIcons();
}

// --- DATA FETCHING ---
async function loadTasks() {
  const userId = localStorage.getItem("userId");
  try {
    const res = await fetch(`http://localhost:5000/tasks?userId=${userId}`);
    tasks = await res.json();
    renderTasks();
    renderOverview();
    renderCalendar();
  } catch (err) { console.error("Failed to load tasks", err); }
}

// PROFILE POPUP LOGIC
function toggleProfilePopup() {
  const popup = document.getElementById('profilePopup');
  if (popup) {
    popup.classList.toggle('active');
  }
}

// Close profile popup when clicking outside
document.addEventListener('click', function(e) {
  const popup = document.getElementById('profilePopup');
  const container = document.getElementById('profileDropdownContainer');
  if (popup && popup.classList.contains('active')) {
    if (!container.contains(e.target)) {
      popup.classList.remove('active');
    }
  }
});

async function loadProfile() {
  const userId = localStorage.getItem("userId");
  try {
    const res = await fetch(`http://localhost:5000/profile/${userId}`);
    const data = await res.json();
    
    // Update old profile view (if still used)
    const profUser = document.getElementById("profileUsername");
    if (profUser) profUser.textContent = data.username;
    const profComp = document.getElementById("profileCompleted");
    if (profComp) profComp.textContent = data.totalCompleted;
    const profStreak = document.getElementById("profileStreak");
    if (profStreak) profStreak.textContent = `${data.streak} 🔥`;
    const profSince = document.getElementById("profileMemberSince");
    if (profSince) profSince.textContent = new Date(data.memberSince).toLocaleDateString("en-US", { month: 'long', year: 'numeric' });
    
    // Update new popup
    const popupUser = document.getElementById("popupUsername");
    if (popupUser) popupUser.textContent = data.username;
    const popupEmail = document.getElementById("popupEmail");
    if (popupEmail) popupEmail.textContent = data.email || "hello@dailydots.com";
    
    // Set avatars to first letter
    const firstLetter = data.username ? data.username.charAt(0).toUpperCase() : 'U';
    const topNavAvatar = document.getElementById("topNavAvatarLetter");
    if (topNavAvatar) topNavAvatar.textContent = firstLetter;
    const popupAvatar = document.getElementById("popupAvatarLetter");
    if (popupAvatar) popupAvatar.textContent = firstLetter;

  } catch (err) { console.error("Failed to load profile", err); }
}

// --- QUICK ADD ---
async function handleQuickAdd(e) {
  if (e.key === "Enter") {
    e.preventDefault();
    await addTask();
  }
}

async function addTask() {
  const input = document.getElementById("taskInput");
  const title = input.value.trim();
  if (!title) return;
  const today = new Date();
  const dueDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const userId = localStorage.getItem("userId");
  const task = { title, description: "", category: "💼 Work", dueDate, completed: false, userId, priority: "medium" };
  try {
    await fetch("http://localhost:5000/tasks", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(task)
    });
    input.value = "";
    loadTasks();
  } catch (err) { alert("Failed to add task 🌸"); }
}

// --- ADD TASK MODAL LOGIC ---
function openAddTaskModal() {
  const today = new Date();
  const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  
  document.getElementById("modalTaskTitle").value = "";
  const dateInput = document.getElementById("modalTaskDue");
  dateInput.value = dateStr;
  dateInput.min = dateStr; // Restrict past dates

  document.getElementById("modalTaskCategory").value = "💼 Work";
  document.getElementById("modalTaskPriority").value = "medium";
  document.getElementById("modalTaskDesc").value = "";
  
  document.getElementById("addTaskModal").style.display = "flex";
}

function closeAddTaskModal() {
  document.getElementById("addTaskModal").style.display = "none";
}

let isSubmittingTask = false;
async function submitModalTask() {
  if (isSubmittingTask) return;
  
  const title = document.getElementById("modalTaskTitle").value.trim();
  const dueDate = document.getElementById("modalTaskDue").value;
  const category = document.getElementById("modalTaskCategory").value;
  const priority = document.getElementById("modalTaskPriority").value;
  const description = document.getElementById("modalTaskDesc").value.trim();

  if (!title) {
    alert("Please enter a task title! 🌸");
    return;
  }

  const userId = localStorage.getItem("userId");
  const task = { title, description, category, dueDate, completed: false, userId, priority };
  
  isSubmittingTask = true;
  try {
    await fetch("http://localhost:5000/tasks", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(task)
    });
    closeAddTaskModal();
    loadTasks();
  } catch (err) { alert("Failed to add task 🌸"); }
  isSubmittingTask = false;
}

// --- RENDER TASKS (MAIN) ---
function getPriority(dateString) {
  if (!dateString) return "medium";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dateString);
  due.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return "high";
  if (diffDays <= 2) return "high";
  if (diffDays <= 7) return "medium";
  return "low";
}

function renderTasks() {
  const searchQuery = document.getElementById("searchInput")?.value.trim().toLowerCase() || "";
  const filterStatus = document.getElementById("filterStatus")?.value || "all";
  const filterCategory = document.getElementById("filterCategory")?.value || "all";
  const filterPriority = document.getElementById("filterPriority")?.value || "all";
  
  const overdueList = document.getElementById("overdueTasks");
  const todayList = document.getElementById("todayTasks");
  const upcomingList = document.getElementById("upcomingTasks");
  const overdueColumn = document.getElementById("overdueColumn");
  const noTasksMessage = document.getElementById("noTasksMessage");

  if(overdueList) overdueList.innerHTML = "";
  if(todayList) todayList.innerHTML = "";
  if(upcomingList) upcomingList.innerHTML = "";

  let counts = { overdue: 0, today: 0, upcoming: 0 };

  tasks.forEach(task => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(task.dueDate);
    due.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const priority = getPriority(task.dueDate);

    if (searchQuery && !(task.title || "").toLowerCase().includes(searchQuery)) return;
    if (filterStatus === "active" && task.completed) return;
    if (filterStatus === "completed" && !task.completed) return;
    if (filterCategory !== "all" && task.category !== filterCategory) return;
    if (filterPriority !== "all" && priority !== filterPriority) return;

    if (task.completed) {
      if (!task.completedAt) return; // Hide immediately if no timestamp
      const completedTime = new Date(task.completedAt).getTime();
      if (new Date().getTime() - completedTime > 15 * 60 * 1000) {
        return; // Hide completed tasks older than 15 mins from grid
      }
    }

    const div = document.createElement("div");
    div.className = `task ${task.completed ? 'completed' : ''}`;
    div.style.cursor = "pointer";
    div.onclick = (e) => {
      // prevent side panel if clicking checkbox
      if(!e.target.closest('button')) openTaskDetails(task._id);
    };

    div.innerHTML = `
      <div class="priority-dot dot-${priority}"></div>
      <div style="flex:1;">
        <strong>${task.title}</strong>
        ${task.description ? `<p style="font-size:13px; color:var(--text-muted); margin-bottom:8px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${task.description}</p>` : ""}
        <div style="margin-top: 8px;">
          ${task.category ? `<span class="category-badge">${task.category}</span>` : ""}
          <small>Due: ${task.dueDate}</small>
        </div>
      </div>
      <div class="buttons" style="margin-left:16px;">
        <button onclick="event.stopPropagation(); toggleComplete('${task._id}')" title="Mark as Done" style="border: 2px solid ${task.completed ? 'var(--primary)' : 'var(--border)'}; background: ${task.completed ? 'var(--primary)' : 'transparent'}; color: ${task.completed ? '#fff' : 'transparent'}; width: 24px; height: 24px; border-radius: 6px; display:flex; align-items:center; justify-content:center; cursor:pointer;">
          <i data-lucide="check" style="width:14px; height:14px; opacity: ${task.completed ? '1' : '0'};"></i>
        </button>
      </div>
    `;

    if (diffDays < 0 && !task.completed) {
      if(overdueList) overdueList.appendChild(div);
      counts.overdue++;
    } else if (diffDays === 0) {
      if(todayList) todayList.appendChild(div);
      counts.today++;
    } else {
      if(upcomingList) upcomingList.appendChild(div);
      counts.upcoming++;
    }
  });

  // Render Routines in Today Column if not completed
  if (typeof routines !== 'undefined' && filterStatus !== "completed") {
    const todayStr = new Date().toISOString().split("T")[0];
    routines.forEach(r => {
      const todayEntry = r.history.find(h => h.date === todayStr) || { status: 'pending' };
      const isCompleted = todayEntry.status === 'completed';
      
      if (searchQuery && !(r.title || "").toLowerCase().includes(searchQuery)) return;
      if (filterCategory !== "all") return; // Routines don't have these categories
      if (filterPriority !== "all") return;
      
      if (!isCompleted) {
        const div = document.createElement("div");
        div.className = `task`;
        div.style.cursor = "pointer";
        div.onclick = (e) => {
          if(!e.target.closest('button')) switchView('routines');
        };
        div.innerHTML = `
          <div class="priority-dot dot-medium"></div>
          <div style="flex:1;">
            <strong>${r.icon} ${r.title}</strong>
            <div style="margin-top: 8px;">
              <span class="category-badge" style="background:var(--bg-main); color:var(--text-muted); border: 1px solid var(--border);">Routine</span>
            </div>
          </div>
          <div class="buttons" style="margin-left:16px;">
            <button onclick="event.stopPropagation(); completeRoutine('${r._id}');" title="Mark as Done" style="border: 2px solid var(--border); background: transparent; color: transparent; width: 24px; height: 24px; border-radius: 6px; display:flex; align-items:center; justify-content:center; cursor:pointer;">
              <i data-lucide="check" style="width:14px; height:14px; opacity: 0;"></i>
            </button>
          </div>
        `;
        if(todayList) todayList.appendChild(div);
        counts.today++;
      }
    });
  }

  const todayColumn = document.getElementById("todayColumn");
  const upcomingColumn = document.getElementById("upcomingColumn");

  if(overdueColumn) overdueColumn.style.display = counts.overdue > 0 ? "block" : "none";
  if(todayColumn) todayColumn.style.display = counts.today > 0 ? "block" : "none";
  if(upcomingColumn) upcomingColumn.style.display = counts.upcoming > 0 ? "block" : "none";

  const totalCounts = counts.overdue + counts.today + counts.upcoming;
  if (noTasksMessage) {
    if (totalCounts === 0) {
      noTasksMessage.style.display = "block";
    } else {
      noTasksMessage.style.display = "none";
    }
  }

  lucide.createIcons();
}

// --- RENDER OVERVIEW (DASHBOARD) ---
function renderOverview() {
  const username = localStorage.getItem("username") || "there";
  const hour = new Date().getHours();
  let timeGreeting = "Good evening";
  if (hour < 12) timeGreeting = "Good morning";
  else if (hour < 18) timeGreeting = "Good afternoon";
  
  const elDashGreeting = document.getElementById("dashGreeting");
  if(elDashGreeting) elDashGreeting.textContent = `${timeGreeting}, ${username}`;

  const dateEl = document.getElementById("dashCurrentDate");
  if(dateEl) {
    const options = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' };
    dateEl.textContent = new Date().toLocaleDateString('en-US', options);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todaysTasks = tasks.filter(t => {
    const due = new Date(t.dueDate);
    due.setHours(0, 0, 0, 0);
    return due.getTime() === today.getTime();
  });

  let todayTotal = todaysTasks.length;
  let todayCompleted = todaysTasks.filter(t => t.completed).length;

  // Add Routines to today's progress
  let routinesTotal = 0;
  let routinesCompleted = 0;
  if (typeof routines !== 'undefined') {
    routinesTotal = routines.length;
    const todayStr = new Date().toISOString().split("T")[0];
    routinesCompleted = routines.filter(r => {
      const entry = r.history.find(h => h.date === todayStr);
      return entry && entry.status === 'completed';
    }).length;
    
    todayTotal += routinesTotal;
    todayCompleted += routinesCompleted;
  }

  const todayLeft = todayTotal - todayCompleted;
  
  const elDashSub = document.getElementById("dashSubGreeting");
  if(elDashSub) elDashSub.textContent = `You have ${todayLeft} tasks/routines left today. Keep going!`;

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const createdToday = tasks.filter(t => { const c = new Date(t.createdAt); c.setHours(0,0,0,0); return c.getTime() === today.getTime(); }).length;
  const createdYesterday = tasks.filter(t => { const c = new Date(t.createdAt); c.setHours(0,0,0,0); return c.getTime() === yesterday.getTime(); }).length;
  const createdDelta = createdToday - createdYesterday;

  const total = tasks.length;
  const completed = tasks.filter(t => t.completed).length;
  const pending = total - completed;
  const overdueCount = tasks.filter(t => {
    const due = new Date(t.dueDate);
    due.setHours(0,0,0,0);
    return due.getTime() < today.getTime() && !t.completed;
  }).length;

  const pctCompleted = total > 0 ? Math.round((completed / total) * 100) : 0;
  const pctPending = total > 0 ? Math.round((pending / total) * 100) : 0;

  if(document.getElementById("statTotal")) document.getElementById("statTotal").textContent = total;
  if(document.getElementById("statTotalSub")) document.getElementById("statTotalSub").textContent = `${createdDelta >= 0 ? '+' : ''}${createdDelta} from yesterday`;
  
  if(document.getElementById("statCompleted")) document.getElementById("statCompleted").textContent = completed;
  if(document.getElementById("statCompletedSub")) document.getElementById("statCompletedSub").textContent = `${pctCompleted}% of total`;
  
  if(document.getElementById("statPending")) document.getElementById("statPending").textContent = pending;
  if(document.getElementById("statPendingSub")) document.getElementById("statPendingSub").textContent = `${pctPending}% of total`;
  
  if(document.getElementById("statOverdue")) document.getElementById("statOverdue").textContent = overdueCount;

  // Today's Progress Bar
  let progressPct = 0;
  if (todayTotal > 0) progressPct = Math.round((todayCompleted / todayTotal) * 100);
  
  if(document.getElementById("dashProgressFill")) document.getElementById("dashProgressFill").style.width = `${progressPct}%`;
  if(document.getElementById("dashProgressPct")) document.getElementById("dashProgressPct").textContent = `${progressPct}%`;
  if(document.getElementById("dashProgressText")) document.getElementById("dashProgressText").textContent = `${todayCompleted} of ${todayTotal} tasks completed`;
  
  let motivational = "You're doing great!";
  if (progressPct === 100 && todayTotal > 0) motivational = "Incredible work today!";
  else if (progressPct >= 75) motivational = "You're almost there.";
  else if (progressPct >= 50) motivational = "Halfway done, keep pushing!";
  
  if(document.getElementById("dashMotivational")) document.getElementById("dashMotivational").textContent = motivational;

  // Render Daily Routines Card
  const dashRoutineTitle = document.getElementById("dashRoutineTitle");
  const dashRoutineSubtext = document.getElementById("dashRoutineSubtext");
  
  if (dashRoutineTitle && dashRoutineSubtext) {
    if (routinesTotal === 0) {
      dashRoutineTitle.textContent = "No routines set yet.";
      dashRoutineSubtext.textContent = "Go to the Daily Routines tab to create some habits!";
    } else if (routinesCompleted === routinesTotal) {
      dashRoutineTitle.textContent = `${routinesCompleted} of ${routinesTotal} routines completed!`;
      dashRoutineSubtext.textContent = "Great job! You've finished all your habits for today. 🎉";
    } else {
      dashRoutineTitle.textContent = `${routinesCompleted} routine${routinesCompleted !== 1 ? 's' : ''} completed.`;
      dashRoutineSubtext.textContent = "Hurry up to complete the other ones!";
    }
  }

  // Render Mini Upcoming Tasks
  const upcomingWidget = document.getElementById("widgetUpcomingTasks");
  const upcomingViewAll = document.getElementById("upcomingViewAllBtn");
  if(upcomingWidget) {
    upcomingWidget.innerHTML = "";
    const upcoming = tasks.filter(t => {
      const due = new Date(t.dueDate);
      due.setHours(0,0,0,0);
      return due.getTime() >= today.getTime() && !t.completed;
    });

    if (upcomingViewAll) {
      upcomingViewAll.style.display = upcoming.length > 2 ? "inline" : "none";
    }

    if (upcoming.length === 0) {
      upcomingWidget.innerHTML = `<p style="color:var(--text-muted); font-size:14px; text-align:center; margin-top:10px;">No tasks</p>`;
    } else {
      upcoming.slice(0, 2).forEach(t => {
        upcomingWidget.innerHTML += `
          <div onclick="switchView('tasks'); openTaskDetails('${t._id}');" style="display:flex; justify-content:space-between; align-items:center; background:var(--input-bg); padding:12px; border-radius:12px; cursor:pointer;">
            <div style="display:flex; align-items:center; gap:12px;">
              <div>
                <span style="display:block; font-size:14px; font-weight:500;">${t.title}</span>
                <span style="font-size:12px; color:var(--text-muted);">${new Date(t.dueDate).toLocaleDateString('en-US', {month:'short', day:'numeric'})}</span>
              </div>
            </div>
            <span class="category-badge" style="background:var(--bg-main); color:var(--primary); margin:0;">${getPriority(t.dueDate)}</span>
          </div>
        `;
      });
    }
  }

  // Render inline today tasks
  const dashToday = document.getElementById("dashTodayTasks");
  if(dashToday) {
    dashToday.innerHTML = "";
    const visibleTodayTasks = todaysTasks.filter(task => {
      if (task.completed) {
        if (!task.completedAt) return false;
        const completedTime = new Date(task.completedAt).getTime();
        return (new Date().getTime() - completedTime <= 15 * 60 * 1000);
      }
      return true;
    });
    visibleTodayTasks.slice(0,3).forEach(task => {
      dashToday.innerHTML += `
        <div class="task ${task.completed?'completed':''}" style="padding:16px;" onclick="openTaskDetails('${task._id}')">
          <div class="priority-dot dot-${getPriority(task.dueDate)}"></div>
          <div style="display:flex; align-items:center; gap:16px;">
            <button onclick="event.stopPropagation(); toggleComplete('${task._id}')" style="border: 2px solid ${task.completed ? 'var(--primary)' : 'var(--border)'}; background: ${task.completed ? 'var(--primary)' : 'transparent'}; color: ${task.completed ? '#fff' : 'transparent'}; width: 24px; height: 24px; border-radius: 6px; display:flex; align-items:center; justify-content:center; cursor:pointer;">
              <i data-lucide="check" style="width:14px; height:14px; opacity: ${task.completed ? '1' : '0'};"></i>
            </button>
            <div>
              <strong>${task.title}</strong>
              <small>${task.description || "No description"}</small>
            </div>
          </div>
        </div>
      `;
    });
  }

  lucide.createIcons();
}

// --- TASK DETAILS SIDE PANEL ---
function openTaskDetails(id) {
  const task = tasks.find(t => t._id === id);
  if(!task) return;
  document.getElementById("panelTitle").textContent = task.title;
  document.getElementById("panelDesc").textContent = task.description || "No description provided.";
  document.getElementById("panelPriority").textContent = getPriority(task.dueDate).toUpperCase();
  document.getElementById("panelCategory").textContent = task.category || "General";
  document.getElementById("panelDue").textContent = new Date(task.dueDate).toLocaleDateString("en-US", { day: 'numeric', month: 'short', year: 'numeric' });
  document.getElementById("panelCreated").textContent = new Date(task.createdAt).toLocaleDateString("en-US", { day: 'numeric', month: 'short', year: 'numeric' });
  
  document.getElementById("panelEditBtn").onclick = () => editTask(id);
  document.getElementById("panelDeleteBtn").onclick = () => { deleteTask(id); closeTaskDetails(); };
  
  document.getElementById("panelFocusBtn").onclick = () => {
    closeTaskDetails();
    startFocusSession(id);
  };

  document.getElementById("taskDetailsOverlay").style.display = "block";
  setTimeout(() => {
    document.getElementById("taskDetailsPanel").style.right = "0";
  }, 10);
}

function closeTaskDetails() {
  document.getElementById("taskDetailsPanel").style.right = "-450px";
  setTimeout(() => {
    document.getElementById("taskDetailsOverlay").style.display = "none";
  }, 300);
}

// --- ROUTINES LOGIC ---
let routines = [];

async function loadRoutines() {
  const userId = localStorage.getItem("userId");
  if (!userId) return;
  try {
    const res = await fetch(`http://localhost:5000/routines?userId=${userId}`);
    if (res.ok) {
      routines = await res.json();
      renderRoutines();
      renderTasks();
      renderOverview();
    }
  } catch (err) { console.error("Failed to load routines", err); }
}

function renderRoutines() {
  const list = document.getElementById("routinesList");
  if (!list) return;
  list.innerHTML = "";
  
  if (routines.length === 0) {
    list.innerHTML = `<p style="color:var(--text-muted); text-align:center; margin-top:20px;">No routines added yet. Click "+ New Routine" to start building habits!</p>`;
    document.getElementById("routinesProgressText").textContent = `0/0`;
    document.getElementById("routinesProgressBar").style.width = `0%`;
    document.getElementById("routinesProgressMsg").textContent = `You've completed 0 of your 0 routines today!`;
    return;
  }
  
  const today = new Date().toISOString().split("T")[0];
  let completedToday = 0;
  
  routines.forEach(r => {
    const todayEntry = r.history.find(h => h.date === today) || { status: 'pending' };
    const isCompleted = todayEntry.status === 'completed';
    const isMissed = todayEntry.status === 'missed';
    
    if (isCompleted) completedToday++;
    
    let statusText = 'Pending';
    let statusColor = 'var(--text-muted)';
    let btnHtml = `<button onclick="completeRoutine('${r._id}')" style="background:transparent; color:var(--text-muted); border:1px solid var(--border); padding:6px 10px; border-radius:8px; cursor:pointer; display:flex; align-items:center; justify-content:center;" title="Mark done"><i data-lucide="check" style="width:16px; height:16px;"></i></button>`;
    
    if (isCompleted) {
      statusText = 'Completed';
      statusColor = 'var(--primary)';
      btnHtml = `<span style="color:var(--primary); font-weight:600; font-size:13px;"><i data-lucide="check" style="width:14px; margin-right:4px;"></i> Completed</span>`;
    } else if (isMissed) {
      statusText = 'Missed';
      statusColor = '#ef4444';
      btnHtml = `<span style="color:#ef4444; font-weight:600; font-size:13px;">Missed</span>`;
    }
    
    list.innerHTML += `
      <div class="task" style="position:relative; flex-direction:column; justify-content:space-between; display:flex; background:var(--card-bg); padding:24px; border-radius:20px; border:none; box-shadow:0 4px 24px rgba(0,0,0,0.04);">
        <div style="display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:16px;">
          <div style="font-size:32px; width:56px; height:56px; background:var(--bg-main); border-radius:14px; display:flex; align-items:center; justify-content:center;">${r.icon}</div>
          <button onclick="deleteRoutine('${r._id}')" style="background:transparent; color:#ef4444; border:none; cursor:pointer; width:auto; height:auto; padding:8px;" title="Delete Routine"><i data-lucide="trash-2" style="width:18px; height:18px;"></i></button>
        </div>
        <div>
          <h4 style="font-size:18px; font-weight:700; margin-bottom:8px; color:var(--text-main);">${r.title}</h4>
          <div style="display:flex; flex-direction:column; gap:6px; font-size:13px; color:var(--text-muted); margin-bottom:20px;">
            <span style="font-weight:600;"><i data-lucide="flame" style="width:14px; margin-right:4px; vertical-align:middle; color:#ea580c;"></i> ${r.currentStreak}-day streak</span>
            <span>Status: <span style="color:${statusColor}; font-weight:700;">${statusText}</span></span>
          </div>
        </div>
        <div style="margin-top:auto; display:flex; justify-content:flex-end;">
          ${btnHtml}
        </div>
      </div>
    `;
  });
  
  const pct = Math.round((completedToday / routines.length) * 100) || 0;
  document.getElementById("routinesProgressText").textContent = `${completedToday}/${routines.length}`;
  document.getElementById("routinesProgressBar").style.width = `${pct}%`;
  document.getElementById("routinesProgressMsg").textContent = `You've completed ${completedToday} of your ${routines.length} routines today!`;
  
  lucide.createIcons();
}

function openAddRoutineModal() {
  document.getElementById("routineTitle").value = "";
  document.getElementById("routineIcon").value = "💧";
  document.getElementById("addRoutineModal").style.display = "flex";
}

function closeAddRoutineModal() {
  document.getElementById("addRoutineModal").style.display = "none";
}

let isSubmittingRoutine = false;
async function submitRoutine() {
  if (isSubmittingRoutine) return;
  const title = document.getElementById("routineTitle").value.trim();
  const icon = document.getElementById("routineIcon").value.trim();
  const userId = localStorage.getItem("userId");
  
  if (!title) return alert("Please enter a routine name!");
  
  isSubmittingRoutine = true;
  try {
    await fetch("http://localhost:5000/routines", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, title, icon: icon || '💧' })
    });
    closeAddRoutineModal();
    loadRoutines();
  } catch (err) { alert("Error adding routine."); }
  finally { isSubmittingRoutine = false; }
}

async function completeRoutine(id) {
  try {
    await fetch(`http://localhost:5000/routines/${id}/complete`, {
      method: "PUT"
    });
    loadRoutines();
  } catch (err) { alert("Error completing routine."); }
}

async function deleteRoutine(id) {
  if (!confirm("Are you sure you want to delete this routine? This will delete all its history.")) return;
  try {
    await fetch(`http://localhost:5000/routines/${id}`, {
      method: "DELETE"
    });
    loadRoutines();
  } catch (err) { alert("Error deleting routine."); }
}

// --- API ACTIONS ---
async function toggleComplete(id) {
  const task = tasks.find(t => t._id === id);
  try {
    await fetch(`http://localhost:5000/tasks/${id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        completed: !task.completed,
        completedAt: !task.completed ? new Date().toISOString() : null
      })
    });
    loadTasks();
  } catch (err) { console.error(err); }
}

async function editTask(id) {
  const task = tasks.find(t => t._id === id);
  const newTitle = prompt("Edit Task Title:", task.title);
  if (newTitle === null) return;
  const newDesc = prompt("Edit Task Description:", task.description || "");
  try {
    await fetch(`http://localhost:5000/tasks/${id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTitle.trim(), description: newDesc.trim() })
    });
    closeTaskDetails();
    loadTasks();
  } catch (err) { console.error(err); }
}

async function deleteTask(id) {
  if (!confirm("Delete this task? 🌸")) return;
  try {
    await fetch(`http://localhost:5000/tasks/${id}`, { method: "DELETE" });
    loadTasks();
  } catch (err) { console.error(err); }
}

// --- CALENDAR LOGIC ---
let currentMonth = new Date();
function changeMonth(delta) {
  currentMonth.setMonth(currentMonth.getMonth() + delta);
  renderCalendar();
}
function renderCalendar() {
  const title = document.getElementById("calendarMonthTitle");
  const daysContainer = document.getElementById("calendarDays");
  if (!title || !daysContainer) return;

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  title.textContent = currentMonth.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  daysContainer.innerHTML = "";

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  let blankDays = firstDay - 1;
  if (blankDays === -1) blankDays = 6;
  
  for (let i = 0; i < blankDays; i++) daysContainer.innerHTML += `<div class="cal-day empty"></div>`;
  
  const today = new Date();
  for (let d = 1; d <= daysInMonth; d++) {
    const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === d;
    const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const dayTasks = tasks.filter(t => t.dueDate === dateStr && !t.completed);
    
    let dotsHtml = `<div class="cal-dots">`;
    const numDots = Math.min(dayTasks.length, 3);
    for (let i=0; i<numDots; i++) dotsHtml += `<div class="cal-dot"></div>`;
    dotsHtml += `</div>`;
    daysContainer.innerHTML += `<div class="cal-day ${isToday ? 'today' : ''}">${d}${dotsHtml}</div>`;
  }
}

// --- INITIALIZATION & GLOBAL LISTENERS ---
const dailyThoughts = ["Discipline is the bridge between goals and success.", "Small steps every day lead to big changes.", "Focus on being productive instead of busy.", "Don't wait. The time will never be just right."];
function updateDailyThought() {
  const textEl = document.getElementById("dailyThoughtText");
  if(textEl) textEl.innerHTML = `"${dailyThoughts[new Date().getDay() % dailyThoughts.length]}"<br><span style="font-weight:600; font-style:normal; margin-top:8px; display:inline-block; color:var(--text-main);">— DailyDots</span>`;
}



document.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
    if (e.key === 'Escape') { e.target.blur(); document.getElementById('shortcutsHelp').style.display = 'none'; closeAddRoutineModal(); closeTaskDetails(); }
    return;
  }
  if (e.key === 'Escape') { document.getElementById('shortcutsHelp').style.display = 'none'; closeAddRoutineModal(); closeTaskDetails(); }
  else if (e.key.toLowerCase() === 'n') { e.preventDefault(); switchView('tasks'); document.getElementById("taskInput")?.focus(); }
  else if (e.key === '/') { e.preventDefault(); switchView('tasks'); document.getElementById("globalSearchInput")?.focus(); }
  else if (e.key.toLowerCase() === 'o') { switchView('overview'); }
  else if (e.key.toLowerCase() === 't') { switchView('tasks'); }
});

// --- CALENDAR LOGIC ---
let calDate = new Date();
const southIndianHolidays = {
  "01-01": "New Year's Day",
  "01-14": "Bhogi",
  "01-15": "Pongal / Makar Sankranti",
  "01-16": "Thiruvalluvar Day / Mattu Pongal",
  "01-17": "Uzhavar Thirunal",
  "01-26": "Republic Day",
  "04-14": "Tamil New Year / Vishu",
  "05-01": "May Day",
  "08-15": "Independence Day",
  "08-25": "Onam (Varies, approx)",
  "09-06": "Krishna Jayanthi (Varies, approx)",
  "09-15": "Milad-un-Nabi",
  "10-02": "Gandhi Jayanti",
  "10-21": "Ayudha Pooja",
  "10-22": "Vijaya Dasami",
  "10-31": "Diwali",
  "12-25": "Christmas"
};

function changeCalendarMonth(delta) {
  calDate.setMonth(calDate.getMonth() + delta);
  renderFullCalendar();
}

function renderFullCalendar() {
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const year = calDate.getFullYear();
  const month = calDate.getMonth();
  document.getElementById("calendarMonthYear").textContent = `${monthNames[month]} ${year}`;
  
  const grid = document.getElementById("fullCalendarGrid");
  if(!grid) return;
  grid.innerHTML = "";
  
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();
  
  let dateHtml = "";
  
  // Previous month days
  for(let i = firstDay - 1; i >= 0; i--) {
    dateHtml += `<div class="calendar-day-cell other-month"><div class="calendar-date">${daysInPrevMonth - i}</div></div>`;
  }
  
  const today = new Date();
  
  // Current month days
  for(let i = 1; i <= daysInMonth; i++) {
    const isToday = (i === today.getDate() && month === today.getMonth() && year === today.getFullYear());
    const mStr = String(month+1).padStart(2, '0');
    const dStr = String(i).padStart(2, '0');
    const fullDateStr = `${year}-${mStr}-${dStr}`;
    const mdStr = `${mStr}-${dStr}`;
    
    let eventsHtml = "";
    
    // Check for holiday
    if(southIndianHolidays[mdStr]) {
      eventsHtml += `<div class="calendar-event calendar-holiday" title="${southIndianHolidays[mdStr]}">${southIndianHolidays[mdStr]}</div>`;
    }
    
    // Check for tasks
    const dayTasks = tasks.filter(t => t.dueDate === fullDateStr);
    if (dayTasks.length > 0) {
      eventsHtml += `<div class="calendar-event calendar-task-due">${dayTasks.length} task${dayTasks.length > 1 ? 's' : ''}</div>`;
    }
    
    dateHtml += `
      <div class="calendar-day-cell ${isToday ? 'today' : ''}" onclick="switchView('tasks')">
        <div class="calendar-date">${i}</div>
        <div style="flex:1; display:flex; flex-direction:column; gap:2px; overflow-y:auto;">
          ${eventsHtml}
        </div>
      </div>
    `;
  }
  
  // Next month filler
  const totalCells = firstDay + daysInMonth;
  const nextDays = (totalCells > 35) ? 42 - totalCells : 35 - totalCells;
  for(let i = 1; i <= nextDays; i++) {
    dateHtml += `<div class="calendar-day-cell other-month"><div class="calendar-date">${i}</div></div>`;
  }
  
  grid.innerHTML = dateHtml;
}

// --- ANALYTICS LOGIC ---
let chartTasks, chartRoutines;

function renderAnalytics() {
  if (typeof Chart === 'undefined') {
    console.error("Chart.js not loaded.");
    return;
  }
  
  const last7Days = [];
  const today = new Date();
  for(let i = 6; i >= 0; i--) {
    let d = new Date(today);
    d.setDate(today.getDate() - i);
    last7Days.push(d.toISOString().split("T")[0]);
  }
  const labels = last7Days.map(d => {
    const obj = new Date(d);
    return `${obj.getDate()} ${obj.toLocaleString('default', { month: 'short' })}`;
  });
  
  // Tasks Data: Completed per day
  const tasksData = last7Days.map(dateStr => {
    return tasks.filter(t => {
      if (!t.completed || !t.completedAt) return false;
      return t.completedAt.startsWith(dateStr);
    }).length;
  });
  
  // Routines Data: Met per day
  const routinesData = last7Days.map(dateStr => {
    if(!routines) return 0;
    return routines.filter(r => {
      const entry = r.history.find(h => h.date === dateStr);
      return entry && entry.status === 'completed';
    }).length;
  });
  
  const ctxTasks = document.getElementById('tasksChart');
  const ctxRoutines = document.getElementById('routinesChart');
  
  if(chartTasks) chartTasks.destroy();
  if(chartRoutines) chartRoutines.destroy();
  
  chartTasks = new Chart(ctxTasks, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Tasks Completed',
        data: tasksData,
        borderColor: '#5c2326',
        backgroundColor: 'rgba(92, 35, 38, 0.1)',
        tension: 0.3,
        fill: true
      }]
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }
  });
  
  chartRoutines = new Chart(ctxRoutines, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Routines Met',
        data: routinesData,
        backgroundColor: '#8c5a53',
        borderRadius: 4
      }]
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }
  });
}

window.onload = () => {
  if (localStorage.getItem("token")) initApp();
  else { document.getElementById("authPage").style.display = "flex"; document.getElementById("app").style.display = "none"; }
  updateDailyThought();
};