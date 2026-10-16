let tasks = [];
let focusTimer = null;
let focusSecondsLeft = 25 * 60;
let isFocusPaused = true;
let currentFocusTaskId = null;

const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') 
  ? 'http://localhost:5000'
  : 'https://dailydots-g1iy.onrender.com';

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
    const res = await fetch(`${API_BASE}/signup`, {
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
    const res = await fetch(`${API_BASE}/login`, {
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
  switchView("overview");
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
    document.getElementById("overviewView").style.display = "flex";
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
  const profilePopup = document.getElementById("profilePopup");
  if (profilePopup) profilePopup.classList.remove("active");
  
  // Close mobile sidebar if open
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("mobileOverlay");
  if (sidebar && sidebar.classList.contains("mobile-open")) {
    sidebar.classList.remove("mobile-open");
    overlay.classList.remove("active");
  }

  lucide.createIcons();
}

// --- DATA FETCHING ---
async function loadTasks() {
  const userId = localStorage.getItem("userId");
  try {
    const res = await fetch(`${API_BASE}/tasks?userId=${userId}`);
    tasks = await res.json();
    renderTasks();
    renderOverview();
  } catch (err) { console.error("Failed to load tasks", err); }
}

// PROFILE POPUP LOGIC
function toggleProfilePopup() {
  const popup = document.getElementById('profilePopup');
  if (popup) {
    popup.classList.toggle('active');
  }
}

// MOBILE MENU LOGIC
function toggleMobileMenu() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('mobileOverlay');
  if (sidebar && overlay) {
    sidebar.classList.toggle('mobile-open');
    overlay.classList.toggle('active');
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
    const res = await fetch(`${API_BASE}/profile/${userId}`);
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
    await fetch(`${API_BASE}/tasks`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(task)
    });
    input.value = "";
    loadTasks();
  } catch (err) { alert("Failed to add task 🌸"); }
}

// --- ADD / EDIT TASK MODAL LOGIC ---
let editingTaskId = null;

function toDateInputValue(value) {
  if (!value) return "";
  const match = String(value).match(/^(\d{4}-\d{2}-\d{2})/);
  if (match) return match[1];
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function setTaskModalMode(mode) {
  const isEdit = mode === "edit";
  document.getElementById("taskModalHeading").textContent = isEdit ? "Edit Task" : "Add Task";
  document.getElementById("taskModalSubheading").textContent = isEdit ? "Update any of the details below." : "Keep going, you got this!";
  document.getElementById("taskModalSubmitLabel").textContent = isEdit ? "Save Changes" : "Add Task";
}

function openAddTaskModal() {
  editingTaskId = null;
  setTaskModalMode("add");

  const today = new Date();
  const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  
  document.getElementById("modalTaskTitle").value = "";
  const dateInput = document.getElementById("modalTaskDue");
  dateInput.value = dateStr;
  dateInput.min = dateStr; // Restrict past dates

  const catText = document.getElementById("modalTaskCategoryText");
  if(catText) catText.innerText = "💼 Work";
  
  const priText = document.getElementById("modalTaskPriorityText");
  if(priText) priText.innerText = "Medium";

  document.getElementById("modalTaskDesc").value = "";
  document.getElementById("customCategoryList").style.display = "none";
  document.getElementById("customPriorityList").style.display = "none";
  
  document.getElementById("addTaskModal").style.display = "flex";
  document.getElementById("modalTaskTitle").focus();
}

function closeAddTaskModal() {
  document.getElementById("addTaskModal").style.display = "none";
  document.getElementById("customCategoryList").style.display = "none";
  document.getElementById("customPriorityList").style.display = "none";
  editingTaskId = null;
}

let isSubmittingTask = false;
async function submitModalTask() {
  if (isSubmittingTask) return;
  
  const title = document.getElementById("modalTaskTitle").value.trim();
  const dueDate = document.getElementById("modalTaskDue").value;
  const category = document.getElementById("modalTaskCategoryText").innerText.trim();
  const priority = document.getElementById("modalTaskPriorityText").innerText.trim().toLowerCase();
  const description = document.getElementById("modalTaskDesc").value.trim();

  if (!title) {
    alert("Please enter a task title! 🌸");
    return;
  }

  const userId = localStorage.getItem("userId");
  const task = { title, description, category, dueDate, priority };
  const taskId = editingTaskId;

  if (!taskId) {
    task.completed = false;
    task.userId = userId;
  }
  
  isSubmittingTask = true;
  try {
    const res = await fetch(taskId ? `${API_BASE}/tasks/${taskId}` : `${API_BASE}/tasks`, {
      method: taskId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(task)
    });
    if (!res.ok) throw new Error("Save failed");
    closeAddTaskModal();
    await loadTasks();
  } catch (err) {
    alert(taskId ? "Failed to update task 🌸" : "Failed to add task 🌸");
  } finally {
    isSubmittingTask = false;
  }
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

function taskPriority(task) {
  const stored = task && task.priority ? String(task.priority).toLowerCase() : "";
  if (stored === "high" || stored === "medium" || stored === "low") return stored;
  return getPriority(task && task.dueDate);
}

function completedBeforeToday(task) {
  if (!task || !task.completed || !task.completedAt) return false;
  const completedDate = new Date(task.completedAt);
  if (Number.isNaN(completedDate.getTime())) return false;
  completedDate.setHours(0, 0, 0, 0);
  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);
  return completedDate.getTime() < todayDate.getTime();
}

function scheduleEndOfDayRefresh() {
  const now = new Date();
  const nextMidnight = new Date(now);
  nextMidnight.setHours(24, 0, 0, 0);
  const delay = Math.max(nextMidnight.getTime() - now.getTime(), 1000);
  setTimeout(() => {
    renderTasks();
    renderOverview();
    if (document.getElementById("analyticsView")?.style.display === "flex") renderAnalytics();
    scheduleEndOfDayRefresh();
  }, delay);
}

function renderTasks() {
  const searchQuery = document.getElementById("searchInput")?.value.trim().toLowerCase() || "";
  const filterStatus = document.getElementById("filterStatus")?.value || "all";
  const filterCategory = document.getElementById("filterCategory")?.value || "all";
  const filterPriority = document.getElementById("filterPriority")?.value || "all";
  
  const overdueList = document.getElementById("overdueTasks");
  const routineList = document.getElementById("routineTasks");
  const todayList = document.getElementById("todayTasks");
  const upcomingList = document.getElementById("upcomingTasks");
  const completedList = document.getElementById("completedTasks");

  const overdueColumn = document.getElementById("overdueColumn");
  const routineColumn = document.getElementById("routinesColumn");
  const todayColumn = document.getElementById("todayColumn");
  const upcomingColumn = document.getElementById("upcomingColumn");
  const completedColumn = document.getElementById("completedColumn");
  const noTasksMessage = document.getElementById("noTasksMessage");

  if(overdueList) overdueList.innerHTML = "";
  if(routineList) routineList.innerHTML = "";
  if(todayList) todayList.innerHTML = "";
  if(upcomingList) upcomingList.innerHTML = "";
  if(completedList) completedList.innerHTML = "";

  let counts = { overdue: 0, routines: 0, today: 0, upcoming: 0, completed: 0 };

  tasks.forEach(task => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(task.dueDate);
    due.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const priority = taskPriority(task);

    if (searchQuery && !(task.title || "").toLowerCase().includes(searchQuery)) return;
    if (filterStatus === "active" && task.completed) return;
    if (filterStatus === "completed" && !task.completed) return;
    if (filterCategory !== "all" && task.category !== filterCategory) return;
    if (filterPriority !== "all" && priority !== filterPriority) return;

    if (completedBeforeToday(task)) return;

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
        <button class="complete-btn ${task.completed ? 'done' : ''}" onclick="event.stopPropagation(); toggleComplete('${task._id}')" title="${task.completed ? 'Completed' : 'Mark as Done'}">
          ${task.completed ? '<i data-lucide="check"></i>' : ''}
        </button>
      </div>
    `;

    if (filterStatus === "completed") {
      if(completedList) completedList.appendChild(div);
      counts.completed++;
    } else if (diffDays < 0) {
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

  // Render Routines in Routines Column if not completed
  if (typeof routines !== 'undefined' && filterStatus !== "completed") {
    const todayStr = new Date().toISOString().split("T")[0];
    routines.forEach(r => {
      const todayEntry = r.history.find(h => h.date === todayStr) || { status: 'pending' };
      const isCompleted = todayEntry.status === 'completed';
      
      if (searchQuery && !(r.title || "").toLowerCase().includes(searchQuery)) return;
      if (filterCategory !== "all" && r.category !== filterCategory) return;
      if (filterPriority !== "all") return;
      
      const div = document.createElement("div");
      div.className = `task ${isCompleted ? 'completed' : ''}`;
      div.style.cursor = "pointer";
      div.onclick = (e) => {
        if(!e.target.closest('button')) switchView('routines');
      };
      div.innerHTML = `
        <div style="flex:1;">
          <strong>${r.icon} ${r.title}</strong>
          <div style="margin-top: 8px;">
            <span class="category-badge" style="background:var(--bg-main); color:var(--text-muted); border: 1px solid var(--border);">Routine</span>
            ${r.category ? `<span class="category-badge">${r.category}</span>` : ""}
          </div>
        </div>
        <div class="buttons" style="margin-left:16px;">
          <button class="complete-btn ${isCompleted ? 'done' : ''}" onclick="event.stopPropagation(); ${isCompleted ? '' : `completeRoutine('${r._id}');`}" title="${isCompleted ? 'Completed' : 'Mark as Done'}">
            ${isCompleted ? '<i data-lucide="check"></i>' : ''}
          </button>
        </div>
      `;
      if(routineList) routineList.appendChild(div);
      counts.routines++;
    });
  }

  if(overdueColumn) overdueColumn.style.display = counts.overdue > 0 ? "block" : "none";
  if(routineColumn) routineColumn.style.display = counts.routines > 0 ? "block" : "none";
  if(todayColumn) todayColumn.style.display = counts.today > 0 ? "block" : "none";
  if(upcomingColumn) upcomingColumn.style.display = counts.upcoming > 0 ? "block" : "none";
  if(completedColumn) completedColumn.style.display = counts.completed > 0 ? "block" : "none";

  const totalCounts = counts.overdue + counts.routines + counts.today + counts.upcoming + counts.completed;
  if (noTasksMessage) {
    if (totalCounts === 0) {
      if (tasks.length === 0) {
        noTasksMessage.innerHTML = `
          <p style="font-size:24px; color:var(--text-muted); font-weight:600;">Welcome!</p>
          <p style="font-size:15px; color:var(--text-muted); margin-top:8px;">Add your first task to get started.</p>
        `;
      } else {
        noTasksMessage.innerHTML = `
          <p style="font-size:24px; color:var(--text-muted); font-weight:600;">You're all caught up!</p>
          <p style="font-size:15px; color:var(--text-muted); margin-top:8px;">Enjoy your free time or add a new task.</p>
        `;
      }
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

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = localDateKey(today);
  const routineList = typeof routines !== "undefined" ? routines : [];

  const homeDate = document.getElementById("homeDate");
  if (homeDate) {
    homeDate.textContent = today.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  }

  const overdueTasks = tasks.filter(t => !t.completed && dueDay(t) && dueDay(t) < todayStr);
  const dueTodayTasks = tasks.filter(t => dueDay(t) === todayStr);
  const openToday = overdueTasks.length + dueTodayTasks.filter(t => !t.completed).length + routineList.filter(r => !routineDoneOn(r, todayStr)).length;
  const doneCount = dueTodayTasks.filter(t => t.completed).length + routineList.filter(r => routineDoneOn(r, todayStr)).length;
  const totalToday = overdueTasks.length + dueTodayTasks.length + routineList.length;
  const progressPct = totalToday ? Math.round((doneCount / totalToday) * 100) : 0;

  const elDashSub = document.getElementById("dashSubGreeting");
  if (elDashSub) {
    if (totalToday === 0) elDashSub.textContent = "Nothing on the list today.";
    else if (openToday === 0) elDashSub.textContent = "Today's list is finished.";
    else elDashSub.textContent = `${openToday} left to finish today.`;
  }

  const progressLabel = document.getElementById("homeProgressLabel");
  const progressPctEl = document.getElementById("homeProgressPct");
  const progressFill = document.getElementById("homeProgressFill");
  if (progressLabel) progressLabel.textContent = totalToday ? `${doneCount} of ${totalToday} done` : "No items for today";
  if (progressPctEl) progressPctEl.textContent = `${progressPct}%`;
  if (progressFill) progressFill.style.width = `${progressPct}%`;

  const todayList = document.getElementById("homeTodayList");
  const todayCount = document.getElementById("homeTodayCount");
  if (todayList) {
    if (todayCount) todayCount.textContent = totalToday ? `${openToday} open` : "";

    const taskRow = (task, label) => `
      <div class="home-row ${task.completed ? "done" : ""}" onclick="openTaskDetails('${task._id}')">
        <button type="button" class="complete-btn ${task.completed ? "done" : ""}" onclick="event.stopPropagation(); toggleComplete('${task._id}')" title="${task.completed ? "Completed" : "Mark as Done"}">${task.completed ? '<i data-lucide="check"></i>' : ""}</button>
        <div class="home-row-copy">
          <strong>${escapeInsightText(task.title)}</strong>
          <small>${escapeInsightText(label)}</small>
        </div>
      </div>`;
    const routineRow = (routine) => {
      const done = routineDoneOn(routine, todayStr);
      return `
        <div class="home-row ${done ? "done" : ""}" onclick="switchView('routines')">
          <button type="button" class="complete-btn ${done ? "done" : ""}" onclick="event.stopPropagation(); ${done ? "" : `completeRoutine('${routine._id}')`}" title="${done ? "Completed" : "Mark as Done"}">${done ? '<i data-lucide="check"></i>' : ""}</button>
          <div class="home-row-copy">
            <strong>${escapeInsightText(`${routine.icon || ""} ${routine.title}`.trim())}</strong>
            <small>Routine</small>
          </div>
        </div>`;
    };

    let html = "";
    if (overdueTasks.length) {
      html += `<div class="home-group-label">Overdue</div>`;
      overdueTasks.forEach(task => { html += taskRow(task, "Overdue"); });
    }
    const openDue = dueTodayTasks.filter(t => !t.completed);
    const openRoutines = routineList.filter(r => !routineDoneOn(r, todayStr));
    if (openDue.length || openRoutines.length) {
      if (overdueTasks.length) html += `<div class="home-group-label">Due today</div>`;
      openDue.forEach(task => { html += taskRow(task, task.category || "Task"); });
      openRoutines.forEach(routine => { html += routineRow(routine); });
    }
    const doneDue = dueTodayTasks.filter(t => t.completed);
    const doneRoutines = routineList.filter(r => routineDoneOn(r, todayStr));
    if (doneDue.length || doneRoutines.length) {
      html += `<div class="home-group-label">Done</div>`;
      doneDue.forEach(task => { html += taskRow(task, task.category || "Task"); });
      doneRoutines.forEach(routine => { html += routineRow(routine); });
    }
    todayList.innerHTML = html || `<div class="home-empty-box"><p class="home-empty">Nothing planned for today.</p></div>`;
  }

  const upcomingList = document.getElementById("homeUpcomingList");
  if (upcomingList) {
    const upcoming = tasks
      .filter(t => !t.completed && dueDay(t) && dueDay(t) > todayStr)
      .sort((a, b) => dueDay(a).localeCompare(dueDay(b)))
      .slice(0, 5);
    if (upcoming.length === 0) {
      upcomingList.innerHTML = `<div class="home-empty-box"><p class="home-empty">Nothing after today.</p></div>`;
    } else {
      upcomingList.innerHTML = upcoming.map(task => {
        const [year, month, day] = dueDay(task).split("-").map(Number);
        const when = new Date(year, month - 1, day).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
        return `<div class="home-row" onclick="openTaskDetails('${task._id}')">
          <div class="home-row-copy">
            <strong>${escapeInsightText(task.title)}</strong>
            <small>${escapeInsightText(task.category || "Task")}</small>
          </div>
          <span class="home-date-chip">${escapeInsightText(when)}</span>
        </div>`;
      }).join("");
    }
  }

  lucide.createIcons();
}

// --- TASK DETAILS SIDE PANEL ---
function openTaskDetails(id) {
  const task = tasks.find(t => t._id === id);
  if(!task) return;
  document.getElementById("panelTitle").textContent = task.title;
  document.getElementById("panelDesc").textContent = task.description || "No description provided.";
  document.getElementById("panelPriority").textContent = taskPriority(task).toUpperCase();
  document.getElementById("panelCategory").textContent = task.category || "General";
  document.getElementById("panelDue").textContent = new Date(task.dueDate).toLocaleDateString("en-US", { day: 'numeric', month: 'short', year: 'numeric' });
  document.getElementById("panelCreated").textContent = new Date(task.createdAt).toLocaleDateString("en-US", { day: 'numeric', month: 'short', year: 'numeric' });
  
  document.getElementById("panelEditBtn").onclick = () => editTask(id);
  document.getElementById("panelDeleteBtn").onclick = () => { deleteTask(id); closeTaskDetails(); };
  
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
    const res = await fetch(`${API_BASE}/routines?userId=${userId}`);
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
    list.innerHTML = `<div style="grid-column: 1 / -1; text-align:center; padding:50px 20px;">
      <p style="font-size:24px; color:var(--text-muted); font-weight:600;">Ready to set some daily goals?</p>
    </div>`;
    document.getElementById("routinesProgressText").textContent = `0/0`;
    document.getElementById("routinesProgressBar").style.width = `0%`;
    document.getElementById("routinesProgressMsg").textContent = `Ready to set some daily goals?`;
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
          <div style="margin-bottom:12px;">
            <span class="category-badge">${r.category || "🏠 Personal"}</span>
          </div>
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
  document.getElementById("routineTitle").focus();
}

function closeAddRoutineModal() {
  document.getElementById("addRoutineModal").style.display = "none";
}

let isSubmittingRoutine = false;
async function submitRoutine() {
  if (isSubmittingRoutine) return;
  const title = document.getElementById("routineTitle").value.trim();
  const icon = document.getElementById("routineIcon").value.trim();
  const category = document.getElementById("routineCategory") ? document.getElementById("routineCategory").value : "🏠 Personal";
  const userId = localStorage.getItem("userId");
  
  if (!title) return alert("Please enter a routine name!");
  
  isSubmittingRoutine = true;
  try {
    await fetch(`${API_BASE}/routines`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, title, icon: icon || '💧', category })
    });
    closeAddRoutineModal();
    loadRoutines();
  } catch (err) { alert("Error adding routine."); }
  finally { isSubmittingRoutine = false; }
}

async function completeRoutine(id) {
  try {
    await fetch(`${API_BASE}/routines/${id}/complete`, {
      method: "PUT"
    });
    loadRoutines();
  } catch (err) { alert("Error completing routine."); }
}

async function deleteRoutine(id) {
  if (!confirm("Are you sure you want to delete this routine? This will delete all its history.")) return;
  try {
    await fetch(`${API_BASE}/routines/${id}`, {
      method: "DELETE"
    });
    loadRoutines();
  } catch (err) { alert("Error deleting routine."); }
}

// --- API ACTIONS ---
async function toggleComplete(id) {
  const task = tasks.find(t => t._id === id);
  if (!task) return;
  const completed = !task.completed;
  const previousCompleted = task.completed;
  const previousCompletedAt = task.completedAt;
  task.completed = completed;
  task.completedAt = completed ? new Date().toISOString() : null;
  renderTasks();
  renderOverview();
  try {
    const res = await fetch(`${API_BASE}/tasks/${id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        completed,
        completedAt: task.completedAt
      })
    });
    if (!res.ok) throw new Error("Update failed");
    loadTasks();
  } catch (err) {
    task.completed = previousCompleted;
    task.completedAt = previousCompletedAt;
    renderTasks();
    renderOverview();
    console.error(err);
  }
}

function editTask(id) {
  const task = tasks.find(t => t._id === id);
  if (!task) return;

  editingTaskId = id;
  setTaskModalMode("edit");

  document.getElementById("modalTaskTitle").value = task.title || "";
  const dateInput = document.getElementById("modalTaskDue");
  dateInput.value = toDateInputValue(task.dueDate);
  dateInput.removeAttribute("min");

  const catText = document.getElementById("modalTaskCategoryText");
  if (catText) catText.innerText = task.category || "💼 Work";

  const priText = document.getElementById("modalTaskPriorityText");
  if (priText) {
    const priority = taskPriority(task);
    priText.innerText = priority.charAt(0).toUpperCase() + priority.slice(1);
  }

  document.getElementById("modalTaskDesc").value = task.description || "";
  document.getElementById("customCategoryList").style.display = "none";
  document.getElementById("customPriorityList").style.display = "none";

  document.getElementById("taskDetailsPanel").style.right = "-450px";
  document.getElementById("taskDetailsOverlay").style.display = "none";
  document.getElementById("addTaskModal").style.display = "flex";
  if (window.lucide) lucide.createIcons();
}

async function deleteTask(id) {
  if (!confirm("Delete this task? 🌸")) return;
  try {
    await fetch(`${API_BASE}/tasks/${id}`, { method: "DELETE" });
    loadTasks();
  } catch (err) { console.error(err); }
}

// --- INITIALIZATION & GLOBAL LISTENERS ---
const dailyThoughts = ["Discipline is the bridge between goals and success.", "Small steps every day lead to big changes.", "Focus on being productive instead of busy.", "Don't wait. The time will never be just right."];
function updateDailyThought() {
  const textEl = document.getElementById("dailyThoughtText");
  if(textEl) textEl.innerHTML = `"${dailyThoughts[new Date().getDay() % dailyThoughts.length]}"<br><span style="font-weight:600; font-style:normal; margin-top:8px; display:inline-block; color:var(--text-main);">— DailyDots</span>`;
}



document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey && !e.target.closest('button')) {
    const taskModal = document.getElementById('addTaskModal');
    const routineModal = document.getElementById('addRoutineModal');
    const taskOpen = taskModal && taskModal.style.display === 'flex';
    const routineOpen = routineModal && routineModal.style.display === 'flex';
    if (taskOpen || routineOpen) {
      e.preventDefault();
      if (taskOpen) submitModalTask();
      else submitRoutine();
      return;
    }
  }
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

// Dates that stay the same every year.
const fixedHolidays = {
  "01-01": "New Year's Day",
  "01-26": "Republic Day",
  "04-14": "Tamil New Year",
  "05-01": "May Day",
  "08-15": "Independence Day",
  "10-02": "Gandhi Jayanti",
  "12-25": "Christmas"
};

// Lunar festivals shift each year. Dates follow the Tamil Nadu holiday lists.
const yearHolidays = {
  2025: {
    "01-13": "Bhogi",
    "01-14": "Pongal",
    "01-15": "Thiruvalluvar Day",
    "01-16": "Uzhavar Thirunal",
    "08-16": "Krishna Jayanthi",
    "09-05": "Onam / Milad-un-Nabi",
    "10-01": "Ayudha Pooja",
    "10-02": "Vijaya Dasami",
    "10-20": "Diwali"
  },
  2026: {
    "01-14": "Bhogi",
    "01-15": "Pongal",
    "01-16": "Thiruvalluvar Day",
    "01-17": "Uzhavar Thirunal",
    "08-26": "Onam / Milad-un-Nabi",
    "09-04": "Krishna Jayanthi",
    "10-19": "Ayudha Pooja",
    "10-20": "Vijaya Dasami",
    "11-08": "Diwali"
  },
  2027: {
    "01-14": "Bhogi",
    "01-15": "Pongal",
    "01-16": "Thiruvalluvar Day",
    "01-17": "Uzhavar Thirunal",
    "08-15": "Milad-un-Nabi",
    "08-25": "Krishna Jayanthi",
    "09-12": "Onam",
    "10-08": "Ayudha Pooja",
    "10-09": "Vijaya Dasami",
    "10-29": "Diwali"
  }
};

function holidayOn(year, monthDay) {
  const names = [];
  if (fixedHolidays[monthDay]) names.push(fixedHolidays[monthDay]);
  const extra = yearHolidays[year] && yearHolidays[year][monthDay];
  if (extra) names.push(extra);
  return names.join(" / ");
}

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
  const monthHolidays = [];
  
  // Current month days
  for(let i = 1; i <= daysInMonth; i++) {
    const isToday = (i === today.getDate() && month === today.getMonth() && year === today.getFullYear());
    const mStr = String(month+1).padStart(2, '0');
    const dStr = String(i).padStart(2, '0');
    const fullDateStr = `${year}-${mStr}-${dStr}`;
    const mdStr = `${mStr}-${dStr}`;
    
    let eventsHtml = "";
    
    const holiday = holidayOn(year, mdStr);
    if (holiday) {
      eventsHtml += `<div class="calendar-event calendar-holiday" title="${holiday}"><span class="holiday-desktop">${holiday}</span><span class="holiday-mobile">★ Holiday</span></div>`;
      monthHolidays.push({ date: i, name: holiday });
    }
    
    // Check for tasks
    const dayTasks = tasks.filter(t => t.dueDate === fullDateStr);
    if (dayTasks.length > 0) {
      eventsHtml += `<div class="calendar-event calendar-task-due">${dayTasks.length} task${dayTasks.length > 1 ? 's' : ''}</div>`;
    }
    
    dateHtml += `
      <div class="calendar-day-cell ${isToday ? 'today' : ''}">
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

  // Render Holidays List Below Calendar
  const holidaysList = document.getElementById("calendarHolidaysList");
  if(holidaysList) {
    if(monthHolidays.length > 0) {
      let html = `<h4 style="font-size:16px; color:var(--text-main); margin-bottom:8px;">Holidays in ${calDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h4>`;
      monthHolidays.forEach(h => {
        html += `<div style="background:var(--card-bg); border:1px solid var(--border); padding:12px 16px; border-radius:12px; display:flex; align-items:center; gap:12px; box-shadow: 0 2px 8px rgba(0,0,0,0.02);">
                   <div style="background:var(--primary); color:#fff; width:36px; height:36px; border-radius:8px; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:14px; flex-shrink:0;">${h.date}</div>
                   <div style="font-size:14px; color:var(--text-main); font-weight:600;">${h.name}</div>
                 </div>`;
      });
      holidaysList.innerHTML = html;
    } else {
      holidaysList.innerHTML = `<p style="color:var(--text-muted); font-size:14px; font-style:italic;">No holidays this month.</p>`;
    }
  }
}

// --- ANALYTICS LOGIC ---
function localDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function dueDay(task) {
  if (!task || !task.dueDate) return "";
  const match = String(task.dueDate).match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : "";
}

function finishedOn(task, dateKey) {
  if (!task.completed || !task.completedAt) return false;
  const completed = new Date(task.completedAt);
  if (Number.isNaN(completed.getTime())) return false;
  return localDateKey(completed) === dateKey;
}

function routineDoneOn(routine, dateKey) {
  return (routine.history || []).some(h => h.date === dateKey && h.status === "completed");
}

function escapeInsightText(value) {
  return String(value).replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
}

function renderAnalytics() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = localDateKey(today);
  const routineList = routines || [];

  const dateEl = document.getElementById("insightsTodayDate");
  if (dateEl) dateEl.textContent = today.toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short" });

  const dueToday = tasks.filter(t => dueDay(t) === todayStr);
  const dueTodayDone = dueToday.filter(t => t.completed).length;
  const routinesDoneToday = routineList.filter(r => routineDoneOn(r, todayStr)).length;
  const planned = dueToday.length + routineList.length;
  const donePlanned = dueTodayDone + routinesDoneToday;
  const todayPct = planned ? Math.round((donePlanned / planned) * 100) : 0;

  const heroTitle = document.getElementById("insightHeroTitle");
  const heroSub = document.getElementById("insightHeroSub");
  if (planned === 0) {
    if (heroTitle) heroTitle.textContent = "Nothing due today";
    if (heroSub) heroSub.textContent = "Add a task or routine when you're ready.";
  } else {
    if (heroTitle) heroTitle.textContent = `${donePlanned} of ${planned} done`;
    const left = planned - donePlanned;
    if (heroSub) heroSub.textContent = left === 0 ? "Today's list is finished." : `${left} still open today.`;
  }
  const ring = document.getElementById("insightRing");
  if (ring) ring.style.setProperty("--pct", String(todayPct));
  const ringValue = document.getElementById("insightRingValue");
  if (ringValue) ringValue.textContent = `${todayPct}%`;

  const tasksFinishedToday = tasks.filter(t => finishedOn(t, todayStr)).length;
  const finishedToday = tasksFinishedToday + routinesDoneToday;
  const pending = tasks.filter(t => !t.completed).length;
  const overdue = tasks.filter(t => !t.completed && dueDay(t) && dueDay(t) < todayStr).length;

  let currentStreak = 0;
  let longestStreak = 0;
  routineList.forEach(r => {
    currentStreak = Math.max(currentStreak, r.currentStreak || 0);
    longestStreak = Math.max(longestStreak, r.longestStreak || 0);
  });

  const setText = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  };
  setText("insightCompletedToday", finishedToday);
  setText("insightCompletedTodaySub", `${tasksFinishedToday} tasks · ${routinesDoneToday} routines`);
  setText("insightPendingTasks", pending);
  setText("insightCarryOver", overdue);
  setText("insightLongestStreak", currentStreak);
  setText("insightStreakSub", routineList.length === 0 ? "Start a routine to build one" : (longestStreak > currentStreak ? `Best ever ${longestStreak} days` : "days in a row"));

  if (overdue === 0) {
    setText("insightFocusTitle", "No overdue tasks");
    setText("insightFocusSub", "You're clear of yesterday's work.");
  } else {
    setText("insightFocusTitle", `${overdue} overdue task${overdue === 1 ? "" : "s"}`);
    setText("insightFocusSub", "Open Tasks to clear them.");
  }

  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const day = new Date(today);
    day.setDate(today.getDate() - i);
    last7Days.push(localDateKey(day));
  }
  const weekSet = new Set(last7Days);
  const weekDays = last7Days.map(key => {
    const [year, month, day] = key.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    const dueTasks = tasks.filter(t => dueDay(t) === key);
    const activeRoutines = routineList.filter(r => {
      if (!r.createdAt) return true;
      const created = new Date(r.createdAt);
      return Number.isNaN(created.getTime()) || localDateKey(created) <= key;
    });
    const planned = dueTasks.length + activeRoutines.length;
    const done = dueTasks.filter(t => t.completed).length + activeRoutines.filter(r => routineDoneOn(r, key)).length;
    return {
      label: date.toLocaleDateString("en-US", { weekday: "short" }),
      planned,
      done,
      pct: planned ? Math.round((done / planned) * 100) : 0,
      isToday: key === todayStr
    };
  });
  const weekPlanned = weekDays.reduce((sum, day) => sum + day.planned, 0);
  const weekDone = weekDays.reduce((sum, day) => sum + day.done, 0);
  setText("insightWeekSummary", weekPlanned === 0 ? "Nothing was due this week." : `You finished ${weekDone} of ${weekPlanned} things due this week.`);
  const weekBox = document.getElementById("weekProgress");
  if (weekBox) {
    weekBox.innerHTML = weekDays.map(day => `
      <div class="week-day ${day.isToday ? "is-today" : ""}" title="${day.planned ? `${day.done} of ${day.planned} finished` : "Nothing due"}">
        <span class="week-day-name">${day.label}</span>
        <div class="week-day-track"><div class="week-day-fill" style="height:${day.pct}%"></div></div>
        <strong>${day.planned ? `${day.done}/${day.planned}` : "—"}</strong>
        <span class="week-day-count">${day.planned ? `${day.pct}%` : ""}</span>
      </div>
    `).join("");
  }

  const weekCats = {};
  tasks.forEach(t => {
    if (!t.category || !t.completed || !t.completedAt) return;
    const completed = new Date(t.completedAt);
    if (Number.isNaN(completed.getTime()) || !weekSet.has(localDateKey(completed))) return;
    weekCats[t.category] = (weekCats[t.category] || 0) + 1;
  });
  routineList.forEach(r => {
    if (!r.category) return;
    const count = (r.history || []).filter(h => h.status === "completed" && weekSet.has(h.date)).length;
    if (count) weekCats[r.category] = (weekCats[r.category] || 0) + count;
  });
  let bestCat = "";
  let bestCount = 0;
  Object.entries(weekCats).forEach(([cat, count]) => {
    if (count > bestCount) {
      bestCat = cat;
      bestCount = count;
    }
  });
  setText("insightTopCategoryName", bestCat || "—");
  setText("insightTopCategoryCount", bestCat ? `${bestCount} finished this week` : "Nothing finished this week yet.");

  const categoryStats = {};
  tasks.forEach(t => {
    const cat = t.category || "General";
    if (!categoryStats[cat]) categoryStats[cat] = { total: 0, completed: 0 };
    categoryStats[cat].total++;
    if (t.completed) categoryStats[cat].completed++;
  });
  const categoryBox = document.getElementById("insightCategories");
  if (categoryBox) {
    const rows = Object.entries(categoryStats).sort((a, b) => b[1].completed - a[1].completed || b[1].total - a[1].total);
    if (rows.length === 0) {
      categoryBox.innerHTML = `<p class="insights-empty">Finish a task to see how your categories compare.</p>`;
    } else {
      categoryBox.innerHTML = rows.map(([name, stat]) => {
        const pct = stat.total ? Math.round((stat.completed / stat.total) * 100) : 0;
        return `<div class="insight-cat-row">
          <div class="insight-cat-meta"><strong>${escapeInsightText(name)}</strong><span>${stat.completed} of ${stat.total}</span></div>
          <div class="insight-cat-track"><div class="insight-cat-fill" style="width:${pct}%"></div></div>
        </div>`;
      }).join("");
    }
  }

}

window.onload = () => {
  if (localStorage.getItem("token")) initApp();
  else { document.getElementById("authPage").style.display = "flex"; document.getElementById("app").style.display = "none"; }
  updateDailyThought();
  scheduleEndOfDayRefresh();
};

window.addEventListener('click', () => {
  const catList = document.getElementById('customCategoryList');
  const priList = document.getElementById('customPriorityList');
  if (catList) catList.style.display = 'none';
  if (priList) priList.style.display = 'none';
});