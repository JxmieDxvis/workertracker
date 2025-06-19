let auth = firebase.auth();

let entries = JSON.parse(localStorage.getItem("entries") || "[]");
let hourlyRate = parseFloat(localStorage.getItem("hourlyRate")) || 0;
document.getElementById("hourlyRate").value = hourlyRate;

auth.onAuthStateChanged(user => {
  if (user) {
    document.getElementById("auth-section").classList.add("hidden");
    document.getElementById("app-section").classList.remove("hidden");
    updateTable();
  } else {
    document.getElementById("auth-section").classList.remove("hidden");
    document.getElementById("app-section").classList.add("hidden");
  }
});

function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  auth.signInWithEmailAndPassword(email, password)
    .catch(err => document.getElementById("auth-msg").innerText = err.message);
}

function signup() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  auth.createUserWithEmailAndPassword(email, password)
    .catch(err => document.getElementById("auth-msg").innerText = err.message);
}

function logout() {
  auth.signOut();
}

function saveRate() {
  hourlyRate = parseFloat(document.getElementById("hourlyRate").value);
  localStorage.setItem("hourlyRate", hourlyRate);
  updateTable();
}

function addEntry() {
  const date = document.getElementById("workDate").value;
  const start = document.getElementById("startTime").value;
  const end = document.getElementById("endTime").value;
  const breakMin = parseFloat(document.getElementById("breakTime").value || "0");

  if (!date || !start || !end) return alert("Fill in all fields");

  const startTime = new Date(`${date}T${start}`);
  const endTime = new Date(`${date}T${end}`);
  let hours = (endTime - startTime) / (1000 * 60 * 60);
  hours = Math.max(0, hours - breakMin / 60);

  if (hours <= 0) return alert("Invalid time range");

  entries.push({ id: Date.now(), date, hours });
  localStorage.setItem("entries", JSON.stringify(entries));
  clearForm();
  updateTable();
}

function deleteEntry(id) {
  if (confirm("Delete this entry?")) {
    entries = entries.filter(e => e.id !== id);
    localStorage.setItem("entries", JSON.stringify(entries));
    updateTable();
  }
}

function clearForm() {
  document.getElementById("workDate").value = "";
  document.getElementById("startTime").value = "";
  document.getElementById("endTime").value = "";
  document.getElementById("breakTime").value = "";
}

function startOfWeek(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay() + 1 - offset * 7);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfWeek(offset = 0) {
  const d = startOfWeek(offset);
  d.setDate(d.getDate() + 6);
  d.setHours(23, 59, 59, 999);
  return d;
}

function updateTable() {
  const tbody = document.getElementById("entriesTable");
  tbody.innerHTML = "";

  const filter = document.getElementById("filter").value;
  let weekStart = new Date(0), weekEnd = new Date();

  if (filter === "thisWeek") {
    weekStart = startOfWeek(0);
    weekEnd = endOfWeek(0);
  } else if (filter === "lastWeek") {
    weekStart = startOfWeek(1);
    weekEnd = endOfWeek(1);
  }

  const filtered = entries.filter(entry => {
    const date = new Date(entry.date);
    return date >= weekStart && date <= weekEnd;
  });

  let totalHours = 0, totalPay = 0;

  if (filtered.length === 0) {
    tbody.innerHTML = "<tr><td colspan='4' style='text-align:center;'>No entries</td></tr>";
  }

  filtered.forEach(entry => {
    totalHours += entry.hours;
    totalPay += entry.hours * hourlyRate;
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${entry.date}</td>
      <td>${entry.hours.toFixed(2)}</td>
      <td>£${(entry.hours * hourlyRate).toFixed(2)}</td>
      <td><button onclick="deleteEntry(${entry.id})">Delete</button></td>
    `;
    tbody.appendChild(tr);
  });

  document.getElementById("weeklyHours").innerText = totalHours.toFixed(2);
  document.getElementById("weeklyPay").innerText = totalPay.toFixed(2);
}
