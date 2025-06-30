// ================= Global State =================
let selectedList = "Personal"; // default

// ================= Element Selectors =================
// Modal
const modal = document.getElementById("event-modal");
const addBtn = document.querySelector(".add-event");
const saveBtn = document.getElementById("save-event");
const cancelBtn = document.getElementById("cancel-event");

// Date
const calendarDateEl = document.getElementById("calendar-date");
const dateInput = document.getElementById("date-picker");

// Lists
const listContainer = document.getElementById("list-container");
const addListBtn = document.getElementById("add-list-btn");

// Main Sections
const calendarSection = document.getElementById("calendar");
const stickyWallSection = document.getElementById("sticky-wall");

// View Toggles
const calendarBtn = document.getElementById("calendar-btn");
const stickyWallBtn = document.getElementById("sticky-wall-btn");
const calendarBody = document.querySelector('.calendar-body');
const viewButtons = document.querySelectorAll('.view-options button');

// Search
const searchBar = document.getElementById("search-bar");
const suggestionsBox = document.getElementById("suggestions");

// ================= Save Event =================
if (saveBtn) {
    saveBtn.addEventListener("click", () => {
        const title = document.getElementById("event-title").value;
        const time = document.getElementById("event-time").value;
        const tag = document.getElementById("event-tag").value;
        const date = document.getElementById("date-picker").value;

        if (!title || !time || !date) {
            alert("Please fill in all fields");
            return;
        }

        const listName = selectedList || "Personal";
        const event = { title, time, tag, date, list: listName };

        const events = JSON.parse(localStorage.getItem("calendarEvents")) || [];
        events.push(event);
        localStorage.setItem("calendarEvents", JSON.stringify(events));

        // Ensure the UI is on the correct list before rendering
        selectedList = listName;
        updateActiveListHighlight();
        renderAllEvents(); 

        // Close modal and clear form
        modal.classList.add("hidden");
        document.getElementById("event-title").value = "";
        document.getElementById("event-time").value = "";
    });
}

// ================= Render Functions =================
function renderEvent(event) {
    const [hourStr, minStr] = event.time.split(":");
    const hour = parseInt(hourStr);
    const minutes = parseInt(minStr);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = ((hour + 11) % 12 + 1);
    const label = `${hour12}:${minStr} ${ampm}`;
    const dataTime = `${hour12} ${ampm}`;

    let slot = document.querySelector(`.time-slot[data-time="${dataTime}"]`);

    if (!slot) {
        slot = document.createElement("div");
        slot.classList.add("time-slot");
        slot.dataset.time = dataTime;
        slot.innerText = label;

        const allSlots = Array.from(calendarBody.querySelectorAll(".time-slot"));
        const newTime = hour * 60 + minutes;

        let inserted = false;
        for (let i = 0; i < allSlots.length; i++) {
            const [existingHourStr, existingAmpm] = allSlots[i].dataset.time.split(" ");
            let existingHour = parseInt(existingHourStr);
            if (existingHour === 12) existingHour = 0;
            if (existingAmpm === "PM") existingHour += 12;
            const existingTime = existingHour * 60;

            if (newTime < existingTime) {
                calendarBody.insertBefore(slot, allSlots[i]);
                inserted = true;
                break;
            }
        }
        if (!inserted) {
            calendarBody.appendChild(slot);
        }
    }

    const eventEl = document.createElement("div");
    eventEl.classList.add("event");
    eventEl.style.cssText = `
      background-color: ${event.tag === "blue" ? "#d6efff" : "#ffd6d6"};
      padding: 6px 12px; margin-top: 5px; border-radius: 8px;
      display: flex; justify-content: space-between; align-items: center;
    `;

    const titleEl = document.createElement("span");
    titleEl.innerText = event.title;

    const delBtn = document.createElement("button");
    delBtn.innerText = "🗑️";
    delBtn.style.cssText = "border: none; background: transparent; cursor: pointer;";

    delBtn.addEventListener("click", () => {
        let events = JSON.parse(localStorage.getItem("calendarEvents")) || [];
        const eventIndex = events.findIndex(e =>
            e.title === event.title && e.time === event.time && e.date === event.date && e.list === event.list
        );
        if (eventIndex > -1) {
            events.splice(eventIndex, 1);
            localStorage.setItem("calendarEvents", JSON.stringify(events));
            renderAllEvents();
        }
    });

    eventEl.appendChild(titleEl);
    eventEl.appendChild(delBtn);
    slot.appendChild(eventEl);
}

function renderAllEvents() {
    renderCalendarView(getActiveViewType()); // Redraw the base view (day, week, month)
    
    const savedEvents = JSON.parse(localStorage.getItem("calendarEvents")) || [];
    const currentDate = dateInput.value;

    savedEvents.forEach(event => {
        if (event.date === currentDate && event.list === selectedList) {
            renderEvent(event);
        }
    });
}

// ================= List Management =================
function initializeLists() {
    let savedLists = JSON.parse(localStorage.getItem("customLists"));
    if (!savedLists || savedLists.length === 0) {
        savedLists = [{ name: "Personal", color: "pink" }];
        localStorage.setItem("customLists", JSON.stringify(savedLists));
    }
    selectedList = savedLists[0].name;

    listContainer.innerHTML = ''; 
    savedLists.forEach(createListItem);
    if(addListBtn) listContainer.appendChild(addListBtn); 
    updateActiveListHighlight();
}

function createListItem(list) {
    const li = document.createElement("li");
    li.className = "list-item";
    li.dataset.listName = list.name;

    const icon = list.color === "blue" ? "🔵" : "🌸";
    const span = document.createElement("span");
    span.textContent = `${icon} ${list.name}`;
    span.style.cursor = "pointer";

    const delBtn = document.createElement("button");
    delBtn.innerHTML = "🗑️";
    delBtn.title = `Delete List "${list.name}"`;
    delBtn.style.cssText = "margin-left: 10px; background: none; border: none; cursor: pointer;";

    li.addEventListener("click", () => {
        selectedList = list.name;
        updateActiveListHighlight();
        renderAllEvents();
    });

    delBtn.onclick = (e) => {
        e.stopPropagation();
        if (confirm(`Delete list "${list.name}"? All its events will be removed.`)) {
            let savedLists = JSON.parse(localStorage.getItem("customLists")) || [];
            const updatedLists = savedLists.filter((l) => l.name !== list.name);
            localStorage.setItem("customLists", JSON.stringify(updatedLists));

            let allEvents = JSON.parse(localStorage.getItem("calendarEvents")) || [];
            const filteredEvents = allEvents.filter((ev) => ev.list !== list.name);
            localStorage.setItem("calendarEvents", JSON.stringify(filteredEvents));
            
            initializeLists();
            renderAllEvents();
        }
    };

    li.appendChild(span);
    li.appendChild(delBtn);
    listContainer.appendChild(li);
}

function updateActiveListHighlight() {
    document.querySelectorAll("#list-container .list-item").forEach(li => {
        li.classList.toggle("active", li.dataset.listName === selectedList);
    });
}

// ================= View Management (Day/Week/Month/Sticky) =================
function setActiveView(view) {
    viewButtons.forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.getElementById(`${view}-view`);
    if(activeBtn) activeBtn.classList.add('active');
    renderAllEvents();
}

function getActiveViewType() {
    const activeButton = document.querySelector('.view-options button.active');
    return activeButton ? activeButton.id.split('-')[0] : 'day'; // default to day view
}

function renderCalendarView(view) {
    calendarBody.innerHTML = ''; // clear calendar slots
    if (view === 'day') {
        ['9 AM', '10 AM', '11 AM', '12 PM', '1 PM', '2 PM'].forEach(time => {
            const div = document.createElement('div');
            div.className = 'time-slot';
            div.textContent = time;
            div.dataset.time = time;
            calendarBody.appendChild(div);
        });
    } else if (view === 'week') {
        ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].forEach(day => {
            const div = document.createElement('div');
            div.className = 'time-slot';
            div.textContent = `📅 ${day}`;
            calendarBody.appendChild(div);
        });
    } else if (view === 'month') {
        for (let i = 1; i <= 30; i++) {
            const div = document.createElement('div');
            div.className = 'time-slot';
            div.textContent = `📆 Day ${i}`;
            calendarBody.appendChild(div);
        }
    }
}

// ================= Search Functionality =================
const tools = [
    { name: "Calendar", action: () => calendarBtn.click() },
    { name: "Sticky Wall", action: () => stickyWallBtn.click() },
    { name: "Upcoming", action: () => document.getElementById("upcoming-btn")?.click() },
    { name: "Today", action: () => document.getElementById("today-btn")?.click() }
];

if (searchBar) {
    searchBar.addEventListener("input", () => {
        const query = searchBar.value.toLowerCase().trim();
        const matchedTools = tools.filter(tool => tool.name.toLowerCase().includes(query));
        
        if (query && matchedTools.length > 0) {
            suggestionsBox.innerHTML = matchedTools.map(tool => `<li>${tool.name}</li>`).join("");
            suggestionsBox.style.display = "block";
        } else {
            suggestionsBox.style.display = "none";
        }

        Array.from(suggestionsBox.children).forEach((li, index) => {
            li.addEventListener("click", () => {
                matchedTools[index].action();
                searchBar.value = "";
                suggestionsBox.style.display = "none";
            });
        });
    });

    searchBar.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            const query = searchBar.value.toLowerCase().trim();
            const match = tools.find(tool => tool.name.toLowerCase().includes(query));
            if (match) {
                match.action();
                searchBar.value = "";
                suggestionsBox.style.display = "none";
            }
        }
    });
}

// ================= Event Listeners =================
if (addBtn) addBtn.addEventListener("click", () => modal.classList.remove("hidden"));
if (cancelBtn) cancelBtn.addEventListener("click", () => modal.classList.add("hidden"));

if (calendarDateEl) calendarDateEl.addEventListener("click", () => {
    dateInput.style.display = "inline-block";
    dateInput.focus();
});

if (dateInput) dateInput.addEventListener("change", () => {
    const selected = new Date(dateInput.value);
    calendarDateEl.textContent = selected.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    dateInput.style.display = "none";
    renderAllEvents();
});

if (addListBtn) {
    addListBtn.addEventListener("click", () => {
        const name = prompt("Enter name for the new list:");
        if (!name || name.trim() === "") return;
        const color = prompt("Choose a color (pink/blue):", "pink").toLowerCase();
        if (!["pink", "blue"].includes(color)) return alert("Invalid color. Use 'pink' or 'blue'.");
        
        const listName = name.trim();
        const savedLists = JSON.parse(localStorage.getItem("customLists")) || [];

        if (savedLists.some(l => l.name === listName)) {
            return alert("A list with this name already exists.");
        }
        const newList = { name: listName, color };
        savedLists.push(newList);
        localStorage.setItem("customLists", JSON.stringify(savedLists));
        createListItem(newList);
    });
}

viewButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const view = btn.id.split('-')[0];
        setActiveView(view);
    });
});

if (calendarBtn) calendarBtn.addEventListener("click", () => {
    calendarSection.classList.remove("hidden");
    stickyWallSection.classList.add("hidden");
    calendarBtn.classList.add("active");
    stickyWallBtn.classList.remove("active");
});

if (stickyWallBtn) stickyWallBtn.addEventListener("click", () => {
    stickyWallSection.classList.remove("hidden");
    calendarSection.classList.add("hidden");
    stickyWallBtn.classList.add("active");
    calendarBtn.classList.remove("active");
});

// ================= Initial Page Load =================
window.addEventListener("DOMContentLoaded", () => {
    // Setup date
    const today = new Date();
    dateInput.value = today.toISOString().split('T')[0];
    calendarDateEl.textContent = today.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

    // Setup lists and render events
    initializeLists();
    
    // Set default views
    calendarSection.classList.remove("hidden");
    stickyWallSection.classList.add("hidden");
    calendarBtn.classList.add("active");
    stickyWallBtn.classList.remove("active");
    setActiveView('day'); // This also triggers the first renderAllEvents()
});
document.getElementById("upcoming-btn").addEventListener("click", () => {
  const slots = document.querySelectorAll(".time-slot");
  const now = new Date();
  const currentHour = now.getHours();

  let found = false;

  slots.forEach(slot => slot.classList.remove("highlight")); // clear old highlights

  for (let slot of slots) {
    const timeText = slot.dataset.time; // like "9 AM", "10 AM", etc.
    const hourMatch = timeText.match(/(\d+)\s?(AM|PM)/i);

    if (hourMatch) {
      let hour = parseInt(hourMatch[1]);
      const period = hourMatch[2].toUpperCase();

      if (period === "PM" && hour !== 12) hour += 12;
      if (period === "AM" && hour === 12) hour = 0;

      if (hour >= currentHour && !found) {
        slot.classList.add("highlight");
        slot.scrollIntoView({ behavior: "smooth", block: "center" });
        found = true;
        break;
      }
    }
  }

  if (!found) {
    alert("No more upcoming events for today.");
  }
});
document.querySelector('.clear-all').addEventListener('click', () => {
  const calendarBody = document.querySelector('.calendar-body');
  const eventElements = calendarBody.querySelectorAll('.event');

  if (eventElements.length === 0) {
    alert("No events to clear.");
    return;
  }

  eventElements.forEach(event => event.remove());

  // Optional: Clear from localStorage if you're storing them
  localStorage.removeItem('events');

  alert("All events cleared.");
});
// Load saved notes on page load
window.addEventListener('DOMContentLoaded', () => {
  const savedNotes = JSON.parse(localStorage.getItem('stickyNotes')) || [];
  savedNotes.forEach(note => renderNote(note));
});

// Save new note
document.getElementById('save-note').addEventListener('click', () => {
  const noteText = document.getElementById('sticky-note').value.trim();
  if (!noteText) return;

  // Save to localStorage
  const existingNotes = JSON.parse(localStorage.getItem('stickyNotes')) || [];
  existingNotes.push(noteText);
  localStorage.setItem('stickyNotes', JSON.stringify(existingNotes));

  // Render note
  renderNote(noteText);
  document.getElementById('sticky-note').value = '';
});

// Function to render note
function renderNote(text) {
  const noteContainer = document.createElement('div');
  noteContainer.classList.add('note-box');

  const p = document.createElement('p');
  p.textContent = text;

  const deleteBtn = document.createElement('button');
  deleteBtn.innerHTML = '❌';
  deleteBtn.onclick = () => {
    noteContainer.remove();
    removeFromStorage(text);
  };

  noteContainer.appendChild(p);
  noteContainer.appendChild(deleteBtn);
  document.getElementById('saved-notes').appendChild(noteContainer);
}

// Remove note from localStorage
function removeFromStorage(text) {
  const notes = JSON.parse(localStorage.getItem('stickyNotes')) || [];
  const updatedNotes = notes.filter(n => n !== text);
  localStorage.setItem('stickyNotes', JSON.stringify(updatedNotes));
}

